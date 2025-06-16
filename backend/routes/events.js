const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Event = require("../models/Event")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Private
router.get(
  "/",
  [
    auth,
    query("upcoming").optional().isBoolean(),
    query("eventType")
      .optional()
      .isIn(["workshop", "seminar", "conference", "cultural", "sports", "placement", "other"]),
    query("organizer").optional().isMongoId(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { upcoming, eventType, organizer, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = { isActive: true }
      if (eventType) filter.eventType = eventType
      if (organizer) filter.organizer = organizer

      // Filter for upcoming events
      if (upcoming === "true") {
        filter.startDate = { $gte: new Date() }
      }

      const events = await Event.find(filter)
        .populate("organizer", "name email")
        .populate("registrations.student", "name email admissionNumber")
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .sort({ startDate: 1 })

      const total = await Event.countDocuments(filter)

      // Add registration status for students
      if (req.user.role === "student") {
        for (const event of events) {
          const isRegistered = event.registrations.some((reg) => reg.student._id.toString() === req.user.id)
          event._doc.isRegistered = isRegistered
          event._doc.registrationStatus = isRegistered
            ? event.registrations.find((reg) => reg.student._id.toString() === req.user.id).status
            : null
          // Remove other students' registrations for privacy
          event.registrations = event.registrations.filter((reg) => reg.student._id.toString() === req.user.id)
        }
      }

      res.json({
        success: true,
        events: events || [],
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      })
    } catch (error) {
      console.error("Get events error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/events/:id
// @desc    Get specific event
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email")
      .populate("registrations.student", "name email admissionNumber")

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Add registration status for students
    if (req.user.role === "student") {
      const isRegistered = event.registrations.some((reg) => reg.student._id.toString() === req.user.id)
      event._doc.isRegistered = isRegistered
      event._doc.registrationStatus = isRegistered
        ? event.registrations.find((reg) => reg.student._id.toString() === req.user.id).status
        : null
      // Remove other students' registrations for privacy
      event.registrations = event.registrations.filter((reg) => reg.student._id.toString() === req.user.id)
    }

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Get event error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Admin/Faculty)
router.post(
  "/",
  [
    auth,
    authorize("admin", "faculty"),
    body("title").notEmpty().withMessage("Event title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("eventType")
      .isIn(["workshop", "seminar", "conference", "cultural", "sports", "placement", "other"])
      .withMessage("Valid event type is required"),
    body("maxRegistrations").optional().isInt({ min: 1 }).withMessage("Valid max registrations required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { title, description, startDate, endDate, location, eventType, maxRegistrations, poster } = req.body

      // Validate dates
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        })
      }

      const event = new Event({
        title,
        description,
        startDate: start,
        endDate: end,
        location,
        eventType,
        organizer: req.user.id,
        maxRegistrations: maxRegistrations || 100,
        poster,
      })

      await event.save()
      await event.populate("organizer", "name email")

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        event,
      })
    } catch (error) {
      console.error("Create event error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin/Organizer)
router.put("/:id", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if user can update this event
    if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const { title, description, startDate, endDate, location, eventType, maxRegistrations, poster, isActive } = req.body

    if (title) event.title = title
    if (description) event.description = description
    if (startDate) event.startDate = new Date(startDate)
    if (endDate) event.endDate = new Date(endDate)
    if (location) event.location = location
    if (eventType) event.eventType = eventType
    if (maxRegistrations) event.maxRegistrations = maxRegistrations
    if (poster) event.poster = poster
    if (isActive !== undefined) event.isActive = isActive

    // Validate dates if both are provided
    if (event.startDate >= event.endDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      })
    }

    await event.save()
    await event.populate("organizer", "name email")

    res.json({
      success: true,
      message: "Event updated successfully",
      event,
    })
  } catch (error) {
    console.error("Update event error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin/Organizer)
router.delete("/:id", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if user can delete this event
    if (req.user.role !== "admin" && event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    await Event.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Delete event error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/events/:id/register
// @desc    Register for event
// @access  Private (Student)
router.post("/:id/register", [auth, authorize("student")], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if event is active and not expired
    if (!event.isActive || new Date() > event.endDate) {
      return res.status(400).json({
        success: false,
        message: "Event registration is not available",
      })
    }

    // Check if already registered
    const existingRegistration = event.registrations.find((reg) => reg.student.toString() === req.user.id)
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      })
    }

    // Check if event is full
    if (event.registrations.length >= event.maxRegistrations) {
      return res.status(400).json({
        success: false,
        message: "Event is full",
      })
    }

    // Add registration
    event.registrations.push({
      student: req.user.id,
    })

    await event.save()

    res.json({
      success: true,
      message: "Successfully registered for the event",
      registrationId: event.registrations[event.registrations.length - 1]._id,
      registeredAt: event.registrations[event.registrations.length - 1].registeredAt,
    })
  } catch (error) {
    console.error("Register for event error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/events/:id/unregister
// @desc    Unregister from event
// @access  Private (Student)
router.post("/:id/unregister", [auth, authorize("student")], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Find and remove registration
    const registrationIndex = event.registrations.findIndex((reg) => reg.student.toString() === req.user.id)
    if (registrationIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not registered for this event",
      })
    }

    event.registrations.splice(registrationIndex, 1)
    await event.save()

    res.json({
      success: true,
      message: "Successfully unregistered from the event",
    })
  } catch (error) {
    console.error("Unregister from event error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/events/:id/registrations
// @desc    Get event registrations
// @access  Private (Admin/Organizer)
router.get("/:id/registrations", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("registrations.student", "name email admissionNumber branch semester phone")
      .populate("organizer", "name email")

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if user can view registrations
    if (req.user.role !== "admin" && event.organizer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      event: {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        maxRegistrations: event.maxRegistrations,
      },
      registrations: event.registrations || [],
      summary: {
        totalRegistrations: event.registrations.length,
        availableSlots: event.maxRegistrations - event.registrations.length,
        registeredCount: event.registrations.filter((reg) => reg.status === "registered").length,
        attendedCount: event.registrations.filter((reg) => reg.status === "attended").length,
        cancelledCount: event.registrations.filter((reg) => reg.status === "cancelled").length,
      },
    })
  } catch (error) {
    console.error("Get event registrations error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router

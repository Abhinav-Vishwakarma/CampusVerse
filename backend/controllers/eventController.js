import Event from "../models/Event.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin/Faculty
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      eventType,
      targetAudience,
      targetBranch,
      targetSemester,
      attachments,
    } = req.body

    // Create event
    const event = await Event.create({
      title,
      description,
      startDate,
      endDate,
      location,
      organizer: req.user._id,
      eventType,
      targetAudience,
      targetBranch,
      targetSemester,
      attachments,
    })

    if (event) {
      // Send notification about new event
      let recipients = "all"
      if (targetAudience && targetAudience.length === 1 && targetAudience[0] !== "all") {
        recipients = targetAudience[0]
      }

      await sendNotification({
        title: "New Event: " + title,
        message: `A new event "${title}" has been scheduled from ${new Date(
          startDate,
        ).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
        type: "info",
        sender: req.user._id,
        recipients,
        relatedTo: {
          model: "Event",
          id: event._id,
        },
        sentVia: ["app", "email"],
      })

      res.status(201).json(event)
    } else {
      res.status(400).json({ message: "Invalid event data" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const { eventType, upcoming } = req.query

    const filter = {}

    if (eventType) {
      filter.eventType = eventType
    }

    // Filter for upcoming events
    if (upcoming === "true") {
      filter.endDate = { $gte: new Date() }
    }

    // Filter events based on user role and target audience
    if (req.user.role !== "admin") {
      filter.$or = [
        { targetAudience: "all" },
        { targetAudience: `${req.user.role}s` }, // Convert 'student' to 'students'
      ]

      // Add branch and semester filters for students
      if (req.user.role === "student") {
        filter.$or.push(
          { targetAudience: "specific-branch", targetBranch: req.user.branch },
          { targetAudience: "specific-semester", targetSemester: req.user.semester },
        )
      }
    }

    const events = await Event.find(filter).populate("organizer", "name email").sort({ startDate: 1 })

    res.json(events)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email")

    if (event) {
      res.json(event)
    } else {
      res.status(404).json({ message: "Event not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin/Faculty
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if user is authorized to update the event
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this event" })
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      eventType,
      targetAudience,
      targetBranch,
      targetSemester,
      attachments,
    } = req.body

    // Update event fields
    if (title) event.title = title
    if (description) event.description = description
    if (startDate) event.startDate = startDate
    if (endDate) event.endDate = endDate
    if (location) event.location = location
    if (eventType) event.eventType = eventType
    if (targetAudience) event.targetAudience = targetAudience
    if (targetBranch) event.targetBranch = targetBranch
    if (targetSemester) event.targetSemester = targetSemester
    if (attachments) event.attachments = attachments

    const updatedEvent = await event.save()

    // Send notification about updated event
    await sendNotification({
      title: "Event Updated: " + updatedEvent.title,
      message: `The event "${updatedEvent.title}" has been updated. Please check the details.`,
      type: "info",
      sender: req.user._id,
      recipients: "all",
      relatedTo: {
        model: "Event",
        id: updatedEvent._id,
      },
      sentVia: ["app"],
    })

    res.json(updatedEvent)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin/Faculty
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if user is authorized to delete the event
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this event" })
    }

    await event.deleteOne()

    res.json({ message: "Event removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if user is already registered
    const alreadyRegistered = event.registeredUsers.some(
      (registration) => registration.user.toString() === req.user._id.toString(),
    )

    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered for this event" })
    }

    // Add user to registered users
    event.registeredUsers.push({
      user: req.user._id,
      registrationDate: new Date(),
    })

    await event.save()

    // Send confirmation notification
    await sendNotification({
      title: "Event Registration Confirmed",
      message: `You have successfully registered for the event "${event.title}"`,
      type: "success",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [req.user._id],
      relatedTo: {
        model: "Event",
        id: event._id,
      },
      sentVia: ["app", "email"],
    })

    res.json({
      message: "Successfully registered for the event",
      event,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get registered users for an event
// @route   GET /api/events/:id/registrations
// @access  Private/Admin/Faculty
const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("registeredUsers.user", "name email studentId")

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if user is authorized to view registrations
    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "faculty"
    ) {
      return res.status(403).json({ message: "Not authorized to view registrations" })
    }

    res.json(event.registeredUsers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { createEvent, getEvents, getEventById, updateEvent, deleteEvent, registerForEvent, getEventRegistrations }

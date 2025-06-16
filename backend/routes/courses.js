const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Course = require("../models/Course")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/courses
// @desc    Get all courses with filters
// @access  Private
router.get(
  "/",
  [
    auth,
    query("branch").optional().isString(),
    query("semester").optional().isInt({ min: 1, max: 8 }),
    query("faculty").optional().isMongoId(),
    query("active").optional().isBoolean(),
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

      const { branch, semester, faculty, active, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = {}
      if (branch) filter.branch = branch
      if (semester) filter.semester = Number.parseInt(semester)
      if (faculty) filter.faculty = faculty
      if (active !== undefined) filter.isActive = active === "true"

      // Role-based filtering
      if (req.user.role === "student") {
        filter.students = req.user.id
      } else if (req.user.role === "faculty") {
        filter.faculty = req.user.id
      }

      const courses = await Course.find(filter)
        .populate("faculty", "name email department")
        .populate("students", "name email admissionNumber")
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .sort({ createdAt: -1 })

      const total = await Course.countDocuments(filter)

      res.json({
        success: true,
        courses: courses || [],
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      })
    } catch (error) {
      console.error("Get courses error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/courses/:id
// @desc    Get specific course
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("faculty", "name email department")
      .populate("students", "name email admissionNumber branch semester")

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    // Check access permissions
    if (req.user.role === "student" && !course.students.some((student) => student._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (req.user.role === "faculty" && course.faculty._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error("Get course error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Admin/Faculty)
router.post(
  "/",
  [
    auth,
    authorize("admin", "faculty"),
    body("name").notEmpty().withMessage("Course name is required"),
    body("code").notEmpty().withMessage("Course code is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("semester").isInt({ min: 1, max: 8 }).withMessage("Valid semester is required"),
    body("branch").notEmpty().withMessage("Branch is required"),
    body("credits").isInt({ min: 1, max: 6 }).withMessage("Valid credits required"),
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

      const { name, code, description, semester, branch, credits, syllabus } = req.body

      // Check if course code already exists
      const existingCourse = await Course.findOne({ code: code.toUpperCase() })
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: "Course code already exists",
        })
      }

      const course = new Course({
        name,
        code: code.toUpperCase(),
        description,
        semester,
        branch,
        credits,
        faculty: req.user.role === "faculty" ? req.user.id : req.body.faculty,
        syllabus,
      })

      await course.save()
      await course.populate("faculty", "name email department")

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        course,
      })
    } catch (error) {
      console.error("Create course error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin/Faculty)
router.put("/:id", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    // Check if faculty can update this course
    if (req.user.role === "faculty" && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const { name, description, credits, syllabus, isActive } = req.body

    if (name) course.name = name
    if (description) course.description = description
    if (credits) course.credits = credits
    if (syllabus) course.syllabus = syllabus
    if (isActive !== undefined) course.isActive = isActive

    await course.save()
    await course.populate("faculty", "name email department")

    res.json({
      success: true,
      message: "Course updated successfully",
      course,
    })
  } catch (error) {
    console.error("Update course error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin)
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    await Course.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error("Delete course error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/courses/:id/enroll
// @desc    Enroll student in course
// @access  Private (Admin/Faculty)
router.post("/:id/enroll", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { studentId } = req.body

    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    const student = await User.findById(studentId)
    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      })
    }

    // Check if already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student already enrolled",
      })
    }

    course.students.push(studentId)
    await course.save()

    res.json({
      success: true,
      message: "Student enrolled successfully",
    })
  } catch (error) {
    console.error("Enroll student error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/courses/:id/unenroll
// @desc    Unenroll student from course
// @access  Private (Admin/Faculty)
router.post("/:id/unenroll", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { studentId } = req.body

    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    course.students = course.students.filter((id) => id.toString() !== studentId)
    await course.save()

    res.json({
      success: true,
      message: "Student unenrolled successfully",
    })
  } catch (error) {
    console.error("Unenroll student error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/courses/:id/students
// @desc    Get course students
// @access  Private (Admin/Faculty)
router.get("/:id/students", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "students",
      "name email admissionNumber branch semester",
    )

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    res.json({
      success: true,
      students: course.students || [],
    })
  } catch (error) {
    console.error("Get course students error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/courses/students/:studentId/courses
// @desc    Get student's courses
// @access  Private
router.get("/students/:studentId/courses", auth, async (req, res) => {
  try {
    const { studentId } = req.params

    // Check access permissions
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const courses = await Course.find({ students: studentId, isActive: true }).populate(
      "faculty",
      "name email department",
    )

    res.json({
      success: true,
      courses: courses || [],
    })
  } catch (error) {
    console.error("Get student courses error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router

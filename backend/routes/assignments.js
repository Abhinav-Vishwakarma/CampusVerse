const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Assignment = require("../models/Assignment")
const Course = require("../models/Course")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/assignments
// @desc    Get all assignments with filters
// @access  Private
router.get(
  "/",
  [
    auth,
    query("course").optional().isMongoId(),
    query("branch").optional().isString(),
    query("section").optional().isString(),
    query("faculty").optional().isMongoId(),
    query("status").optional().isIn(["active", "expired", "all"]),
  ],
  async (req, res) => {
    console.log(req.query)
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { course, branch, section, faculty, status, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = { isActive: true }
      if (course) filter.course = course
      if (branch) filter.branch = branch
      if (section) filter.section = section
      if (faculty) filter.faculty = faculty

      // Status filtering
      const now = new Date()
      if (status === "active") {
        filter.dueDate = { $gte: now }
      } else if (status === "expired") {
        filter.dueDate = { $lt: now }
      }

      // Role-based filtering
      if (req.user.role === "faculty") {
        filter.faculty = req.user.id
      } else if (req.user.role === "student") {
        filter.branch = req.user.branch
        filter.section = req.user.section
      }

      const assignments = await Assignment.find(filter)
        .populate("course", "name code")
        .populate("faculty", "name email")
        .populate("submissions.student", "name email admissionNumber")
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .sort({ createdAt: -1 })

      const total = await Assignment.countDocuments(filter)

      // Add submission status for students
      if (req.user.role === "student") {
        for (const assignment of assignments) {
          const submission = assignment.submissions.find((sub) => sub.student._id.toString() === req.user.id)
          assignment._doc.hasSubmitted = !!submission
          assignment._doc.submissionStatus = submission
            ? {
                submittedAt: submission.submittedAt,
                marks: submission.marks,
                feedback: submission.feedback,
                gradedAt: submission.gradedAt,
              }
            : null
          // Remove other students' submissions for privacy
          assignment.submissions = submission ? [submission] : []
        }
      }

      res.json({
        success: true,
        assignments: assignments || [],
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      })
    } catch (error) {
      console.error("Get assignments error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/assignments/:id
// @desc    Get specific assignment
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("course", "name code")
      .populate("faculty", "name email")
      .populate("submissions.student", "name email admissionNumber")
      .populate("submissions.gradedBy", "name email")

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      })
    }

    // Check access permissions
    if (req.user.role === "student") {
      // Students can only see their own submissions
      const userSubmission = assignment.submissions.find((sub) => sub.student._id.toString() === req.user.id)
      assignment.submissions = userSubmission ? [userSubmission] : []
    } else if (req.user.role === "faculty" && assignment.faculty._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      assignment,
    })
  } catch (error) {
    console.error("Get assignment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Faculty/Admin)
router.post(
  "/",
  [
    auth,
    authorize("faculty", "admin"),
    body("title").notEmpty().withMessage("Assignment title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("course").isMongoId().withMessage("Valid course ID is required"),
    body("branch").notEmpty().withMessage("Branch is required"),
    body("section").notEmpty().withMessage("Section is required"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("totalMarks").isInt({ min: 1 }).withMessage("Valid total marks is required"),
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

      const { title, description, course, branch, section, dueDate, totalMarks, instructions, attachments } = req.body

      // Validate course exists
      const courseExists = await Course.findById(course)
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        })
      }

      const assignment = new Assignment({
        title,
        description,
        course,
        faculty: req.user.id,
        branch,
        section,
        dueDate: new Date(dueDate),
        totalMarks,
        instructions,
        attachments: attachments || [],
      })

      await assignment.save()
      await assignment.populate("course", "name code")
      await assignment.populate("faculty", "name email")

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignment,
      })
    } catch (error) {
      console.error("Create assignment error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Faculty/Admin)
router.put("/:id", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      })
    }

    // Check if faculty can update this assignment
    if (req.user.role === "faculty" && assignment.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const { title, description, dueDate, totalMarks, instructions, attachments, isActive } = req.body

    if (title) assignment.title = title
    if (description) assignment.description = description
    if (dueDate) assignment.dueDate = new Date(dueDate)
    if (totalMarks) assignment.totalMarks = totalMarks
    if (instructions) assignment.instructions = instructions
    if (attachments) assignment.attachments = attachments
    if (isActive !== undefined) assignment.isActive = isActive

    await assignment.save()
    await assignment.populate("course", "name code")
    await assignment.populate("faculty", "name email")

    res.json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    })
  } catch (error) {
    console.error("Update assignment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Faculty/Admin)
router.delete("/:id", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      })
    }

    // Check if faculty can delete this assignment
    if (req.user.role === "faculty" && assignment.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    await Assignment.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    })
  } catch (error) {
    console.error("Delete assignment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/assignments/:id/submit
// @desc    Submit assignment
// @access  Private (Student)
router.post(
  "/:id/submit",
  [auth, authorize("student"), body("submissionText").notEmpty().withMessage("Submission text is required")],
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

      const { submissionText, attachments } = req.body

      const assignment = await Assignment.findById(req.params.id)
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        })
      }

      // Check if assignment is still active and not expired
      if (!assignment.isActive || new Date() > assignment.dueDate) {
        return res.status(400).json({
          success: false,
          message: "Assignment submission deadline has passed",
        })
      }

      // Check if student already submitted
      const existingSubmission = assignment.submissions.find((sub) => sub.student.toString() === req.user.id)
      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: "You have already submitted this assignment",
        })
      }

      // Add submission
      const submission = {
        student: req.user.id,
        submissionText,
        attachments: attachments || [],
      }

      assignment.submissions.push(submission)
      await assignment.save()

      res.json({
        success: true,
        message: "Assignment submitted successfully",
        submissionId: assignment.submissions[assignment.submissions.length - 1]._id,
        submittedAt: assignment.submissions[assignment.submissions.length - 1].submittedAt,
      })
    } catch (error) {
      console.error("Submit assignment error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/assignments/:id/submissions/:submissionId/grade
// @desc    Grade assignment submission
// @access  Private (Faculty/Admin)
router.put(
  "/:id/submissions/:submissionId/grade",
  [
    auth,
    authorize("faculty", "admin"),
    body("marks").isInt({ min: 0 }).withMessage("Valid marks are required"),
    body("feedback").optional().isString(),
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

      const { marks, feedback } = req.body

      const assignment = await Assignment.findById(req.params.id)
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        })
      }

      // Check if faculty can grade this assignment
      if (req.user.role === "faculty" && assignment.faculty.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const submission = assignment.submissions.id(req.params.submissionId)
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        })
      }

      // Validate marks don't exceed total marks
      if (marks > assignment.totalMarks) {
        return res.status(400).json({
          success: false,
          message: `Marks cannot exceed total marks (${assignment.totalMarks})`,
        })
      }

      submission.marks = marks
      submission.feedback = feedback
      submission.gradedAt = new Date()
      submission.gradedBy = req.user.id

      await assignment.save()

      res.json({
        success: true,
        message: "Assignment graded successfully",
        marks,
        feedback,
        gradedAt: submission.gradedAt,
      })
    } catch (error) {
      console.error("Grade assignment error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/assignments/students/:studentId/assignments
// @desc    Get student assignments
// @access  Private
router.get("/students/:studentId/assignments", auth, async (req, res) => {
  try {
    const { studentId } = req.params

    // Check access permissions
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const assignments = await Assignment.find({
      branch: req.user.role === "student" ? req.user.branch : undefined,
      section: req.user.role === "student" ? req.user.section : undefined,
      isActive: true,
    })
      .populate("course", "name code")
      .populate("faculty", "name email")
      .sort({ dueDate: 1 })

    // Filter and add submission status for each assignment
    const assignmentsWithStatus = assignments.map((assignment) => {
      const submission = assignment.submissions.find((sub) => sub.student.toString() === studentId)

      return {
        ...assignment.toObject(),
        hasSubmitted: !!submission,
        submissionStatus: submission
          ? {
              submittedAt: submission.submittedAt,
              marks: submission.marks,
              feedback: submission.feedback,
              gradedAt: submission.gradedAt,
            }
          : null,
        submissions: undefined, // Remove submissions array for privacy
      }
    })

    res.json({
      success: true,
      assignments: assignmentsWithStatus || [],
    })
  } catch (error) {
    console.error("Get student assignments error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/assignments/:id/submissions
// @desc    Get assignment submissions
// @access  Private (Faculty/Admin)
router.get("/:id/submissions", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("submissions.student", "name email admissionNumber")
      .populate("submissions.gradedBy", "name email")
      .populate("course", "name code")

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      })
    }

    // Check if faculty can view this assignment
    if (req.user.role === "faculty" && assignment.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      assignment: {
        title: assignment.title,
        course: assignment.course,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
      },
      submissions: assignment.submissions || [],
    })
  } catch (error) {
    console.error("Get assignment submissions error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router

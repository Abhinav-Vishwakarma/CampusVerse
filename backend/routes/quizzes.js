const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Quiz = require("../models/Quiz")
const Course = require("../models/Course")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Generate random quiz code
const generateQuizCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// @route   GET /api/quizzes
// @desc    Get all quizzes with filters
// @access  Private
router.get(
  "/",
  [
    auth,
    query("course").optional().isMongoId(),
    query("branch").optional().isString(),
    query("section").optional().isString(),
    query("active").optional().isBoolean(),
    query("faculty").optional().isMongoId(),
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

      const { course, branch, section, active, faculty, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = {}
      if (course) filter.course = course
      if (branch) filter.branch = branch
      if (section) filter.section = section
      if (active !== undefined) filter.isActive = active === "true"
      if (faculty) filter.faculty = faculty

      // Role-based filtering
      if (req.user.role === "faculty") {
        filter.faculty = req.user.id
      } else if (req.user.role === "student") {
        filter.branch = req.user.branch
        filter.section = req.user.section
        filter.isActive = true
        filter.startDate = { $lte: new Date() }
        filter.endDate = { $gte: new Date() }
      }

      const quizzes = await Quiz.find(filter)
        .populate("course", "name code")
        .populate("faculty", "name email")
        .select(req.user.role === "student" ? "-questions.correctAnswer" : "")
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .sort({ createdAt: -1 })

      const total = await Quiz.countDocuments(filter)

      // Add attempt status for students
      if (req.user.role === "student") {
        for (const quiz of quizzes) {
          const attempt = quiz.attempts.find((att) => att.student.toString() === req.user.id)
          quiz._doc.hasAttempted = !!attempt
          quiz._doc.attemptScore = attempt ? attempt.score : null
          quiz._doc.attemptPercentage = attempt ? attempt.percentage : null
        }
      }

      res.json({
        success: true,
        quizzes: quizzes || [],
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      })
    } catch (error) {
      console.error("Get quizzes error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/quizzes/:id
// @desc    Get specific quiz
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("course", "name code")
      .populate("faculty", "name email")
      .populate("attempts.student", "name email admissionNumber")

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      })
    }

    // Check access permissions
    if (req.user.role === "student") {
      // Students can only see their own attempts and can't see correct answers
      quiz.attempts = quiz.attempts.filter((att) => att.student._id.toString() === req.user.id)
      quiz.questions = quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        marks: q.marks,
      }))
    } else if (req.user.role === "faculty" && quiz.faculty._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      quiz,
    })
  } catch (error) {
    console.error("Get quiz error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/quizzes
// @desc    Create new quiz
// @access  Private (Faculty/Admin)
router.post(
  "/",
  [
    auth,
    authorize("faculty", "admin"),
    body("title").notEmpty().withMessage("Quiz title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("course").isMongoId().withMessage("Valid course ID is required"),
    body("branch").notEmpty().withMessage("Branch is required"),
    body("section").notEmpty().withMessage("Section is required"),
    body("duration").isInt({ min: 1 }).withMessage("Valid duration is required"),
    body("totalMarks").isInt({ min: 1 }).withMessage("Valid total marks is required"),
    body("passingMarks").isInt({ min: 1 }).withMessage("Valid passing marks is required"),
    body("questions").isArray({ min: 1 }).withMessage("At least one question is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
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

      const {
        title,
        description,
        course,
        branch,
        section,
        duration,
        totalMarks,
        passingMarks,
        questions,
        startDate,
        endDate,
      } = req.body

      // Validate course exists
      const courseExists = await Course.findById(course)
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        })
      }

      // Generate unique quiz code
      let code
      let codeExists = true
      while (codeExists) {
        code = generateQuizCode()
        const existingQuiz = await Quiz.findOne({ code })
        if (!existingQuiz) codeExists = false
      }

      const quiz = new Quiz({
        title,
        description,
        course,
        faculty: req.user.id,
        branch,
        section,
        duration,
        totalMarks,
        passingMarks,
        questions,
        code,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      })

      await quiz.save()
      await quiz.populate("course", "name code")
      await quiz.populate("faculty", "name email")

      res.status(201).json({
        success: true,
        message: "Quiz created successfully",
        quiz,
      })
    } catch (error) {
      console.error("Create quiz error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private (Faculty/Admin)
router.put("/:id", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      })
    }

    // Check if faculty can update this quiz
    if (req.user.role === "faculty" && quiz.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const { title, description, duration, totalMarks, passingMarks, questions, startDate, endDate, isActive } = req.body

    if (title) quiz.title = title
    if (description) quiz.description = description
    if (duration) quiz.duration = duration
    if (totalMarks) quiz.totalMarks = totalMarks
    if (passingMarks) quiz.passingMarks = passingMarks
    if (questions) quiz.questions = questions
    if (startDate) quiz.startDate = new Date(startDate)
    if (endDate) quiz.endDate = new Date(endDate)
    if (isActive !== undefined) quiz.isActive = isActive

    await quiz.save()
    await quiz.populate("course", "name code")
    await quiz.populate("faculty", "name email")

    res.json({
      success: true,
      message: "Quiz updated successfully",
      quiz,
    })
  } catch (error) {
    console.error("Update quiz error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private (Faculty/Admin)
router.delete("/:id", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      })
    }

    // Check if faculty can delete this quiz
    if (req.user.role === "faculty" && quiz.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    await Quiz.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Quiz deleted successfully",
    })
  } catch (error) {
    console.error("Delete quiz error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/quizzes/verify-code
// @desc    Verify quiz code
// @access  Private (Student)
router.post(
  "/verify-code",
  [auth, authorize("student"), body("code").notEmpty().withMessage("Quiz code is required")],
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

      const { code } = req.body

      const quiz = await Quiz.findOne({
        code: code.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }).populate("course", "name code")

      if (!quiz) {
        return res.status(404).json({
          success: false,
          valid: false,
          message: "Invalid or expired quiz code",
        })
      }

      // Check if student already attempted
      const hasAttempted = quiz.attempts.some((att) => att.student.toString() === req.user.id)

      res.json({
        success: true,
        valid: true,
        quizId: quiz._id,
        quiz: {
          title: quiz.title,
          description: quiz.description,
          duration: quiz.duration,
          totalMarks: quiz.totalMarks,
          course: quiz.course,
        },
        hasAttempted,
        message: hasAttempted ? "You have already attempted this quiz" : "Quiz code verified successfully",
      })
    } catch (error) {
      console.error("Verify quiz code error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/quizzes/:id/attempt
// @desc    Submit quiz attempt
// @access  Private (Student)
router.post(
  "/:id/attempt",
  [
    auth,
    authorize("student"),
    body("answers").isArray().withMessage("Answers array is required"),
    body("startTime").isISO8601().withMessage("Valid start time is required"),
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

      const { answers, startTime } = req.body

      const quiz = await Quiz.findById(req.params.id)
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        })
      }

      // Check if quiz is active and within time limits
      const now = new Date()
      if (!quiz.isActive || now < quiz.startDate || now > quiz.endDate) {
        return res.status(400).json({
          success: false,
          message: "Quiz is not available",
        })
      }

      // Check if student already attempted
      const existingAttempt = quiz.attempts.find((att) => att.student.toString() === req.user.id)
      if (existingAttempt) {
        return res.status(400).json({
          success: false,
          message: "You have already attempted this quiz",
        })
      }

      // Calculate score
      let score = 0
      for (const answer of answers) {
        const question = quiz.questions[answer.question]
        if (question && question.correctAnswer === answer.selectedOption) {
          score += question.marks
        }
      }

      const percentage = Math.round((score / quiz.totalMarks) * 100)

      // Add attempt to quiz
      const attempt = {
        student: req.user.id,
        answers,
        score,
        percentage,
        startTime: new Date(startTime),
        endTime: now,
      }

      quiz.attempts.push(attempt)
      await quiz.save()

      res.json({
        success: true,
        message: "Quiz submitted successfully",
        result: {
          score,
          totalMarks: quiz.totalMarks,
          percentage,
          passed: score >= quiz.passingMarks,
        },
      })
    } catch (error) {
      console.error("Submit quiz attempt error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/quizzes/students/:studentId/quiz-attempts
// @desc    Get student quiz attempts
// @access  Private
router.get("/students/:studentId/quiz-attempts", auth, async (req, res) => {
  try {
    const { studentId } = req.params

    // Check access permissions
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const quizzes = await Quiz.find({
      "attempts.student": studentId,
    })
      .populate("course", "name code")
      .populate("faculty", "name email")

    const attempts = []
    for (const quiz of quizzes) {
      const attempt = quiz.attempts.find((att) => att.student.toString() === studentId)
      if (attempt) {
        attempts.push({
          quiz: {
            id: quiz._id,
            title: quiz.title,
            course: quiz.course,
            faculty: quiz.faculty,
            totalMarks: quiz.totalMarks,
            passingMarks: quiz.passingMarks,
          },
          attempt: {
            score: attempt.score,
            percentage: attempt.percentage,
            submittedAt: attempt.submittedAt,
            passed: attempt.score >= quiz.passingMarks,
          },
        })
      }
    }

    res.json({
      success: true,
      attempts: attempts || [],
    })
  } catch (error) {
    console.error("Get student quiz attempts error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/quizzes/:id/attempts
// @desc    Get quiz attempts
// @access  Private (Faculty/Admin)
router.get("/:id/attempts", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("attempts.student", "name email admissionNumber")
      .populate("course", "name code")

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      })
    }

    // Check if faculty can view this quiz
    if (req.user.role === "faculty" && quiz.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      quiz: {
        title: quiz.title,
        course: quiz.course,
        totalMarks: quiz.totalMarks,
        passingMarks: quiz.passingMarks,
      },
      attempts: quiz.attempts || [],
    })
  } catch (error) {
    console.error("Get quiz attempts error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/quizzes/:id/generate-code
// @desc    Generate new quiz code
// @access  Private (Faculty/Admin)
router.post("/:id/generate-code", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      })
    }

    // Check if faculty can update this quiz
    if (req.user.role === "faculty" && quiz.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Generate new unique code
    let code
    let codeExists = true
    while (codeExists) {
      code = generateQuizCode()
      const existingQuiz = await Quiz.findOne({ code })
      if (!existingQuiz) codeExists = false
    }

    quiz.code = code
    await quiz.save()

    res.json({
      success: true,
      message: "New quiz code generated successfully",
      code,
    })
  } catch (error) {
    console.error("Generate quiz code error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router

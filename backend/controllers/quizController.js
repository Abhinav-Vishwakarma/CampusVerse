import Quiz from "../models/Quiz.js"
import Question from "../models/Question.js"
import QuizAttempt from "../models/QuizAttempt.js"
import User from "../models/User.js"
import Course from "../models/Course.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Create a new question
// @route   POST /api/quiz/questions
// @access  Private/Faculty
const createQuestion = async (req, res) => {
  try {
    const { text, subject, options, questionType, marks, difficulty } = req.body

    // Validate options
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "At least two options are required" })
    }

    // Check if at least one option is marked as correct
    const hasCorrectOption = options.some((option) => option.isCorrect)
    if (!hasCorrectOption) {
      return res.status(400).json({ message: "At least one option must be marked as correct" })
    }

    // Create question
    const question = await Question.create({
      text,
      subject,
      options,
      questionType,
      marks: marks || 1,
      difficulty: difficulty || "medium",
      createdBy: req.user._id,
    })

    res.status(201).json(question)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get questions by subject
// @route   GET /api/quiz/questions
// @access  Private/Faculty
const getQuestions = async (req, res) => {
  try {
    const { subject, difficulty } = req.query

    const filter = {}

    if (subject) filter.subject = subject
    if (difficulty) filter.difficulty = difficulty

    // Faculty can only see their own questions or admin's questions
    if (req.user.role === "faculty") {
      filter.$or = [{ createdBy: req.user._id }, { createdBy: { $in: await getAdminIds() } }]
    }

    const questions = await Question.find(filter).populate("createdBy", "name email").sort({ createdAt: -1 })

    res.json(questions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Helper function to get admin IDs
const getAdminIds = async () => {
  const admins = await User.find({ role: "admin" }).select("_id")
  return admins.map((admin) => admin._id)
}

// @desc    Create a new quiz
// @route   POST /api/quiz
// @access  Private/Faculty
const createQuiz = async (req, res) => {
  try {
    const { title, courseId, questionIds, duration, loginWindowStart, loginWindowEnd } = req.body

    // Validate required fields
    if (!title || !courseId || !questionIds || !duration || !loginWindowStart || !loginWindowEnd) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is authorized for this course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to create quiz for this course" })
    }

    // Validate questions
    const questions = await Question.find({ _id: { $in: questionIds } })
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: "One or more questions not found" })
    }

    // Calculate total marks
    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0)

    // Create quiz
    const quiz = await Quiz.create({
      title,
      course: courseId,
      creator: req.user._id,
      questions: questionIds,
      totalMarks,
      duration,
      loginWindowStart: new Date(loginWindowStart),
      loginWindowEnd: new Date(loginWindowEnd),
    })

    // Send notification to students
    await sendNotification({
      title: "New Quiz Created",
      message: `A new quiz "${title}" has been created for ${course.name}. Login window: ${new Date(
        loginWindowStart,
      ).toLocaleString()} to ${new Date(loginWindowEnd).toLocaleString()}`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: course.students,
      relatedTo: {
        model: "Quiz",
        id: quiz._id,
      },
      sentVia: ["app", "email"],
    })

    res.status(201).json(quiz)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all quizzes
// @route   GET /api/quiz
// @access  Private
const getQuizzes = async (req, res) => {
  try {
    const { courseId } = req.query

    const filter = {}

    if (courseId) filter.course = courseId

    // If user is a student, only show quizzes for their courses
    if (req.user.role === "student") {
      const studentCourses = await Course.find({ students: req.user._id }).select("_id")
      filter.course = { $in: studentCourses.map((course) => course._id) }
    }

    // If user is a faculty, only show quizzes they created
    if (req.user.role === "faculty") {
      filter.creator = req.user._id
    }

    const quizzes = await Quiz.find(filter)
      .populate("course", "name code")
      .populate("creator", "name email")
      .sort({ createdAt: -1 })

    res.json(quizzes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get quiz by ID
// @route   GET /api/quiz/:id
// @access  Private
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("course", "name code")
      .populate("creator", "name email")
      .populate("questions")

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" })
    }

    // Check if user is authorized to view this quiz
    if (req.user.role === "student") {
      const course = await Course.findById(quiz.course)
      if (!course.students.includes(req.user._id)) {
        return res.status(403).json({ message: "Not authorized to view this quiz" })
      }
    }

    res.json(quiz)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Start quiz attempt
// @route   POST /api/quiz/:id/attempt
// @access  Private/Student
const startQuizAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" })
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      return res.status(400).json({ message: "Quiz is not active" })
    }

    // Check if login window is open
    const now = new Date()
    if (now < quiz.loginWindowStart || now > quiz.loginWindowEnd) {
      return res.status(400).json({ message: "Quiz login window is not open" })
    }

    // Check if student is enrolled in the course
    const course = await Course.findById(quiz.course)
    if (!course.students.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to attempt this quiz" })
    }

    // Check if student has already attempted the quiz
    const existingAttempt = await QuizAttempt.findOne({
      quiz: quiz._id,
      student: req.user._id,
    })

    if (existingAttempt) {
      return res.status(400).json({ message: "You have already attempted this quiz" })
    }

    // Create quiz attempt
    const quizAttempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      startTime: now,
      status: "in-progress",
    })

    // Return quiz questions without correct answers
    const questions = await Question.find({ _id: { $in: quiz.questions } }).select("-options.isCorrect")

    res.status(201).json({
      quizAttempt,
      quiz: {
        ...quiz.toObject(),
        questions,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Submit quiz attempt
// @route   PUT /api/quiz/:id/attempt/:attemptId
// @access  Private/Student
const submitQuizAttempt = async (req, res) => {
  try {
    const { id, attemptId } = req.params
    const { answers } = req.body

    // Check if quiz exists
    const quiz = await Quiz.findById(id)
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" })
    }

    // Check if attempt exists
    const quizAttempt = await QuizAttempt.findById(attemptId)
    if (!quizAttempt) {
      return res.status(404).json({ message: "Quiz attempt not found" })
    }

    // Check if student is authorized
    if (quizAttempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to submit this attempt" })
    }

    // Check if attempt is already completed
    if (quizAttempt.status !== "in-progress") {
      return res.status(400).json({ message: "Quiz attempt is already completed" })
    }

    // Check if quiz duration has expired
    const now = new Date()
    const quizEndTime = new Date(quizAttempt.startTime)
    quizEndTime.setMinutes(quizEndTime.getMinutes() + quiz.duration)

    if (now > quizEndTime) {
      quizAttempt.endTime = quizEndTime
    } else {
      quizAttempt.endTime = now
    }

    // Process answers
    let totalMarksObtained = 0
    const processedAnswers = []

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId)
      if (!question) continue

      // Check if answer is correct
      let isCorrect = false
      let marksObtained = 0

      if (question.questionType === "single") {
        // For single correct option
        const correctOptionIndex = question.options.findIndex((opt) => opt.isCorrect)
        isCorrect = answer.selectedOptions.length === 1 && answer.selectedOptions[0] === correctOptionIndex
        marksObtained = isCorrect ? question.marks : 0
      } else {
        // For multiple correct options
        const correctOptionIndices = question.options
          .map((opt, index) => (opt.isCorrect ? index : -1))
          .filter((index) => index !== -1)

        // Check if selected options match correct options exactly
        isCorrect =
          answer.selectedOptions.length === correctOptionIndices.length &&
          answer.selectedOptions.every((opt) => correctOptionIndices.includes(opt))

        marksObtained = isCorrect ? question.marks : 0
      }

      totalMarksObtained += marksObtained

      processedAnswers.push({
        question: question._id,
        selectedOptions: answer.selectedOptions,
        isCorrect,
        marksObtained,
      })
    }

    // Update quiz attempt
    quizAttempt.answers = processedAnswers
    quizAttempt.totalMarksObtained = totalMarksObtained
    quizAttempt.status = "completed"
    await quizAttempt.save()

    // Send notification to faculty
    await sendNotification({
      title: "Quiz Attempt Submitted",
      message: `${req.user.name} has submitted the quiz "${quiz.title}"`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [quiz.creator],
      relatedTo: {
        model: "Quiz",
        id: quiz._id,
      },
      sentVia: ["app"],
    })

    res.json({
      message: "Quiz submitted successfully",
      quizAttempt,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get quiz attempts for a quiz
// @route   GET /api/quiz/:id/attempts
// @access  Private/Faculty
const getQuizAttempts = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" })
    }

    // Check if faculty is authorized
    if (quiz.creator.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view quiz attempts" })
    }

    // Get all attempts for this quiz
    const quizAttempts = await QuizAttempt.find({ quiz: quiz._id })
      .populate("student", "name email studentId")
      .sort({ createdAt: -1 })

    res.json(quizAttempts)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get student's quiz attempts
// @route   GET /api/quiz/student/attempts
// @access  Private/Student
const getStudentQuizAttempts = async (req, res) => {
  try {
    // Get all attempts for this student
    const quizAttempts = await QuizAttempt.find({ student: req.user._id })
      .populate({
        path: "quiz",
        select: "title totalMarks course",
        populate: {
          path: "course",
          select: "name code",
        },
      })
      .sort({ createdAt: -1 })

    res.json(quizAttempts)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Evaluate quiz attempt
// @route   PUT /api/quiz/attempts/:attemptId/evaluate
// @access  Private/Faculty
const evaluateQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { evaluatedAnswers } = req.body

    // Check if attempt exists
    const quizAttempt = await QuizAttempt.findById(attemptId).populate("quiz").populate("student")

    if (!quizAttempt) {
      return res.status(404).json({ message: "Quiz attempt not found" })
    }

    // Check if faculty is authorized
    if (quizAttempt.quiz.creator.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to evaluate this attempt" })
    }

    // Update answers with faculty evaluation
    let totalMarksObtained = 0

    for (const evaluatedAnswer of evaluatedAnswers) {
      const answerIndex = quizAttempt.answers.findIndex((a) => a.question.toString() === evaluatedAnswer.questionId)

      if (answerIndex !== -1) {
        quizAttempt.answers[answerIndex].isCorrect = evaluatedAnswer.isCorrect
        quizAttempt.answers[answerIndex].marksObtained = evaluatedAnswer.marksObtained
        totalMarksObtained += evaluatedAnswer.marksObtained
      }
    }

    // Update quiz attempt
    quizAttempt.totalMarksObtained = totalMarksObtained
    quizAttempt.status = "evaluated"
    quizAttempt.evaluatedBy = req.user._id
    quizAttempt.evaluatedAt = new Date()
    await quizAttempt.save()

    // Send notification to student
    await sendNotification({
      title: "Quiz Evaluated",
      message: `Your quiz "${quizAttempt.quiz.title}" has been evaluated. You scored ${totalMarksObtained}/${quizAttempt.quiz.totalMarks}`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [quizAttempt.student._id],
      relatedTo: {
        model: "Quiz",
        id: quizAttempt.quiz._id,
      },
      sentVia: ["app", "email"],
    })

    res.json({
      message: "Quiz evaluated successfully",
      quizAttempt,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Verify quiz code
// @route   POST /api/quiz/verify-code
// @access  Private/Student
const verifyQuizCode = async (req, res) => {
  try {
    const { quizCode } = req.body

    if (!quizCode) {
      return res.status(400).json({ message: "Quiz code is required" })
    }

    // Find quiz by code
    const quiz = await Quiz.findOne({ quizCode }).populate("course", "name code students")

    if (!quiz) {
      return res.status(404).json({ message: "Invalid quiz code" })
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      return res.status(400).json({ message: "Quiz is not active" })
    }

    // Check if login window is open
    const now = new Date()
    if (now < quiz.loginWindowStart || now > quiz.loginWindowEnd) {
      return res.status(400).json({ message: "Quiz login window is not open" })
    }

    // Check if student is enrolled in the course
    if (!quiz.course.students.includes(req.user._id)) {
      return res.status(403).json({ message: "You are not enrolled in this course" })
    }

    // Check if student has already attempted the quiz
    const existingAttempt = await QuizAttempt.findOne({
      quiz: quiz._id,
      student: req.user._id,
    })

    if (existingAttempt) {
      return res.status(400).json({ message: "You have already attempted this quiz" })
    }

    res.json({
      message: "Quiz code verified successfully",
      quizId: quiz._id,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export {
  createQuestion,
  getQuestions,
  createQuiz,
  getQuizzes,
  getQuizById,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempts,
  getStudentQuizAttempts,
  evaluateQuizAttempt,
  verifyQuizCode,
}

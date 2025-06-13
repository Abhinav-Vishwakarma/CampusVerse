import express from "express"
import {
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
} from "../controllers/quizController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Faculty and Admin routes
router.post("/questions", roleCheck("faculty", "admin"), createQuestion)
router.get("/questions", roleCheck("faculty", "admin"), getQuestions)
router.post("/", roleCheck("faculty", "admin"), createQuiz)
router.get("/:id/attempts", roleCheck("faculty", "admin"), getQuizAttempts)
router.put("/attempts/:attemptId/evaluate", roleCheck("faculty", "admin"), evaluateQuizAttempt)

// Student routes
router.post("/verify-code", roleCheck("student"), verifyQuizCode)
router.post("/:id/attempt", roleCheck("student"), startQuizAttempt)
router.put("/:id/attempt/:attemptId", roleCheck("student"), submitQuizAttempt)
router.get("/student/attempts", roleCheck("student"), getStudentQuizAttempts)

// All authenticated users
router.get("/", getQuizzes)
router.get("/:id", getQuizById)

export default router

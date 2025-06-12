import express from "express"
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addStudentsToCourse,
  removeStudentFromCourse,
} from "../controllers/courseController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Public routes (all authenticated users)
router.get("/", getCourses)
router.get("/:id", getCourseById)

// Faculty and Admin routes
router.post("/", roleCheck("faculty", "admin"), createCourse)
router.put("/:id", roleCheck("faculty", "admin"), updateCourse)
router.post("/:id/students", roleCheck("faculty", "admin"), addStudentsToCourse)
router.delete("/:id/students/:studentId", roleCheck("faculty", "admin"), removeStudentFromCourse)

// Admin only routes
router.delete("/:id", roleCheck("admin"), deleteCourse)

export default router

import express from "express"
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  uploadCourseMaterial,
} from "../controllers/courseController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// Protected routes
router.get("/", protect, getCourses)
router.get("/:id", protect, getCourseById)
router.post("/", protect, roleCheck("faculty", "admin"), createCourse)
router.put("/:id", protect, roleCheck("faculty", "admin"), updateCourse)
router.delete("/:id", protect, roleCheck("admin"), deleteCourse)
router.post("/:id/enroll", protect, roleCheck("student"), enrollInCourse)
router.post("/:id/materials", protect, roleCheck("faculty", "admin"), uploadCourseMaterial)

export default router

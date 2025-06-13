import express from "express"
import {
  markAttendance,
  getCourseAttendance,
  getStudentCourseAttendance,
  calculateNeededClasses,
  updateAttendance,
} from "../controllers/attendanceController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Faculty and Admin routes
router.post("/", roleCheck("faculty", "admin"), markAttendance)
router.get("/course/:courseId", roleCheck("faculty", "admin"), getCourseAttendance)
router.put("/:id", roleCheck("faculty", "admin"), updateAttendance)

// All authenticated users
router.get("/student/:studentId/course/:courseId", getStudentCourseAttendance)
router.get("/calculate-needed", calculateNeededClasses)

export default router

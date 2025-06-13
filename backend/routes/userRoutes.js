import express from "express"
import { getUsers, getUserById, updateUser, deleteUser, getDashboardStats } from "../controllers/userController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// Protected routes
router.get("/", protect, roleCheck("admin"), getUsers)
router.get("/dashboard-stats", protect, getDashboardStats)
router.get("/:id", protect, getUserById)
router.put("/:id", protect, roleCheck("admin"), updateUser)
router.delete("/:id", protect, roleCheck("admin"), deleteUser)

export default router

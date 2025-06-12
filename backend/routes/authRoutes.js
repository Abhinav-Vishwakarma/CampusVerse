import express from "express"
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getGoogleDriveAuthUrl,
  handleGoogleDriveCallback,
} from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/google-drive/callback", handleGoogleDriveCallback)

// Protected routes
router.get("/profile", protect, getUserProfile)
router.put("/profile", protect, updateUserProfile)
router.get("/google-drive", protect, getGoogleDriveAuthUrl)

export default router

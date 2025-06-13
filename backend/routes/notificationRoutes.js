import express from "express"
import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  sendCampusAlert,
  getNotificationStatistics,
} from "../controllers/notificationController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// All authenticated users
router.get("/", getUserNotifications)
router.get("/unread-count", getUnreadCount)
router.put("/:id/read", markNotificationAsRead)
router.put("/mark-all-read", markAllNotificationsAsRead)

// Faculty and Admin routes
router.post("/", roleCheck("faculty", "admin"), createNotification)
router.delete("/:id", roleCheck("faculty", "admin"), deleteNotification)

// Admin only routes
router.post("/alert", roleCheck("admin"), sendCampusAlert)
router.get("/statistics", roleCheck("admin"), getNotificationStatistics)

export default router

import Notification from "../models/Notification.js"
import User from "../models/User.js"
import { sendEmail } from "../utils/emailService.js"

/**
 * Send notification to users
 * @param {Object} notificationData - Notification data
 * @returns {Object} - Created notification
 */
const sendNotification = async (notificationData) => {
  try {
    // Create notification in database
    const notification = await Notification.create(notificationData)

    // Get recipients
    let recipients = []

    if (notificationData.recipients === "specific-users") {
      recipients = notificationData.specificUsers
    } else {
      // Query users based on role
      const query = {}
      if (notificationData.recipients !== "all") {
        query.role = notificationData.recipients.replace("s", "") // Convert 'students' to 'student'
      }

      const users = await User.find(query).select("_id email")
      recipients = users.map((user) => user._id)
    }

    // Send email notifications if enabled
    if (notificationData.sentVia.includes("email")) {
      const users = await User.find({ _id: { $in: recipients } }).select("email")

      for (const user of users) {
        if (user.email) {
          await sendEmail(
            user.email,
            notificationData.title,
            notificationData.message,
            `<h1>${notificationData.title}</h1><p>${notificationData.message}</p>`,
          )
        }
      }
    }

    // Send SMS notifications if enabled and implemented
    if (notificationData.sentVia.includes("sms")) {
      // SMS implementation would go here
      console.log("SMS notifications not implemented yet")
    }

    return notification
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Object} - Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId)

    if (!notification) {
      throw new Error("Notification not found")
    }

    // Check if already marked as read
    const alreadyRead = notification.isRead.some((read) => read.user.toString() === userId)

    if (!alreadyRead) {
      notification.isRead.push({
        user: userId,
        readAt: new Date(),
      })

      await notification.save()
    }

    return notification
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

/**
 * Get unread notifications for a user
 * @param {string} userId - User ID
 * @returns {Array} - Unread notifications
 */
const getUnreadNotifications = async (userId) => {
  try {
    const user = await User.findById(userId)

    if (!user) {
      throw new Error("User not found")
    }

    // Find notifications for this user that are not marked as read
    const notifications = await Notification.find({
      $or: [
        { recipients: "all" },
        { recipients: `${user.role}s` }, // Convert 'student' to 'students'
        { specificUsers: userId },
      ],
      "isRead.user": { $ne: userId },
    }).sort({ createdAt: -1 })

    return notifications
  } catch (error) {
    console.error("Error getting unread notifications:", error)
    throw error
  }
}

export { sendNotification, markAsRead, getUnreadNotifications }

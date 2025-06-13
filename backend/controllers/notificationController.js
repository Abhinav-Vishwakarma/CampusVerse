import Notification from "../models/Notification.js"
import User from "../models/User.js"
import { sendNotification, markAsRead, getUnreadNotifications } from "../services/notificationService.js"

// @desc    Send a new notification
// @route   POST /api/notifications
// @access  Private/Admin/Faculty
const createNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, specificUsers, relatedTo, sentVia } = req.body

    // Check if user is authorized to send notifications
    if (req.user.role !== "admin" && req.user.role !== "faculty") {
      return res.status(403).json({ message: "Not authorized to send notifications" })
    }

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" })
    }

    // Create notification data
    const notificationData = {
      title,
      message,
      type: type || "info",
      sender: req.user._id,
      recipients: recipients || "all",
      specificUsers: specificUsers || [],
      relatedTo: relatedTo || { model: null, id: null },
      sentVia: sentVia || ["app"],
    }

    // Send notification
    const notification = await sendNotification(notificationData)

    res.status(201).json({
      message: "Notification sent successfully",
      notification,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Build query
    const query = {
      $or: [
        { recipients: "all" },
        { recipients: `${user.role}s` }, // Convert 'student' to 'students'
        { specificUsers: req.user._id },
      ],
    }

    // Filter for unread notifications only
    if (unreadOnly === "true") {
      query["isRead.user"] = { $ne: req.user._id }
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Get total count
    const total = await Notification.countDocuments(query)

    // Mark notifications as read status for this user
    const notificationsWithReadStatus = notifications.map((notification) => {
      const isRead = notification.isRead.some((read) => read.user.toString() === req.user._id.toString())

      return {
        ...notification.toObject(),
        isReadByUser: isRead,
      }
    })

    res.json({
      notifications: notificationsWithReadStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadNotifications = await getUnreadNotifications(req.user._id)

    res.json({
      count: unreadNotifications.length,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id)

    res.json({
      message: "Notification marked as read",
      notification,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get all unread notifications for this user
    const unreadNotifications = await getUnreadNotifications(req.user._id)

    // Mark all as read
    for (const notification of unreadNotifications) {
      await markAsRead(notification._id, req.user._id)
    }

    res.json({
      message: `${unreadNotifications.length} notifications marked as read`,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    // Check if user is authorized to delete
    if (notification.sender.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this notification" })
    }

    await notification.deleteOne()

    res.json({ message: "Notification removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Send campus-wide alert
// @route   POST /api/notifications/alert
// @access  Private/Admin
const sendCampusAlert = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can send campus-wide alerts" })
    }

    const { title, message, type, urgent } = req.body

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" })
    }

    // Create alert notification
    const notificationData = {
      title: urgent ? `🚨 URGENT: ${title}` : title,
      message,
      type: type || "warning",
      sender: req.user._id,
      recipients: "all",
      sentVia: ["app", "email"], // Send via both app and email for alerts
    }

    // Send notification
    const notification = await sendNotification(notificationData)

    res.status(201).json({
      message: "Campus-wide alert sent successfully",
      notification,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get notification statistics
// @route   GET /api/notifications/statistics
// @access  Private/Admin
const getNotificationStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view notification statistics" })
    }

    const { startDate, endDate } = req.query

    // Build date filter
    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Get total notifications
    const totalNotifications = await Notification.countDocuments(dateFilter)

    // Get notifications by type
    const notificationsByType = await Notification.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ])

    // Get notifications by sender role
    const notificationsBySender = await Notification.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "senderInfo",
        },
      },
      { $unwind: "$senderInfo" },
      { $group: { _id: "$senderInfo.role", count: { $sum: 1 } } },
    ])

    // Get read vs unread statistics
    const readStats = await Notification.aggregate([
      { $match: dateFilter },
      {
        $project: {
          totalRecipients: {
            $cond: {
              if: { $eq: ["$recipients", "all"] },
              then: await User.countDocuments(),
              else: {
                $cond: {
                  if: { $eq: ["$recipients", "specific-users"] },
                  then: { $size: "$specificUsers" },
                  else: await User.countDocuments({ role: { $regex: "$recipients" } }),
                },
              },
            },
          },
          readCount: { $size: "$isRead" },
        },
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$totalRecipients" },
          totalRead: { $sum: "$readCount" },
        },
      },
    ])

    res.json({
      totalNotifications,
      notificationsByType,
      notificationsBySender,
      readStats: readStats[0] || { totalSent: 0, totalRead: 0 },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  sendCampusAlert,
  getNotificationStatistics,
}

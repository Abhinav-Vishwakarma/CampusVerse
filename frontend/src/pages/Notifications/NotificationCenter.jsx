"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { notificationsAPI } from "../../services/api"
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar,
  Eye,
} from "lucide-react"

const NotificationCenter = () => {
  const { user } = useAuth()
  const { showError, showSuccess } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (user?.id) fetchNotifications()
    // eslint-disable-next-line
  }, [user])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationsAPI.getUserNotifications(user.id, { limit: 50 })
      setNotifications(res.data?.data || [])
    } catch (error) {
      showError("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId, user.id)
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
    } catch {
      showError("Failed to mark as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsAPI.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      showSuccess("All notifications marked as read")
    } catch {
      showError("Failed to mark all as read")
    } finally {
      setMarkingAll(false)
    }
  }

  const sortNotifications = (notifications) => {
    const sorted = [...notifications]
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1, normal: 0 }
        return sorted.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
      case "type":
        return sorted.sort((a, b) => (a.type || "").localeCompare(b.type || ""))
      default:
        return sorted
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const sortedNotifications = sortNotifications(notifications)
console.log(sortedNotifications)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="text-gray-600 dark:text-gray-400">View your notifications</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="btn-primary flex items-center space-x-2"
          disabled={markingAll}
        >
          <Eye className="w-4 h-4" />
          <span>{markingAll ? "Marking..." : "Mark All as Read"}</span>
        </button>
      </div>

      {/* Sort Options */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field max-w-xs">
              <option value="date">Date (Newest First)</option>
              <option value="priority">Priority</option>
              <option value="type">Type</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{notifications.length} notifications</span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {sortedNotifications.map((notification) => (
          <div
            key={notification._id}
            className={`card p-6 border-l-4 ${
              notification.priority === "urgent" || notification.priority === "high"
                ? "border-red-500"
                : notification.priority === "medium"
                ? "border-yellow-500"
                : "border-blue-500"
            } ${!notification.isRead ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getTypeIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                    {!notification.isRead && (
                      <button
                        className="ml-2 text-xs text-blue-600 underline"
                        onClick={() => handleMarkAsRead(notification._id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      By {notification.createdBy?.name || "System"}
                    </span>
                    <span>•</span>
                    <span>{formatDate(notification.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(notification.priority)}`}
                >
                  {notification.priority}
                </span>
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have any notifications yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationCenter

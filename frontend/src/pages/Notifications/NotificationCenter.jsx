"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import {
  Bell,
  Plus,
  Send,
  Users,
  User,
  GraduationCap,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  Calendar,
} from "lucide-react"

const NotificationCenter = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
    targetAudience: "all",
    priority: "normal",
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // Mock notifications with dates
      const mockNotifications = [
        {
          _id: "1",
          title: "System Maintenance",
          message: "The system will be under maintenance from 2 AM to 4 AM tomorrow",
          type: "warning",
          targetAudience: "all",
          priority: "high",
          createdBy: { name: "Admin", role: "admin" },
          createdAt: "2024-01-15T10:30:00Z",
          isRead: false,
        },
        {
          _id: "2",
          title: "New Course Available",
          message: "Machine Learning course is now available for enrollment",
          type: "info",
          targetAudience: "student",
          priority: "normal",
          createdBy: { name: "Dr. Smith", role: "faculty" },
          createdAt: "2024-01-14T14:20:00Z",
          isRead: true,
        },
        {
          _id: "3",
          title: "Fee Payment Reminder",
          message: "Semester fees are due by January 20th",
          type: "warning",
          targetAudience: "student",
          priority: "medium",
          createdBy: { name: "Finance Admin", role: "admin" },
          createdAt: "2024-01-13T09:15:00Z",
          isRead: false,
        },
        {
          _id: "4",
          title: "Faculty Meeting",
          message: "Monthly faculty meeting scheduled for January 18th at 3 PM",
          type: "info",
          targetAudience: "faculty",
          priority: "normal",
          createdBy: { name: "Dean Office", role: "admin" },
          createdAt: "2024-01-12T11:45:00Z",
          isRead: true,
        },
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      showError("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      showError("Please fill in all required fields")
      return
    }

    try {
      // Mock creation
      const notification = {
        _id: Date.now().toString(),
        ...newNotification,
        createdBy: { name: user.name, role: user.role },
        createdAt: new Date().toISOString(),
        isRead: false,
      }

      setNotifications((prev) => [notification, ...prev])
      setShowCreateModal(false)
      setNewNotification({
        title: "",
        message: "",
        type: "info",
        targetAudience: "all",
        priority: "normal",
      })
      showSuccess("Notification sent successfully!")
    } catch (error) {
      showError("Failed to send notification")
    }
  }

  const sortNotifications = (notifications) => {
    const sorted = [...notifications]
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      case "priority":
        const priorityOrder = { high: 3, medium: 2, normal: 1 }
        return sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      case "type":
        return sorted.sort((a, b) => a.type.localeCompare(b.type))
      default:
        return sorted
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case "student":
        return <GraduationCap className="w-4 h-4" />
      case "faculty":
        return <User className="w-4 h-4" />
      case "admin":
        return <Shield className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
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
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const sortedNotifications = sortNotifications(notifications)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student" ? "View your notifications" : "Manage and send notifications to users"}
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "faculty") && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
        )}
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
              notification.priority === "high"
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
                    {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      {getAudienceIcon(notification.targetAudience)}
                      <span className="capitalize">{notification.targetAudience}</span>
                    </div>
                    <span>•</span>
                    <span>
                      By {notification.createdBy?.name} ({notification.createdBy?.role})
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
              {user?.role === "student"
                ? "You don't have any notifications yet."
                : "Create your first notification to get started."}
            </p>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Notification</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification((prev) => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification((prev) => ({ ...prev, message: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Enter notification message"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification((prev) => ({ ...prev, type: e.target.value }))}
                    className="input-field"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification((prev) => ({ ...prev, priority: e.target.value }))}
                    className="input-field"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Audience
                </label>
                <select
                  value={newNotification.targetAudience}
                  onChange={(e) => setNewNotification((prev) => ({ ...prev, targetAudience: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="faculty">Faculty Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter

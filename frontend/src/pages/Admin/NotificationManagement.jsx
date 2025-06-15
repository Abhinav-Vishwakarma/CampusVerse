"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { notificationsAPI, usersAPI } from "../../services/api"
import { Bell, Send, Users, Calendar, CheckCircle, Search, X, User } from "lucide-react"

const NotificationManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // User search states
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)

  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info", // info, warning, success, error
    targetType: "all", // all, branch, semester, year, individual
    targetBranches: [],
    targetSemesters: [],
    targetYears: [],
    targetUsers: [],
    priority: "normal", // low, normal, high, urgent
    scheduledAt: "",
    expiresAt: "",
  })

  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology"]
  const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]
  const years = ["2021", "2022", "2023", "2024", "2025"]

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (userSearchQuery.length > 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [userSearchQuery])

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications()
      const notificationsData = response?.data || []
      setNotifications(Array.isArray(notificationsData) ? notificationsData : [])
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      showError("Failed to fetch notifications")
      setNotifications([])
    }
  }

  const searchUsers = async () => {
    try {
      setSearchLoading(true)
      const response = await usersAPI.searchUsers(userSearchQuery)
      const usersData = response?.data || []
      setSearchResults(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error("Failed to search users:", error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleUserSelect = (selectedUser) => {
    if (!selectedUsers.find((u) => u.id === selectedUser.id)) {
      setSelectedUsers((prev) => [...prev, selectedUser])
      setNotificationForm((prev) => ({
        ...prev,
        targetUsers: [...prev.targetUsers, selectedUser.id],
      }))
    }
    setUserSearchQuery("")
    setSearchResults([])
  }

  const handleUserRemove = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
    setNotificationForm((prev) => ({
      ...prev,
      targetUsers: prev.targetUsers.filter((id) => id !== userId),
    }))
  }

  const handleSendNotification = async (e) => {
    e.preventDefault()

    if (!notificationForm.title || !notificationForm.message) {
      showError("Please fill in title and message")
      return
    }

    if (
      notificationForm.targetType !== "all" &&
      notificationForm.targetBranches.length === 0 &&
      notificationForm.targetSemesters.length === 0 &&
      notificationForm.targetYears.length === 0 &&
      notificationForm.targetUsers.length === 0
    ) {
      showError("Please select target recipients")
      return
    }

    setLoading(true)
    try {
      const notificationData = {
        ...notificationForm,
        createdBy: user?.id,
        scheduledFor: notificationForm.scheduledAt || null,
        expiresAt: notificationForm.expiresAt || null,
      }

      const response = await notificationsAPI.createNotification(notificationData)

      if (response?.data) {
        const newNotification = {
          ...response.data,
          sentBy: user?.name || "Admin",
          recipients: calculateRecipients(),
          readCount: 0,
          status: notificationForm.scheduledAt ? "scheduled" : "sent",
        }

        setNotifications((prev) => [newNotification, ...prev])

        setNotificationForm({
          title: "",
          message: "",
          type: "info",
          targetType: "all",
          targetBranches: [],
          targetSemesters: [],
          targetYears: [],
          targetUsers: [],
          priority: "normal",
          scheduledAt: "",
          expiresAt: "",
        })

        setSelectedUsers([])

        showSuccess(
          notificationForm.scheduledAt ? "Notification scheduled successfully!" : "Notification sent successfully!",
        )
      }
    } catch (error) {
      console.error("Failed to send notification:", error)
      showError("Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  const calculateRecipients = () => {
    if (notificationForm.targetType === "all") return 450
    if (notificationForm.targetType === "branch") return notificationForm.targetBranches.length * 100
    if (notificationForm.targetType === "semester") return notificationForm.targetSemesters.length * 60
    if (notificationForm.targetType === "year") return notificationForm.targetYears.length * 120
    if (notificationForm.targetType === "individual") return notificationForm.targetUsers.length
    return 0
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const handleTargetChange = (type, value, checked) => {
    setNotificationForm((prev) => {
      const targetKey = `target${type.charAt(0).toUpperCase() + type.slice(1)}s`
      const currentTargets = prev[targetKey]

      if (checked) {
        return {
          ...prev,
          [targetKey]: [...currentTargets, value],
        }
      } else {
        return {
          ...prev,
          [targetKey]: currentTargets.filter((item) => item !== value),
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Send targeted notifications to students and faculty</p>
      </div>

      {/* Send Notification Form */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send New Notification</h2>

        <form onSubmit={handleSendNotification} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Enter notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, type: e.target.value }))}
                className="input-field"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
            <textarea
              value={notificationForm.message}
              onChange={(e) => setNotificationForm((prev) => ({ ...prev, message: e.target.value }))}
              className="input-field"
              rows={4}
              placeholder="Enter notification message"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                value={notificationForm.priority}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, priority: e.target.value }))}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
              <select
                value={notificationForm.targetType}
                onChange={(e) => {
                  setNotificationForm((prev) => ({ ...prev, targetType: e.target.value }))
                  setShowUserSearch(e.target.value === "individual")
                }}
                className="input-field"
              >
                <option value="all">All Users</option>
                <option value="branch">By Branch</option>
                <option value="semester">By Semester</option>
                <option value="year">By Year</option>
                <option value="individual">Individual Users</option>
              </select>
            </div>
          </div>

          {/* Target Selection */}
          {notificationForm.targetType === "branch" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Branches</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {branches.map((branch) => (
                  <label key={branch} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationForm.targetBranches.includes(branch)}
                      onChange={(e) => handleTargetChange("branch", branch, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{branch}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {notificationForm.targetType === "semester" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Semesters
              </label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {semesters.map((semester) => (
                  <label key={semester} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationForm.targetSemesters.includes(semester)}
                      onChange={(e) => handleTargetChange("semester", semester, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{semester}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {notificationForm.targetType === "year" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Years</label>
              <div className="grid grid-cols-5 gap-2">
                {years.map((year) => (
                  <label key={year} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationForm.targetYears.includes(year)}
                      onChange={(e) => handleTargetChange("year", year, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{year}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Individual User Selection */}
          {notificationForm.targetType === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search and Select Users
              </label>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Selected Users ({selectedUsers.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((selectedUser) => (
                      <div
                        key={selectedUser.id}
                        className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                      >
                        <User className="w-3 h-3 mr-1" />
                        <span>
                          {selectedUser.name} ({selectedUser.role})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUserRemove(selectedUser.id)}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Search */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Search by name, email, branch, course, admission number..."
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        onClick={() => handleUserSelect(searchUser)}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{searchUser.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{searchUser.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                {searchUser.role}
                              </span>
                              {searchUser.branch && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  {searchUser.branch}
                                </span>
                              )}
                              {searchUser.semester && (
                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                  Sem {searchUser.semester}
                                </span>
                              )}
                            </div>
                          </div>
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {userSearchQuery.length > 2 && searchResults.length === 0 && !searchLoading && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule For Later (Optional)
              </label>
              <input
                type="datetime-local"
                value={notificationForm.scheduledAt}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                value={notificationForm.expiresAt}
                onChange={(e) => setNotificationForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{loading ? "Sending..." : notificationForm.scheduledAt ? "Schedule" : "Send Now"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sent Notifications */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sent Notifications</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{notification.message}</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Sent: {notification.sentAt ? new Date(notification.sentAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Recipients: {notification.recipients || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Read: {notification.readCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bell className="w-4 h-4" />
                        <span>By: {notification.sentBy || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Read Rate:{" "}
                    {notification.recipients
                      ? Math.round(((notification.readCount || 0) / notification.recipients) * 100)
                      : 0}
                    %
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-secondary text-xs">View Details</button>
                    <button className="btn-secondary text-xs">Resend</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications sent</h3>
              <p className="text-gray-600 dark:text-gray-400">Your sent notifications will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationManagement

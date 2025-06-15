"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { notificationsAPI, usersAPI } from "../../services/api"
import { Bell, Send, Users, Calendar, CheckCircle, Search, X, User, Trash2, RefreshCw, Eye, ChevronDown, ChevronUp } from "lucide-react"

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
    type: "announcement", // info, warning, success, error
    targetAudience: "all", // all, branch, semester, year, individual
    targetUsers: [],
    priority: "medium", // Changed default to medium
    scheduledAt: "",
    expiresAt: "",
  })

  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil", "Information Technology"]
  const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]
  const years = ["2021", "2022", "2023", "2024", "2025"]

  // New states for filters and pagination
  const [filters, setFilters] = useState({
    targetAudience: "",
    type: "",
    priority: "",
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pages: 0
  })
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

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

  // Update useEffect to watch for filter changes
  useEffect(() => {
    fetchNotifications();
  }, [filters]); // Add filters as dependency

  // Update fetchNotifications function
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.targetAudience && { targetAudience: filters.targetAudience }),
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority })
      };
      
      const response = await notificationsAPI.getNotifications(queryParams);
      
      if (response?.data?.data) {
        setNotifications(response.data.data);
        setPagination({
          current: response.data.pagination.current,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        });
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      showError(error.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
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
      showError("Title and message are required")
      return
    }

    // Validate individual target users
    if (notificationForm.targetAudience === "individual" && notificationForm.targetUsers.length === 0) {
      showError("Please select target users for individual notifications")
      return
    }

    setLoading(true)
    try {
      const notificationData = {
        ...notificationForm,
        createdBy: user?.id, // Required by backend
        scheduledFor: notificationForm.scheduledAt || null,
        expiresAt: notificationForm.expiresAt || null,
      }

      const response = await notificationsAPI.createNotification(notificationData)

      if (response?.data?.success) {
        const newNotification = response.data.data
        setNotifications((prev) => [newNotification, ...prev])

        // Reset form
        setNotificationForm({
          title: "",
          message: "",
          type: "announcement",
          targetAudience: "all",
          targetUsers: [],
          priority: "medium",
          scheduledAt: "",
          expiresAt: "",
        })
        setSelectedUsers([])
        showSuccess("Notification sent successfully!")
      }
    } catch (error) {
      console.error("Failed to send notification:", error)
      showError(error.response?.data?.message || "Failed to send notification")
    } finally {
      setLoading(false)
    }
  }

  // Update the notification type select options
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

  // Add pagination handler
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // Add delete handler
  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return
    }

    try {
      await notificationsAPI.deleteNotification(id)
      showSuccess("Notification deleted successfully")
      fetchNotifications()
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete notification")
    }
  }

  // Add bulk notification handler
  const handleBulkSend = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.createBulkNotifications(
        [notificationForm], 
        user?.id
      )
      if (response?.data?.success) {
        showSuccess(`${response.data.data.length} notifications created`)
        fetchNotifications()
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to send notifications")
    } finally {
      setLoading(false)
    }
  }

  // Add notification details viewer
  const NotificationDetails = ({ notification }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Created By</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {notification.createdBy?.name || "Unknown"}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Target Audience</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {notification.targetAudience}
          </p>
        </div>
        {notification.scheduledFor && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Scheduled For</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(notification.scheduledFor).toLocaleString()}
            </p>
          </div>
        )}
        {notification.expiresAt && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Expires At</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(notification.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Read By</h4>
        <div className="mt-2 max-h-40 overflow-y-auto">
          {notification.readBy?.map(read => (
            <div key={read.user._id} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>{read.user.name}</span>
              <span>•</span>
              <span>{new Date(read.readAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const handleResendNotification = async (notification) => {
    try {
      setLoading(true);
      // Create new notification with same content
      console.log(notification)
      const resendData = {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetAudience: notification.targetAudience,
        targetUsers: notification.targetUsers,
        priority: notification.priority,
        createdBy: user?.id
      };

      const response = await notificationsAPI.createNotification(resendData);

      if (response?.data?.success) {
        showSuccess("Notification resent successfully");
        fetchNotifications(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to resend notification:", error);
      showError(error.response?.data?.message || "Failed to resend notification");
    } finally {
      setLoading(false);
    }
  };

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
                <option value="announcement">Announcement</option>
                <option value="reminder">Reminder</option>
                <option value="alert">Alert</option>
                <option value="update">Update</option>
                <option value="event">Event</option>
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
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
              <select
                value={notificationForm.targetAudience}
                onChange={(e) => {
                  setNotificationForm((prev) => ({ ...prev, targetAudience: e.target.value }))
                  setShowUserSearch(e.target.value === "individual")
                }}
                className="input-field"
              >
                <option value="all">All Users</option>
                <option value="students">All Students</option>
                <option value="faculty">All Faculty</option>
                <option value="admin">All Admins</option>
                <option value="individual">Individual Users</option>
              </select>
            </div>
          </div>

          {/* Target Selection */}
          {notificationForm.targetAudience === "branch" && (
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

          {notificationForm.targetAudience === "semester" && (
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

          {notificationForm.targetAudience === "year" && (
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
          {notificationForm.targetAudience === "individual" && (
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

      {/* Add filter controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={filters.targetAudience}
          onChange={e => setFilters(prev => ({ ...prev, targetAudience: e.target.value }))}
          className="input-field"
        >
          <option value="">All Audiences</option>
          <option value="all">All Users</option>
          <option value="students">Students</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
          <option value="individual">Individual</option>
        </select>

        <select
          value={filters.type}
          onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="input-field"
        >
          <option value="">All Types</option>
          <option value="announcement">Announcement</option>
          <option value="reminder">Reminder</option>
          <option value="alert">Alert</option>
          <option value="update">Update</option>
          <option value="event">Event</option>
        </select>

        <select
          value={filters.priority}
          onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          className="input-field"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <button 
          onClick={() => {
            setFilters({
              targetAudience: "",
              type: "",
              priority: "",
              page: 1,
              limit: 10
            });
            fetchNotifications();
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Filters
        </button>
      </div>

      {/* Update notifications list */}
      <div className="space-y-4">
        {notifications.map(notification => (
          <div key={notification._id} className="card p-4">
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
                      Sent: {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Recipients: {notification.targetUsers?.length || 'All'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Read: {notification.readBy?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bell className="w-4 h-4" />
                    <span>By: {notification.createdBy?.name || "Unknown"}</span>
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
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => {
                  setSelectedNotification(
                    selectedNotification?._id === notification._id ? null : notification
                  )
                  setShowDetails(!showDetails)
                }}
                className="btn-secondary flex items-center gap-2"
              >
                {selectedNotification?._id === notification._id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {selectedNotification?._id === notification._id ? "Hide Details" : "Show Details"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteNotification(notification._id)}
                  className="btn-danger flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => handleResendNotification(notification)}
                  className="btn-danger flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Resend
                </button>
                
              </div>
              
            </div>

            {selectedNotification?._id === notification._id && showDetails && (
              <NotificationDetails notification={notification} />
            )}
          </div>
        ))}
      </div>

      {/* Add pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                page === pagination.current
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationManagement

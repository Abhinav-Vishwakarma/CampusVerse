"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { usersAPI, coursesAPI, eventsAPI, feesAPI } from "../../services/api"
import { Users, BookOpen, Calendar, DollarSign, AlertTriangle } from "lucide-react"

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    totalEvents: 0,
    pendingFees: 0,
    overdueFees: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [usersRes, coursesRes, eventsRes, feesRes] = await Promise.all([
        usersAPI.getUsers(),
        coursesAPI.getCourses(),
        eventsAPI.getEvents(),
        feesAPI.getOverdueFees(),
      ])

      const users = usersRes.data
      const students = users.filter((u) => u.role === "student")
      const faculty = users.filter((u) => u.role === "faculty")

      setStats({
        totalUsers: users.length,
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalCourses: coursesRes.data.length,
        totalEvents: eventsRes.data.length,
        pendingFees: feesRes.data.filter((f) => f.status === "pending").length,
        overdueFees: feesRes.data.filter((f) => f.status === "overdue").length,
      })

      // Mock recent activity
      setRecentActivity([
        { id: 1, type: "user", message: "New student registered", time: "2 hours ago" },
        { id: 2, type: "course", message: "New course created by Prof. Smith", time: "4 hours ago" },
        { id: 3, type: "event", message: "Tech fest event scheduled", time: "1 day ago" },
        { id: 4, type: "fee", message: "Fee payment received from John Doe", time: "2 days ago" },
      ])
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">Welcome back, {user?.name}! Here's what's happening in your campus.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Fees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueFees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Students</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Faculty</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.totalFaculty}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Admins</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalUsers - stats.totalStudents - stats.totalFaculty}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Pending Fees</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.pendingFees}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Overdue Fees</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.overdueFees}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Paid Fees</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalStudents - stats.pendingFees - stats.overdueFees}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div
                  className={`p-2 rounded-lg ${
                    activity.type === "user"
                      ? "bg-blue-100 dark:bg-blue-900"
                      : activity.type === "course"
                        ? "bg-green-100 dark:bg-green-900"
                        : activity.type === "event"
                          ? "bg-purple-100 dark:bg-purple-900"
                          : "bg-yellow-100 dark:bg-yellow-900"
                  }`}
                >
                  {activity.type === "user" && <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  {activity.type === "course" && <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  {activity.type === "event" && <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                  {activity.type === "fee" && <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

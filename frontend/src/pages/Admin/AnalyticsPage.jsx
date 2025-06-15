"use client"

import { useState, useEffect } from "react"
import { useNotification } from "../../contexts/NotificationContext"
import { usersAPI, coursesAPI, placementsAPI, feesAPI } from "../../services/api"
import { BarChart3, TrendingUp, Users, BookOpen, Briefcase, DollarSign } from "lucide-react"

const AnalyticsPage = () => {
  const { showError } = useNotification()
  const [analytics, setAnalytics] = useState({
    users: { total: 0, students: 0, faculty: 0, admins: 0 },
    courses: { total: 0, active: 0 },
    placements: { total: 0, applications: 0 },
    fees: { total: 0, paid: 0, pending: 0, overdue: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [usersRes, coursesRes, placementsRes, feesRes] = await Promise.all([
        usersAPI.getUsers(),
        coursesAPI.getCourses(),
        placementsAPI.getPlacements(),
        feesAPI.getOverdueFees(),
      ])

      const users = usersRes.data
      const courses = coursesRes.data
      const placements = placementsRes.data
      const fees = feesRes.data

      setAnalytics({
        users: {
          total: users.length,
          students: users.filter((u) => u.role === "student").length,
          faculty: users.filter((u) => u.role === "faculty").length,
          admins: users.filter((u) => u.role === "admin").length,
        },
        courses: {
          total: courses.length,
          active: courses.filter((c) => c.isActive).length,
        },
        placements: {
          total: placements.length,
          applications: placements.reduce((acc, p) => acc + (p.applications?.length || 0), 0),
        },
        fees: {
          total: fees.length,
          paid: fees.filter((f) => f.status === "paid").length,
          pending: fees.filter((f) => f.status === "pending").length,
          overdue: fees.filter((f) => f.status === "overdue").length,
        },
      })
    } catch (error) {
      showError("Failed to fetch analytics data")
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of system metrics and performance</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.courses.active}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Placements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.placements.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fee Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.fees.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Distribution
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Students</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">{analytics.users.students}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    ({((analytics.users.students / analytics.users.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Faculty</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">{analytics.users.faculty}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    ({((analytics.users.faculty / analytics.users.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Admins</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">{analytics.users.admins}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    ({((analytics.users.admins / analytics.users.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Status */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Fee Status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Paid</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.fees.paid}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Pending</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.fees.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Overdue</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.fees.overdue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            System Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{analytics.courses.total}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{analytics.courses.active} active</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {analytics.placements.applications}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Across {analytics.placements.total} placements
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {analytics.fees.paid > 0 ? ((analytics.fees.paid / analytics.fees.total) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fee Collection Rate</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {analytics.fees.paid} of {analytics.fees.total} paid
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Key Metrics
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.users.students > 0 ? (analytics.courses.total / analytics.users.students).toFixed(1) : 0}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Avg Courses per Student</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.placements.total > 0
                  ? (analytics.placements.applications / analytics.placements.total).toFixed(1)
                  : 0}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">Avg Applications per Placement</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.users.faculty > 0 ? (analytics.courses.total / analytics.users.faculty).toFixed(1) : 0}
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">Avg Courses per Faculty</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {analytics.fees.overdue > 0 ? ((analytics.fees.overdue / analytics.fees.total) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Overdue Fee Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

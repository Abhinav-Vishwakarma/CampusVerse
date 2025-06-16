"use client"

import { useState, useEffect } from "react"
import { useNotification } from "../../contexts/NotificationContext"
import { analyticsAPI } from "../../services/api"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Briefcase, 
  DollarSign,
  GraduationCap,
  Calendar,
  ClipboardCheck
} from "lucide-react"

const AnalyticsPage = () => {
  const { showError } = useNotification()
  const [dashboardStats, setDashboardStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [courseStats, setCourseStats] = useState(null)
  const [feeStats, setFeeStats] = useState(null)
  const [placementStats, setPlacementStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
    role: ''
  })

  useEffect(() => {
    fetchAllStats()
  }, [])

  const fetchAllStats = async () => {
    setLoading(true)
    try {
      const [
        dashboardRes,
        userRes,
        courseRes,
        feeRes,
        placementRes
      ] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getUserStats(),
        analyticsAPI.getCourseStats(),
        analyticsAPI.getFeeStats(),
        analyticsAPI.getPlacementStats()
      ])

      setDashboardStats(dashboardRes.data?.data)
      setUserStats(userRes.data?.data)
      setCourseStats(courseRes.data?.data)
      setFeeStats(feeRes.data?.data)
      setPlacementStats(placementRes.data?.data)
    } catch (error) {
      showError("Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch filtered stats
  const fetchFilteredStats = async (newFilters) => {
    setLoading(true)
    try {
      const [userRes, courseRes] = await Promise.all([
        analyticsAPI.getUserStats(newFilters),
        analyticsAPI.getCourseStats(newFilters)
      ])
      setUserStats(userRes.data?.data)
      setCourseStats(courseRes.data?.data)
    } catch (error) {
      showError("Failed to fetch filtered data")
    } finally {
      setLoading(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchFilteredStats(newFilters)
  }

  if (loading || !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select 
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="input-field"
          >
            <option value="">All Branches</option>
            {courseStats?.byBranch?.map(b => (
              <option key={b._id} value={b._id}>{b._id}</option>
            ))}
          </select>

          <select 
            value={filters.semester}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
            className="input-field"
          >
            <option value="">All Semesters</option>
            {courseStats?.bySemester?.map(s => (
              <option key={s._id} value={s._id}>Semester {s._id}</option>
            ))}
          </select>

          <select 
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="input-field"
          >
            <option value="">All Roles</option>
            {userStats?.byRole?.map(r => (
              <option key={r._id} value={r._id}>{r._id}</option>
            ))}
          </select>
        </div>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardStats.users.total}
              </p>
              <p className="text-xs text-gray-500">
                {dashboardStats.users.students} students, {dashboardStats.users.faculty} faculty
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardStats.courses}
              </p>
              <p className="text-xs text-gray-500">
                {courseStats?.enrollments?.avgEnrollment.toFixed(1)} avg enrollments
              </p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardStats.placements}
              </p>
              <p className="text-xs text-gray-500">
                {placementStats?.applicationStats?.length} applications
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fee Collection</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{feeStats?.byStatus?.find(s => s._id === 'paid')?.total?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">
                {feeStats?.overdue?.count || 0} overdue fees
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Recent Users</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {dashboardStats.recent.users.map(user => (
                <div key={user._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 capitalize">{user.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Recent Assignments</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {dashboardStats.recent.assignments.map(assignment => (
                <div key={assignment._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.course?.code}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Performance Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {dashboardStats.assignments.submissionRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assignment Submission Rate</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {courseStats?.enrollments?.avgEnrollment.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Course Enrollment</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {((feeStats?.byStatus?.find(s => s._id === 'paid')?.count || 0) / 
                  (feeStats?.byStatus?.reduce((acc, curr) => acc + curr.count, 0) || 1) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fee Collection Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

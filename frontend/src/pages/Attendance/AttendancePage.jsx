"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { attendanceAPI, coursesAPI } from "../../services/api"
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const AttendancePage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [attendanceData, setAttendanceData] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendance()
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getCourses()
      const userCourses =
        user?.role === "student"
          ? response.data.filter((course) => course.students?.includes(user._id))
          : response.data.filter((course) => course.faculty === user._id)

      setCourses(userCourses)
      if (userCourses.length > 0) {
        setSelectedCourse(userCourses[0]._id)
      }
    } catch (error) {
      showError("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    try {
      const response = await attendanceAPI.getStudentAttendance(user._id, selectedCourse)
      setAttendanceData(response.data.records || [])
      setStats(response.data.stats || {})
    } catch (error) {
      showError("Failed to fetch attendance data")
    }
  }

  const calculateNeededClasses = async () => {
    try {
      const response = await attendanceAPI.calculateNeeded({
        studentId: user._id,
        courseId: selectedCourse,
        targetPercentage: 75,
      })

      const { classesNeeded, canSkip } = response.data
      if (classesNeeded > 0) {
        showSuccess(`You need to attend ${classesNeeded} more classes to reach 75%`)
      } else if (canSkip > 0) {
        showSuccess(`You can skip ${canSkip} classes and still maintain 75%`)
      } else {
        showSuccess("You're exactly at the target attendance!")
      }
    } catch (error) {
      showError("Failed to calculate needed classes")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return "text-green-600 dark:text-green-400"
    if (percentage >= 65) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getAttendanceIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "absent":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your attendance and maintain good records</p>
        </div>
        {user?.role === "student" && (
          <button onClick={calculateNeededClasses} className="btn-primary">
            Calculate Needed Classes
          </button>
        )}
      </div>

      {/* Course Selection */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="input-field max-w-xs"
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.presentClasses || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absentClasses || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Percentage</p>
                <p className={`text-2xl font-bold ${getAttendanceColor(stats.percentage || 0)}`}>
                  {(stats.percentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Records</h2>
        </div>
        <div className="p-6">
          {attendanceData.length > 0 ? (
            <div className="space-y-3">
              {attendanceData.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getAttendanceIcon(record.status)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{record.topic || "Regular Class"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        record.status === "present"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : record.status === "absent"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {record.status}
                    </span>
                    {record.markedBy && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Marked by {record.markedBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No attendance records</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedCourse
                  ? "No attendance has been marked for this course yet."
                  : "Select a course to view attendance."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Guidelines */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">≥75%</div>
            <p className="text-sm text-green-700 dark:text-green-300">Excellent - Eligible for exams</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">65-74%</div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Warning - Improve attendance</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">&lt;65%</div>
            <p className="text-sm text-red-700 dark:text-red-300">Critical - May be debarred</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendancePage

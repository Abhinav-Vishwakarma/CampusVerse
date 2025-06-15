"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { coursesAPI, eventsAPI, aiAPI, analyticsAPI } from "../../services/api"
import { BookOpen, Calendar, Brain, TrendingUp, Award, Clock } from "lucide-react"

const StudentDashboard = () => {
  const { user } = useAuth()
  const { showError } = useNotification()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [aiCredits, setAiCredits] = useState(0)
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    avgAttendance: 0,
    avgQuizScore: 0,
    completedAssignments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch student courses
      const coursesResponse = await coursesAPI.getStudentCourses(user.id)
      const coursesData = coursesResponse?.data || []
      setCourses(Array.isArray(coursesData) ? coursesData : [])

      // Fetch upcoming events
      const eventsResponse = await eventsAPI.getEvents({ upcoming: true, limit: 5 })
      const eventsData = eventsResponse?.data || []
      setUpcomingEvents(Array.isArray(eventsData) ? eventsData : [])

      // Fetch AI credits
      const creditsResponse = await aiAPI.getCredits(user.id)
      setAiCredits(creditsResponse?.data?.credits || 0)

      // Fetch dashboard stats
      const statsResponse = await analyticsAPI.getDashboardStats()
      const statsData = statsResponse?.data || {}
      setStats({
        enrolledCourses: coursesData.length || 0,
        avgAttendance: statsData.avgAttendance || 0,
        avgQuizScore: statsData.avgQuizScore || 0,
        completedAssignments: statsData.completedAssignments || 0,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      showError("Failed to load dashboard data")
      // Set default values on error
      setCourses([])
      setUpcomingEvents([])
      setAiCredits(0)
      setStats({
        enrolledCourses: 0,
        avgAttendance: 0,
        avgQuizScore: 0,
        completedAssignments: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToAttendance = () => {
    navigate("/attendance")
  }

  const handleNavigateToQuizzes = () => {
    navigate("/quizzes")
  }

  const handleNavigateToCourses = () => {
    navigate("/courses")
  }

  const handleNavigateToEvents = () => {
    navigate("/events")
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || "Student"}!</h1>
        <p className="text-blue-100">
          {user?.course || "Course"} • Semester {user?.semester || "N/A"} • {user?.branch || "Branch"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToCourses}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enrolledCourses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToAttendance}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Credits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiCredits}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToQuizzes}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quiz Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgQuizScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Courses</h2>
            <button
              onClick={handleNavigateToCourses}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        <div className="p-6">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 6).map((course) => (
                <div
                  key={course._id || course.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/courses/${course._id || course.id}`)}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {course.name || course.title || "Untitled Course"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.code || "No Code"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {course.description || "No description available"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {course.semester ? `Semester ${course.semester}` : "No Semester"}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View Details</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses enrolled</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Visit the courses page to enroll in courses.</p>
              <button onClick={handleNavigateToCourses} className="btn-primary">
                Browse Courses
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
            <button
              onClick={handleNavigateToEvents}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        <div className="p-6">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event._id || event.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${event._id || event.id}`)}
                >
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {event.title || event.name || "Untitled Event"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.description || "No description available"}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {event.startDate ? new Date(event.startDate).toLocaleDateString() : "Date not available"}
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle registration logic here
                    }}
                  >
                    Register
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming events</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Check back later for new events.</p>
              <button onClick={handleNavigateToEvents} className="btn-primary">
                Browse Events
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard

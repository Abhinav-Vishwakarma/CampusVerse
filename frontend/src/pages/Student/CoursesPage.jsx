"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { BookOpen, Users, Clock, Star, CheckCircle, Plus, X } from "lucide-react"
import { coursesAPI } from "../../services/api"

const StudentCoursesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("enrolled")
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewCourse, setViewCourse] = useState(null)

  useEffect(() => {
    if (user?.id) fetchCourses()
    // eslint-disable-next-line
  }, [user])

  // Fetch enrolled and available courses from backend
  const fetchCourses = async () => {
    setLoading(true)
    try {
      // 1. Enrolled courses (student's courses)
      const enrolledRes = await coursesAPI.getStudentCourses(user.id)
      setEnrolledCourses(
        (enrolledRes.data?.courses || []).map((course) => ({
          ...course,
          instructor: course.faculty?.name || "",
          enrolled: true,
        }))
      )

      // 2. Available courses (all active courses not enrolled by student)
      const allRes = await coursesAPI.getCourses({ active: true, limit: 100 })
      const enrolledIds = new Set((enrolledRes.data?.courses || []).map((c) => c._id))
      setAvailableCourses(
        (allRes.data?.courses || [])
          .filter((course) => !enrolledIds.has(course._id))
          .map((course) => ({
            ...course,
            instructor: course.faculty?.name || "",
            rating: 4.5, // Placeholder, update if you have ratings
            students: course.students?.length || 0,
            type: "semester",
            category: course.branch,
            duration: "N/A",
            price: "Free",
          }))
      )
    } catch (error) {
      showError(error.message || "Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  // Enroll in a course using backend API
  const handleEnrollment = async (courseId) => {
    try {
      setLoading(true)
      await coursesAPI.enrollStudent(courseId, user.id)
      showSuccess("Successfully enrolled in course!")
      fetchCourses()
    } catch (error) {
      showError(error.message || "Failed to enroll in course")
    } finally {
      setLoading(false)
    }
  }

  const renderEnrolledCourses = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrolledCourses.map((course) => (
        <div key={course._id} className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">{course.code}</span>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Instructor: {course.instructor}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span>{course.branch}</span>
            <span>•</span>
            <span>{course.semester} Semester</span>
            <span>•</span>
            <span>{course.credits} Credits</span>
          </div>
          <button
            className="btn-primary w-full"
            onClick={() => setViewCourse(course)}
          >
            View Details
          </button>
        </div>
      ))}
      {enrolledCourses.length === 0 && (
        <div className="text-center py-12 col-span-full">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No enrolled courses</h3>
          <p className="text-gray-600 dark:text-gray-400">Enroll in a course to get started.</p>
        </div>
      )}
    </div>
  )

  const renderAvailableCourses = () => (
    <div className="space-y-6">
      {/* Available Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableCourses.map((course) => (
          <div key={course._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600 capitalize">{course.type}</span>
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                {course.price}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Instructor: {course.instructor}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{course.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{course.students} students</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{course.duration}</span>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {course.category}
              </span>
            </div>
            <button
              onClick={() => handleEnrollment(course._id)}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Now</span>
            </button>
          </div>
        ))}
        {availableCourses.length === 0 && (
          <div className="text-center py-12 col-span-full">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No available courses</h3>
            <p className="text-gray-600 dark:text-gray-400">All available courses are already enrolled.</p>
          </div>
        )}
      </div>
    </div>
  )

  // Course Detail Modal
  const renderCourseDetailModal = () => {
    if (!viewCourse) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg relative">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={() => setViewCourse(null)}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewCourse.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{viewCourse.description || "No description available."}</p>
          <div className="mb-2">
            <span className="font-semibold">Course Code:</span> {viewCourse.code}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Instructor:</span> {viewCourse.instructor}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Branch:</span> {viewCourse.branch}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Semester:</span> {viewCourse.semester}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Credits:</span> {viewCourse.credits}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Section:</span> {viewCourse.section || "-"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Total Students:</span> {viewCourse.students?.length || 0}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Type:</span> {viewCourse.type || "Semester"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Category:</span> {viewCourse.category || viewCourse.branch}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Price:</span> {viewCourse.price || "Free"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Rating:</span> {viewCourse.rating || "N/A"}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Duration:</span> {viewCourse.duration || "N/A"}
          </div>
        </div>
      </div>
    )
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your enrolled and available courses</p>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("enrolled")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "enrolled"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Enrolled Courses ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "available"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Available Courses ({availableCourses.length})
          </button>
        </nav>
      </div>
      {/* Tab Content */}
      <div className="mt-6">{activeTab === "enrolled" ? renderEnrolledCourses() : renderAvailableCourses()}</div>
      {renderCourseDetailModal()}
    </div>
  )
}

export default StudentCoursesPage

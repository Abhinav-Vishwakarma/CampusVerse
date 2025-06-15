"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { BookOpen, Users, Clock, Star, CheckCircle, Plus } from "lucide-react"

const StudentCoursesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("enrolled")
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      // Mock data for enrolled courses
      const mockEnrolledCourses = [
        {
          _id: "1",
          name: "Data Structures and Algorithms",
          code: "CS301",
          instructor: "Dr. Smith",
          progress: 75,
          type: "semester",
          branch: "Computer Science",
          semester: "5th",
          credits: 4,
          enrolled: true,
        },
        {
          _id: "2",
          name: "Database Management Systems",
          code: "CS302",
          instructor: "Prof. Johnson",
          progress: 60,
          type: "semester",
          branch: "Computer Science",
          semester: "5th",
          credits: 3,
          enrolled: true,
        },
      ]

      // Mock data for available courses
      const mockAvailableCourses = [
        {
          _id: "3",
          name: "React Development Masterclass",
          code: "UDEMY001",
          instructor: "John Doe",
          rating: 4.8,
          students: 1250,
          type: "udemy",
          category: "Web Development",
          duration: "40 hours",
          price: "Free",
        },
        {
          _id: "4",
          name: "Machine Learning Fundamentals",
          code: "COURSE001",
          instructor: "Dr. AI Expert",
          rating: 4.9,
          students: 890,
          type: "external",
          category: "AI/ML",
          duration: "60 hours",
          price: "₹2999",
        },
      ]

      setEnrolledCourses(mockEnrolledCourses)
      setAvailableCourses(mockAvailableCourses)
    } catch (error) {
      showError("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollment = async (courseId) => {
    try {
      // Mock enrollment
      const course = availableCourses.find((c) => c._id === courseId)
      if (course) {
        setEnrolledCourses((prev) => [...prev, { ...course, enrolled: true, progress: 0 }])
        setAvailableCourses((prev) => prev.filter((c) => c._id !== courseId))
        showSuccess(`Successfully enrolled in ${course.name}`)
      }
    } catch (error) {
      showError("Failed to enroll in course")
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

          {course.type === "semester" && (
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <span>{course.branch}</span>
              <span>•</span>
              <span>{course.semester} Semester</span>
              <span>•</span>
              <span>{course.credits} Credits</span>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{course.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>

          <button className="btn-primary w-full">Continue Learning</button>
        </div>
      ))}
    </div>
  )

  const renderAvailableCourses = () => (
    <div className="space-y-6">
      {/* Course Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">UDEMY Courses</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Professional development courses</p>
        </div>
        <div className="card p-4 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">External Courses</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Industry-relevant training</p>
        </div>
        <div className="card p-4 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Certification</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Professional certifications</p>
        </div>
      </div>

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
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Now</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )

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
    </div>
  )
}

export default StudentCoursesPage

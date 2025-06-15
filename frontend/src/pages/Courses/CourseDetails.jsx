"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { coursesAPI } from "../../services/api"
import { BookOpen, Users, Calendar, FileText, ArrowLeft, Upload } from "lucide-react"

const CourseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const response = await coursesAPI.getCourse(id)
      setCourse(response.data)
    } catch (error) {
      showError("Failed to fetch course details")
      navigate("/courses")
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    try {
      await coursesAPI.enrollInCourse(id)
      showSuccess("Successfully enrolled in course!")
      fetchCourse()
    } catch (error) {
      showError("Failed to enroll in course")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Course not found</h3>
        <p className="text-gray-600 dark:text-gray-400">The course you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/courses")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {course.code} • {course.department}
          </p>
        </div>
        {user?.role === "student" && !course.students?.includes(user._id) && (
          <button onClick={handleEnroll} className="btn-primary">
            Enroll Now
          </button>
        )}
      </div>

      {/* Course Info Card */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg inline-block mb-2">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Semester</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{course.semester}</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg inline-block mb-2">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{course.students?.length || 0}</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg inline-block mb-2">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Credits</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{course.credits || 3}</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg inline-block mb-2">
              <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Materials</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{course.materials?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {["overview", "materials", "students"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Description</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{course.description}</p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Objectives</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Understand fundamental concepts and principles</li>
            <li>Apply theoretical knowledge to practical problems</li>
            <li>Develop critical thinking and analytical skills</li>
            <li>Work effectively in team environments</li>
          </ul>
        </div>
      )}

      {activeTab === "materials" && (
        <div className="space-y-4">
          {(user?.role === "faculty" || user?.role === "admin") && (
            <div className="flex justify-end">
              <button className="btn-primary flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Material</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {course.materials?.map((material, index) => (
              <div key={index} className="card p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{material.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {material.type} • {material.size}
                    </p>
                  </div>
                </div>
                <button className="btn-secondary">Download</button>
              </div>
            )) || (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No materials uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Enrolled Students ({course.students?.length || 0})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.students?.map((student, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{student.name?.[0] || "S"}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{student.name || `Student ${index + 1}`}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{student.studentId || "N/A"}</p>
                </div>
              </div>
            )) || (
              <div className="col-span-full text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No students enrolled yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetails

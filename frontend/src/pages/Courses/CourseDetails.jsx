"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { coursesAPI, usersAPI } from "../../services/api"
import { BookOpen, Users, Calendar, FileText, ArrowLeft, Upload, Plus, Trash2, X } from "lucide-react"

const CourseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [allStudents, setAllStudents] = useState([])
  const [enrolling, setEnrolling] = useState(false)
  const [removing, setRemoving] = useState({})
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [fetchingStudents, setFetchingStudents] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchCourse()
    // eslint-disable-next-line
  }, [id])

  // Fetch all students only when switching to "students" tab and modal is opened
  useEffect(() => {
    if (
      (user?.role === "faculty" || user?.role === "admin") &&
      activeTab === "students" &&
      showEnrollModal
    ) {
      fetchAllStudents()
    }
    // eslint-disable-next-line
  }, [activeTab, showEnrollModal])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await coursesAPI.getCourse(id)
      if (response?.data?.success) {
        setCourse(response.data.course)
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch course details")
      navigate("/courses")
    } finally {
      setLoading(false)
    }
  }

  // Fetch all students for enroll modal (for faculty/admin)
  const fetchAllStudents = async () => {
    if (!course) return
    setFetchingStudents(true)
    try {
      const res = await usersAPI.getUsers({
        role: "student",
        branch: course.branch,
        semester: course.semester,
      })
      setAllStudents(res.data?.users || [])
    } catch {
      setAllStudents([])
    } finally {
      setFetchingStudents(false)
    }
  }

  // Student self-enroll
  const handleEnroll = async () => {
    try {
      const response = await coursesAPI.enrollStudent(id, user._id || user.id)
      if (response?.data?.success) {
        showSuccess("Successfully enrolled in course!")
        fetchCourse()
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to enroll in course")
    }
  }

  // Student self-unenroll
  const handleUnenroll = async () => {
    try {
      const response = await coursesAPI.unenrollStudent(id, user._id || user.id)
      if (response?.data?.success) {
        showSuccess("Successfully unenrolled from course!")
        fetchCourse()
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to unenroll from course")
    }
  }

  // Faculty/Admin: Enroll a student
  const handleEnrollStudent = async (studentId) => {
    setEnrolling(studentId)
    try {
      const response = await coursesAPI.enrollStudent(id, studentId)
      if (response?.data?.success) {
        showSuccess("Student enrolled successfully!")
        fetchCourse()
        // Remove enrolled student from modal list
        setAllStudents((prev) => prev.filter((stu) => (stu._id || stu.id) !== studentId))
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to enroll student")
    } finally {
      setEnrolling(false)
    }
  }

  // Faculty/Admin: Remove a student
  const handleRemoveStudent = async (studentId) => {
    setRemoving((prev) => ({ ...prev, [studentId]: true }))
    try {
      const response = await coursesAPI.unenrollStudent(id, studentId)
      if (response?.data?.success) {
        showSuccess("Student removed from course!")
        fetchCourse()
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to remove student")
    } finally {
      setRemoving((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  // Admin: Delete course
  const handleDeleteCourse = async () => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return
    setDeleting(true)
    try {
      const response = await coursesAPI.deleteCourse(id)
      if (response?.data?.success) {
        showSuccess("Course deleted successfully!")
        navigate("/courses")
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete course")
    } finally {
      setDeleting(false)
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

  // For faculty/admin: students not yet enrolled
  const enrolledIds = course.students?.map((s) => s._id || s.id) || []
  const unenrolledStudents = allStudents.filter(
    (stu) => !enrolledIds.includes(stu._id || stu.id)
  )

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
        {user?.role === "student" && !enrolledIds.includes(user._id || user.id) && (
          <button onClick={handleEnroll} className="btn-primary">
            Enroll Now
          </button>
        )}
        {user?.role === "student" && enrolledIds.includes(user._id || user.id) && (
          <button onClick={handleUnenroll} className="btn-secondary">
            Unenroll
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
          <div className="flex justify-between items-start">
            <div>
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
            {user?.role === "admin" && (
              <button
                onClick={handleDeleteCourse}
                className="btn-danger flex items-center space-x-2 ml-4"
                disabled={deleting}
                title="Delete Course"
              >
                <Trash2 className="w-5 h-5" />
                <span>{deleting ? "Deleting..." : "Delete Course"}</span>
              </button>
            )}
          </div>
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
            {course.materials?.length > 0 ? (
              course.materials.map((material, index) => (
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
              ))
            ) : (
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enrolled Students ({course.students?.length || 0})
            </h3>
            {(user?.role === "faculty" || user?.role === "admin") && (
              <button
                className="btn-primary flex items-center space-x-2"
                onClick={() => setShowEnrollModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Enroll Student</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.students?.length > 0 ? (
              course.students.map((student, index) => (
                <div key={student._id || student.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{student.name?.[0] || "S"}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{student.name || `Student ${index + 1}`}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.admissionNumber || student.email || "N/A"}</p>
                  </div>
                  {(user?.role === "faculty" || user?.role === "admin") && (
                    <button
                      className="btn-danger flex items-center space-x-1"
                      onClick={() => handleRemoveStudent(student._id || student.id)}
                      disabled={removing[student._id || student.id]}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{removing[student._id || student.id] ? "Removing..." : "Remove"}</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No students enrolled yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowEnrollModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Enroll Student</h2>
            {fetchingStudents ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : unenrolledStudents.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No eligible students found for this course.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                {unenrolledStudents.map((stu) => (
                  <div key={stu._id || stu.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{stu.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Admission No: {stu.admissionNumber || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Email: {stu.email}
                      </div>
                    </div>
                    <button
                      className="btn-primary flex items-center space-x-1"
                      onClick={() => handleEnrollStudent(stu._id || stu.id)}
                      disabled={enrolling === (stu._id || stu.id)}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{enrolling === (stu._id || stu.id) ? "Adding..." : "Add"}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetails

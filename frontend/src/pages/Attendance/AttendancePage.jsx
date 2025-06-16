"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { attendanceAPI, coursesAPI } from "../../services/api"
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle, Plus, Edit2 } from "lucide-react"

const AttendancePage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [attendanceData, setAttendanceData] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [markForm, setMarkForm] = useState({
    date: "",
    topic: "",
    lecture: 1,
    students: [],
  })

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    // Only fetch attendance if a valid course ID is selected
    if (selectedCourse) {
      fetchAttendance()
    }
    // eslint-disable-next-line
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getCourses(user.id)
      setCourses(response.data.courses)
      // Set selectedCourse to the first course's _id (not name)
      if (response.data.courses && response.data.courses.length > 0) {
        setSelectedCourse(response.data.courses[0]._id)
      }
    } catch (error) {
      showError("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    try {
      if (user.role === "student") {
        const response = await attendanceAPI.getAttendance(user.id, selectedCourse)
        setAttendanceData(response.data.records || [])
        setStats(response.data.stats || {})
      } else {
        // For faculty/admin, get all attendance for the course
        const response = await attendanceAPI.getAttendance(selectedCourse)
        setAttendanceData(response.data.records || [])
        setStats(response.data.overallStats || {})
      }
    } catch (error) {
      showError("Failed to fetch attendance data")
    }
  }

  // Calculate needed classes for student
  const calculateNeededClasses = async () => {
    try {
      const response = await attendanceAPI.calculateNeeded({
        courseId: selectedCourse,
        targetPercentage: 75,
      })
      const { calculation } = response.data
      showSuccess(calculation.message)
    } catch (error) {
      showError("Failed to calculate needed classes")
    }
  }

  // Mark attendance (faculty/admin)
  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    if (!markForm.date || !markForm.topic || !markForm.lecture || markForm.students.length === 0) {
      showError("Please fill all fields and select at least one student.")
      return
    }
    try {
      await attendanceAPI.markAttendance({
        course: selectedCourse,
        date: markForm.date,
        topic: markForm.topic,
        lecture: markForm.lecture,
        students: markForm.students,
      })
      showSuccess("Attendance marked successfully!")
      setShowMarkModal(false)
      fetchAttendance()
    } catch (error) {
      showError("Failed to mark attendance")
    }
  }

  // Edit attendance (faculty/admin)
  const handleEditAttendance = async (e) => {
    e.preventDefault()
    if (!editRecord) return
    try {
      await attendanceAPI.updateAttendance(editRecord._id, {
        status: editRecord.status,
        topic: editRecord.topic,
        lecture: editRecord.lecture,
      })
      showSuccess("Attendance updated successfully!")
      setShowEditModal(false)
      setEditRecord(null)
      fetchAttendance()
    } catch (error) {
      showError("Failed to update attendance")
    }
  }

  // For faculty/admin: get students for selected course
  const courseStudents =
    courses.find((c) => c._id === selectedCourse)?.students?.map((s) =>
      typeof s === "object" ? s : { _id: s, name: s }
    ) || []

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
        {["faculty", "admin"].includes(user?.role) && (
          <button
            className="btn-primary flex items-center space-x-2"
            onClick={() => {
              setShowMarkModal(true)
              setMarkForm({
                date: "",
                topic: "",
                lecture: 1,
                students: courseStudents.map((s) => ({
                  studentId: s._id,
                  status: "present",
                })),
              })
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Mark Attendance</span>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClasses || stats.totalRecords || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.presentClasses || stats.totalPresent || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absentClasses || stats.totalAbsent || 0}</p>
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
                <p className={`text-2xl font-bold ${getAttendanceColor(stats.percentage || stats.overallPercentage || 0)}`}>
                  {(stats.percentage || stats.overallPercentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
                      {record.student && (user.role === "faculty" || user.role === "admin") && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Student: {record.student.name} ({record.student.admissionNumber})
                        </p>
                      )}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Marked by {record.markedBy.name || record.markedBy}
                      </p>
                    )}
                    {["faculty", "admin"].includes(user.role) && (
                      <button
                        className="ml-2 text-xs text-blue-600 underline"
                        onClick={() => {
                          setEditRecord({ ...record })
                          setShowEditModal(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 inline" /> Edit
                      </button>
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

      {/* Mark Attendance Modal (Faculty/Admin) */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowMarkModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Mark Attendance</h2>
            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={markForm.date}
                  onChange={e => setMarkForm(f => ({ ...f, date: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic</label>
                <input
                  type="text"
                  value={markForm.topic}
                  onChange={e => setMarkForm(f => ({ ...f, topic: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecture Number</label>
                <input
                  type="number"
                  min={1}
                  value={markForm.lecture}
                  onChange={e => setMarkForm(f => ({ ...f, lecture: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Students</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {courseStudents.map((student, idx) => (
                    <div key={student._id} className="flex items-center space-x-2">
                      <span className="w-36 truncate">{student.name}</span>
                      <select
                        value={
                          markForm.students[idx]?.status || "present"
                        }
                        onChange={e => {
                          const updated = [...markForm.students]
                          updated[idx] = {
                            studentId: student._id,
                            status: e.target.value,
                          }
                          setMarkForm(f => ({
                            ...f,
                            students: updated,
                          }))
                        }}
                        className="input-field"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setShowMarkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal (Faculty/Admin) */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowEditModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Attendance</h2>
            <form onSubmit={handleEditAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={editRecord.status}
                  onChange={e => setEditRecord(r => ({ ...r, status: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic</label>
                <input
                  type="text"
                  value={editRecord.topic}
                  onChange={e => setEditRecord(r => ({ ...r, topic: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecture Number</label>
                <input
                  type="number"
                  min={1}
                  value={editRecord.lecture}
                  onChange={e => setEditRecord(r => ({ ...r, lecture: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

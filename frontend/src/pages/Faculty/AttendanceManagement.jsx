"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Users, Calendar, CheckCircle, XCircle, Clock, Save } from "lucide-react"

const AttendanceManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [lectureNo, setLectureNo] = useState("")
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)

  const courses = ["B.Tech", "M.Tech", "BCA", "MCA"]
  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil"]
  const sections = ["A", "B", "C"]

  useEffect(() => {
    if (selectedCourse && selectedBranch && selectedSection) {
      fetchStudents()
    }
  }, [selectedCourse, selectedBranch, selectedSection])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      // Mock student data
      const mockStudents = [
        { _id: "1", name: "John Doe", rollNo: "CS2021001", studentId: "STU001" },
        { _id: "2", name: "Jane Smith", rollNo: "CS2021002", studentId: "STU002" },
        { _id: "3", name: "Mike Johnson", rollNo: "CS2021003", studentId: "STU003" },
        { _id: "4", name: "Sarah Wilson", rollNo: "CS2021004", studentId: "STU004" },
        { _id: "5", name: "David Brown", rollNo: "CS2021005", studentId: "STU005" },
        { _id: "6", name: "Emily Davis", rollNo: "CS2021006", studentId: "STU006" },
        { _id: "7", name: "Alex Miller", rollNo: "CS2021007", studentId: "STU007" },
        { _id: "8", name: "Lisa Garcia", rollNo: "CS2021008", studentId: "STU008" },
      ]

      setStudents(mockStudents)

      // Initialize attendance state
      const initialAttendance = {}
      mockStudents.forEach((student) => {
        initialAttendance[student._id] = "present"
      })
      setAttendance(initialAttendance)
    } catch (error) {
      showError("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleSubmitAttendance = async () => {
    if (!lectureNo) {
      showError("Please specify lecture number")
      return
    }

    setLoading(true)
    try {
      // Mock submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const presentCount = Object.values(attendance).filter((status) => status === "present").length
      const absentCount = Object.values(attendance).filter((status) => status === "absent").length
      const exemptCount = Object.values(attendance).filter((status) => status === "exempt").length

      showSuccess(
        `Attendance submitted successfully! Present: ${presentCount}, Absent: ${absentCount}, Exempt: ${exemptCount}`,
      )

      // Reset form
      setLectureNo("")
      setAttendance({})
    } catch (error) {
      showError("Failed to submit attendance")
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const present = Object.values(attendance).filter((status) => status === "present").length
    const absent = Object.values(attendance).filter((status) => status === "absent").length
    const exempt = Object.values(attendance).filter((status) => status === "exempt").length

    return { total, present, absent, exempt }
  }

  const stats = getAttendanceStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Mark attendance for your classes</p>
      </div>

      {/* Selection Form */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input-field">
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="input-field">
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input-field"
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecture No.</label>
            <input
              type="number"
              value={lectureNo}
              onChange={(e) => setLectureNo(e.target.value)}
              className="input-field"
              placeholder="Enter lecture number"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.present}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.absent}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exempt</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.exempt}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      {students.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Student List - {selectedCourse} {selectedBranch} Section {selectedSection}
              </h2>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{student.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{student.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Roll No: {student.rollNo} | ID: {student.studentId}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAttendanceChange(student._id, "present")}
                      className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                        attendance[student._id] === "present"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Present</span>
                    </button>

                    <button
                      onClick={() => handleAttendanceChange(student._id, "absent")}
                      className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                        attendance[student._id] === "absent"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Absent</span>
                    </button>

                    <button
                      onClick={() => handleAttendanceChange(student._id, "exempt")}
                      className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${
                        attendance[student._id] === "exempt"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>Exempt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmitAttendance}
                disabled={loading || !lectureNo}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? "Submitting..." : "Submit Attendance"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedCourse || !selectedBranch || !selectedSection ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select Class Details</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select course, branch, and section to view students.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default AttendanceManagement

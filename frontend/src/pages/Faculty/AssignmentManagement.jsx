"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Plus, Calendar, FileText, Users, Eye, Download, CheckCircle } from "lucide-react"

const AssignmentManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("create")
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)

  const [assignmentForm, setAssignmentForm] = useState({
    course: "",
    branch: "",
    section: "",
    subject: "",
    unit: "",
    title: "",
    description: "",
    dueDate: "",
    maxMarks: 10,
    instructions: "",
  })

  const courses = ["B.Tech", "M.Tech", "BCA", "MCA"]
  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil"]
  const sections = ["A", "B", "C"]

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      // Mock assignments data
      const mockAssignments = [
        {
          _id: "1",
          title: "Data Structures Implementation",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          unit: "2",
          description: "Implement various data structures in C++",
          dueDate: "2024-02-20",
          maxMarks: 10,
          createdAt: "2024-02-10",
          submissions: 15,
          totalStudents: 45,
          status: "active",
        },
        {
          _id: "2",
          title: "Database Design Project",
          course: "B.Tech",
          branch: "Computer Science",
          section: "B",
          subject: "DBMS",
          unit: "3",
          description: "Design a complete database for library management",
          dueDate: "2024-02-25",
          maxMarks: 15,
          createdAt: "2024-02-12",
          submissions: 8,
          totalStudents: 38,
          status: "active",
        },
      ]

      setAssignments(mockAssignments)
    } catch (error) {
      showError("Failed to fetch assignments")
    }
  }

  const handleCreateAssignment = async (e) => {
    e.preventDefault()

    if (
      !assignmentForm.course ||
      !assignmentForm.branch ||
      !assignmentForm.section ||
      !assignmentForm.subject ||
      !assignmentForm.title ||
      !assignmentForm.dueDate
    ) {
      showError("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // Mock creation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newAssignment = {
        _id: Date.now().toString(),
        ...assignmentForm,
        createdAt: new Date().toISOString().split("T")[0],
        submissions: 0,
        totalStudents: 45, // Mock student count
        status: "active",
      }

      setAssignments((prev) => [newAssignment, ...prev])
      setAssignmentForm({
        course: "",
        branch: "",
        section: "",
        subject: "",
        unit: "",
        title: "",
        description: "",
        dueDate: "",
        maxMarks: 10,
        instructions: "",
      })
      showSuccess("Assignment created successfully!")
      setActiveTab("manage")
    } catch (error) {
      showError("Failed to create assignment")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (assignment) => {
    const dueDate = new Date(assignment.dueDate)
    const today = new Date()

    if (dueDate < today) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    } else if (dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    } else {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const getSubmissionPercentage = (assignment) => {
    return Math.round((assignment.submissions / assignment.totalStudents) * 100)
  }

  const renderCreateAssignment = () => (
    <div className="space-y-6">
      <form onSubmit={handleCreateAssignment} className="space-y-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignment Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course *</label>
              <select
                value={assignmentForm.course}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, course: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
              <select
                value={assignmentForm.branch}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, branch: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section *</label>
              <select
                value={assignmentForm.section}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, section: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Section</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
              <input
                type="text"
                value={assignmentForm.subject}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="input-field"
                placeholder="Enter subject name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label>
              <input
                type="text"
                value={assignmentForm.unit}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, unit: e.target.value }))}
                className="input-field"
                placeholder="Enter unit number"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Enter assignment title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field"
              rows={4}
              placeholder="Enter assignment description"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
              <input
                type="date"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Marks</label>
              <input
                type="number"
                value={assignmentForm.maxMarks}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, maxMarks: Number.parseInt(e.target.value) }))}
                className="input-field"
                min="1"
                max="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</label>
            <textarea
              value={assignmentForm.instructions}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, instructions: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Enter additional instructions for students"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{loading ? "Creating..." : "Create Assignment"}</span>
          </button>
        </div>
      </form>
    </div>
  )

  const renderManageAssignments = () => (
    <div className="space-y-6">
      {assignments.map((assignment) => (
        <div key={assignment._id} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment)}`}>
                  {new Date(assignment.dueDate) < new Date()
                    ? "Overdue"
                    : new Date(assignment.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                      ? "Due Soon"
                      : "Active"}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {assignment.course} - {assignment.branch} - Section {assignment.section}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{assignment.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Subject: {assignment.subject}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Submissions: {assignment.submissions}/{assignment.totalStudents}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Max Marks: {assignment.maxMarks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Submission Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{getSubmissionPercentage(assignment)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getSubmissionPercentage(assignment)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="btn-primary text-xs flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>View Submissions</span>
            </button>
            <button className="btn-secondary text-xs flex items-center space-x-1">
              <Download className="w-3 h-3" />
              <span>Download All</span>
            </button>
            <button className="btn-secondary text-xs">Edit Assignment</button>
          </div>
        </div>
      ))}

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments found</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first assignment to get started.</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignment Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage assignments for your students</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("create")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "create"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Create Assignment
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manage"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Manage Assignments ({assignments.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">{activeTab === "create" ? renderCreateAssignment() : renderManageAssignments()}</div>
    </div>
  )
}

export default AssignmentManagement

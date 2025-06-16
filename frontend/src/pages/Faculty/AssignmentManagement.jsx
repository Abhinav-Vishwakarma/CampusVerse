"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { assignmentsAPI, coursesAPI } from "../../services/api"
import { Plus, Calendar, FileText, Users, Eye, Download, CheckCircle, Trash2, Edit2 } from "lucide-react"

const AssignmentManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("create")
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [branches, setBranches] = useState([])
  const [sections, setSections] = useState([])
  const [editAssignment, setEditAssignment] = useState(null)
  const [viewSubmissions, setViewSubmissions] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [submissionLoading, setSubmissionLoading] = useState(false)

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    course: "",
    branch: "",
    section: "",
    title: "",
    description: "",
    dueDate: "",
    totalMarks: 10,
    instructions: "",
    attachments: [],
  })

  // Grading state
  const [grading, setGrading] = useState({}) // { [submissionId]: { marks, feedback, saving } }

  // Fetch courses, branches, sections for faculty
  useEffect(() => {
    fetchCourses()
  }, [])

  // Fetch assignments only when tab is switched to "manage"
  useEffect(() => {
    if (activeTab === "manage" && user?.role === "faculty") {
      fetchAssignments()
    }
    // eslint-disable-next-line
  }, [activeTab, user])

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.getCourses({ faculty: user._id, active: true, limit: 100 })
      setCourses(res.data?.courses || [])
      // Extract unique branches and sections from courses
      const allBranches = new Set()
      const allSections = new Set()
      res.data?.courses?.forEach(c => {
        if (c.branch) allBranches.add(c.branch)
        if (c.section) allSections.add(c.section)
      })
      setBranches([...allBranches])
      setSections([...allSections])
    } catch {
      setCourses([])
      setBranches([])
      setSections([])
    }
  }

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      // console.log(user)
      const res = await assignmentsAPI.getAssignments({
        faculty: user.id,
        status: "all",
        limit: 50,
      })
      setAssignments(res.data?.assignments || [])
    } catch {
      showError("Failed to fetch assignments")
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  // Create or update assignment
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault()
    const { course, branch, section, title, description, dueDate, totalMarks } = assignmentForm
    if (!course || !branch || !section || !title || !description || !dueDate || !totalMarks) {
      showError("Please fill in all required fields")
      return
    }
    setLoading(true)
    try {
      if (editAssignment) {
        // Update
        const res = await assignmentsAPI.updateAssignment(editAssignment._id, {
          ...assignmentForm,
          totalMarks: Number(assignmentForm.totalMarks),
        })
        if (res.data?.success) {
          showSuccess("Assignment updated successfully!")
          setEditAssignment(null)
          setAssignmentForm({
            course: "",
            branch: "",
            section: "",
            title: "",
            description: "",
            dueDate: "",
            totalMarks: 10,
            instructions: "",
            attachments: [],
          })
          fetchAssignments()
          setActiveTab("manage")
        }
      } else {
        // Create
        const res = await assignmentsAPI.createAssignment({
          ...assignmentForm,
          totalMarks: Number(assignmentForm.totalMarks),
        })
        if (res.data?.success) {
          showSuccess("Assignment created successfully!")
          setAssignmentForm({
            course: "",
            branch: "",
            section: "",
            title: "",
            description: "",
            dueDate: "",
            totalMarks: 10,
            instructions: "",
            attachments: [],
          })
          fetchAssignments()
          setActiveTab("manage")
        }
      }
    } catch (error) {
      showError(error.message || "Failed to save assignment")
    } finally {
      setLoading(false)
    }
  }

  // Delete assignment
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return
    setLoading(true)
    try {
      const res = await assignmentsAPI.deleteAssignment(id)
      if (res.data?.success) {
        showSuccess("Assignment deleted")
        fetchAssignments()
      }
    } catch (error) {
      showError(error.message || "Failed to delete assignment")
    } finally {
      setLoading(false)
    }
  }

  // Edit assignment
  const handleEditAssignment = (assignment) => {
    setEditAssignment(assignment)
    setAssignmentForm({
      course: assignment.course?._id || assignment.course,
      branch: assignment.branch,
      section: assignment.section,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.slice(0, 10),
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions || "",
      attachments: assignment.attachments || [],
    })
    setActiveTab("create")
  }

  // View submissions
  const handleViewSubmissions = async (assignment) => {
    setViewSubmissions(assignment)
    setSubmissionLoading(true)
    try {
      const res = await assignmentsAPI.getAssignmentSubmissions(assignment._id)
      setSubmissions(res.data?.submissions || [])
    } catch {
      showError("Failed to fetch submissions")
      setSubmissions([])
    } finally {
      setSubmissionLoading(false)
    }
  }

  // Grading handler
  const handleGradeSubmission = async (submissionId) => {
    const { marks, feedback } = grading[submissionId] || {}
    if (marks === undefined || marks === "" || isNaN(Number(marks))) {
      showError("Please enter valid marks")
      return
    }
    setGrading((prev) => ({ ...prev, [submissionId]: { ...prev[submissionId], saving: true } }))
    try {
      const res = await assignmentsAPI.gradeSubmission(submissionId, {
        marks: Number(marks),
        feedback: feedback || "",
      })
      if (res.data?.success) {
        showSuccess("Grade saved!")
        // Update local submissions state
        setSubmissions((subs) =>
          subs.map((s) =>
            s._id === submissionId
              ? { ...s, marks: Number(marks), feedback: feedback || "" }
              : s
          )
        )
        setGrading((prev) => ({ ...prev, [submissionId]: { marks, feedback, saving: false } }))
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to save grade")
      setGrading((prev) => ({ ...prev, [submissionId]: { ...prev[submissionId], saving: false } }))
    }
  }

  // Render create/edit assignment form
  const renderCreateAssignment = () => (
    <div className="space-y-6">
      <form onSubmit={handleAssignmentSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editAssignment ? "Edit Assignment" : "Assignment Details"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course *</label>
              <select
                value={assignmentForm.course}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, course: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Branch *</label>
              <select
                value={assignmentForm.branch}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, branch: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Section *</label>
              <select
                value={assignmentForm.section}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, section: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Section</option>
                {/* {sections.map((section) => (
                  <option key={section} value={section}>{section}</option>
                ))} */}
                <option value="A">A</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Assignment Title *</label>
            <input
              type="text"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field"
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Due Date *</label>
              <input
                type="date"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Marks *</label>
              <input
                type="number"
                value={assignmentForm.totalMarks}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, totalMarks: Number(e.target.value) }))}
                className="input-field"
                min="1"
                max="100"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instructions</label>
            <textarea
              value={assignmentForm.instructions}
              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, instructions: e.target.value }))}
              className="input-field"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-between">
          {editAssignment && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditAssignment(null)
                setAssignmentForm({
                  course: "",
                  branch: "",
                  section: "",
                  title: "",
                  description: "",
                  dueDate: "",
                  totalMarks: 10,
                  instructions: "",
                  attachments: [],
                })
              }}
            >
              Cancel Edit
            </button>
          )}
          <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{editAssignment ? "Update Assignment" : "Create Assignment"}</span>
          </button>
        </div>
      </form>
    </div>
  )

  // Render manage assignments
  const renderManageAssignments = () => (
    <div className="space-y-6">
      {assignments.map((assignment) => (
        <div key={assignment._id} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  new Date(assignment.dueDate) < new Date()
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : new Date(assignment.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                }`}>
                  {new Date(assignment.dueDate) < new Date()
                    ? "Overdue"
                    : new Date(assignment.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                      ? "Due Soon"
                      : "Active"}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {assignment.course?.name || ""} - {assignment.branch} - Section {assignment.section}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{assignment.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Faculty: {assignment.faculty?.name || ""}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Total Marks: {assignment.totalMarks}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="btn-primary text-xs flex items-center space-x-1" onClick={() => handleViewSubmissions(assignment)}>
                <Eye className="w-3 h-3" />
                <span>View Submissions</span>
              </button>
              <button className="btn-secondary text-xs flex items-center space-x-1" onClick={() => handleEditAssignment(assignment)}>
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button className="btn-danger text-xs flex items-center space-x-1" onClick={() => handleDeleteAssignment(assignment._id)}>
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
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

      {/* Submissions Modal */}
      {viewSubmissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setViewSubmissions(null)}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">Submissions for {viewSubmissions.title}</h3>
            {submissionLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {submissions.length === 0 && (
                  <div className="text-center text-gray-500">No submissions yet.</div>
                )}
                {submissions.map((sub) => (
                  <div key={sub._id} className="border-b pb-2 mb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{sub.student?.name}</div>
                        <div className="text-xs text-gray-500">{sub.student?.email}</div>
                        <div className="text-xs text-gray-500">Admission: {sub.student?.admissionNumber}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">
                          Submitted: {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        <span className="font-semibold">Submission:</span> {sub.submissionText}
                      </div>
                      {sub.attachments && sub.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sub.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-xs"
                            >
                              {file.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Grading UI */}
                    <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
                      <div>
                        <label className="font-semibold mr-2">Marks:</label>
                        <input
                          type="number"
                          min="0"
                          max={viewSubmissions.totalMarks}
                          value={
                            grading[sub._id]?.marks !== undefined
                              ? grading[sub._id].marks
                              : sub.marks ?? ""
                          }
                          onChange={(e) =>
                            setGrading((prev) => ({
                              ...prev,
                              [sub._id]: {
                                ...prev[sub._id],
                                marks: e.target.value,
                              },
                            }))
                          }
                          className="input-field w-20"
                          disabled={grading[sub._id]?.saving}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="font-semibold mr-2">Feedback:</label>
                        <input
                          type="text"
                          value={
                            grading[sub._id]?.feedback !== undefined
                              ? grading[sub._id].feedback
                              : sub.feedback ?? ""
                          }
                          onChange={(e) =>
                            setGrading((prev) => ({
                              ...prev,
                              [sub._id]: {
                                ...prev[sub._id],
                                feedback: e.target.value,
                              },
                            }))
                          }
                          className="input-field w-full"
                          disabled={grading[sub._id]?.saving}
                        />
                      </div>
                      <button
                        className="btn-primary text-xs"
                        disabled={grading[sub._id]?.saving}
                        onClick={() => handleGradeSubmission(sub._id)}
                        type="button"
                      >
                        {grading[sub._id]?.saving ? (
                          <span className="animate-spin inline-block w-4 h-4 border-b-2 border-white rounded-full"></span>
                        ) : (
                          "Save Grade"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            onClick={() => {
              setActiveTab("create")
              setEditAssignment(null)
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "create"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {editAssignment ? "Edit Assignment" : "Create Assignment"}
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

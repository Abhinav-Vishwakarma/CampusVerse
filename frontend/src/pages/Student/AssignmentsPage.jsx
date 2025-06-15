"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Upload, FileText, Calendar, Clock, CheckCircle, AlertCircle, Download } from "lucide-react"

const AssignmentsPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [assignments, setAssignments] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [submissionText, setSubmissionText] = useState("")
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [loading, setLoading] = useState(true)

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
          subject: "Data Structures",
          description: "Implement Binary Search Tree with all operations",
          dueDate: "2024-02-15",
          maxMarks: 10,
          submittedAt: null,
          status: "pending",
          attachments: ["assignment1.pdf"],
        },
        {
          _id: "2",
          title: "Database Design Project",
          subject: "DBMS",
          description: "Design a complete database for library management system",
          dueDate: "2024-02-10",
          maxMarks: 10,
          submittedAt: "2024-02-08",
          status: "submitted",
          score: 8,
          attachments: ["db_project.pdf"],
        },
        {
          _id: "3",
          title: "Network Protocol Analysis",
          subject: "Computer Networks",
          description: "Analyze TCP/IP protocol stack and create a detailed report",
          dueDate: "2024-02-20",
          maxMarks: 10,
          submittedAt: null,
          status: "pending",
          attachments: ["network_assignment.pdf"],
        },
      ]

      setAssignments(mockAssignments)
    } catch (error) {
      showError("Failed to fetch assignments")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        showError("File size should be less than 10MB")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmission = async (assignmentId) => {
    if (!selectedFile && !submissionText.trim()) {
      showError("Please upload a file or provide submission text")
      return
    }

    try {
      // Mock submission
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment._id === assignmentId
            ? {
                ...assignment,
                status: "submitted",
                submittedAt: new Date().toISOString(),
              }
            : assignment,
        ),
      )

      setActiveAssignment(null)
      setSelectedFile(null)
      setSubmissionText("")
      showSuccess("Assignment submitted successfully!")
    } catch (error) {
      showError("Failed to submit assignment")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "overdue":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">View and submit your assignments</p>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((assignment) => {
          const overdue = isOverdue(assignment.dueDate) && assignment.status === "pending"
          const actualStatus = overdue ? "overdue" : assignment.status

          return (
            <div key={assignment._id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(actualStatus)}`}
                    >
                      {getStatusIcon(actualStatus)}
                      <span className="capitalize">{actualStatus}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{assignment.subject}</p>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{assignment.description}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>Max Marks: {assignment.maxMarks}</span>
                    </div>
                    {assignment.submittedAt && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {assignment.score && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Score: {assignment.score}/{assignment.maxMarks}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  {assignment.attachments?.map((attachment, index) => (
                    <button key={index} className="btn-secondary text-xs flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  ))}

                  {assignment.status === "pending" && (
                    <button onClick={() => setActiveAssignment(assignment._id)} className="btn-primary text-xs">
                      Submit
                    </button>
                  )}
                </div>
              </div>

              {/* Submission Form */}
              {activeAssignment === assignment._id && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Submit Assignment</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload File
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="input-field"
                          accept=".pdf,.doc,.docx,.txt,.zip"
                        />
                        {selectedFile && (
                          <span className="text-sm text-green-600 dark:text-green-400">{selectedFile.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supported formats: PDF, DOC, DOCX, TXT, ZIP (Max 10MB)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Submission Notes (Optional)
                      </label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="input-field"
                        rows={3}
                        placeholder="Add any notes about your submission..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setActiveAssignment(null)
                          setSelectedFile(null)
                          setSubmissionText("")
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmission(assignment._id)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Submit Assignment</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments found</h3>
          <p className="text-gray-600 dark:text-gray-400">Your assignments will appear here when they are assigned.</p>
        </div>
      )}
    </div>
  )
}

export default AssignmentsPage

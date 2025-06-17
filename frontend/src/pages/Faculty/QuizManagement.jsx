"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { quizAPI, coursesAPI } from "../../services/api"
import { Plus, Clock, Users, FileText, Play, Square, Trash2, Eye, Edit } from "lucide-react"

const BRANCHES = ["CSE", "ECE", "EEE", "ME", "CE", "IT", "BT"]
const SECTIONS = ["A", "B", "C", "D"]

const QuizManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("create")
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])

  // Quiz creation form state
  const [quizForm, setQuizForm] = useState({
    course: "",
    branch: "",
    section: "",
    title: "",
    description: "",
    duration: 60,
    totalMarks: 10,
    passingMarks: 5,
    startDate: "",
    endDate: "",
    questions: [],
  })

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    marks: 1,
  })

  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showResults, setShowResults] = useState(null) // quiz object or null
  const [results, setResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)

  // Fetch courses for this faculty
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await coursesAPI.getCourses({ faculty: user.id, active: true, limit: 100 })
        setCourses(res.data?.courses || [])
      } catch {
        setCourses([])
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Fetch quizzes when tab is switched to "manage"
  useEffect(() => {
    if (activeTab === "manage") fetchQuizzes()
    // eslint-disable-next-line
  }, [activeTab])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const res = await quizAPI.getQuizzes({ faculty: user.id, limit: 50 })
      setQuizzes(res.data?.quizzes || [])
    } catch {
      showError("Failed to fetch quizzes")
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuizSubmit = async (e) => {
    e.preventDefault()
    if (quizForm.questions.length === 0) {
      showError("Please add at least one question")
      return
    }
    if (
      !quizForm.course ||
      !quizForm.branch ||
      !quizForm.section ||
      !quizForm.title ||
      !quizForm.description ||
      !quizForm.startDate ||
      !quizForm.endDate
    ) {
      showError("Please fill all required fields")
      return
    }
    setLoading(true)
    try {
      const totalMarks = quizForm.questions.reduce((sum, q) => sum + (q.marks || 1), 0)
      const res = await quizAPI.createQuiz({
        ...quizForm,
        totalMarks,
        questions: quizForm.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        })),
      })
      if (res.data?.success) {
        showSuccess("Quiz created successfully!")
        setQuizForm({
          course: "",
          branch: "",
          section: "",
          title: "",
          description: "",
          duration: 60,
          totalMarks: 10,
          passingMarks: 5,
          startDate: "",
          endDate: "",
          questions: [],
        })
        setActiveTab("manage")
      } else {
        showError(res.data?.message || "Failed to create quiz")
      }
    } catch (error) {
      showError(error.message || "Failed to create quiz")
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = () => {
    if (!questionForm.question.trim() || questionForm.options.some((opt) => !opt.trim())) {
      showError("Please fill in all question fields")
      return
    }
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...questionForm,
          id: Date.now(),
        },
      ],
    }))
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1,
    })
    setShowQuestionForm(false)
    showSuccess("Question added successfully!")
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return
    setLoading(true)
    try {
      const res = await quizAPI.deleteQuiz(quizId)
      if (res.data?.success) {
        showSuccess("Quiz deleted")
        fetchQuizzes()
      } else {
        showError(res.data?.message || "Failed to delete quiz")
      }
    } catch (error) {
      showError(error.message || "Failed to delete quiz")
    } finally {
      setLoading(false)
    }
  }

  const handleViewResults = async (quiz) => {
    setShowResults(quiz)
    setResultsLoading(true)
    try {
      const res = await quizAPI.getQuizResults(quiz._id)
      setResults(res.data?.results || [])
    } catch {
      showError("Failed to fetch results")
      setResults([])
    } finally {
      setResultsLoading(false)
    }
  }

  const handleCancelQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to cancel this quiz?")) return
    setLoading(true)
    try {
      const res = await quizAPI.cancelQuiz(quizId)
      if (res.data?.success) {
        showSuccess("Quiz cancelled")
        fetchQuizzes()
      } else {
        showError(res.data?.message || "Failed to cancel quiz")
      }
    } catch (error) {
      showError(error.message || "Failed to cancel quiz")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (isActive, startDate, endDate) => {
    const now = new Date()
    if (!isActive) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    if (now < new Date(startDate)) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (now > new Date(endDate)) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  const renderCreateQuiz = () => (
    <div className="space-y-6">
      <form onSubmit={handleQuizSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course *</label>
              <select
                value={quizForm.course}
                onChange={(e) => setQuizForm({ ...quizForm, course: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
              <select
                value={quizForm.branch}
                onChange={(e) => setQuizForm({ ...quizForm, branch: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section *</label>
              <select
                value={quizForm.section}
                onChange={(e) => setQuizForm({ ...quizForm, section: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Section</option>
                {SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Title *</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="input-field"
                placeholder="Enter quiz title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
              <textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Enter quiz description"
                required
              />
            </div>
          </div>
        </div>

        {/* Timing Configuration */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timing & Marks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
              <input
                type="datetime-local"
                value={quizForm.startDate}
                onChange={(e) => setQuizForm({ ...quizForm, startDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
              <input
                type="datetime-local"
                value={quizForm.endDate}
                onChange={(e) => setQuizForm({ ...quizForm, endDate: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (minutes) *</label>
              <input
                type="number"
                value={quizForm.duration}
                onChange={(e) => setQuizForm({ ...quizForm, duration: Number.parseInt(e.target.value) })}
                className="input-field"
                min="1"
                max="180"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passing Marks *</label>
              <input
                type="number"
                value={quizForm.passingMarks}
                onChange={(e) => setQuizForm({ ...quizForm, passingMarks: Number.parseInt(e.target.value) })}
                className="input-field"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Questions ({quizForm.questions.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowQuestionForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {quizForm.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Q{index + 1}. {question.question}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded ${
                            optIndex === question.correctAnswer
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Marks: {question.marks}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setQuizForm((prev) => ({
                        ...prev,
                        questions: prev.questions.filter((q) => q.id !== question.id),
                      }))
                    }
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Question Form Modal */}
          {showQuestionForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question</label>
                    <textarea
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Enter your question"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</label>
                    <div className="space-y-2">
                      {questionForm.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={questionForm.correctAnswer === index}
                            onChange={() => setQuestionForm({ ...questionForm, correctAnswer: index })}
                            className="text-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options]
                              newOptions[index] = e.target.value
                              setQuestionForm({ ...questionForm, options: newOptions })
                            }}
                            className="input-field flex-1"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marks</label>
                    <input
                      type="number"
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: Number.parseInt(e.target.value) })}
                      className="input-field w-24"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button type="button" onClick={() => setShowQuestionForm(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="button" onClick={handleAddQuestion} className="btn-primary">
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{loading ? "Creating..." : "Create Quiz"}</span>
          </button>
        </div>
      </form>
    </div>
  )

  const renderManageQuizzes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      quiz.isActive,
                      quiz.startDate,
                      quiz.endDate,
                    )}`}
                  >
                    {quiz.isActive
                      ? new Date() < new Date(quiz.startDate)
                        ? "Scheduled"
                        : new Date() > new Date(quiz.endDate)
                        ? "Completed"
                        : "Active"
                      : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {quiz.course?.name} ({quiz.course?.code}) - {quiz.branch} - Section {quiz.section}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quiz Code: <span className="font-mono">{quiz.code}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {quiz.questions?.length || 0} Questions
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{quiz.duration} minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Start</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {quiz.startDate ? new Date(quiz.startDate).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Square className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">End</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {quiz.endDate ? new Date(quiz.endDate).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Attempts</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{quiz.attempts?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                className="btn-secondary text-xs flex items-center space-x-1"
                onClick={() => handleViewResults(quiz)}
              >
                <Eye className="w-3 h-3" />
                <span>View Results</span>
              </button>
              <button
                className="btn-secondary text-xs flex items-center space-x-1"
                onClick={() => handleCancelQuiz(quiz._id)}
                disabled={!quiz.isActive}
              >
                <Square className="w-3 h-3" />
                <span>Cancel Quiz</span>
              </button>
              <button
                onClick={() => handleDeleteQuiz(quiz._id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      {quizzes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes found</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first quiz to get started.</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage quizzes for your students</p>
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
            Create Quiz
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manage"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Manage Quizzes ({quizzes.length})
          </button>
        </nav>
      </div>
      {/* Tab Content */}
      <div className="mt-6">{activeTab === "create" ? renderCreateQuiz() : renderManageQuizzes()}</div>

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowResults(null)}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">
              Results for {showResults.title}
            </h3>
            {resultsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.length === 0 && (
                  <div className="text-center text-gray-500">No attempts yet.</div>
                )}
                {results.map((r, idx) => (
                  <div key={r.student?._id || idx} className="border-b pb-2 mb-2">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{r.student?.name}</div>
                        <div className="text-xs text-gray-500">{r.student?.email}</div>
                        <div className="text-xs text-gray-500">Admission: {r.student?.admissionNumber}</div>
                      </div>
                      <div className="text-right">
                        <div>
                          <span className="font-semibold">Score:</span>{" "}
                          {r.score} / {showResults.totalMarks}
                        </div>
                        <div>
                          <span className="font-semibold">Status:</span>{" "}
                          {r.score >= showResults.passingMarks ? (
                            <span className="text-green-600 font-semibold">Passed</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Failed</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Attempted: {r.attemptedAt ? new Date(r.attemptedAt).toLocaleString() : "-"}
                        </div>
                      </div>
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
}

export default QuizManagement

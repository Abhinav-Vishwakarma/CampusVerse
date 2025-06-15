"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Plus, Clock, Users, FileText, Play, Square, Trash2, Eye, Edit } from "lucide-react"

const QuizManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("create")
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)

  // Quiz creation form state
  const [quizForm, setQuizForm] = useState({
    course: "",
    branch: "",
    section: "",
    subject: "",
    unitNo: "",
    title: "",
    duration: 60,
    loginTime: "",
    startTime: "",
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

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      // Mock quiz data
      const mockQuizzes = [
        {
          _id: "1",
          title: "Data Structures Basics",
          code: "QUIZ1234",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          unitNo: "1",
          duration: 60,
          loginTime: "2024-02-15T09:00:00Z",
          startTime: "2024-02-15T09:30:00Z",
          status: "active",
          participants: 25,
          totalQuestions: 10,
          createdAt: "2024-02-14T10:00:00Z",
        },
        {
          _id: "2",
          title: "Database Normalization",
          code: "QUIZ5678",
          course: "B.Tech",
          branch: "Computer Science",
          section: "B",
          subject: "DBMS",
          unitNo: "2",
          duration: 45,
          loginTime: "2024-02-16T10:00:00Z",
          startTime: "2024-02-16T10:15:00Z",
          status: "scheduled",
          participants: 0,
          totalQuestions: 8,
          createdAt: "2024-02-14T11:00:00Z",
        },
      ]

      setQuizzes(mockQuizzes)
    } catch (error) {
      showError("Failed to fetch quizzes")
    }
  }

  const generateQuizCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleQuizSubmit = async (e) => {
    e.preventDefault()
    if (quizForm.questions.length === 0) {
      showError("Please add at least one question")
      return
    }

    setLoading(true)
    try {
      const newQuiz = {
        ...quizForm,
        _id: Date.now().toString(),
        code: generateQuizCode(),
        status: "scheduled",
        participants: 0,
        totalQuestions: quizForm.questions.length,
        createdAt: new Date().toISOString(),
      }

      setQuizzes((prev) => [newQuiz, ...prev])
      setQuizForm({
        course: "",
        branch: "",
        section: "",
        subject: "",
        unitNo: "",
        title: "",
        duration: 60,
        loginTime: "",
        startTime: "",
        questions: [],
      })
      showSuccess("Quiz created successfully!")
      setActiveTab("manage")
    } catch (error) {
      showError("Failed to create quiz")
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = () => {
    if (!questionForm.question.trim() || questionForm.options.some((opt) => !opt.trim())) {
      showError("Please fill in all question fields")
      return
    }

    const newQuestion = {
      ...questionForm,
      id: Date.now(),
    }

    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
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

  const handleQuizAction = async (quizId, action) => {
    try {
      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz._id === quizId
            ? {
                ...quiz,
                status: action === "start" ? "active" : action === "cancel" ? "cancelled" : quiz.status,
              }
            : quiz,
        ),
      )
      showSuccess(`Quiz ${action}ed successfully!`)
    } catch (error) {
      showError(`Failed to ${action} quiz`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const renderCreateQuiz = () => (
    <div className="space-y-6">
      <form onSubmit={handleQuizSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
              <select
                value={quizForm.course}
                onChange={(e) => setQuizForm({ ...quizForm, course: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Course</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
              <select
                value={quizForm.branch}
                onChange={(e) => setQuizForm({ ...quizForm, branch: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Branch</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
              <select
                value={quizForm.section}
                onChange={(e) => setQuizForm({ ...quizForm, section: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
              <input
                type="text"
                value={quizForm.subject}
                onChange={(e) => setQuizForm({ ...quizForm, subject: e.target.value })}
                className="input-field"
                placeholder="Enter subject name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit No.</label>
              <input
                type="text"
                value={quizForm.unitNo}
                onChange={(e) => setQuizForm({ ...quizForm, unitNo: e.target.value })}
                className="input-field"
                placeholder="Enter unit number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Title</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="input-field"
                placeholder="Enter quiz title"
                required
              />
            </div>
          </div>
        </div>

        {/* Timing Configuration */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timing Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Login Time</label>
              <input
                type="datetime-local"
                value={quizForm.loginTime}
                onChange={(e) => setQuizForm({ ...quizForm, loginTime: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Start Time</label>
              <input
                type="datetime-local"
                value={quizForm.startTime}
                onChange={(e) => setQuizForm({ ...quizForm, startTime: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes)
              </label>
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
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quiz.status)}`}>
                    {quiz.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {quiz.course} - {quiz.branch} - Section {quiz.section}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quiz.subject} (Unit {quiz.unitNo}) • Quiz Code: <span className="font-mono">{quiz.code}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{quiz.totalQuestions} Questions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{quiz.duration} minutes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Login Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(quiz.loginTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Start Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(quiz.startTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{quiz.participants}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {quiz.status === "scheduled" && (
                <button
                  onClick={() => handleQuizAction(quiz._id, "start")}
                  className="btn-primary text-xs flex items-center space-x-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Quiz</span>
                </button>
              )}
              {quiz.status === "active" && (
                <button
                  onClick={() => handleQuizAction(quiz._id, "stop")}
                  className="btn-secondary text-xs flex items-center space-x-1"
                >
                  <Square className="w-3 h-3" />
                  <span>Stop Quiz</span>
                </button>
              )}
              <button className="btn-secondary text-xs flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>View Results</span>
              </button>
              <button className="btn-secondary text-xs flex items-center space-x-1">
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleQuizAction(quiz._id, "cancel")}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Cancel</span>
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
    </div>
  )
}

export default QuizManagement

"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { quizAPI } from "../../services/api"
import { Clock, Trophy, Plus, Play, Eye } from "lucide-react"

const QuizzesPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("available")

  useEffect(() => {
    fetchQuizzes()
    if (user?.role === "student") {
      fetchAttempts()
    }
    // eslint-disable-next-line
  }, [])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      // Student: fetch only available quizzes for their branch/section
      let filters = {}
      if (user?.role === "student") {
        filters = {
          branch: user.branch,
          section: user.section,
          active: true,
          limit: 50,
        }
      }
      const response = await quizAPI.getQuizzes(filters)
      setQuizzes(response.data?.quizzes || [])
    } catch (error) {
      showError("Failed to fetch quizzes")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttempts = async () => {
    try {
      if (!user?._id) return
      const response = await quizAPI.getStudentAttempts(user._id)
      setAttempts(response.data?.attempts || [])
    } catch (error) {
      showError("Failed to fetch attempts")
    }
  }

  const handleStartQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`)
  }

  const handleQuizCodeEntry = () => {
    navigate("/quiz-code")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Only show quizzes that are active and within time window
  const availableQuizzes = quizzes.filter(
    (quiz) =>
      quiz.isActive &&
      new Date() >= new Date(quiz.startDate) &&
      new Date() <= new Date(quiz.endDate) &&
      !quiz.hasAttempted // Don't show if already attempted
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student" ? "Take quizzes and view your results" : "Manage your quizzes"}
          </p>
        </div>
        <div className="flex space-x-3">
          {user?.role === "student" && (
            <button onClick={handleQuizCodeEntry} className="btn-secondary flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Enter Quiz Code</span>
            </button>
          )}
          {(user?.role === "faculty" || user?.role === "admin") && (
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {user?.role === "student" && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("available")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Available Quizzes
            </button>
            <button
              onClick={() => setActiveTab("attempts")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "attempts"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              My Attempts
            </button>
          </nav>
        </div>
      )}

      {/* Available Quizzes */}
      {(activeTab === "available" || user?.role !== "student") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(user?.role === "student" ? availableQuizzes : quizzes).map((quiz) => (
            <div key={quiz._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    quiz.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {quiz.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{quiz.duration} min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Marks:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{quiz.totalMarks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Passing Marks:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{quiz.passingMarks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Questions:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{quiz.questions?.length || quiz.questionsCount || 0}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                {user?.role === "student" ? (
                  <button
                    onClick={() => handleStartQuiz(quiz._id)}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    disabled={!quiz.isActive || quiz.hasAttempted}
                  >
                    <Play className="w-4 h-4" />
                    <span>{quiz.hasAttempted ? "Attempted" : "Start Quiz"}</span>
                  </button>
                ) : (
                  <>
                    <button className="btn-secondary flex-1 flex items-center justify-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button className="btn-primary flex-1">Edit</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Attempts */}
      {activeTab === "attempts" && user?.role === "student" && (
        <div className="space-y-4">
          {attempts.map((attempt, idx) => (
            <div key={idx} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{attempt.quiz?.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Attempted on {attempt.attempt?.submittedAt ? new Date(attempt.attempt.submittedAt).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {attempt.attempt?.score}/{attempt.quiz?.totalMarks}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      attempt.attempt?.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {attempt.attempt?.percentage}% - {attempt.attempt?.passed ? "Passed" : "Failed"}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {attempts.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quiz attempts yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Start taking quizzes to see your results here.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(user?.role === "student" ? availableQuizzes : quizzes).length === 0 && activeTab === "available" && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student"
              ? "Check back later for new quizzes or enter a quiz code to start."
              : "Create your first quiz to get started."}
          </p>
        </div>
      )}
    </div>
  )
}

export default QuizzesPage

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useNotification } from "../../contexts/NotificationContext"
import { quizAPI } from "../../services/api"
import { KeyRound, ArrowRight } from "lucide-react"

const QuizCodeEntry = () => {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showError, showSuccess } = useNotification()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      showError("Please enter a quiz code")
      return
    }

    setLoading(true)
    try {
      const response = await quizAPI.verifyQuizCode(code.toUpperCase())
      if (response.data.valid) {
        showSuccess("Quiz code verified! Redirecting...")
        navigate(`/quiz/${response.data.quizId}`)
      } else {
        showError(response.data.message || "Invalid quiz code")
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to verify quiz code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Enter Quiz Code</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter the 4-character code provided by your instructor
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="code" className="sr-only">
              Quiz Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="appearance-none relative block w-full px-3 py-4 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
              placeholder="ABCD"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  <span>Start Quiz</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have a quiz code?{" "}
              <button
                type="button"
                onClick={() => navigate("/quizzes")}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Browse available quizzes
              </button>
            </p>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions:</h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Enter the exact 6-character code provided by your instructor</li>
            <li>• Make sure you're within the quiz time window</li>
            <li>• Ensure you have a stable internet connection</li>
            <li>• You cannot pause the quiz once started</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default QuizCodeEntry

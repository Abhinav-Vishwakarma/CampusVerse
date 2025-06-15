"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useNotification } from "../../contexts/NotificationContext"
import { quizAPI } from "../../services/api"
import { Clock, AlertTriangle, CheckCircle } from "lucide-react"

const QuizTaking = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { showError, showSuccess } = useNotification()
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [attemptId, setAttemptId] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    fetchQuiz()
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [quizId])

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timeLeft])

  const fetchQuiz = async () => {
    try {
      const response = await quizAPI.getQuiz(quizId)
      const quizData = response.data
      setQuiz(quizData)
      setTimeLeft(quizData.duration * 60) // Convert minutes to seconds

      // Start quiz attempt
      const attemptResponse = await quizAPI.attemptQuiz(quizId, {})
      setAttemptId(attemptResponse.data.attemptId)
    } catch (error) {
      showError("Failed to load quiz")
      navigate("/quizzes")
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (submitting) return

    setSubmitting(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question: questionId,
        selectedOption: answer,
      }))

      await quizAPI.updateAttempt(quizId, attemptId, {
        answers: formattedAnswers,
        status: "completed",
      })

      showSuccess("Quiz submitted successfully!")
      navigate("/quizzes")
    } catch (error) {
      showError("Failed to submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = () => {
    if (timeLeft > 300) return "text-green-600" // > 5 minutes
    if (timeLeft > 60) return "text-yellow-600" // > 1 minute
    return "text-red-600" // <= 1 minute
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quiz not found</h3>
        <p className="text-gray-600 dark:text-gray-400">The quiz you're looking for doesn't exist or has expired.</p>
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{quiz.description}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getTimeColor()}`}>
              <Clock className="inline w-6 h-6 mr-2" />
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Time remaining</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{Object.keys(answers).length} answered</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{currentQ.question}</h2>
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <input
                  type={currentQ.questionType === "multiple-choice" ? "radio" : "checkbox"}
                  name={`question-${currentQ._id}`}
                  value={option.text}
                  checked={answers[currentQ._id] === option.text}
                  onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white">{option.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? "bg-blue-600 text-white"
                    : answers[quiz.questions[index]._id]
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? "Submitting..." : "Submit Quiz"}</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
              className="btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.totalMarks}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Marks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.passingMarks}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Passing Marks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.questions.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Questions</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizTaking

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
  const [loading, setLoading] = useState(true)
  const [notStarted, setNotStarted] = useState(false)
  const [timeToStart, setTimeToStart] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const timerRef = useRef(null)
  const startTimerRef = useRef(null)

  // Fetch quiz and check if not started
  const fetchQuiz = async () => {
    setLoading(true)
    try {
      const response = await quizAPI.getQuiz(quizId)
      const quizData = response.data?.quiz
      if (!quizData) throw new Error("Quiz not found")
      const now = new Date()
      const start = new Date(quizData.startDate)
      const end = new Date(quizData.endDate)
      if (now < start) {
        setQuiz(quizData)
        setNotStarted(true)
        setTimeToStart(Math.max(0, Math.floor((start - now) / 1000)))
        setLoading(false)
        return
      }
      if (now > end) {
        showError("Quiz time is over. You cannot attempt this quiz now.")
        navigate("/quizzes")
        return
      }
      setQuiz(quizData)
      setNotStarted(false)
      setTimeLeft(quizData.duration * 60)
      setStartTime(now)
    } catch (error) {
      showError("Failed to load quiz")
      navigate("/quizzes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuiz()
    // eslint-disable-next-line
  }, [quizId])

  // Timer effect for not started state
  useEffect(() => {
    if (notStarted && quiz) {
      if (startTimerRef.current) clearInterval(startTimerRef.current)
      startTimerRef.current = setInterval(() => {
        setTimeToStart((prev) => {
          if (prev <= 1) {
            clearInterval(startTimerRef.current)
            fetchQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(startTimerRef.current)
    }
    // eslint-disable-next-line
  }, [notStarted, quiz])

  // Timer for quiz duration
  useEffect(() => {
    if (!notStarted && quiz && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
    // eslint-disable-next-line
  }, [notStarted, quiz, timeLeft])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const getTimeColor = () => {
    if (timeLeft > 300) return "text-green-600"
    if (timeLeft > 60) return "text-yellow-600"
    return "text-red-600"
  }

  const handleAnswerChange = (questionIdx, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }))
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const formattedAnswers = quiz.questions.map((q, idx) => ({
        question: idx,
        selectedOption: answers[idx] !== undefined ? Number(answers[idx]) : null,
      }))
      // Send startTime and endTime as ISO strings
      await quizAPI.attemptQuiz(quizId, {
        answers: formattedAnswers,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
      })
      showSuccess("Quiz submitted successfully!")
      navigate("/quizzes")
    } catch (error) {
      showError(
        error?.response?.data?.message ||
        (error?.response?.data?.errors?.[0]?.msg) ||
        error.message ||
        "Failed to submit quiz"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (notStarted && quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Quiz will start at</h2>
        <div className="text-lg text-gray-700 dark:text-gray-300 mb-2">
          <Clock className="inline w-5 h-5 mr-2" />
          {new Date(quiz.startDate).toLocaleString()}
        </div>
        <div className="text-md text-blue-600 dark:text-blue-300 mb-4">
          Starts in: <span className="font-mono">{formatTime(timeToStart)}</span>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/quizzes")}
        >
          Back to Quizzes
        </button>
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
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={index}
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswerChange(currentQuestion, index)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white">{option}</span>
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
                    : answers[index] !== undefined
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

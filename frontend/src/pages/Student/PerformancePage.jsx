"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { TrendingUp, Award, BookOpen, FileText, BarChart3 } from "lucide-react"

const PerformancePage = () => {
  const { user } = useAuth()
  const [selectedSemester, setSelectedSemester] = useState("5")
  const [performanceData, setPerformanceData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [selectedSemester])

  const fetchPerformanceData = async () => {
    try {
      // Mock performance data
      const mockData = {
        5: {
          assignments: [
            { subject: "Data Structures", completed: 8, total: 10, score: 85 },
            { subject: "DBMS", completed: 6, total: 8, score: 78 },
            { subject: "Computer Networks", completed: 7, total: 9, score: 82 },
          ],
          quizzes: [
            { subject: "Data Structures", attempted: 5, total: 6, avgScore: 88 },
            { subject: "DBMS", attempted: 4, total: 5, avgScore: 75 },
            { subject: "Computer Networks", attempted: 6, total: 6, avgScore: 90 },
          ],
          classTests: [
            { subject: "Data Structures", test: "Mid-term", score: 85, maxScore: 100 },
            { subject: "DBMS", test: "Unit Test 1", score: 78, maxScore: 100 },
            { subject: "Computer Networks", test: "Mid-term", score: 92, maxScore: 100 },
          ],
          overall: {
            gpa: 8.2,
            attendance: 85,
            rank: 12,
            totalStudents: 120,
          },
        },
      }

      setPerformanceData(mockData)
    } catch (error) {
      console.error("Failed to fetch performance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentData = performanceData[selectedSemester] || {}

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getScoreColor = (score, maxScore = 100) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-green-600 dark:text-green-400"
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Performance</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your academic progress and achievements</p>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="input-field w-auto"
        >
          <option value="5">5th Semester</option>
          <option value="4">4th Semester</option>
          <option value="3">3rd Semester</option>
          <option value="2">2nd Semester</option>
          <option value="1">1st Semester</option>
        </select>
      </div>

      {/* Overall Stats */}
      {currentData.overall && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current GPA</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentData.overall.gpa}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentData.overall.attendance}%</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Class Rank</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentData.overall.rank}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentData.overall.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignments */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Assignments Performance
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {currentData.assignments?.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{assignment.subject}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Completed: {assignment.completed}/{assignment.total}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor((assignment.completed / assignment.total) * 100)}`}
                      style={{ width: `${(assignment.completed / assignment.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className={`text-lg font-bold ${getScoreColor(assignment.score)}`}>{assignment.score}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quizzes */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Quiz Performance
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentData.quizzes?.map((quiz, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{quiz.subject}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Attempted</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quiz.attempted}/{quiz.total}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Score</span>
                    <span className={`font-bold ${getScoreColor(quiz.avgScore)}`}>{quiz.avgScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(quiz.avgScore)}`}
                      style={{ width: `${quiz.avgScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Tests */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Class Tests Performance
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {currentData.classTests?.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{test.subject}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{test.test}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getScoreColor(test.score, test.maxScore)}`}>
                    {test.score}/{test.maxScore}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round((test.score / test.maxScore) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformancePage

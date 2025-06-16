"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { BarChart3, TrendingUp, Users, Award, Filter } from "lucide-react"

const PerformanceTracking = () => {
  const { user } = useAuth()
  const [performanceData, setPerformanceData] = useState([])
  const [filters, setFilters] = useState({
    course: "",
    branch: "",
    section: "",
    subject: "",
  })
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  const courses = ["B.Tech", "M.Tech", "BCA", "MCA"]
  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil"]
  const sections = ["A", "B", "C"]
  const subjects = ["Data Structures", "DBMS", "Computer Networks", "Operating Systems"]

  useEffect(() => {
    fetchPerformanceData()
  }, [filters])

  const fetchPerformanceData = async () => {
    try {
      // Mock performance data
      const mockData = [
        {
          _id: "1",
          studentName: "John Doe",
          rollNo: "CS2021001",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          quizScores: [85, 78, 92, 88],
          assignmentScores: [90, 85, 88],
          attendancePercentage: 92,
          overallGrade: "A",
          totalMarks: 450,
          obtainedMarks: 385,
        },
        {
          _id: "2",
          studentName: "Jane Smith",
          rollNo: "CS2021002",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          quizScores: [92, 88, 95, 90],
          assignmentScores: [95, 92, 90],
          attendancePercentage: 96,
          overallGrade: "A+",
          totalMarks: 450,
          obtainedMarks: 410,
        },
        {
          _id: "3",
          studentName: "Mike Johnson",
          rollNo: "CS2021003",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          quizScores: [75, 70, 78, 72],
          assignmentScores: [80, 75, 78],
          attendancePercentage: 85,
          overallGrade: "B",
          totalMarks: 450,
          obtainedMarks: 340,
        },
      ]

      // Apply filters
      let filteredData = mockData
      if (filters.course) filteredData = filteredData.filter((item) => item.course === filters.course)
      if (filters.branch) filteredData = filteredData.filter((item) => item.branch === filters.branch)
      if (filters.section) filteredData = filteredData.filter((item) => item.section === filters.section)
      if (filters.subject) filteredData = filteredData.filter((item) => item.subject === filters.subject)

      setPerformanceData(filteredData)

      // Calculate stats
      const totalStudents = filteredData.length
      const avgAttendance =
        filteredData.reduce((sum, student) => sum + student.attendancePercentage, 0) / totalStudents || 0
      const avgScore =
        filteredData.reduce((sum, student) => sum + (student.obtainedMarks / student.totalMarks) * 100, 0) /
          totalStudents || 0
      const topPerformers = filteredData.filter(
        (student) => student.overallGrade === "A+" || student.overallGrade === "A",
      ).length

      setStats({
        totalStudents,
        avgAttendance: Math.round(avgAttendance),
        avgScore: Math.round(avgScore),
        topPerformers,
      })
    } catch (error) {
      console.error("Failed to fetch performance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A+":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "A":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "B":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "C":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  }

  const calculateAverage = (scores) => {
    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400">Track and analyze student performance across courses</p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
            <select
              value={filters.course}
              onChange={(e) => setFilters((prev) => ({ ...prev, course: e.target.value }))}
              className="input-field"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters((prev) => ({ ...prev, branch: e.target.value }))}
              className="input-field"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
            <select
              value={filters.section}
              onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
              className="input-field"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
              className="input-field"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgScore}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Performers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topPerformers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Student Performance ({performanceData.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course/Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quiz Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {performanceData.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{student.studentName[0]}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.studentName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{student.rollNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{student.course}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {student.branch} - Section {student.section}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {calculateAverage(student.quizScores)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {calculateAverage(student.assignmentScores)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {student.attendancePercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {Math.round((student.obtainedMarks / student.totalMarks) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(student.overallGrade)}`}
                    >
                      {student.overallGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {performanceData.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No performance data found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {Object.values(filters).some((filter) => filter)
                ? "Try adjusting your filters to see more results."
                : "Performance data will appear here once students start submitting work."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformanceTracking

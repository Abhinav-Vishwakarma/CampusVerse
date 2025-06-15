"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { BookOpen, Users, Plus, Search, Filter } from "lucide-react"

const CoursesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedSemester, selectedBranch])

  const fetchCourses = async () => {
    try {
      // Mock data for now since API might not be available
      const mockCourses = [
        {
          _id: "1",
          name: "Data Structures and Algorithms",
          code: "CS101",
          description: "Learn fundamental data structures and algorithms",
          semester: 3,
          branch: "CSE",
          students: ["user1", "user2"],
          isActive: true,
        },
        {
          _id: "2",
          name: "Database Management Systems",
          code: "CS201",
          description: "Introduction to database concepts and SQL",
          semester: 4,
          branch: "CSE",
          students: ["user1"],
          isActive: true,
        },
        {
          _id: "3",
          name: "Digital Electronics",
          code: "EC101",
          description: "Basic digital circuits and logic design",
          semester: 3,
          branch: "ECE",
          students: [],
          isActive: true,
        },
      ]

      setCourses(mockCourses)
    } catch (error) {
      showError("Failed to fetch courses")
      setCourses([]) // Ensure courses is always an array
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    if (!Array.isArray(courses)) {
      setFilteredCourses([])
      return
    }

    let filtered = [...courses]

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedSemester) {
      filtered = filtered.filter((course) => course.semester === Number.parseInt(selectedSemester))
    }

    if (selectedBranch) {
      filtered = filtered.filter((course) => course.branch === selectedBranch)
    }

    setFilteredCourses(filtered)
  }

  const handleEnroll = async (courseId) => {
    try {
      // Mock enrollment
      showSuccess("Successfully enrolled in course!")
      fetchCourses()
    } catch (error) {
      showError("Failed to enroll in course")
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student" ? "Browse and enroll in courses" : "Manage your courses"}
          </p>
        </div>
        {(user?.role === "faculty" || user?.role === "admin") && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="input-field"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="input-field">
            <option value="">All Branches</option>
            <option value="CSE">Computer Science</option>
            <option value="ECE">Electronics</option>
            <option value="ME">Mechanical</option>
            <option value="CE">Civil</option>
            <option value="EE">Electrical</option>
          </select>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(filteredCourses) &&
          filteredCourses.map((course) => (
            <div key={course._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                  {course.code}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Semester:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.semester}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Branch:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.branch}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Students:</span>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{course.students?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                {user?.role === "student" && (
                  <button
                    onClick={() => handleEnroll(course._id)}
                    className="btn-primary flex-1"
                    disabled={course.students?.includes(user._id)}
                  >
                    {course.students?.includes(user._id) ? "Enrolled" : "Enroll"}
                  </button>
                )}
                <button className="btn-secondary flex-1">View Details</button>
              </div>
            </div>
          ))}
      </div>

      {(!Array.isArray(filteredCourses) || filteredCourses.length === 0) && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default CoursesPage

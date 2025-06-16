"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import {
  BookOpen,
  Users,
  Plus,
  Search,
  Filter,
  X,
  Loader2
} from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { coursesAPI } from '../../services/api'
import { debounce } from 'lodash'

const AVAILABLE_BRANCHES = [
  "CSE",
  "ECE",
  "ME",
  "CE",
  "EE",
  "IT",
  "CSIT",
  "CSE-AIML",
  "CSE-DS"
]

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const COURSE_TYPES = [
  "Undergraduate",
  "Postgraduate",
  "Doctoral",
  "Diploma",
  "Vocational",
  "Bridge",
  "Online"
]

const CoursesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
    faculty: '',
    type: '',
    active: true,
    page: 1,
    limit: 10
  })

  const [searchParams, setSearchParams] = useState({
    branch: '',
    semester: '',
    faculty: '',
    type: ''
  })

  useEffect(() => {
    fetchCourses()
  }, [filters])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedSemester, selectedBranch])

  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
    }, 500),
    []
  )

  const fetchCourses = async (searchFilters = filters) => {
    try {
      setLoading(true)
      const response = await coursesAPI.getCourses(searchFilters)

      if (response?.data?.success) {
        setCourses(response.data.courses || [])
        setFilteredCourses(response.data.courses || [])
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to fetch courses")
      setCourses([])
      setFilteredCourses([])
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
      const response = await coursesAPI.enrollStudent(courseId, user.id)
      if (response?.data?.success) {
        showSuccess("Successfully enrolled in course!")
        fetchCourses()
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to enroll in course")
    }
  }

  const CreateCourseModal = () => {
    const { user } = useAuth()
    const { showSuccess, showError } = useNotification()
    const [loading, setLoading] = useState(false)
    const [courseForm, setCourseForm] = useState({
      name: "",
      code: "",
      description: "",
      semester: 1,
      branch: "",
      credits: 3,
      type: "Undergraduate",
      faculty: user?.role === "faculty" ? user?._id : "",
      syllabus: "",
      isActive: true
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      try {
        setLoading(true)
        const response = await coursesAPI.createCourse(courseForm)
        if (response?.data?.success) {
          showSuccess("Course created successfully!")
          setShowCreateModal(false)
          fetchCourses()
        }
      } catch (error) {
        showError(error.response?.data?.message || "Failed to create course")
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Course</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Name *</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  required
                  placeholder="Enter course name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Course Code *</label>
                <input
                  type="text"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm(prev => ({
                    ...prev,
                    code: e.target.value.toUpperCase()
                  }))}
                  className="input-field"
                  required
                  placeholder="e.g., CS101"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                className="input-field"
                rows={3}
                required
                placeholder="Enter course description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Semester *</label>
                <select
                  value={courseForm.semester}
                  onChange={(e) => setCourseForm(prev => ({
                    ...prev,
                    semester: Number(e.target.value)
                  }))}
                  className="input-field"
                  required
                >
                  {SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Branch *</label>
                <select
                  value={courseForm.branch}
                  onChange={(e) => setCourseForm(prev => ({
                    ...prev,
                    branch: e.target.value
                  }))}
                  className="input-field"
                  required
                >
                  <option value="">Select Branch</option>
                  {AVAILABLE_BRANCHES.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Credits *</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm(prev => ({
                    ...prev,
                    credits: Number(e.target.value)
                  }))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Type *</label>
                <select
                  value={courseForm.type}
                  onChange={(e) => setCourseForm(prev => ({
                    ...prev,
                    type: e.target.value
                  }))}
                  className="input-field"
                  required
                >
                  {COURSE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {user?.role === "admin" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Faculty *</label>
                  <select
                    value={courseForm.faculty}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      faculty: e.target.value
                    }))}
                    className="input-field"
                    required
                  >
                   <option value="">All Faculty</option>
                    <option value="teacher">Teacher</option>
                    {/* Fetch and map faculty users here */}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Syllabus Link</label>
              <input
                type="url"
                value={courseForm.syllabus}
                onChange={(e) => setCourseForm(prev => ({
                  ...prev,
                  syllabus: e.target.value
                }))}
                className="input-field"
                placeholder="Enter syllabus link (optional)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={courseForm.isActive}
                onChange={(e) => setCourseForm(prev => ({
                  ...prev,
                  isActive: e.target.checked
                }))}
                className="rounded border-gray-300"
                id="isActive"
              />
              <label htmlFor="isActive" className="text-sm">
                Active Course
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Course'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      ...searchParams,
      page: 1 // Reset to first page on new search
    }
    setFilters(newFilters)
    fetchCourses(newFilters)
  }

  const handleResetFilters = () => {
    const defaultFilters = {
      branch: '',
      semester: '',
      faculty: '',
      active: true,
      page: 1,
      limit: 10
    }
    setFilters(defaultFilters)
    setSearchParams({
      branch: '',
      semester: '',
      faculty: ''
    })
    fetchCourses(defaultFilters)
  }

  const getCourseTypeColor = (type) => {
    const colors = {
      Undergraduate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Postgraduate: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Doctoral: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Diploma: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Vocational: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Bridge: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      Online: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
    }
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={searchParams.branch}
            onChange={(e) => setSearchParams(prev => ({ ...prev, branch: e.target.value }))}
            className="input-field"
          >
            <option value="">All Branches</option>
            {AVAILABLE_BRANCHES.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>

          <select
            value={searchParams.semester}
            onChange={(e) => setSearchParams(prev => ({ ...prev, semester: e.target.value }))}
            className="input-field"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          {user?.role === 'admin' && (
            <select
              value={searchParams.faculty}
              onChange={(e) => setSearchParams(prev => ({ ...prev, faculty: e.target.value }))}
              className="input-field"
            >
              <option value="">All Faculty</option>
              {/* Add faculty options if available */}
            </select>
          )}

          <select
            value={searchParams.type}
            onChange={(e) => setSearchParams(prev => ({ ...prev, type: e.target.value }))}
            className="input-field"
          >
            <option value="">All Course Types</option>
            {COURSE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="btn-primary flex items-center justify-center gap-2 flex-1"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
  ${getCourseTypeColor(course.type)}`}>
                  {course.type}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                  {course.code}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {course.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {course.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Credits:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.credits}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Semester:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.semester}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Branch:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.branch}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Faculty:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.faculty?.name || 'Not assigned'}
                </span>
              </div>
              {/* <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.type}
                </span>
              </div> */}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/courses/${course._id}`)}
                className="btn-secondary flex-1"
              >
                View Details
              </button>
              {user?.role === "student" && (
                <button
                  onClick={() => handleEnroll(course._id)}
                  className={`btn-primary flex-1 ${course.students?.includes(user._id) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  disabled={course.students?.includes(user._id)}
                >
                  {course.students?.includes(user._id) ? 'Enrolled' : 'Enroll'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {!loading && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No courses found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && <CreateCourseModal />}
    </div>
  )
}

export default CoursesPage

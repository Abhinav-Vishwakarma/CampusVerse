"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { notesAPI } from "../../services/api"
import { FileText, Download, Upload, Search, Filter, Heart, MessageCircle } from "lucide-react"

const NotesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [notes, setNotes] = useState([])
  const [pyqs, setPyqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("notes")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [notesRes, pyqsRes] = await Promise.all([notesAPI.getNotes(), notesAPI.getPYQs()])
      setNotes(notesRes.data)
      setPyqs(pyqsRes.data)
    } catch (error) {
      showError("Failed to fetch notes and PYQs")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileUrl, title) => {
    try {
      // In a real app, you'd handle the download properly
      window.open(fileUrl, "_blank")
      showSuccess(`Downloading ${title}`)
    } catch (error) {
      showError("Failed to download file")
    }
  }

  const filterItems = (items) => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (user?.role === "student") {
      if (selectedSemester) {
        filtered = filtered.filter(
          (item) =>
            item.course?.semester === Number.parseInt(selectedSemester) ||
            item.semester === Number.parseInt(selectedSemester),
        )
      }

      if (selectedBranch) {
        filtered = filtered.filter((item) => item.course?.branch === selectedBranch || item.branch === selectedBranch)
      }
    }

    return filtered
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const filteredNotes = filterItems(notes)
  const filteredPyqs = filterItems(pyqs)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes & PYQs</h1>
          <p className="text-gray-600 dark:text-gray-400">Access study materials and previous year questions</p>
        </div>
        {(user?.role === "faculty" || user?.role === "admin") && (
          <button className="btn-primary flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Material</span>
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
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          {user?.role === "student" && (
            <>
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
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="input-field"
              >
                <option value="">All Branches</option>
                <option value="CSE">Computer Science</option>
                <option value="ECE">Electronics</option>
                <option value="ME">Mechanical</option>
                <option value="CE">Civil</option>
                <option value="EE">Electrical</option>
              </select>
            </>
          )}
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "notes"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Notes ({filteredNotes.length})
          </button>
          <button
            onClick={() => setActiveTab("pyqs")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pyqs"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            PYQs ({filteredPyqs.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === "notes" ? filteredNotes : filteredPyqs).map((item) => (
          <div key={item._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                {item.fileType?.toUpperCase() || "PDF"}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {item.content || item.description || "No description available"}
            </p>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {item.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">+{item.tags.length - 3} more</span>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span>{item.downloads || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{item.likes?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{item.comments?.length || 0}</span>
                </div>
              </div>
              {activeTab === "pyqs" && (
                <span className="text-xs font-medium">
                  {item.year} • {item.examType}
                </span>
              )}
            </div>

            {/* Course Info */}
            {item.course && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {item.course.name} • Sem {item.course.semester}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleDownload(item.fileUrl, item.title)}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="btn-secondary">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(activeTab === "notes" ? filteredNotes : filteredPyqs).length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No {activeTab} found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedSemester || selectedBranch
              ? "Try adjusting your search or filter criteria."
              : `No ${activeTab} have been uploaded yet.`}
          </p>
        </div>
      )}
    </div>
  )
}

export default NotesPage

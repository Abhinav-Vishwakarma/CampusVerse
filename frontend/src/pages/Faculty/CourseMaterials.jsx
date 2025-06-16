"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Upload, FileText, Download, Trash2, Eye, Plus } from "lucide-react"
import { coursesAPI } from "../../services/api"

// API helpers (add these in your api.js if not present)
const API_BASE_URL = "http://localhost:5000/api"
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

const fetchCourses = async () => {
  const res = await fetch(`${API_BASE_URL}/courses?active=true&limit=100`, {
    headers: authHeaders(),
  })
  return res.json()
}

const fetchMaterials = async (courseId) => {
  const res = await fetch(
    `${API_BASE_URL}/files/type/assignment?course=${courseId}&limit=100`,
    { headers: authHeaders() }
  )
  return res.json()
}

const uploadMaterial = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/files/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  })
  return res.json()
}

const deleteMaterial = async (fileId) => {
  const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return res.json()
}

const downloadMaterial = async (fileId) => {
  const res = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
    method: "GET",
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error("Download failed")
  const blob = await res.blob()
  return blob
}



const CourseMaterials = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [materials, setMaterials] = useState([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [branches, setBranches] = useState([])
  const [sections, setSections] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [uploadForm, setUploadForm] = useState({
    course: "",
    branch: "",
    section: "",
    subject: "",
    unit: "",
    title: "",
    description: "",
    file: null,
  })
const BRANCHES = [
  "CSE", "ECE", "EEE", "ME", "CE", "IT", "BT"
]
const SECTIONS = [
  "A", "B", "C", "D"
]
  // Fetch courses on mount
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        // Fetch only courses taught by this faculty
        const res = await coursesAPI.getCourses({ faculty: user.id, active: true, limit: 100 })
        if (res.data?.courses) {
          setCourses(res.data.courses)
        } else {
          setCourses([])
        }
      } catch {
        showError("Failed to fetch courses")
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Fetch materials when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadMaterials(selectedCourse)
    } else {
      setMaterials([])
    }
  }, [selectedCourse])

  const loadMaterials = async (courseId) => {
    setLoading(true)
    try {
      const res = await fetchMaterials(courseId)
      if (res.success) {
        setMaterials(res.data.files)
      } else {
        setMaterials([])
      }
    } catch {
      showError("Failed to fetch materials")
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit (as per backend)
        showError("File size should be less than 10MB")
        return
      }
      setUploadForm((prev) => ({ ...prev, file }))
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    const { course, branch, section, subject, unit, title, file } = uploadForm
    if (!file || !course || !branch || !section || !subject || !unit || !title) {
      showError("Please fill in all required fields")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "assignment")
      formData.append("course", course)
      formData.append("branch", branch)
      formData.append("semester", courses.find((c) => c._id === course)?.semester || "")
      formData.append("title", title)
      formData.append("description", uploadForm.description || "")
      formData.append("unit", unit)
      formData.append("subject", subject)
      // Optionally add section/tags if needed

      const res = await uploadMaterial(formData)
      if (res.success) {
        showSuccess("Material uploaded successfully!")
        setShowUploadForm(false)
        setUploadForm({
          course: "",
          branch: "",
          section: "",
          subject: "",
          unit: "",
          title: "",
          description: "",
          file: null,
        })
        loadMaterials(selectedCourse || course)
      } else {
        showError(res.message || "Failed to upload material")
      }
    } catch {
      showError("Failed to upload material")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      setLoading(true)
      try {
        const res = await deleteMaterial(fileId)
        if (res.success) {
          setMaterials((prev) => prev.filter((m) => m._id !== fileId))
          showSuccess("Material deleted successfully")
        } else {
          showError(res.message || "Failed to delete material")
        }
      } catch {
        showError("Failed to delete material")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDownload = async (material) => {
    try {
      const blob = await downloadMaterial(material._id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = material.originalName || material.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showSuccess(`Downloading ${material.originalName || material.name}`)
    } catch {
      showError("Failed to download file")
    }
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase()
    switch (extension) {
      case "pdf":
        return "📄"
      case "ppt":
      case "pptx":
        return "📊"
      case "doc":
      case "docx":
        return "📝"
      case "xls":
      case "xlsx":
        return "📈"
      default:
        return "📁"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Materials</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage course materials</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Course Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Course to View Materials
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input-field"
        >
          <option value="">Select Course</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {materials.map((material) => (
          <div key={material._id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-3xl">{getFileIcon(material.originalName || material.name)}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {material.title || material.originalName || material.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{material.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div>
                      <span className="font-medium">Course:</span>{" "}
                      {material.metadata?.course?.name || ""}
                    </div>
                    <div>
                      <span className="font-medium">Branch:</span>{" "}
                      {material.metadata?.branch || ""}
                    </div>
                    <div>
                      <span className="font-medium">Unit:</span>{" "}
                      {material.metadata?.unit || ""}
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span>{" "}
                      {material.size
                        ? `${(material.size / (1024 * 1024)).toFixed(1)} MB`
                        : ""}
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span>{" "}
                      {material.createdAt
                        ? new Date(material.createdAt).toLocaleDateString()
                        : ""}
                    </div>
                    <div>
                      <span className="font-medium">By:</span>{" "}
                      {material.uploadedBy?.name || ""}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {material.originalName || material.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(material)}
                  className="btn-secondary text-xs flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                <button className="btn-secondary text-xs flex items-center space-x-1" disabled>
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleDelete(material._id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && selectedCourse && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No materials uploaded
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your first course material to get started.
          </p>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload Course Material
            </h3>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course *
                  </label>
                  <select
                    value={uploadForm.course}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, course: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Branch *
                  </label>
                  <select
                    value={uploadForm.branch}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, branch: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Branch</option>
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Section *
                  </label>
                  <select
                    value={uploadForm.section}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, section: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Section</option>
                    {SECTIONS.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, subject: e.target.value }))}
                    className="input-field"
                    placeholder="Enter subject name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.unit}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, unit: e.target.value }))}
                    className="input-field"
                    placeholder="Enter unit number"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="Enter material title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Enter material description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOC, PPT, XLS, TXT up to 10MB
                    </p>
                    {uploadForm.file && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Selected: {uploadForm.file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{loading ? "Uploading..." : "Upload Material"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseMaterials

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Upload, FileText, Download, Trash2, Eye, Plus } from "lucide-react"

const CourseMaterials = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [materials, setMaterials] = useState([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const courses = ["B.Tech", "M.Tech", "BCA", "MCA"]
  const branches = ["Computer Science", "Electronics", "Mechanical", "Civil"]
  const sections = ["A", "B", "C"]

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      // Mock materials data
      const mockMaterials = [
        {
          _id: "1",
          title: "Introduction to Data Structures",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          unit: "1",
          description: "Basic concepts and introduction to data structures",
          fileName: "ds_intro.pdf",
          fileSize: "2.5 MB",
          uploadedAt: "2024-02-10T10:00:00Z",
          uploadedBy: user?.name || "Faculty",
        },
        {
          _id: "2",
          title: "Arrays and Linked Lists",
          course: "B.Tech",
          branch: "Computer Science",
          section: "A",
          subject: "Data Structures",
          unit: "2",
          description: "Implementation and operations on arrays and linked lists",
          fileName: "arrays_linkedlists.pptx",
          fileSize: "4.1 MB",
          uploadedAt: "2024-02-12T14:30:00Z",
          uploadedBy: user?.name || "Faculty",
        },
      ]

      setMaterials(mockMaterials)
    } catch (error) {
      showError("Failed to fetch materials")
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        showError("File size should be less than 50MB")
        return
      }
      setUploadForm((prev) => ({ ...prev, file }))
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()

    if (
      !uploadForm.file ||
      !uploadForm.course ||
      !uploadForm.branch ||
      !uploadForm.section ||
      !uploadForm.subject ||
      !uploadForm.unit ||
      !uploadForm.title
    ) {
      showError("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // Mock upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newMaterial = {
        _id: Date.now().toString(),
        ...uploadForm,
        fileName: uploadForm.file.name,
        fileSize: `${(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.name || "Faculty",
      }

      setMaterials((prev) => [newMaterial, ...prev])
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
      setShowUploadForm(false)
      showSuccess("Material uploaded successfully!")
    } catch (error) {
      showError("Failed to upload material")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (materialId) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        setMaterials((prev) => prev.filter((material) => material._id !== materialId))
        showSuccess("Material deleted successfully")
      } catch (error) {
        showError("Failed to delete material")
      }
    }
  }

  const handleDownload = (material) => {
    // Mock download
    showSuccess(`Downloading ${material.fileName}`)
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
        <button onClick={() => setShowUploadForm(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {materials.map((material) => (
          <div key={material._id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-3xl">{getFileIcon(material.fileName)}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{material.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{material.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div>
                      <span className="font-medium">Course:</span> {material.course}
                    </div>
                    <div>
                      <span className="font-medium">Branch:</span> {material.branch}
                    </div>
                    <div>
                      <span className="font-medium">Section:</span> {material.section}
                    </div>
                    <div>
                      <span className="font-medium">Subject:</span> {material.subject}
                    </div>
                    <div>
                      <span className="font-medium">Unit:</span> {material.unit}
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span> {material.fileSize}
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span>{" "}
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">By:</span> {material.uploadedBy}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{material.fileName}</span>
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
                <button className="btn-secondary text-xs flex items-center space-x-1">
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

      {materials.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No materials uploaded</h3>
          <p className="text-gray-600 dark:text-gray-400">Upload your first course material to get started.</p>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Course Material</h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course *</label>
                  <select
                    value={uploadForm.course}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, course: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
                  <select
                    value={uploadForm.branch}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, branch: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section *</label>
                  <select
                    value={uploadForm.section}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, section: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Enter material description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload File *</label>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, PPT, XLS, TXT up to 50MB</p>
                    {uploadForm.file && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Selected: {uploadForm.file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowUploadForm(false)} className="btn-secondary flex-1">
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

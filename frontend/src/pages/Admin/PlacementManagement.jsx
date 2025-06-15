"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Briefcase, Plus, Building, DollarSign, Calendar, Users, TrendingUp, Eye, Edit, Trash2 } from "lucide-react"

const PlacementManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [placements, setPlacements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  const [placementForm, setPlacementForm] = useState({
    company: "",
    role: "",
    description: "",
    year: new Date().getFullYear().toString(),
    package: "",
    location: "",
    eligibility: "",
    requirements: "",
    applicationDeadline: "",
    interviewDate: "",
    type: "full-time", // full-time, internship
  })

  useEffect(() => {
    fetchPlacements()
  }, [])

  const fetchPlacements = async () => {
    try {
      // Mock placements data
      const mockPlacements = [
        {
          _id: "1",
          company: "Google",
          role: "Software Engineer",
          description: "Join our team to build next-generation software solutions",
          year: "2024",
          package: 2500000,
          location: "Bangalore",
          eligibility: "B.Tech/M.Tech in CS/IT with 70%+ marks",
          requirements: "Strong programming skills in Java/Python, DSA knowledge",
          applicationDeadline: "2024-03-15",
          interviewDate: "2024-03-25",
          type: "full-time",
          applicants: 45,
          selected: 3,
          status: "active",
          createdAt: "2024-02-01",
        },
        {
          _id: "2",
          company: "Microsoft",
          role: "Software Development Engineer",
          description: "Work on cutting-edge cloud technologies",
          year: "2024",
          package: 2200000,
          location: "Hyderabad",
          eligibility: "B.Tech in CS/IT/ECE with 65%+ marks",
          requirements: "Experience with C#/.NET, Azure knowledge preferred",
          applicationDeadline: "2024-03-20",
          interviewDate: "2024-03-30",
          type: "full-time",
          applicants: 38,
          selected: 2,
          status: "active",
          createdAt: "2024-02-05",
        },
        {
          _id: "3",
          company: "Amazon",
          role: "Summer Intern",
          description: "12-week internship program",
          year: "2024",
          package: 80000,
          location: "Chennai",
          eligibility: "Current students in 3rd year",
          requirements: "Programming skills, problem-solving abilities",
          applicationDeadline: "2024-02-28",
          interviewDate: "2024-03-10",
          type: "internship",
          applicants: 67,
          selected: 8,
          status: "completed",
          createdAt: "2024-01-15",
        },
      ]

      setPlacements(mockPlacements)

      // Calculate stats
      const totalPlacements = mockPlacements.length
      const totalApplicants = mockPlacements.reduce((sum, p) => sum + p.applicants, 0)
      const totalSelected = mockPlacements.reduce((sum, p) => sum + p.selected, 0)
      const avgPackage =
        mockPlacements.filter((p) => p.type === "full-time").reduce((sum, p) => sum + p.package, 0) /
        mockPlacements.filter((p) => p.type === "full-time").length

      setStats({
        totalPlacements,
        totalApplicants,
        totalSelected,
        avgPackage,
        placementRate: Math.round((totalSelected / totalApplicants) * 100),
      })
    } catch (error) {
      showError("Failed to fetch placements")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!placementForm.company || !placementForm.role || !placementForm.package || !placementForm.applicationDeadline) {
      showError("Please fill in all required fields")
      return
    }

    try {
      if (editingPlacement) {
        // Update existing placement
        setPlacements((prev) =>
          prev.map((placement) =>
            placement._id === editingPlacement._id
              ? { ...placement, ...placementForm, package: Number.parseInt(placementForm.package) }
              : placement,
          ),
        )
        showSuccess("Placement updated successfully!")
      } else {
        // Create new placement
        const newPlacement = {
          _id: Date.now().toString(),
          ...placementForm,
          package: Number.parseInt(placementForm.package),
          applicants: 0,
          selected: 0,
          status: "active",
          createdAt: new Date().toISOString(),
        }
        setPlacements((prev) => [newPlacement, ...prev])
        showSuccess("Placement opportunity created successfully!")
      }

      resetForm()
    } catch (error) {
      showError("Failed to save placement")
    }
  }

  const resetForm = () => {
    setPlacementForm({
      company: "",
      role: "",
      description: "",
      year: new Date().getFullYear().toString(),
      package: "",
      location: "",
      eligibility: "",
      requirements: "",
      applicationDeadline: "",
      interviewDate: "",
      type: "full-time",
    })
    setEditingPlacement(null)
    setShowModal(false)
  }

  const handleEdit = (placement) => {
    setPlacementForm({
      ...placement,
      package: placement.package.toString(),
      applicationDeadline: placement.applicationDeadline,
      interviewDate: placement.interviewDate,
    })
    setEditingPlacement(placement)
    setShowModal(true)
  }

  const handleDelete = async (placementId) => {
    if (window.confirm("Are you sure you want to delete this placement opportunity?")) {
      try {
        setPlacements((prev) => prev.filter((placement) => placement._id !== placementId))
        showSuccess("Placement deleted successfully")
      } catch (error) {
        showError("Failed to delete placement")
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const formatPackage = (amount, type) => {
    if (type === "internship") {
      return `₹${amount.toLocaleString()}/month`
    }
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} LPA`
    } else {
      return `₹${amount.toLocaleString()}`
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placement Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage placement opportunities and track performance</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Placement</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Opportunities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPlacements}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applicants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplicants}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSelected}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Package</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPackage(stats.avgPackage || 0, "full-time")}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.placementRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Placements List */}
      <div className="space-y-4">
        {placements.map((placement) => (
          <div key={placement._id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{placement.role}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(placement.status)}`}>
                    {placement.status}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      placement.type === "full-time"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    }`}
                  >
                    {placement.type}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{placement.company}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatPackage(placement.package, placement.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Deadline: {new Date(placement.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-3">{placement.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{placement.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Eligibility:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{placement.eligibility}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Applicants:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{placement.applicants}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Selected:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{placement.selected}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(placement)}
                className="btn-secondary text-xs flex items-center space-x-1"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button className="btn-secondary text-xs flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>View Applications</span>
              </button>
              <button
                onClick={() => handleDelete(placement._id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {placements.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No placement opportunities</h3>
          <p className="text-gray-600 dark:text-gray-400">Create your first placement opportunity to get started.</p>
        </div>
      )}

      {/* Add/Edit Placement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingPlacement ? "Edit Placement" : "Add Placement Opportunity"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company *</label>
                  <input
                    type="text"
                    value={placementForm.company}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, company: e.target.value }))}
                    className="input-field"
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role *</label>
                  <input
                    type="text"
                    value={placementForm.role}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="input-field"
                    placeholder="Enter job role"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <textarea
                  value={placementForm.description}
                  onChange={(e) => setPlacementForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Enter job description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year *</label>
                  <select
                    value={placementForm.year}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, year: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                  <select
                    value={placementForm.type}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Package * {placementForm.type === "internship" ? "(per month)" : "(per annum)"}
                  </label>
                  <input
                    type="number"
                    value={placementForm.package}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, package: e.target.value }))}
                    className="input-field"
                    placeholder="Enter package amount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={placementForm.location}
                  onChange={(e) => setPlacementForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                  placeholder="Enter job location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eligibility Criteria
                </label>
                <textarea
                  value={placementForm.eligibility}
                  onChange={(e) => setPlacementForm((prev) => ({ ...prev, eligibility: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Enter eligibility criteria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</label>
                <textarea
                  value={placementForm.requirements}
                  onChange={(e) => setPlacementForm((prev) => ({ ...prev, requirements: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Enter job requirements"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    value={placementForm.applicationDeadline}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, applicationDeadline: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={placementForm.interviewDate}
                    onChange={(e) => setPlacementForm((prev) => ({ ...prev, interviewDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingPlacement ? "Update Placement" : "Create Placement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementManagement

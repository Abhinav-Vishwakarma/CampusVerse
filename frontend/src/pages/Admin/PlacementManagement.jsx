"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { placementsAPI } from "../../services/api"
import { Briefcase, Plus, Building, DollarSign, Calendar, Users, TrendingUp, Eye, Edit, Trash2 } from "lucide-react"
import PropTypes from 'prop-types'

const AVAILABLE_BRANCHES = [
  "All Branches",
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

const PlacementManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [placements, setPlacements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlacements: 0,
    totalApplications: 0,
    totalSelected: 0,
    avgPackage: 0,
    placementRate: 0,
    placementsByCompany: [],
    applicationStats: {}
  })
  const [applications, setApplications] = useState([])
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)

  const [placementForm, setPlacementForm] = useState({
    jobTitle: "",
    company: "",
    description: "",
    location: "",
    salary: {
      min: 0,
      max: 0
    },
    requirements: [],
    currentRequirement: "", // Add this field
    eligibilityCriteria: {
      minCGPA: 6.0,
      branches: [],
      passingYear: new Date().getFullYear() + 4
    },
    applicationDeadline: "",
    isActive: true
  })

  const [filters, setFilters] = useState({
    company: "",
    location: "",
    salary: "",
    active: true,
    page: 1,
    limit: 10,
  })
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchPlacements()
  }, [filters.page, filters.company, filters.location, filters.salary, filters.active])

  const fetchPlacements = async () => {
    try {
      setLoading(true)
      const response = await placementsAPI.getPlacements(filters)

      if (response?.data?.success) {
        setPlacements(response.data.data)
        setPagination(response.data.pagination)
      }

      // Fetch stats
      const statsResponse = await placementsAPI.getPlacementStats()
      if (statsResponse?.data?.success) {
        const { data } = statsResponse.data
        setStats({
          totalPlacements: data.totalPlacements,
          totalApplications: data.totalApplications,
          placementsByCompany: data.placementsByCompany,
          applicationStats: data.applicationStats,
        })
      }
    } catch (error) {
      console.error("Failed to fetch placements:", error)
      showError(error.response?.data?.message || "Failed to fetch placements")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingPlacement) {
        const response = await placementsAPI.updatePlacement(editingPlacement._id, placementForm)
        if (response?.data?.success) {
          showSuccess("Placement updated successfully!")
          fetchPlacements()
        }
      } else {
        const response = await placementsAPI.createPlacement({
          ...placementForm,
          postedBy: user.id,
        })
        if (response?.data?.success) {
          showSuccess("Placement created successfully!")
          fetchPlacements()
        }
      }
      resetForm()
    } catch (error) {
      showError(error.response?.data?.message || "Failed to save placement")
    }
  }

  const resetForm = () => {
    setPlacementForm({
      jobTitle: "",
      company: "",
      description: "",
      location: "",
      salary: {
        min: 0,
        max: 0
      },
      requirements: [],
      currentRequirement: "", // Add this field
      eligibilityCriteria: {
        minCGPA: 6.0,
        branches: [],
        passingYear: new Date().getFullYear() + 4
      },
      applicationDeadline: "",
      isActive: true
    })
    setEditingPlacement(null)
    setShowModal(false)
  }

  const handleEdit = (placement) => {
    setPlacementForm({
      jobTitle: placement.jobTitle,
      company: placement.company,
      description: placement.description,
      location: placement.location,
      salary: {
        min: placement.salary.min,
        max: placement.salary.max
      },
      requirements: Array.isArray(placement.requirements) ? placement.requirements : [],
      eligibilityCriteria: {
        minCGPA: placement.eligibilityCriteria?.minCGPA || 6.0,
        branches: Array.isArray(placement.eligibilityCriteria?.branches) 
          ? placement.eligibilityCriteria.branches 
          : [],
        passingYear: placement.eligibilityCriteria?.passingYear || new Date().getFullYear() + 4
      },
      applicationDeadline: new Date(placement.applicationDeadline)
        .toISOString()
        .split('T')[0],
      isActive: placement.isActive
    })
    setEditingPlacement(placement)
    setShowModal(true)
  }

  const handleDelete = async (placementId) => {
    if (!window.confirm("Are you sure you want to delete this placement?")) {
      return
    }

    try {
      const response = await placementsAPI.deletePlacement(placementId)
      if (response?.data?.success) {
        showSuccess("Placement deleted successfully")
        fetchPlacements()
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to delete placement")
    }
  }

  const handleViewApplications = async (placementId) => {
    try {
      setLoading(true)
      const response = await placementsAPI.getPlacementApplications(placementId)
      
      if (response?.data?.success) {
        const placement = placements.find(p => p._id === placementId)
        if (!placement) {
          showError("Placement not found")
          return
        }
        
        setApplications(response.data.data)
        setShowApplicationsModal(true)
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
      showError(error.response?.data?.message || "Failed to fetch applications")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateApplicationStatus = async (placementId, applicationId, status) => {
    try {
      const response = await placementsAPI.updateApplicationStatus(
        placementId,
        applicationId,
        status
      )
      if (response?.data?.success) {
        showSuccess("Application status updated successfully")
        handleViewApplications(placementId) // Refresh applications
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update application status")
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

  const formatPackage = (amount, type = 'full-time') => {
    if (!amount) return '₹0'
    
    try {
      const numAmount = Number(amount)
      if (isNaN(numAmount)) return '₹0'
      
      if (type === "internship") {
        return `₹${numAmount.toLocaleString()}/month`
      }
      return numAmount >= 100000
        ? `₹${(numAmount / 100000).toFixed(1)} LPA`
        : `₹${numAmount.toLocaleString()}`
    } catch (error) {
      console.error('Error formatting package:', error)
      return '₹0'
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
                {formatPackage(stats?.avgPackage ?? 0, "full-time")}
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

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by company"
          value={filters.company}
          onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
          className="input-field"
        />

        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          className="input-field"
        />

        <input
          type="number"
          placeholder="Min Salary"
          value={filters.salary}
          onChange={(e) => setFilters(prev => ({ ...prev, salary: e.target.value }))}
          className="input-field"
        />

        <select
          value={filters.active}
          onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value === 'true' }))}
          className="input-field"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          onClick={() => {
            setFilters({
              company: "",
              location: "",
              salary: "",
              active: true,
              page: 1,
              limit: 10
            })
          }}
          className="btn-secondary"
        >
          Reset Filters
        </button>
      </div>

      {/* Placements List */}
      <div className="space-y-4">
        {placements.map((placement) => (
          <div key={placement._id || 'temp'} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {placement.jobTitle}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    placement.isActive 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {placement.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {placement.company}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatPackage(placement.salary?.min)} - {formatPackage(placement.salary?.max)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Deadline: {new Date(placement.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {placement.description}
                </p>

                {/* Requirements */}
                {placement.requirements?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Requirements:
                    </h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                      {placement.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Eligibility Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Location:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {placement.location}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Min CGPA:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {placement.eligibilityCriteria?.minCGPA}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Passing Year:
                    </span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {placement.eligibilityCriteria?.passingYear}
                    </span>
                  </div>
                </div>

                {/* Eligible Branches */}
                <div className="mt-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Eligible Branches:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {placement.eligibilityCriteria?.branches.map((branch, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full"
                      >
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleEdit(placement)}
                className="btn-secondary text-xs flex items-center space-x-1"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleViewApplications(placement._id)}
                className="btn-secondary text-xs flex items-center space-x-1"
              >
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={placementForm.jobTitle}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      jobTitle: e.target.value 
                    }))}
                    className="input-field"
                    placeholder="Enter job title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={placementForm.company}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      company: e.target.value 
                    }))}
                    className="input-field"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={placementForm.description}
                  onChange={(e) => setPlacementForm((prev) => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  className="input-field"
                  rows={3}
                  placeholder="Enter job description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Salary *
                  </label>
                  <input
                    type="number"
                    value={placementForm.salary.min}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      salary: { ...prev.salary, min: Number(e.target.value) }
                    }))}
                    className="input-field"
                    placeholder="Enter minimum salary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Salary *
                  </label>
                  <input
                    type="number"
                    value={placementForm.salary.max}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      salary: { ...prev.salary, max: Number(e.target.value) }
                    }))}
                    className="input-field"
                    placeholder="Enter maximum salary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requirements (Press Enter to add)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={placementForm.currentRequirement || ''}
                    onChange={(e) => setPlacementForm(prev => ({
                      ...prev,
                      currentRequirement: e.target.value
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const value = e.target.value.trim()
                        if (value && !placementForm.requirements.includes(value)) {
                          setPlacementForm(prev => ({
                            ...prev,
                            requirements: [...prev.requirements, value],
                            currentRequirement: ''
                          }))
                        }
                      }
                    }}
                    className="input-field"
                    placeholder="Type requirement and press Enter to add"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {placementForm.requirements.map((req, index) => (
                      <div 
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <span>{req}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPlacementForm(prev => ({
                              ...prev,
                              requirements: prev.requirements.filter((_, i) => i !== index)
                            }))
                          }}
                          className="hover:text-red-600 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum CGPA
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={placementForm.eligibilityCriteria.minCGPA}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        minCGPA: Number(e.target.value)
                      }
                    }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passing Year
                  </label>
                  <input
                    type="number"
                    value={placementForm.eligibilityCriteria.passingYear}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      eligibilityCriteria: {
                        ...prev.eligibilityCriteria,
                        passingYear: Number(e.target.value)
                      }
                    }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={placementForm.location}
                    onChange={(e) => setPlacementForm((prev) => ({ 
                      ...prev, 
                      location: e.target.value 
                    }))}
                    className="input-field"
                    placeholder="Enter job location"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eligible Branches
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AVAILABLE_BRANCHES.map(branch => (
                    <label key={branch} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          branch === "All Branches" 
                            ? placementForm.eligibilityCriteria.branches.length === AVAILABLE_BRANCHES.length - 1
                            : placementForm.eligibilityCriteria.branches.includes(branch)
                        }
                        onChange={(e) => {
                          if (branch === "All Branches") {
                            setPlacementForm(prev => ({
                              ...prev,
                              eligibilityCriteria: {
                                ...prev.eligibilityCriteria,
                                branches: e.target.checked 
                                  ? AVAILABLE_BRANCHES.filter(b => b !== "All Branches")
                                  : []
                              }
                            }))
                          } else {
                            setPlacementForm(prev => ({
                              ...prev,
                              eligibilityCriteria: {
                                ...prev.eligibilityCriteria,
                                branches: e.target.checked
                                  ? [...prev.eligibilityCriteria.branches, branch]
                                  : prev.eligibilityCriteria.branches.filter(b => b !== branch)
                              }
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {branch}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  value={placementForm.applicationDeadline}
                  onChange={(e) => setPlacementForm((prev) => ({ 
                    ...prev, 
                    applicationDeadline: e.target.value 
                  }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={placementForm.isActive}
                  onChange={(e) => setPlacementForm((prev) => ({ 
                    ...prev, 
                    isActive: e.target.checked 
                  }))}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Active Placement
                </label>
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

      {/* View Applications Modal */}
      {showApplicationsModal && (
        <ApplicationsModal
          placement={placements.find(p => p._id === applications[0]?.placementId)}
          applications={applications}
          onClose={() => setShowApplicationsModal(false)}
          onUpdateStatus={handleUpdateApplicationStatus}
        />
      )}
    </div>
  )
}

const ApplicationsModal = ({ placement, applications = [], onClose, onUpdateStatus }) => {
  if (!placement) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Error: Placement not found</h3>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Applications for {placement.role} at {placement.company}
        </h3>

        {applications.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No applications found.</p>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app._id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{app.student?.name || 'Unknown Student'}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {app.student?.email || 'No email'}
                    </p>
                    <p className="text-sm">Branch: {app.student?.branch || 'N/A'}</p>
                    <p className="text-sm">CGPA: {app.student?.cgpa || 'N/A'}</p>
                  </div>
                  
                  <select
                    value={app.status || 'pending'}
                    onChange={(e) => onUpdateStatus(placement._id, app._id, e.target.value)}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="selected">Selected</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

ApplicationsModal.propTypes = {
  placement: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired
  }),
  applications: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    student: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      branch: PropTypes.string,
      cgpa: PropTypes.number
    }),
    status: PropTypes.string
  })),
  onClose: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired
}

export default PlacementManagement

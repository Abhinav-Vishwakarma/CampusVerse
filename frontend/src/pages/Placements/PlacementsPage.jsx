"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { placementsAPI } from "../../services/api"
import { Briefcase, MapPin, DollarSign, Calendar, Users, Plus, ExternalLink } from "lucide-react"

const PlacementsPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [placements, setPlacements] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("available")
  const [selectedPlacement, setSelectedPlacement] = useState(null)

  useEffect(() => {
    fetchPlacements()
  }, [])

  const fetchPlacements = async () => {
    try {
      const response = await placementsAPI.getPlacements()
      setPlacements(response.data)

      if (user?.role === "student") {
        // Filter applications for current user
        const userApplications = response.data.filter((p) => p.applications?.some((app) => app.student === user._id))
        setApplications(userApplications)
      }
    } catch (error) {
      showError("Failed to fetch placements")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (placementId) => {
    try {
      await placementsAPI.applyForPlacement(placementId, {
        coverLetter: "I am interested in this position and believe I would be a great fit.",
        resume: "resume.pdf", // In real app, this would be a file upload
      })
      showSuccess("Application submitted successfully!")
      fetchPlacements()
    } catch (error) {
      showError("Failed to submit application")
    }
  }

  const formatSalary = (salary) => {
    if (salary >= 100000) {
      return `₹${(salary / 100000).toFixed(1)}L`
    }
    return `₹${(salary / 1000).toFixed(0)}K`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const availablePlacements = placements.filter((p) => new Date(p.applicationDeadline) > new Date() && p.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placements</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student" ? "Find and apply for job opportunities" : "Manage placement opportunities"}
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "faculty") && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Placement</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      {user?.role === "student" && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("available")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Available ({availablePlacements.length})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "applications"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              My Applications ({applications.length})
            </button>
          </nav>
        </div>
      )}

      {/* Placements Grid */}
      {(activeTab === "available" || user?.role !== "student") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(user?.role === "student" ? availablePlacements : placements).map((placement) => (
            <div key={placement._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    placement.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {placement.isActive ? "Active" : "Closed"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{placement.jobTitle}</h3>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{placement.company}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{placement.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{placement.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>{formatSalary(placement.salary)} per annum</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Apply by {new Date(placement.applicationDeadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{placement.applications?.length || 0} applications</span>
                </div>
              </div>

              {/* Requirements */}
              {placement.requirements && placement.requirements.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {placement.requirements.slice(0, 3).map((req, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded"
                      >
                        {req}
                      </span>
                    ))}
                    {placement.requirements.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{placement.requirements.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {user?.role === "student" ? (
                  <>
                    <button
                      onClick={() => handleApply(placement._id)}
                      disabled={!placement.isActive || placement.applications?.some((app) => app.student === user._id)}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {placement.applications?.some((app) => app.student === user._id) ? "Applied" : "Apply Now"}
                    </button>
                    <button onClick={() => setSelectedPlacement(placement)} className="btn-secondary">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-secondary flex-1">View Applications</button>
                    <button className="btn-primary flex-1">Edit</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Applications */}
      {activeTab === "applications" && user?.role === "student" && (
        <div className="space-y-4">
          {applications.map((placement) => {
            const userApp = placement.applications?.find((app) => app.student === user._id)
            return (
              <div key={placement._id} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{placement.jobTitle}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{placement.company}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Applied on {new Date(userApp?.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        userApp?.status === "accepted"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : userApp?.status === "rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {userApp?.status || "pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{placement.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Salary:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {formatSalary(placement.salary)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(placement.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {applications.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start applying to placements to see your applications here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(user?.role === "student" ? availablePlacements : placements).length === 0 && activeTab === "available" && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No placements available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student"
              ? "Check back later for new placement opportunities."
              : "Add your first placement opportunity to get started."}
          </p>
        </div>
      )}

      {/* Placement Details Modal */}
      {selectedPlacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedPlacement.jobTitle}</h3>
                <p className="text-blue-600 dark:text-blue-400">{selectedPlacement.company}</p>
              </div>
              <button
                onClick={() => setSelectedPlacement(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Job Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedPlacement.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Location</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedPlacement.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Salary</h4>
                  <p className="text-gray-600 dark:text-gray-400">{formatSalary(selectedPlacement.salary)} per annum</p>
                </div>
              </div>

              {selectedPlacement.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Requirements</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    {selectedPlacement.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button onClick={() => setSelectedPlacement(null)} className="btn-secondary flex-1">
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApply(selectedPlacement._id)
                    setSelectedPlacement(null)
                  }}
                  disabled={
                    !selectedPlacement.isActive ||
                    selectedPlacement.applications?.some((app) => app.student === user._id)
                  }
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedPlacement.applications?.some((app) => app.student === user._id)
                    ? "Already Applied"
                    : "Apply Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlacementsPage

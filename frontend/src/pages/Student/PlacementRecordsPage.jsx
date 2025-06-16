"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Briefcase, TrendingUp, Users, Filter, Building, DollarSign } from "lucide-react"
import { placementsAPI } from "../../services/api"

const PlacementRecordsPage = () => {
  const { user } = useAuth()
  const [placementData, setPlacementData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [filters, setFilters] = useState({
    company: "",
    location: "",
    year: "",
  })
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState([])
  const [locations, setLocations] = useState([])
  const [years, setYears] = useState([])

  useEffect(() => {
    fetchPlacementData()
    fetchStats()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line
  }, [placementData, filters])

  const fetchPlacementData = async () => {
    setLoading(true)
    try {
      // Fetch all placements (active only)
      const res = await placementsAPI.getPlacements({ active: true, limit: 100 })
      const data = res.data?.data || []
      setPlacementData(data)

      // Extract unique companies, locations, years for filters
      setCompanies([...new Set(data.map((item) => item.company))].sort())
      setLocations([...new Set(data.map((item) => item.location))].sort())
      setYears([
        ...new Set(
          data.map((item) =>
            item.applicationDeadline
              ? new Date(item.applicationDeadline).getFullYear().toString()
              : ""
          )
        ),
      ].filter(Boolean).sort())
    } catch (error) {
      setPlacementData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await placementsAPI.getPlacementStats()
      const s = res.data?.data || {}
      setStats({
        totalPlacements: s.totalPlacements || 0,
        totalApplications: s.totalApplications || 0,
        companies: (s.placementsByCompany || []).length,
        highestPackage: null, // We'll compute below
        avgPackage: null,
      })
      // Compute highest and avg package from placementData after fetch
    } catch (error) {
      setStats({})
    }
  }

  const applyFilters = () => {
    let filtered = placementData
    if (filters.company) {
      filtered = filtered.filter((item) => item.company === filters.company)
    }
    if (filters.location) {
      filtered = filtered.filter((item) => item.location === filters.location)
    }
    if (filters.year) {
      filtered = filtered.filter(
        (item) =>
          item.applicationDeadline &&
          new Date(item.applicationDeadline).getFullYear().toString() === filters.year
      )
    }
    setFilteredData(filtered)
    // Compute stats for filtered data
    if (filtered.length > 0) {
      const pkgs = filtered.map((item) => item.salary?.max || item.salary?.min || 0)
      const highest = Math.max(...pkgs)
      const avg = pkgs.reduce((a, b) => a + b, 0) / pkgs.length
      setStats((prev) => ({
        ...prev,
        highestPackage: highest,
        avgPackage: avg,
      }))
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const formatPackage = (amount) => {
    if (!amount) return "-"
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placement Records</h1>
        <p className="text-gray-600 dark:text-gray-400">Explore placement data by company, location, and year</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Placements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPlacements}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Package</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPackage(stats.avgPackage)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Highest Package</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPackage(stats.highestPackage)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Building className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Companies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.companies}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
            <select
              value={filters.company}
              onChange={(e) => handleFilterChange("company", e.target.value)}
              className="input-field"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="input-field"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="input-field"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Placement Records Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Placement Records ({filteredData.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Posted By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{record.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.jobTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatPackage(record.salary?.max || record.salary?.min)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.applicationDeadline
                      ? new Date(record.applicationDeadline).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {record.postedBy?.name || "Admin"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No placement records found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </div>
  )
}

export default PlacementRecordsPage

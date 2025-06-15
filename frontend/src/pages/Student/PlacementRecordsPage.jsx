"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Briefcase, TrendingUp, Users, Filter, Building, DollarSign } from "lucide-react"

const PlacementRecordsPage = () => {
  const { user } = useAuth()
  const [placementData, setPlacementData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [filters, setFilters] = useState({
    course: "",
    branch: "",
    year: "",
  })
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlacementData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [placementData, filters])

  const fetchPlacementData = async () => {
    try {
      // Mock placement data
      const mockData = [
        {
          _id: "1",
          studentName: "John Doe",
          course: "B.Tech",
          branch: "Computer Science",
          year: "2023",
          company: "Google",
          package: 2500000,
          role: "Software Engineer",
          placementType: "On-Campus",
        },
        {
          _id: "2",
          studentName: "Jane Smith",
          course: "B.Tech",
          branch: "Computer Science",
          year: "2023",
          company: "Microsoft",
          package: 2200000,
          role: "Software Developer",
          placementType: "On-Campus",
        },
        {
          _id: "3",
          studentName: "Mike Johnson",
          course: "B.Tech",
          branch: "Electronics",
          year: "2023",
          company: "Intel",
          package: 1800000,
          role: "Hardware Engineer",
          placementType: "On-Campus",
        },
        {
          _id: "4",
          studentName: "Sarah Wilson",
          course: "M.Tech",
          branch: "Computer Science",
          year: "2023",
          company: "Amazon",
          package: 2800000,
          role: "Senior Software Engineer",
          placementType: "Off-Campus",
        },
        {
          _id: "5",
          studentName: "David Brown",
          course: "B.Tech",
          branch: "Mechanical",
          year: "2022",
          company: "Tesla",
          package: 2000000,
          role: "Mechanical Engineer",
          placementType: "On-Campus",
        },
      ]

      setPlacementData(mockData)

      // Calculate stats
      const totalPlacements = mockData.length
      const avgPackage = mockData.reduce((sum, item) => sum + item.package, 0) / totalPlacements
      const highestPackage = Math.max(...mockData.map((item) => item.package))
      const companies = [...new Set(mockData.map((item) => item.company))].length

      setStats({
        totalPlacements,
        avgPackage,
        highestPackage,
        companies,
      })
    } catch (error) {
      console.error("Failed to fetch placement data:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = placementData

    if (filters.course) {
      filtered = filtered.filter((item) => item.course === filters.course)
    }
    if (filters.branch) {
      filtered = filtered.filter((item) => item.branch === filters.branch)
    }
    if (filters.year) {
      filtered = filtered.filter((item) => item.year === filters.year)
    }

    setFilteredData(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const formatPackage = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} LPA`
    } else {
      return `₹${amount.toLocaleString()}`
    }
  }

  const getUniqueValues = (key) => {
    return [...new Set(placementData.map((item) => item[key]))].sort()
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
        <p className="text-gray-600 dark:text-gray-400">Explore placement data by course, branch, and year</p>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
            <select
              value={filters.course}
              onChange={(e) => handleFilterChange("course", e.target.value)}
              className="input-field"
            >
              <option value="">All Courses</option>
              {getUniqueValues("course").map((course) => (
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
              onChange={(e) => handleFilterChange("branch", e.target.value)}
              className="input-field"
            >
              <option value="">All Branches</option>
              {getUniqueValues("branch").map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
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
              {getUniqueValues("year").map((year) => (
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
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course/Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Year
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{record.studentName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{record.course}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{record.branch}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{record.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatPackage(record.package)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.placementType === "On-Campus"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      }`}
                    >
                      {record.placementType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.year}
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

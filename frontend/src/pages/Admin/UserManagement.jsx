import { useState, useEffect, useCallback, useRef } from "react"
import debounce from 'lodash/debounce'
import { useNotification } from "../../contexts/NotificationContext"
import { usersAPI } from "../../services/api"
import { Search, Filter, Plus, Edit, Trash2, Eye, Users, UserCheck, FileSearch } from "lucide-react"

const UserManagement = () => {
  const { showSuccess, showError } = useNotification()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    course: "",
    branch: "",
    semester: null,
    admissionNumber: "",
    phone: "",
    section: "",
    department: "",
    employeeId:"",
  })
  const [advancedSearch, setAdvancedSearch] = useState({
    searchId: "",
    branch: "",
    section: "",
    course: "",
    role: ""
  })
  const [suggestions, setSuggestions] = useState([])
  const [filters, setFilters] = useState({
    roles: [],
    branches: [],
    courses: [],
    departments: []
  })

  // Debounced search function for suggestions
  const debouncedSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length >= 2) {
        try {
          const response = await usersAPI.getSuggestions(query)
          if (response?.data) {
            setSuggestions(response.data.users)
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error)
        }
      } else {
        setSuggestions([])
      }
    }, 300),
    []
  )

  // Fetch available filters
  const fetchFilters = async () => {
    try {
      const response = await usersAPI.getFilters()
      if (response?.data?.data) {
        setFilters(response.data.data)
      } else {
        // Set default values if API fails
        setFilters({
          roles: ['student', 'faculty', 'admin'],
          branches: ['CSE', 'ECE', 'ME', 'CE', 'EE'],
          courses: ['BTech', 'MTech', 'BCA', 'MCA'],
          departments: ['CSE', 'ECE', 'ME', 'CE', 'EE']
        })
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error)
      // Set default values on error
      setFilters({
        roles: ['student', 'faculty', 'admin'],
        branches: ['CSE', 'ECE', 'ME', 'CE', 'EE'],
        courses: ['BTech', 'MTech', 'BCA', 'MCA'],
        departments: ['CSE', 'ECE', 'ME', 'CE', 'EE']
      })
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getUsers()
      console.log(response.data)
      const usersData = response?.data.users || []
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      showError("Failed to fetch users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([])
      return
    }

    let filtered = [...users]

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.admissionNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.role) {
        showError("Name, email and role are required")
        return
      }

      const dataToSend = { ...newUser };

      // Conditional removal of 'semester' if role is 'faculty'
      if (dataToSend.role === "faculty" || dataToSend.role === "admin") {
        delete dataToSend.semester;
      }

      const response = await usersAPI.createUser(dataToSend)
      if (response?.data) {
        setUsers((prev) => [response.data, ...prev])
        setShowCreateModal(false)
        setNewUser({
          name: "",
          email: "",
          role: "student",
          course: "",
          branch: "",
          semester: null,
          admissionNumber: "",
          phone: "",
          section: "",
          department: "",
          employeeId:"",
        })
        showSuccess("User created successfully")
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      showError(error.message || "Failed to create user")
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      showError("Invalid user ID")
      return
    }

    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await usersAPI.deleteUser(userId)
        setUsers((prev) => prev.filter((user) => user._id !== userId && user.id !== userId))
        showSuccess("User deleted successfully")
      } catch (error) {
        console.error("Failed to delete user:", error)
        showError(error.message || "Failed to delete user")
      }
    }
  }

  const handleUpdateUser = async (userId, userData) => {
    try {
      if (!userId || !userData) {
        showError("Invalid user data")
        return
      }

      const response = await usersAPI.updateUser(userId, userData)
      if (response?.data) {
        setUsers((prev) => prev.map((user) => (user._id === userId || user.id === userId ? response.data : user)))
        setShowModal(false)
        setSelectedUser(null)
        showSuccess("User updated successfully")
      }
    } catch (error) {
      console.error("Failed to update user:", error)
      showError(error.message || "Failed to update user")
    }
  }

  // Modified search handler
  const handleAdvancedSearch = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.searchUsers({
        search: advancedSearch.searchId,
        role: advancedSearch.role,
        branch: advancedSearch.branch,
        course: advancedSearch.course,
        page: 1,
        limit: 10
      })

      if (response?.data) {
        setUsers(response.data.users)
        showSuccess("Search completed successfully")
      }
    } catch (error) {
      console.error("Search failed:", error)
      showError(error.response?.data?.message || "Failed to perform search")
    } finally {
      setLoading(false)
    }
  }

  // Update search input to handle suggestions
  const handleSearchInput = (e) => {
    const value = e.target.value
    setAdvancedSearch(prev => ({...prev, searchId: value}))
    debouncedSuggestions(value)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "faculty":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "student":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  useEffect(() => {
    fetchFilters()
  }, []) // Empty dependency array means it runs once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const safeUsers = Array.isArray(users) ? users : []
  const safeFilteredUsers = Array.isArray(filteredUsers) ? filteredUsers : []

  const stats = {
    total: safeUsers.length,
    students: safeUsers.filter((u) => u.role === "student").length,
    faculty: safeUsers.filter((u) => u.role === "faculty").length,
    admins: safeUsers.filter((u) => u.role === "admin").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all users in the system</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.students}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Faculty</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.faculty}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Search Bar with Suggestions */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSearch className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Advanced Search</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={advancedSearch.searchId}
              onChange={handleSearchInput}
              className="input-field"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setAdvancedSearch(prev => ({...prev, searchId: suggestion.name}))
                      setSuggestions([])
                    }}
                  >
                    <div className="flex items-center">
                      {suggestion.profilePicture ? (
                        <img src={suggestion.profilePicture} className="w-8 h-8 rounded-full mr-2" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                          {suggestion.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">{suggestion.name}</div>
                        <div className="text-xs text-gray-500">{suggestion.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            value={advancedSearch.branch}
            onChange={(e) => setAdvancedSearch(prev => ({...prev, branch: e.target.value}))}
            className="input-field"
          >
            <option value="">Select Branch</option>
            {filters?.branches?.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            )) || null}
          </select>

          <select
            value={advancedSearch.section}
            onChange={(e) => setAdvancedSearch(prev => ({...prev, section: e.target.value}))}
            className="input-field"
          >
            <option value="">Select Section</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>

          <select
            value={advancedSearch.course}
            onChange={(e) => setAdvancedSearch(prev => ({...prev, course: e.target.value}))}
            className="input-field"
          >
            <option value="">Select Course</option>
            {filters?.courses?.map(course => (
              <option key={course} value={course}>{course}</option>
            )) || null}
          </select>

          <select
            value={advancedSearch.role}
            onChange={(e) => setAdvancedSearch(prev => ({...prev, role: e.target.value}))}
            className="input-field"
          >
            <option value="">Select Role</option>
            {filters?.roles?.map(role => (
              <option key={role} value={role}>{role}</option>
            )) || null}
          </select>

          <button 
            onClick={handleAdvancedSearch}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users ({safeFilteredUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ID/Addmission Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course/Branch/Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {safeFilteredUsers.map((user) => (
                <tr key={user._id || user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{(user.name || "U")[0].toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email || "No Email"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(user.role)}`}
                    >
                      {user.role || "No Role"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.admissionNumber || user.rollNumber || user.employeeId || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.course && user.branch ? `${user.course} - ${user.branch}` : user.department || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowModal(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id || user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {safeFilteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || roleFilter ? "Try adjusting your search criteria." : "No users have been added yet."}
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role != "student" &&(
              <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={newUser.employeeId}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, employeeId: e.target.value }))}
                      className="input-field"
                      placeholder="ID will be generated automatically"
                      disabled
                    />
                  </div>)
                  }
              {newUser.role === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admission Number
                    </label>
                    <input
                      type="text"
                      value={newUser.admissionNumber}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, admissionNumber: e.target.value }))}
                      className="input-field"
                      placeholder="ID will be generated automatically"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                      <select
                        value={newUser.course}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, course: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select Course</option>
                        <option value="BTech">B.Tech</option>
                        <option value="MTech">M.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="MCA">MCA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                      <select
                        value={newUser.branch}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, branch: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select Branch</option>
                        <option value="CSE">Computer Science</option>
                        <option value="ECE">Electronics</option>
                        <option value="ME">Mechanical</option>
                        <option value="CE">Civil</option>
                        <option value="EE">Electrical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                      <select
                        value={newUser.section}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, section: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                      <select
                        value={newUser.semester}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, semester: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select Semester</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>

                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Department only when role === faculty */}

              {newUser.role === "faculty" && (
                <>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, department: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Department</option>
                      <option value="CSE">Computer Science</option>
                      <option value="ECE">Electronics</option>
                      <option value="ME">Mechanical</option>
                      <option value="CE">Civil</option>
                      <option value="EE">Electrical</option>
                    </select>
                  </div>
                </>
              )}

             
              

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewUser({
                    name: "",
                    email: "",
                    role: "student",
                    course: "",
                    branch: "",
                    semester: null,
                    admissionNumber: "",
                    phone: "",
                    section: "",
                    employeeId:"",
                  })
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleCreateUser} className="btn-primary flex-1">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details/Edit Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" defaultValue={selectedUser.name || ""} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" defaultValue={selectedUser.email || ""} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select defaultValue={selectedUser.role || "student"} className="input-field">
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course/Department
                </label>
                <input
                  type="text"
                  defaultValue={selectedUser.course || selectedUser.department || ""}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedUser(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateUser(selectedUser._id || selectedUser.id, {})}
                className="btn-primary flex-1"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

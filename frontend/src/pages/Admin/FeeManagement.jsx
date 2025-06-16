"use client"

import { debounce } from "lodash"
import { useState, useEffect, useCallback, useMemo } from "react"
import { feesAPI, usersAPI, coursesAPI } from "../../services/api"
import { useNotification } from "../../contexts/NotificationContext"
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Trash2,
  X,
  Users,
  BookOpen,
} from "lucide-react"

const FEE_TYPES = [
  { value: "tuition", label: "Tuition" },
  { value: "hostel", label: "Hostel" },
  { value: "library", label: "Library" },
  { value: "lab", label: "Lab" },
  { value: "exam", label: "Exam" },
  { value: "development", label: "Development" },
  { value: "other", label: "Other" },
]

const PAYMENT_METHODS = ["cash", "card", "online", "cheque"]

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

// Add role types constant
const ROLE_TYPES = ["student", "faculty", "admin"]

const FeeManagement = () => {
  const { showSuccess, showError } = useNotification()
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [feeTypeFilter, setFeeTypeFilter] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [courseFilter, setCourseFilter] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)
  const [newFee, setNewFee] = useState({
    studentId: "",
    feeType: "",
    amount: "",
    dueDate: "",
    semester: "",
    academicYear: "",
    description: "",
  })
  const [bulkFee, setBulkFee] = useState({
    courseId: "",
    branch: "",
    feeType: "",
    amount: "",
    dueDate: "",
    semester: "",
    academicYear: "",
    description: "",
  })
  const [editFee, setEditFee] = useState(null)
  const [payment, setPayment] = useState({
    paymentMethod: "cash",
    transactionId: "",
    amount: "",
  })
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  })

  // Add student search state
  const [studentSearch, setStudentSearch] = useState("")
  const [searchedStudents, setSearchedStudents] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Add role filter state
  const [roleFilter, setRoleFilter] = useState("")

  // Fetch courses for bulk fee creation and filters
  useEffect(() => {
    coursesAPI.getCourses({ active: true, limit: 100 })
      .then(res => setCourses(res?.data?.courses || []))
      .catch(() => setCourses([]))
  }, [])

  // Fetch students for dropdown (for single fee creation)
  useEffect(() => {
    usersAPI.getUsers({ role: "student", limit: 1000 })
      .then(usersRes => setStudents(usersRes?.data?.data || usersRes?.data?.users || []))
      .catch(() => setStudents([]))
  }, [])

  // Fetch fees and stats on filter change
  useEffect(() => {
    fetchFees()
    fetchStats()
    // eslint-disable-next-line
  }, [searchTerm, statusFilter, feeTypeFilter, semesterFilter, branchFilter, courseFilter, roleFilter])

  // Fetch fees from backend using filters
  const fetchFees = async () => {
    setLoading(true)
    try {
      const filters = {
        status: statusFilter || undefined,
        feeType: feeTypeFilter || undefined,
        semester: semesterFilter || undefined,
        branch: branchFilter || undefined,
        course: courseFilter || undefined,
        role: roleFilter || undefined,
        search: searchTerm || undefined,
        limit: 100,
        timestamp: Date.now() // Prevent caching
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      )

      const res = await feesAPI.getFees(filters)
      setFees(res?.data?.fees || [])
    } catch (error) {
      showError(error?.response?.data?.message || "Failed to fetch fees")
      setFees([])
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const res = await feesAPI.getFeeStats()
      if (res?.data) setStats(res.data)
    } catch {
      setStats({ totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0 })
    }
  }

  // CRUD: Create Fee
  const handleCreateFee = async () => {
    if (!newFee.studentId || !newFee.feeType || !newFee.amount || !newFee.dueDate || !newFee.semester || !newFee.academicYear) {
      showError("Please fill in all required fields")
      return
    }
    try {
      setLoading(true)
      const res = await feesAPI.createFee({
        studentId: newFee.studentId,
        feeType: newFee.feeType,
        amount: Number(newFee.amount),
        dueDate: newFee.dueDate,
        semester: Number(newFee.semester),
        academicYear: newFee.academicYear,
        description: newFee.description,
      })
      if (res?.data?.success) {
        showSuccess("Fee created successfully!")
        setShowCreateModal(false)
        setNewFee({
          studentId: "",
          feeType: "",
          amount: "",
          dueDate: "",
          semester: "",
          academicYear: "",
          description: "",
        })
        fetchFees()
        fetchStats()
      }
    } catch (error) {
      showError(error.message || "Failed to create fee")
    } finally {
      setLoading(false)
    }
  }

  // CRUD: Bulk Fee Creation
  const handleBulkFee = async () => {
    if (!bulkFee.courseId && !bulkFee.branch) {
      showError("Select course or branch for bulk fee creation")
      return
    }
    try {
      setLoading(true)
      // Get students based on filters
      const usersRes = await usersAPI.getUsers({ 
        course: bulkFee.courseId,
        branch: bulkFee.branch,
        role: 'student',
        limit: 1000
      })
      
      const students = usersRes?.data?.users || []
      if (!students.length) {
        showError("No students found matching the criteria")
        return
      }

      // Create fees for each student
      const feesData = students.map(student => ({
        student: student._id,
        feeType: bulkFee.feeType,
        amount: Number(bulkFee.amount),
        dueDate: bulkFee.dueDate,
        semester: Number(bulkFee.semester),
        academicYear: bulkFee.academicYear,
        description: bulkFee.description,
        status: "pending",
        payments: [],
        totalPaid: 0,
        balance: Number(bulkFee.amount)
      }))

      const res = await feesAPI.bulkCreateFees(feesData)
      if (res?.data?.success) {
        showSuccess(`Created fees for ${students.length} students`)
        setShowBulkModal(false)
        fetchFees()
      }
    } catch (error) {
      showError(error.message || "Failed to create bulk fees")
    } finally {
      setLoading(false)
    }
  }

  // CRUD: Edit Fee
  const handleEditFee = async () => {
    if (!editFee) return
    try {
      setLoading(true)
      const res = await feesAPI.updateFee(editFee._id, {
        amount: Number(editFee.amount),
        dueDate: editFee.dueDate,
        description: editFee.description,
        status: editFee.status,
      })
      if (res?.data?.success) {
        showSuccess("Fee updated successfully!")
        setShowEditModal(false)
        setEditFee(null)
        fetchFees()
        fetchStats()
      }
    } catch (error) {
      showError(error.message || "Failed to update fee")
    } finally {
      setLoading(false)
    }
  }

  // CRUD: Delete Fee
  const handleDeleteFee = async (feeId) => {
    if (!window.confirm("Are you sure you want to delete this fee record?")) return
    try {
      setLoading(true)
      const res = await feesAPI.deleteFee(feeId)
      if (res?.data?.success) {
        showSuccess("Fee deleted successfully!")
        fetchFees()
        fetchStats()
      }
    } catch (error) {
      showError(error.message || "Failed to delete fee")
    } finally {
      setLoading(false)
    }
  }

  // Payment
  const handlePayFee = async () => {
    if (!selectedFee) return
    if (!payment.amount || !payment.paymentMethod || !payment.transactionId) {
      showError("Please fill all payment details")
      return
    }
    try {
      setLoading(true)
      const res = await feesAPI.payFee(selectedFee._id, {
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
      })
      if (res?.data?.success) {
        showSuccess("Payment recorded successfully!")
        setShowPayModal(false)
        setPayment({ paymentMethod: "cash", transactionId: "", amount: "" })
        setSelectedFee(null)
        fetchFees()
        fetchStats()
      }
    } catch (error) {
      showError(error.message || "Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  // Stats Card Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "partial":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  // Create debounced search functions
  const debouncedFetch = useCallback(
    debounce(async (searchTerm) => {
      try {
        setLoading(true)
        const res = await feesAPI.getFees({
          search: searchTerm,
          status: statusFilter,
          feeType: feeTypeFilter,
          semester: semesterFilter,
          branch: branchFilter,
          course: courseFilter,
          limit: 10
        })
        setFees(res?.data?.fees || [])
      } catch (error) {
        showError("Failed to fetch fees")
      } finally {
        setTimeout(() => setLoading(false), 1000) // Add 1 second delay
      }
    }, 1000),
    [statusFilter, feeTypeFilter, semesterFilter, branchFilter, courseFilter]
  )

  // Create debounced student search
  const debouncedStudentSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm) {
        setSearchedStudents([])
        return
      }
      try {
        setIsSearching(true)
        const res = await usersAPI.getUsers({
          search: searchTerm,
          role: 'student',
          limit: 10
        })
        setSearchedStudents(res?.data?.users || [])
      } catch (error) {
        console.error(error)
      } finally {
        setIsSearching(false)
      }
    }, 500),
    []
  )

  // Update useEffect to use debounced search
  useEffect(() => {
    if (searchTerm) {
      debouncedFetch(searchTerm)
    } else {
      fetchFees()
    }
  }, [searchTerm, statusFilter, feeTypeFilter, semesterFilter, branchFilter, courseFilter])

  // Add student search handler
  const handleStudentSearch = (e) => {
    const value = e.target.value
    setStudentSearch(value)
    debouncedStudentSearch(value)
  }

  // Student search component
  const StudentSearchSelect = () => (
    <div className="relative">
      <input
        type="text"
        value={studentSearch}
        onChange={handleStudentSearch}
        className="input-field"
        placeholder="Search student by name or admission number..."
      />
      {isSearching && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      {searchedStudents.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchedStudents.map(student => (
            <div
              key={student._id}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setNewFee(prev => ({ ...prev, studentId: student._id }))
                setStudentSearch(student.name)
                setSearchedStudents([])
              }}
            >
              <div className="font-medium">{student.name}</div>
              <div className="text-sm text-gray-500">{student.admissionNumber}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Update the filters section to include role type
  const FilterSection = useCallback(() => (
    <div className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search students or fees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="input-field"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="partial">Partial</option>
        </select>
        <select 
          value={feeTypeFilter} 
          onChange={(e) => setFeeTypeFilter(e.target.value)} 
          className="input-field"
        >
          <option value="">All Fee Types</option>
          {FEE_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>{ft.label}</option>
          ))}
        </select>
        <select 
          value={semesterFilter} 
          onChange={(e) => setSemesterFilter(e.target.value)} 
          className="input-field"
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
        <select 
          value={branchFilter} 
          onChange={(e) => setBranchFilter(e.target.value)} 
          className="input-field"
        >
          <option value="">All Branches</option>
          {Array.from(new Set(students.map(s => s.branch))).map(branch =>
            <option key={branch} value={branch}>{branch}</option>
          )}
        </select>
        <select 
          value={courseFilter} 
          onChange={(e) => setCourseFilter(e.target.value)} 
          className="input-field"
        >
          <option value="">All Courses</option>
          {courses.map(course =>
            <option key={course._id} value={course._id}>{course.name}</option>
          )}
        </select>
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)} 
          className="input-field"
        >
          <option value="">All Roles</option>
          {ROLE_TYPES.map(role => (
            <option key={role} value={role} className="capitalize">
              {role}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end mt-4">
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={handleResetFilters}
        >
          <Filter className="w-4 h-4" />
          Reset Filters
        </button>
      </div>
    </div>
  ), [
    searchTerm, 
    statusFilter, 
    feeTypeFilter, 
    semesterFilter, 
    branchFilter, 
    courseFilter, 
    roleFilter,
    students,
    courses
  ])

  // Add this function near other handler functions
  const handleResetFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setFeeTypeFilter("")
    setSemesterFilter("")
    setBranchFilter("")
    setCourseFilter("")
    setRoleFilter("")
    setStudentSearch("")
    setSearchedStudents([])
    fetchFees()
    fetchStats()
  }

  // Add this to clean up debounced functions on unmount
  useEffect(() => {
    return () => {
      debouncedFetch.cancel()
      debouncedStudentSearch.cancel()
    }
  }, [debouncedFetch, debouncedStudentSearch])

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage student fees and payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)} className="btn-secondary flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Bulk Fee</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Fee</span>
          </button>
        </div>
      </div>

      {/* Stats Cards (from backend) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalAmount?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.paidAmount?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.pendingAmount?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.overdueAmount?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterSection />

      {/* Fees Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Records ({fees.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {fees.map((fee) => (
                <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{fee.student?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{fee.student?.admissionNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">{fee.feeType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ₹{fee.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(fee.status)}`}
                    >
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View/Pay"
                        onClick={() => {
                          setSelectedFee(fee)
                          setShowPayModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Edit"
                        onClick={() => {
                          setEditFee({ ...fee })
                          setShowEditModal(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                        onClick={() => handleDeleteFee(fee._id)}
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

        {fees.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No fees found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter ? "Try adjusting your search criteria." : "Create your first fee record."}
            </p>
          </div>
        )}
      </div>

      {/* Create Fee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowCreateModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Fee Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student *
                </label>
                <StudentSearchSelect />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Type *</label>
                <select
                  value={newFee.feeType}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, feeType: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select Fee Type</option>
                  {FEE_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                  <input
                    type="number"
                    value={newFee.amount}
                    onChange={(e) => setNewFee((prev) => ({ ...prev, amount: e.target.value }))}
                    className="input-field"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester *</label>
                  <select
                    value={newFee.semester}
                    onChange={(e) => setNewFee((prev) => ({ ...prev, semester: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={newFee.academicYear}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, academicYear: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 2024-25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={newFee.dueDate}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={newFee.description}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleCreateFee} className="btn-primary flex-1">
                Create Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Fee Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowBulkModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bulk Fee Creation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
                <select
                  value={bulkFee.courseId}
                  onChange={(e) => setBulkFee((prev) => ({ ...prev, courseId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Course (optional)</option>
                  {courses.map(course =>
                    <option key={course._id} value={course._id}>{course.name}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                <select
                  value={bulkFee.branch}
                  onChange={(e) => setBulkFee((prev) => ({ ...prev, branch: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Branch (optional)</option>
                  {Array.from(new Set(students.map(s => s.branch))).map(branch =>
                    <option key={branch} value={branch}>{branch}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Type *</label>
                <select
                  value={bulkFee.feeType}
                  onChange={(e) => setBulkFee((prev) => ({ ...prev, feeType: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select Fee Type</option>
                  {FEE_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                  <input
                    type="number"
                    value={bulkFee.amount}
                    onChange={(e) => setBulkFee((prev) => ({ ...prev, amount: e.target.value }))}
                    className="input-field"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester *</label>
                  <select
                    value={bulkFee.semester}
                    onChange={(e) => setBulkFee((prev) => ({ ...prev, semester: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year *</label>
                <input
                  type="text"
                  value={bulkFee.academicYear}
                  onChange={(e) => setBulkFee((prev) => ({ ...prev, academicYear: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 2024-25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={bulkFee.dueDate}
                  onChange={(e) => setBulkFee((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={bulkFee.description}
                  onChange={(e) => setBulkFee((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowBulkModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleBulkFee} className="btn-primary flex-1">
                Create Bulk Fees
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fee Modal */}
      {showEditModal && editFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowEditModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Fee Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                <input
                  type="number"
                  value={editFee.amount}
                  onChange={(e) => setEditFee((prev) => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={editFee.dueDate ? editFee.dueDate.slice(0, 10) : ""}
                  onChange={(e) => setEditFee((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editFee.description}
                  onChange={(e) => setEditFee((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={editFee.status}
                  onChange={(e) => setEditFee((prev) => ({ ...prev, status: e.target.value }))}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleEditFee} className="btn-primary flex-1">
                Update Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Fee Modal */}
      {showPayModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setShowPayModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => setPayment((prev) => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  required
                  max={selectedFee.balance}
                  min={1}
                  placeholder={`Max: ₹${selectedFee.balance}`}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Balance: ₹{selectedFee.balance}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method *</label>
                <select
                  value={payment.paymentMethod}
                  onChange={(e) => setPayment((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="input-field"
                  required
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>{pm.charAt(0).toUpperCase() + pm.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction ID *</label>
                <input
                  type="text"
                  value={payment.transactionId}
                  onChange={(e) => setPayment((prev) => ({ ...prev, transactionId: e.target.value }))}
                  className="input-field"
                  required
                  placeholder="Enter transaction/receipt ID"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowPayModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handlePayFee} className="btn-primary flex-1">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeeManagement

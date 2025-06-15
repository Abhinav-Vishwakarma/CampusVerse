"use client"

import { useState, useEffect } from "react"
import { useNotification } from "../../contexts/NotificationContext"
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

const FeeManagement = () => {
  const { showSuccess, showError } = useNotification()
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFee, setNewFee] = useState({
    studentId: "",
    feeType: "",
    amount: "",
    dueDate: "",
    semester: "",
    description: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mock data
      const mockFees = [
        {
          _id: "1",
          student: { _id: "1", name: "John Doe", studentId: "CS2021001", branch: "CSE" },
          feeType: "Tuition Fee",
          amount: 50000,
          dueDate: "2024-01-15",
          status: "pending",
          semester: 3,
          createdAt: "2024-01-01",
        },
        {
          _id: "2",
          student: { _id: "2", name: "Jane Smith", studentId: "CS2021002", branch: "CSE" },
          feeType: "Lab Fee",
          amount: 5000,
          dueDate: "2024-01-10",
          status: "paid",
          semester: 3,
          paidAt: "2024-01-05",
          createdAt: "2024-01-01",
        },
      ]

      const mockStudents = [
        { _id: "1", name: "John Doe", studentId: "CS2021001", branch: "CSE", semester: 3 },
        { _id: "2", name: "Jane Smith", studentId: "CS2021002", branch: "CSE", semester: 3 },
        { _id: "3", name: "Bob Johnson", studentId: "CS2021003", branch: "CSE", semester: 3 },
      ]

      setFees(mockFees)
      setStudents(mockStudents)
    } catch (error) {
      showError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFee = async () => {
    if (!newFee.studentId || !newFee.feeType || !newFee.amount || !newFee.dueDate) {
      showError("Please fill in all required fields")
      return
    }

    try {
      const selectedStudent = students.find((s) => s._id === newFee.studentId)
      const fee = {
        _id: Date.now().toString(),
        student: selectedStudent,
        ...newFee,
        amount: Number(newFee.amount),
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      setFees((prev) => [fee, ...prev])
      setShowCreateModal(false)
      setNewFee({
        studentId: "",
        feeType: "",
        amount: "",
        dueDate: "",
        semester: "",
        description: "",
      })
      showSuccess("Fee created successfully!")
    } catch (error) {
      showError("Failed to create fee")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student?.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.feeType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || fee.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0)
  const paidAmount = fees.filter((fee) => fee.status === "paid").reduce((sum, fee) => sum + fee.amount, 0)
  const pendingAmount = fees.filter((fee) => fee.status === "pending").reduce((sum, fee) => sum + fee.amount, 0)
  const overdueAmount = fees.filter((fee) => fee.status === "overdue").reduce((sum, fee) => sum + fee.amount, 0)

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
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Fee</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{paidAmount.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{pendingAmount.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{overdueAmount.toLocaleString()}</p>
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
              placeholder="Search students or fees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Fees Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Records ({filteredFees.length})</h2>
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
              {filteredFees.map((fee) => (
                <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{fee.student?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{fee.student?.studentId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{fee.feeType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ₹{fee.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(fee.dueDate).toLocaleDateString()}
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
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFees.length === 0 && (
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Fee Record</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student *</label>
                <select
                  value={newFee.studentId}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, studentId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Type *</label>
                <select
                  value={newFee.feeType}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, feeType: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Fee Type</option>
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Lab Fee">Lab Fee</option>
                  <option value="Library Fee">Library Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Hostel Fee">Hostel Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Other">Other</option>
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                  <select
                    value={newFee.semester}
                    onChange={(e) => setNewFee((prev) => ({ ...prev, semester: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={newFee.dueDate}
                  onChange={(e) => setNewFee((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
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
    </div>
  )
}

export default FeeManagement

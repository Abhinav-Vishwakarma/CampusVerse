"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { CreditCard, AlertTriangle, CheckCircle, Clock, Download, DollarSign } from "lucide-react"

const FeesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFee, setSelectedFee] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)

  useEffect(() => {
    fetchFees()
  }, [])

  const fetchFees = async () => {
    try {
      // Mock fees data
      const mockFees = [
        {
          _id: "1",
          feeType: "Tuition Fee",
          amount: 50000,
          dueDate: "2024-01-15",
          status: "pending",
          semester: 3,
          student: { name: "John Doe", studentId: "CS2021001" },
        },
        {
          _id: "2",
          feeType: "Lab Fee",
          amount: 5000,
          dueDate: "2024-01-10",
          status: "paid",
          semester: 3,
          paidAt: "2024-01-05",
          student: { name: "John Doe", studentId: "CS2021001" },
        },
        {
          _id: "3",
          feeType: "Library Fee",
          amount: 2000,
          dueDate: "2023-12-15",
          status: "overdue",
          semester: 3,
          student: { name: "John Doe", studentId: "CS2021001" },
        },
      ]

      setFees(mockFees)
    } catch (error) {
      showError("Failed to fetch fees data")
      setFees([]) // Ensure fees is always an array
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (feeId, paymentData) => {
    try {
      // Mock payment processing
      setFees((prev) =>
        prev.map((fee) => (fee._id === feeId ? { ...fee, status: "paid", paidAt: new Date().toISOString() } : fee)),
      )
      showSuccess("Payment processed successfully!")
      setPaymentModal(false)
      setSelectedFee(null)
    } catch (error) {
      showError("Payment failed. Please try again.")
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Ensure fees is an array before using reduce
  const safeFeesArray = Array.isArray(fees) ? fees : []
  const totalAmount = safeFeesArray.reduce((sum, fee) => sum + fee.amount, 0)
  const paidAmount = safeFeesArray.filter((fee) => fee.status === "paid").reduce((sum, fee) => sum + fee.amount, 0)
  const pendingAmount = totalAmount - paidAmount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fees Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "student" ? "View and pay your fees" : "Manage student fees"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {user?.role === "student" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fees</p>
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
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fees List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user?.role === "student" ? "My Fees" : "Student Fees"}
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {safeFeesArray.map((fee) => (
              <div key={fee._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(fee.status)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{fee.feeType}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fee.semester && `Semester ${fee.semester} • `}
                        Due: {new Date(fee.dueDate).toLocaleDateString()}
                      </p>
                      {user?.role !== "student" && fee.student && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Student: {fee.student.name} ({fee.student.studentId})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      ₹{fee.amount.toLocaleString()}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(fee.status)}`}
                    >
                      {fee.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {fee.paidAt && <span>Paid on {new Date(fee.paidAt).toLocaleDateString()}</span>}
                    {fee.status === "overdue" && (
                      <span className="text-red-600 dark:text-red-400">
                        Overdue by {Math.ceil((new Date() - new Date(fee.dueDate)) / (1000 * 60 * 60 * 24))} days
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {fee.status === "paid" && (
                      <button className="btn-secondary text-sm flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    )}
                    {user?.role === "student" && fee.status !== "paid" && (
                      <button
                        onClick={() => {
                          setSelectedFee(fee)
                          setPaymentModal(true)
                        }}
                        className="btn-primary text-sm"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {safeFeesArray.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No fees found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.role === "student" ? "You have no pending fees." : "No fee records available."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{selectedFee.feeType}</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{selectedFee.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Due Date: {new Date(selectedFee.dueDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select className="input-field">
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                  <input type="text" placeholder="MM/YY" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                  <input type="text" placeholder="123" className="input-field" />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setPaymentModal(false)
                  setSelectedFee(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayment(selectedFee._id, { method: "card", amount: selectedFee.amount })}
                className="btn-primary flex-1"
              >
                Pay ₹{selectedFee.amount.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeesPage

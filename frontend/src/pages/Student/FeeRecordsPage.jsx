"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { CreditCard, Download, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react"

const FeeRecordsPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [feeRecords, setFeeRecords] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeeData()
  }, [])

  const fetchFeeData = async () => {
    try {
      // Mock fee records
      const mockFeeRecords = [
        {
          _id: "1",
          semester: "5th Semester",
          academicYear: "2023-24",
          totalAmount: 75000,
          paidAmount: 75000,
          dueAmount: 0,
          dueDate: "2023-08-15",
          status: "paid",
          paymentDate: "2023-08-10",
          receiptNo: "RCP001234",
        },
        {
          _id: "2",
          semester: "6th Semester",
          academicYear: "2023-24",
          totalAmount: 75000,
          paidAmount: 50000,
          dueAmount: 25000,
          dueDate: "2024-01-15",
          status: "partial",
          paymentDate: "2023-12-20",
          receiptNo: "RCP001235",
        },
        {
          _id: "3",
          semester: "7th Semester",
          academicYear: "2024-25",
          totalAmount: 80000,
          paidAmount: 0,
          dueAmount: 80000,
          dueDate: "2024-08-15",
          status: "pending",
          paymentDate: null,
          receiptNo: null,
        },
      ]

      // Mock payment history
      const mockPaymentHistory = [
        {
          _id: "1",
          date: "2023-08-10",
          amount: 75000,
          semester: "5th Semester",
          method: "Online Banking",
          transactionId: "TXN123456789",
          receiptNo: "RCP001234",
        },
        {
          _id: "2",
          date: "2023-12-20",
          amount: 50000,
          semester: "6th Semester",
          method: "UPI",
          transactionId: "TXN987654321",
          receiptNo: "RCP001235",
        },
      ]

      setFeeRecords(mockFeeRecords)
      setPaymentHistory(mockPaymentHistory)
    } catch (error) {
      showError("Failed to fetch fee records")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "pending":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "partial":
        return <Clock className="w-4 h-4" />
      case "pending":
      case "overdue":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const handleDownloadReceipt = (receiptNo) => {
    // Mock download functionality
    showSuccess(`Downloading receipt ${receiptNo}`)
  }

  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
  const totalDue = feeRecords.reduce((sum, record) => sum + record.dueAmount, 0)

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Records</h1>
        <p className="text-gray-600 dark:text-gray-400">View your payment history and outstanding dues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Dues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalDue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{paymentHistory.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Records */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {feeRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{record.semester}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{record.academicYear}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{record.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{record.paidAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{record.dueAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 w-fit ${getStatusColor(record.status)}`}
                    >
                      {getStatusIcon(record.status)}
                      <span className="capitalize">{record.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(record.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {record.receiptNo && (
                        <button
                          onClick={() => handleDownloadReceipt(record.receiptNo)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Receipt</span>
                        </button>
                      )}
                      {record.status !== "paid" && (
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {paymentHistory.map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">₹{payment.amount.toLocaleString()}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{payment.semester}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                      </span>
                      <span>{payment.method}</span>
                      <span>TXN: {payment.transactionId}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadReceipt(payment.receiptNo)}
                  className="btn-secondary text-xs flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Receipt</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeeRecordsPage

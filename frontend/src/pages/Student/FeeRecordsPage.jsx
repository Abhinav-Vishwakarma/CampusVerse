"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { feesAPI } from "../../services/api"
import { CreditCard, Download, Calendar, CheckCircle, AlertCircle, Clock, X } from "lucide-react"

const FeeRecordsPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [feeRecords, setFeeRecords] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
    overdueAmount: 0,
    totalRecords: 0,
    paidRecords: 0,
    pendingRecords: 0,
    overdueRecords: 0,
  })
  const [payNowFee, setPayNowFee] = useState(null)
  const [payNowForm, setPayNowForm] = useState({
    amount: "",
    paymentMethod: "online",
    transactionId: "",
  })
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetchFeeData()
    // eslint-disable-next-line
  }, [user])

  const fetchFeeData = async () => {
    setLoading(true)
    try {
      // Fetch all fee records for the student
      const res = await feesAPI.getFees({ student: user.id })
      const fees = res.data?.fees || []
      setFeeRecords(
        fees.map((fee) => ({
          _id: fee._id,
          semester: `Semester ${fee.semester}`,
          academicYear: fee.academicYear,
          totalAmount: fee.amount,
          paidAmount: fee.totalPaid,
          dueAmount: fee.balance,
          dueDate: fee.dueDate,
          status: fee.status,
          payments: fee.payments || [],
          feeType: fee.feeType,
          description: fee.description,
        }))
      )
      setSummary(res.data?.summary || {})
      // Flatten all payments for payment history
      const allPayments = []
      fees.forEach((fee) => {
        (fee.payments || []).forEach((p) => {
          allPayments.push({
            _id: p._id,
            date: p.paidAt,
            amount: p.amount,
            semester: `Semester ${fee.semester}`,
            method: p.paymentMethod,
            transactionId: p.transactionId,
            receiptNo: p.receipt,
            feeType: fee.feeType,
          })
        })
      })
      // Sort by date descending
      setPaymentHistory(allPayments.sort((a, b) => new Date(b.date) - new Date(a.date)))
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
    // You can implement real download logic here if backend supports it
    showSuccess(`Downloading receipt ${receiptNo}`)
  }

  const handlePayNowClick = (fee) => {
    setPayNowFee(fee)
    setPayNowForm({
      amount: fee.dueAmount,
      paymentMethod: "online",
      transactionId: "",
    })
  }

  const handlePayNowSubmit = async (e) => {
    e.preventDefault()
    if (!payNowForm.amount || !payNowForm.paymentMethod || !payNowForm.transactionId) {
      showError("Please fill all payment details")
      return
    }
    if (Number(payNowForm.amount) > payNowFee.dueAmount) {
      showError(`Amount cannot exceed due amount (₹${payNowFee.dueAmount})`)
      return
    }
    setPaying(true)
    try {
      const res = await feesAPI.payFee(payNowFee._id, {
        amount: Number(payNowForm.amount),
        paymentMethod: payNowForm.paymentMethod,
        transactionId: payNowForm.transactionId,
      })
      if (res.data?.success) {
        showSuccess("Payment successful!")
        setPayNowFee(null)
        fetchFeeData()
      } else {
        showError(res.data?.message || "Payment failed")
      }
    } catch (error) {
      showError(error?.response?.data?.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  const totalPaid = summary.totalPaid || paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
  const totalDue = summary.totalBalance || feeRecords.reduce((sum, record) => sum + record.dueAmount, 0)

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
                  Fee Type
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                    {record.feeType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{(record.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{(record.paidAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₹{(record.dueAmount || 0).toLocaleString()}
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
                    {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {record.payments.length > 0 && (
                        <button
                          onClick={() => handleDownloadReceipt(record.payments[record.payments.length - 1].receipt)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Receipt</span>
                        </button>
                      )}
                      {record.status !== "paid" && (
                        <button
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          onClick={() => handlePayNowClick(record)}
                        >
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

      {/* Pay Now Modal */}
      {payNowFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setPayNowFee(null)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Pay Fee</h2>
            <div className="mb-4">
              <div className="mb-1"><span className="font-semibold">Semester:</span> {payNowFee.semester}</div>
              <div className="mb-1"><span className="font-semibold">Fee Type:</span> {payNowFee.feeType}</div>
              <div className="mb-1"><span className="font-semibold">Due Amount:</span> ₹{payNowFee.dueAmount.toLocaleString()}</div>
              <div className="mb-1"><span className="font-semibold">Due Date:</span> {payNowFee.dueDate ? new Date(payNowFee.dueDate).toLocaleDateString() : "-"}</div>
            </div>
            <form onSubmit={handlePayNowSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  min="1"
                  max={payNowFee.dueAmount}
                  value={payNowForm.amount}
                  onChange={e => setPayNowForm(f => ({ ...f, amount: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                <select
                  value={payNowForm.paymentMethod}
                  onChange={e => setPayNowForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="online">Online</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={payNowForm.transactionId}
                  onChange={e => setPayNowForm(f => ({ ...f, transactionId: e.target.value }))}
                  className="input-field"
                  required
                  placeholder="Enter transaction/reference number"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setPayNowFee(null)}
                  disabled={paying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={paying}
                >
                  {paying ? "Paying..." : "Pay Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {payment.semester} ({payment.feeType})
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{payment.date ? new Date(payment.date).toLocaleDateString() : "-"}</span>
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
            {paymentHistory.length === 0 && <div className="text-center text-gray-500">No payments yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeeRecordsPage

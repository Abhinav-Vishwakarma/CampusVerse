import Fee from "../models/Fee.js"
import User from "../models/User.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Create fee record
// @route   POST /api/fees
// @access  Private/Admin
const createFeeRecord = async (req, res) => {
  try {
    const { studentId, semester, academicYear, amount, dueDate, feeType, remarks } = req.body

    // Check if student exists
    const student = await User.findById(studentId)
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if fee record already exists for this student, semester, and academic year
    const existingFee = await Fee.findOne({
      student: studentId,
      semester,
      academicYear,
      feeType,
    })

    if (existingFee) {
      return res.status(400).json({
        message: "Fee record already exists for this student, semester, and academic year",
      })
    }

    // Create fee record
    const fee = await Fee.create({
      student: studentId,
      semester,
      academicYear,
      amount,
      dueDate,
      feeType,
      remarks,
    })

    // Send notification to student
    await sendNotification({
      title: "New Fee Record",
      message: `A new fee record of ₹${amount} for ${feeType} has been created. Due date: ${new Date(
        dueDate,
      ).toLocaleDateString()}`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [studentId],
      relatedTo: {
        model: "Fee",
        id: fee._id,
      },
      sentVia: ["app", "email"],
    })

    res.status(201).json(fee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all fee records
// @route   GET /api/fees
// @access  Private/Admin
const getFeeRecords = async (req, res) => {
  try {
    const { studentId, semester, academicYear, status, feeType } = req.query

    const filter = {}

    if (studentId) filter.student = studentId
    if (semester) filter.semester = semester
    if (academicYear) filter.academicYear = academicYear
    if (status) filter.status = status
    if (feeType) filter.feeType = feeType

    const fees = await Fee.find(filter).populate("student", "name email studentId branch").sort({ createdAt: -1 })

    res.json(fees)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get student's fee records
// @route   GET /api/fees/student
// @access  Private/Student
const getStudentFeeRecords = async (req, res) => {
  try {
    const fees = await Fee.find({ student: req.user._id }).sort({ createdAt: -1 })

    // Calculate total pending amount
    const totalPending = fees
      .filter((fee) => fee.status === "pending" || fee.status === "partial")
      .reduce((sum, fee) => {
        const paidAmount = fee.transactions.reduce((total, transaction) => total + transaction.amount, 0)
        return sum + (fee.amount - paidAmount)
      }, 0)

    // Calculate total paid amount
    const totalPaid = fees.reduce((sum, fee) => {
      const paidAmount = fee.transactions.reduce((total, transaction) => total + transaction.amount, 0)
      return sum + paidAmount
    }, 0)

    res.json({
      fees,
      summary: {
        totalPending,
        totalPaid,
        totalRecords: fees.length,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get fee record by ID
// @route   GET /api/fees/:id
// @access  Private
const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate("student", "name email studentId branch")

    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" })
    }

    // Check if user is authorized to view this fee record
    if (req.user.role !== "admin" && fee.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this fee record" })
    }

    res.json(fee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update fee record
// @route   PUT /api/fees/:id
// @access  Private/Admin
const updateFeeRecord = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)

    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" })
    }

    const { amount, dueDate, status, remarks } = req.body

    // Update fields
    if (amount) fee.amount = amount
    if (dueDate) fee.dueDate = dueDate
    if (status) fee.status = status
    if (remarks) fee.remarks = remarks

    const updatedFee = await fee.save()

    // Send notification to student if status changed
    if (status) {
      await sendNotification({
        title: "Fee Status Updated",
        message: `Your fee record status has been updated to ${status}`,
        type: "info",
        sender: req.user._id,
        recipients: "specific-users",
        specificUsers: [fee.student],
        relatedTo: {
          model: "Fee",
          id: fee._id,
        },
        sentVia: ["app"],
      })
    }

    res.json(updatedFee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Add payment transaction
// @route   POST /api/fees/:id/payment
// @access  Private/Admin
const addPaymentTransaction = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)

    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" })
    }

    const { amount, paymentMethod, transactionId, receipt } = req.body

    // Validate payment amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" })
    }

    // Calculate total paid amount
    const totalPaid = fee.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    const remainingAmount = fee.amount - totalPaid

    if (amount > remainingAmount) {
      return res.status(400).json({
        message: `Payment amount cannot exceed remaining amount of ₹${remainingAmount}`,
      })
    }

    // Add payment transaction
    fee.transactions.push({
      amount,
      paymentMethod,
      transactionId,
      receipt,
      paymentDate: new Date(),
    })

    // Update fee status
    const newTotalPaid = totalPaid + amount
    if (newTotalPaid >= fee.amount) {
      fee.status = "paid"
    } else if (newTotalPaid > 0) {
      fee.status = "partial"
    }

    await fee.save()

    // Send notification to student
    await sendNotification({
      title: "Payment Received",
      message: `Payment of ₹${amount} has been received for your ${fee.feeType} fee. ${
        fee.status === "paid" ? "Fee fully paid!" : `Remaining: ₹${fee.amount - newTotalPaid}`
      }`,
      type: "success",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [fee.student],
      relatedTo: {
        model: "Fee",
        id: fee._id,
      },
      sentVia: ["app", "email"],
    })

    res.json({
      message: "Payment transaction added successfully",
      fee,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get overdue fees
// @route   GET /api/fees/overdue
// @access  Private/Admin
const getOverdueFees = async (req, res) => {
  try {
    const currentDate = new Date()

    // Find fees that are overdue
    const overdueFees = await Fee.find({
      dueDate: { $lt: currentDate },
      status: { $in: ["pending", "partial"] },
    })
      .populate("student", "name email studentId branch")
      .sort({ dueDate: 1 })

    // Update status to overdue
    for (const fee of overdueFees) {
      if (fee.status !== "overdue") {
        fee.status = "overdue"
        await fee.save()

        // Send overdue notification
        await sendNotification({
          title: "Fee Overdue",
          message: `Your ${fee.feeType} fee of ₹${fee.amount} is overdue. Please make payment immediately.`,
          type: "warning",
          sender: req.user._id,
          recipients: "specific-users",
          specificUsers: [fee.student._id],
          relatedTo: {
            model: "Fee",
            id: fee._id,
          },
          sentVia: ["app", "email"],
        })
      }
    }

    res.json(overdueFees)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get fee statistics
// @route   GET /api/fees/statistics
// @access  Private/Admin
const getFeeStatistics = async (req, res) => {
  try {
    const { academicYear, semester } = req.query

    const filter = {}
    if (academicYear) filter.academicYear = academicYear
    if (semester) filter.semester = semester

    // Get all fees
    const fees = await Fee.find(filter)

    // Calculate statistics
    let totalAmount = 0
    let totalPaid = 0
    let totalPending = 0
    const statusCounts = {
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0,
    }

    for (const fee of fees) {
      totalAmount += fee.amount
      statusCounts[fee.status]++

      const paidAmount = fee.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
      totalPaid += paidAmount
      totalPending += fee.amount - paidAmount
    }

    // Get fee type wise statistics
    const feeTypeStats = await Fee.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$feeType",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    res.json({
      totalAmount,
      totalPaid,
      totalPending,
      statusCounts,
      feeTypeStats,
      collectionPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private/Admin
const deleteFeeRecord = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)

    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" })
    }

    // Check if fee has any payments
    if (fee.transactions.length > 0) {
      return res.status(400).json({
        message: "Cannot delete fee record with payment transactions",
      })
    }

    await fee.deleteOne()

    res.json({ message: "Fee record removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export {
  createFeeRecord,
  getFeeRecords,
  getStudentFeeRecords,
  getFeeById,
  updateFeeRecord,
  addPaymentTransaction,
  getOverdueFees,
  getFeeStatistics,
  deleteFeeRecord,
}

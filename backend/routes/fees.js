const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Fee = require("../models/Fee")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/fees
// @desc    Get all fees with filters
// @access  Private
router.get(
  "/",
  [
    auth,
    query("student").optional().isMongoId(),
    query("status").optional().isIn(["pending", "paid", "overdue", "partial"]),
    query("semester").optional().isInt({ min: 1, max: 8 }),
    query("feeType").optional().isIn(["tuition", "hostel", "library", "lab", "exam", "development", "other"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { student, status, semester, feeType, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = {}
      if (student) filter.student = student
      if (status) filter.status = status
      if (semester) filter.semester = Number.parseInt(semester)
      if (feeType) filter.feeType = feeType

      // Role-based filtering
      if (req.user.role === "student") {
        filter.student = req.user.id
      }

      const fees = await Fee.find(filter)
        .populate("student", "name email admissionNumber branch semester")
        .populate("createdBy", "name email")
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .sort({ createdAt: -1 })

      const total = await Fee.countDocuments(filter)

      res.json({
        success: true,
        fees: fees || [],
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      })
    } catch (error) {
      console.error("Get fees error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/fees/:id
// @desc    Get specific fee
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate("student", "name email admissionNumber branch semester")
      .populate("createdBy", "name email")

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      })
    }

    // Check access permissions
    if (req.user.role === "student" && fee.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      fee,
    })
  } catch (error) {
    console.error("Get fee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/fees
// @desc    Create new fee
// @access  Private (Admin)
router.post(
  "/",
  [
    auth,
    authorize("admin"),
    body("studentId").isMongoId().withMessage("Valid student ID is required"),
    body("feeType")
      .isIn(["tuition", "hostel", "library", "lab", "exam", "development", "other"])
      .withMessage("Valid fee type is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Valid amount is required"),
    body("dueDate").isISO8601().withMessage("Valid due date is required"),
    body("semester").isInt({ min: 1, max: 8 }).withMessage("Valid semester is required"),
    body("academicYear").notEmpty().withMessage("Academic year is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { studentId, feeType, amount, dueDate, semester, academicYear, description } = req.body

      // Validate student exists
      const student = await User.findById(studentId)
      if (!student || student.role !== "student") {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        })
      }

      const fee = new Fee({
        student: studentId,
        feeType,
        amount,
        dueDate: new Date(dueDate),
        semester,
        academicYear,
        description,
        createdBy: req.user.id,
      })

      await fee.save()
      await fee.populate("student", "name email admissionNumber")
      await fee.populate("createdBy", "name email")

      res.status(201).json({
        success: true,
        message: "Fee record created successfully",
        fee,
      })
    } catch (error) {
      console.error("Create fee error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/fees/:id
// @desc    Update fee
// @access  Private (Admin)
router.put("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      })
    }

    const { amount, dueDate, description, status } = req.body

    if (amount) fee.amount = amount
    if (dueDate) fee.dueDate = new Date(dueDate)
    if (description) fee.description = description
    if (status) fee.status = status

    await fee.save()
    await fee.populate("student", "name email admissionNumber")

    res.json({
      success: true,
      message: "Fee record updated successfully",
      fee,
    })
  } catch (error) {
    console.error("Update fee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   DELETE /api/fees/:id
// @desc    Delete fee
// @access  Private (Admin)
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      })
    }

    await Fee.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Fee record deleted successfully",
    })
  } catch (error) {
    console.error("Delete fee error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/fees/:id/pay
// @desc    Pay fee
// @access  Private (Student/Admin)
router.post(
  "/:id/pay",
  [
    auth,
    body("paymentMethod").isIn(["cash", "card", "online", "cheque"]).withMessage("Valid payment method is required"),
    body("transactionId").notEmpty().withMessage("Transaction ID is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Valid amount is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { paymentMethod, transactionId, amount } = req.body

      const fee = await Fee.findById(req.params.id)
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: "Fee record not found",
        })
      }

      // Check access permissions
      if (req.user.role === "student" && fee.student.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      // Validate payment amount
      if (amount > fee.balance) {
        return res.status(400).json({
          success: false,
          message: `Payment amount cannot exceed balance (₹${fee.balance})`,
        })
      }

      // Generate receipt number
      const receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`

      // Add payment
      const payment = {
        amount,
        paymentMethod,
        transactionId,
        receipt: receiptNumber,
      }

      fee.payments.push(payment)
      await fee.save() // This will trigger the pre-save hook to recalculate balance

      res.json({
        success: true,
        message: "Payment recorded successfully",
        paymentId: fee.payments[fee.payments.length - 1]._id,
        paidAt: fee.payments[fee.payments.length - 1].paidAt,
        receipt: receiptNumber,
        newBalance: fee.balance,
        status: fee.status,
      })
    } catch (error) {
      console.error("Pay fee error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/fees/students/:studentId/fees
// @desc    Get student fees
// @access  Private
router.get("/students/:studentId/fees", auth, async (req, res) => {
  try {
    const { studentId } = req.params

    // Check access permissions
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const fees = await Fee.find({ student: studentId }).populate("createdBy", "name email").sort({ createdAt: -1 })

    // Calculate summary statistics
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalPaid = fees.reduce((sum, fee) => sum + fee.totalPaid, 0)
    const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0)
    const overdueAmount = fees.filter((fee) => fee.status === "overdue").reduce((sum, fee) => sum + fee.balance, 0)

    res.json({
      success: true,
      fees: fees || [],
      summary: {
        totalAmount,
        totalPaid,
        totalBalance,
        overdueAmount,
        totalRecords: fees.length,
        paidRecords: fees.filter((fee) => fee.status === "paid").length,
        pendingRecords: fees.filter((fee) => fee.status === "pending").length,
        overdueRecords: fees.filter((fee) => fee.status === "overdue").length,
      },
    })
  } catch (error) {
    console.error("Get student fees error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/fees/overdue
// @desc    Get overdue fees
// @access  Private (Admin)
router.get("/overdue", [auth, authorize("admin")], async (req, res) => {
  try {
    const overdueFees = await Fee.find({
      status: "overdue",
    })
      .populate("student", "name email admissionNumber branch semester phone")
      .sort({ dueDate: 1 })

    const totalOverdueAmount = overdueFees.reduce((sum, fee) => sum + fee.balance, 0)

    res.json({
      success: true,
      fees: overdueFees || [],
      summary: {
        totalRecords: overdueFees.length,
        totalOverdueAmount,
      },
    })
  } catch (error) {
    console.error("Get overdue fees error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/fees/bulk
// @desc    Create bulk fees
// @access  Private (Admin)
router.post(
  "/bulk",
  [auth, authorize("admin"), body("fees").isArray({ min: 1 }).withMessage("Fees array is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { fees } = req.body

      const createdFees = []
      const errors_list = []

      for (const feeData of fees) {
        try {
          // Validate student exists
          const student = await User.findById(feeData.studentId)
          if (!student || student.role !== "student") {
            errors_list.push({
              studentId: feeData.studentId,
              error: "Student not found",
            })
            continue
          }

          const fee = new Fee({
            student: feeData.studentId,
            feeType: feeData.feeType,
            amount: feeData.amount,
            dueDate: new Date(feeData.dueDate),
            semester: feeData.semester,
            academicYear: feeData.academicYear,
            description: feeData.description,
            createdBy: req.user.id,
          })

          await fee.save()
          createdFees.push(fee)
        } catch (error) {
          errors_list.push({
            studentId: feeData.studentId,
            error: error.message,
          })
        }
      }

      res.status(201).json({
        success: true,
        message: `${createdFees.length} fee records created successfully`,
        created: createdFees.length,
        errors: errors_list,
      })
    } catch (error) {
      console.error("Bulk create fees error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/fees/stats
// @desc    Get fee statistics
// @access  Private (Admin)
router.get("/stats", [auth, authorize("admin")], async (req, res) => {
  try {
    const totalFees = await Fee.countDocuments()
    const paidFees = await Fee.countDocuments({ status: "paid" })
    const pendingFees = await Fee.countDocuments({ status: "pending" })
    const overdueFees = await Fee.countDocuments({ status: "overdue" })
    const partialFees = await Fee.countDocuments({ status: "partial" })

    // Calculate amounts
    const totalAmount = await Fee.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
    const paidAmount = await Fee.aggregate([{ $group: { _id: null, total: { $sum: "$totalPaid" } } }])
    const pendingAmount = await Fee.aggregate([
      { $match: { status: { $in: ["pending", "overdue", "partial"] } } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ])

    // Fee type distribution
    const feeTypeStats = await Fee.aggregate([
      {
        $group: {
          _id: "$feeType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$totalPaid" },
        },
      },
    ])

    // Monthly collection trends (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlyTrends = await Fee.aggregate([
      {
        $match: {
          "payments.paidAt": { $gte: twelveMonthsAgo },
        },
      },
      { $unwind: "$payments" },
      {
        $group: {
          _id: {
            year: { $year: "$payments.paidAt" },
            month: { $month: "$payments.paidAt" },
          },
          totalCollected: { $sum: "$payments.amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    res.json({
      success: true,
      stats: {
        totalFees,
        paidFees,
        pendingFees,
        overdueFees,
        partialFees,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
        collectionPercentage: totalAmount[0]?.total
          ? Math.round(((paidAmount[0]?.total || 0) / totalAmount[0].total) * 100)
          : 0,
      },
      feeTypeStats: feeTypeStats || [],
      monthlyTrends: monthlyTrends || [],
    })
  } catch (error) {
    console.error("Get fee stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router

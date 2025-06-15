const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "online", "cheque"],
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
  receipt: {
    type: String,
  },
})

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  feeType: {
    type: String,
    enum: ["tuition", "hostel", "library", "lab", "exam", "development", "other"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue", "partial"],
    default: "pending",
  },
  payments: [paymentSchema],
  totalPaid: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: function () {
      return this.amount
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Calculate balance before saving
feeSchema.pre("save", function (next) {
  this.totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0)
  this.balance = this.amount - this.totalPaid

  if (this.balance <= 0) {
    this.status = "paid"
  } else if (this.totalPaid > 0) {
    this.status = "partial"
  } else if (new Date() > this.dueDate) {
    this.status = "overdue"
  }

  next()
})

module.exports = mongoose.model("Fee", feeSchema)

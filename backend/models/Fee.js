import mongoose from "mongoose"

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    feeType: {
      type: String,
      enum: ["tuition", "hostel", "mess", "library", "lab", "exam", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "partial"],
      default: "pending",
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidDate: Date,
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "net-banking", "cheque"],
    },
    transactionId: String,
    receiptNumber: String,
    late_fee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    remarks: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

const Fee = mongoose.model("Fee", feeSchema)
export default Fee

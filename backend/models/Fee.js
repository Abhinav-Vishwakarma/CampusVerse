import mongoose from "mongoose"

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
    transactions: [
      {
        amount: Number,
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        paymentMethod: {
          type: String,
          enum: ["online", "cash", "cheque", "bank-transfer"],
          required: true,
        },
        transactionId: String,
        receipt: String,
      },
    ],
    feeType: {
      type: String,
      enum: ["tuition", "hostel", "transport", "examination", "other"],
      default: "tuition",
    },
    remarks: String,
  },
  {
    timestamps: true,
  },
)

const Fee = mongoose.model("Fee", feeSchema)
export default Fee

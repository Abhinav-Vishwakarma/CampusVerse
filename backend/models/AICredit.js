import mongoose from "mongoose"

const aiCreditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalCredits: {
      type: Number,
      default: 10,
    },
    lastRefillDate: {
      type: Date,
      default: Date.now,
    },
    transactions: [
      {
        action: {
          type: String,
          enum: ["roadmap", "resume", "ats-check", "refill"],
          required: true,
        },
        creditsUsed: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

const AICredit = mongoose.model("AICredit", aiCreditSchema)

export default AICredit

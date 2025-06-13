import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error", "announcement"],
      default: "info",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    recipients: {
      type: String,
      enum: ["all", "students", "faculty", "admins", "specific-users"],
      required: true,
    },
    specificUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentVia: [
      {
        type: String,
        enum: ["app", "email", "sms"],
      },
    ],
    isRead: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    scheduledFor: Date,
    expiresAt: Date,
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
    actionUrl: String,
    actionText: String,
  },
  {
    timestamps: true,
  },
)

const Notification = mongoose.model("Notification", notificationSchema)
export default Notification

const mongoose = require("mongoose")

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "late"],
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  lecture: {
    type: Number,
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true })

module.exports = mongoose.model("Attendance", attendanceSchema)

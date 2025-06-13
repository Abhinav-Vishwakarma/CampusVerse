import mongoose from "mongoose"

const attendanceSchema = new mongoose.Schema(
  {
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
      enum: ["present", "absent", "excused"],
      default: "absent",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure a student can only have one attendance record per course per day
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true })

const Attendance = mongoose.model("Attendance", attendanceSchema)
export default Attendance

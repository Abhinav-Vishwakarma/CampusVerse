const mongoose = require("mongoose")

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submissionText: {
    type: String,
    required: true,
  },
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      fileSize: Number,
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  marks: {
    type: Number,
    min: 0,
  },
  feedback: {
    type: String,
  },
  gradedAt: {
    type: Date,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
})

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1,
  },
  instructions: {
    type: String,
  },
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      fileSize: Number,
    },
  ],
  submissions: [submissionSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Assignment", assignmentSchema)

const mongoose = require("mongoose")

const COURSE_TYPES = [
  "Undergraduate",
  "Postgraduate",
  "Doctoral",
  "Diploma",
  "Vocational",
  "Bridge", 
  "Online",
]

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  branch: {
    type: String,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  syllabus: {
    type: String,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
    enum: COURSE_TYPES,
    default: "Undergraduate",
  },
})

courseSchema.statics.COURSE_TYPES = COURSE_TYPES

module.exports = mongoose.model("Course", courseSchema)

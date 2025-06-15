const mongoose = require("mongoose")

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["assignment", "note", "profile", "resume", "document", "image", "other"],
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  relatedTo: {
    model: {
      type: String,
      enum: ["Assignment", "Note", "Course", "User", "Event", "Placement"],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  downloads: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metadata: {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    branch: String,
    semester: Number,
    tags: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for efficient queries
fileSchema.index({ uploadedBy: 1, type: 1 })
fileSchema.index({ "relatedTo.model": 1, "relatedTo.id": 1 })

module.exports = mongoose.model("File", fileSchema)
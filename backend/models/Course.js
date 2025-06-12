import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    semester: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalClasses: {
      type: Number,
      default: 0,
    },
    syllabus: {
      type: String,
    },
    materials: [
      {
        title: String,
        fileUrl: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

const Course = mongoose.model("Course", courseSchema)
export default Course

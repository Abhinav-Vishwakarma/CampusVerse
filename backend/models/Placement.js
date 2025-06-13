import mongoose from "mongoose"

const placementSchema = new mongoose.Schema(
  {
    company: {
      name: {
        type: String,
        required: true,
      },
      logo: String,
      website: String,
      description: String,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    requirements: [String],
    skills: [String],
    location: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      default: "full-time",
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "INR",
      },
    },
    eligibility: {
      branches: [String],
      minCGPA: Number,
      graduationYear: [Number],
      backlogs: {
        allowed: Boolean,
        maxCount: Number,
      },
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    driveDate: Date,
    status: {
      type: String,
      enum: ["active", "closed", "cancelled", "completed"],
      default: "active",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applications: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["applied", "shortlisted", "rejected", "selected", "withdrawn"],
          default: "applied",
        },
        resume: String,
        coverLetter: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

const Placement = mongoose.model("Placement", placementSchema)
export default Placement

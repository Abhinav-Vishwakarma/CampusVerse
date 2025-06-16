const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["student", "faculty", "admin"],
    default: "student",
  },
  admissionNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  course: {
    type: String,
    required: function () {
      return this.role === "student"
    },
  },
  branch: {
    type: String,
    required: function () {
      return this.role === "student"
    },
  },
  semester: {
    type: Number,
    required: function () {
      return this.role === "student"
    },
  },
  section: {
    type: String,
    required: function () {
      return this.role === "student"
    },
  },
  enrolledCourses: {
  type: [String], // Array of strings
  required: function () {
    return this.role === "student"
  },
  default: [], 
}
,
  department: {
    type: String,
    required: function () {
      return this.role === "faculty"
    },
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  profilePicture: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  aiCredits: {
    type: Number,
    default: 10,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

module.exports = mongoose.model("User", userSchema)

const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  })
}

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["student", "faculty", "admin"]).withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const {
        name,
        email,
        password,
        role,
        course,
        branch,
        semester,
        section,
        department,
        admissionNumber,
        employeeId,
        phone,
      } = req.body

      // Check if user exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        })
      }

      // Create user
      const userData = {
        name,
        email,
        password,
        role,
        phone,
      }

      // Add role-specific fields
      if (role === "student") {
        userData.course = course
        userData.branch = branch
        userData.semester = semester
        userData.section = section
        userData.admissionNumber =
          admissionNumber ||
          `${branch.substring(0, 2).toUpperCase()}${new Date().getFullYear()}${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`
      } else if (role === "faculty") {
        userData.department = department
        userData.employeeId =
          employeeId ||
          `FAC${new Date().getFullYear()}${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")}`
      }

      const user = new User(userData)
      await user.save()

      const token = generateToken(user._id)

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          course: user.course,
          branch: user.branch,
          semester: user.semester,
          section: user.section,
          department: user.department,
          admissionNumber: user.admissionNumber,
          employeeId: user.employeeId,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Check if user exists
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({
          success: false,
          message: "Account is deactivated",
        })
      }

      const token = generateToken(user._id)

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          course: user.course,
          branch: user.branch,
          semester: user.semester,
          section: user.section,
          department: user.department,
          admissionNumber: user.admissionNumber,
          employeeId: user.employeeId,
          aiCredits: user.aiCredits,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during login",
      })
    }
  },
)

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone, address, dateOfBirth } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Update fields
    if (name) user.name = name
    if (phone) user.phone = phone
    if (address) user.address = address
    if (dateOfBirth) user.dateOfBirth = dateOfBirth

    await user.save()

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", auth, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Please include a valid email")],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { email } = req.body
      const user = await User.findOne({ email })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString("hex")
      user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

      await user.save()

      // In production, send email here
      console.log("Reset token:", resetToken)

      res.json({
        success: true,
        message: "Password reset email sent",
        resetToken, // Remove this in production
      })
    } catch (error) {
      console.error("Forgot password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { token, password } = req.body

      // Hash token to compare with database
      const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      })

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token",
        })
      }

      // Set new password
      user.password = password
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined

      await user.save()

      res.json({
        success: true,
        message: "Password reset successful",
      })
    } catch (error) {
      console.error("Reset password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

module.exports = router

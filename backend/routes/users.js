// const express = require("express")
// const { body, validationResult, query } = require("express-validator")
// const User = require("../models/User")
// const { auth, authorize } = require("../middleware/auth")

// const router = express.Router()

// // @route   GET /api/users
// // @desc    Get all users with filters
// // @access  Private (Admin/Faculty)
// router.get(
//   "/",
//   [
//     auth,
//     authorize("admin", "faculty"),
//     query("role").optional().isIn(["student", "faculty", "admin"]),
//     query("course").optional().isString(),
//     query("branch").optional().isString(),
//     query("semester").optional().isInt({ min: 1, max: 8 }),
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req)
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           message: "Validation errors",
//           errors: errors.array(),
//         })
//       }

//       const { role, course, branch, semester, search, page = 1, limit = 10 } = req.query

//       // Build filter object
//       const filter = { isActive: true }

//       if (role) filter.role = role
//       if (course) filter.course = course
//       if (branch) filter.branch = branch
//       if (semester) filter.semester = Number.parseInt(semester)

//       if (search) {
//         filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
//       }

//       // Fetch users based on filter
//       const users = await User.find(filter)
//         .skip((page - 1) * limit)
//         .limit(limit)

//       res.json({
//         success: true,
//         users: users,
//       })
//     } catch (err) {
//       console.error(err.message)
//       res.status(500).send("Server error")
//     }
//   },
// )

// module.exports = router

const express = require("express")
const { body, validationResult, query } = require("express-validator")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/users
// @desc    Get all users with filters
// @access  Private (Admin/Faculty)
router.get(
  "/",
  [
    auth,
    authorize("admin", "faculty"),
    query("role").optional().isIn(["student", "faculty", "admin"]),
    query("course").optional().isString(),
    query("branch").optional().isString(),
    query("semester").optional().isInt({ min: 1, max: 8 }),
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

      const { role, course, branch, semester, search, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = { isActive: true }

      if (role) filter.role = role
      if (course) filter.course = course
      if (branch) filter.branch = branch
      if (semester) filter.semester = Number.parseInt(semester)

      if (search) {
        filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
      }

      // Fetch users based on filter
      const users = await User.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)

      res.json({
        success: true,
        users: users,
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  },
)

// @route   GET /api/users/search
// @desc    Search users with fuzzy matching
// @access  Private
router.get("/search", 
  auth,
  [
    query("search")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Search query is required"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        })
      }

      const { search, page = 1, limit = 10, role, branch, course } = req.query

      // Build search regex for fuzzy matching
      const searchRegex = new RegExp(search, "i") // Case-insensitive

      // Build query object
      const query = {
        isActive: true, // Using your existing field
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { branch: searchRegex },
          { course: searchRegex },
          { admissionNumber: searchRegex },
          { employeeId: searchRegex }, // For faculty/admin
          { phone: searchRegex },
          { department: searchRegex } // For faculty
        ]
      }

      // Add additional filters if provided
      if (role) {
        query.role = role
      }
      if (branch) {
        query.branch = new RegExp(branch, "i")
      }
      if (course) {
        query.course = new RegExp(course, "i")
      }

      // Execute search with pagination
      const users = await User.find(query)
        .select("name email role branch semester course admissionNumber employeeId department phone profilePicture createdAt") // Select fields based on your model
        .sort({ name: 1 }) // Sort alphabetically by name
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean() // Return plain objects for better performance

      // Get total count for pagination
      const total = await User.countDocuments(query)

      // Format response
      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch || "N/A",
        semester: user.semester ? `${user.semester}${getSemesterSuffix(user.semester)}` : "N/A",
        course: user.course || "N/A",
        admissionNumber: user.admissionNumber || user.employeeId || "N/A",
        department: user.department || "N/A", // For faculty
        phone: user.phone || "N/A",
        profilePicture: user.profilePicture || null,
        joinedAt: user.createdAt
      }))

      res.json({
        success: true,
        data: formattedUsers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        meta: {
          searchQuery: search,
          resultsCount: users.length
        }
      })

    } catch (error) {
      console.error("User search error:", error)
      res.status(500).json({
        success: false,
        message: "Search failed",
        error: error.message
      })
    }
  }
)

// @route   GET /api/users/suggestions
// @desc    Get user suggestions for autocomplete
// @access  Private
router.get("/suggestions",
  auth,
  [
    query("q")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Query must be at least 2 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Limit must be between 1 and 10")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        })
      }

      const { q, limit = 5 } = req.query
      const searchRegex = new RegExp(q, "i")

      const suggestions = await User.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { admissionNumber: searchRegex },
          { employeeId: searchRegex }
        ]
      })
      .select("name email admissionNumber employeeId profilePicture role")
      .limit(limit * 1)
      .sort({ name: 1 })
      .lean()

      const formattedSuggestions = suggestions.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        admissionNumber: user.admissionNumber || user.employeeId,
        profilePicture: user.profilePicture,
        role: user.role
      }))

      res.json({
        success: true,
        data: formattedSuggestions
      })

    } catch (error) {
      console.error("User suggestions error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to get suggestions",
        error: error.message
      })
    }
  }
)

// @route   GET /api/users/filters
// @desc    Get available filter options
// @access  Private
router.get("/filters", auth, async (req, res) => {
  try {
    // Get unique values for filters
    const [roles, branches, courses, departments] = await Promise.all([
      User.distinct("role", { isActive: true }),
      User.distinct("branch", { isActive: true, branch: { $ne: null } }),
      User.distinct("course", { isActive: true, course: { $ne: null } }),
      User.distinct("department", { isActive: true, department: { $ne: null } })
    ])

    res.json({
      success: true,
      data: {
        roles: roles.filter(Boolean), // Remove null/undefined values
        branches: branches.filter(Boolean),
        courses: courses.filter(Boolean),
        departments: departments.filter(Boolean)
      }
    })

  } catch (error) {
    console.error("Get filters error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get filter options",
      error: error.message
    })
  }
})

// Helper function to get semester suffix
function getSemesterSuffix(semester) {
  const suffixes = {
    1: "st", 2: "nd", 3: "rd", 4: "th", 5: "th", 6: "th", 7: "th", 8: "th"
  }
  return suffixes[semester] || "th"
}

// @route   GET /api/users/profile/:userId
// @desc    Get user profile
// @access  Private
router.get("/profile/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password -resetPasswordToken") // Exclude sensitive fields
      .lean()

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error("Get user profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message
    })
  }
})

module.exports = router
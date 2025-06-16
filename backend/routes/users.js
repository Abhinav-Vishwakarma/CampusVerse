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
    console.log(req.query)
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      let {
        role,
        course,
        branch,
        semester,
        section,
        search,
        page = 1,
        limit,
      } = req.query

      // Handle limit conversion
      if (limit && limit !== "all") {
        limit = parseInt(limit)
      } else {
        limit = null
      }

      // Strict filter
      const filter = { isActive: true }

      if (role) filter.role = role
      if (course) filter.course = course
      if (branch) filter.branch = branch
      if (section) filter.section = section
      if (semester) filter.semester = parseInt(semester)
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ]
      }

      // Debug filter
      console.log("MongoDB Filter:", filter)

      let query = User.find(filter)

      if (limit) {
        query = query.skip((page - 1) * limit).limit(limit)
      }

      const users = await query

      res.json({
        success: true,
        users,
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  }
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



// @route   POST /api/users
// @desc    Add a new user to the database
// @access  Private (Admin only, or relevant role who can add users)
router.post(
  "/", // You might want to change this to something like "/register" or "/add" if "/" is used for listing users
  [
    // Middleware for authentication and authorization
    auth,
    authorize("admin"), // Only admin can add users in this example

    // Input validation for required fields
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password")
      .optional() // Password is now optional
      .isLength({ min: 6 }) // But if provided, it must be at least 6 characters
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["student", "faculty", "admin"])
      .withMessage("Invalid role specified"),

    // Optional fields with conditional validation if needed (example for student/faculty specific fields)
    body("course").optional().isString(),
    body("branch").optional().isString(),
    body("semester").optional().isInt({ min: 1, max: 8 }),
    body("section").optional().isString(),
    body("department").optional().isString(),
    body("admissionNumber").optional().isString(),
    body("employeeId").optional().isString(),
    body("phone").optional().isString(),
  ],
  async (req, res) => {
    // Check for validation errors
    console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    let { // Use 'let' for password as it might be reassigned
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
    } = req.body;

    try {
      // Check if user with this email already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // --- Generate admissionNumber or employeeId if not provided ---

      if (role === "student" && !admissionNumber) {
        const branchPrefix = branch ? branch.substring(0, 2).toUpperCase() : 'UN';
        admissionNumber = `<span class="math-inline">\{branchPrefix\}</span>{new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      }
      // for admin
      if (role === "admin" && employeeId === "") {
        employeeId = `ADM${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(5, "0")}`;
      }

      // for faculty
      if (role === "faculty" && employeeId === "") {
        employeeId = `FAC${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(5, "0")}`;
      }



      // --- Default password if not provided in the request body ---
      if (!password) {
        if (role === "student" && admissionNumber) {
          password = admissionNumber;
        } else if ((role === "faculty" || role === "admin") && employeeId) {
          password = employeeId;
        } else {
          // If password is not provided and a default cannot be determined (e.g., for 'admin' role)
          return res.status(400).json({
            success: false,
            message: "Password is required for this role or could not be defaulted.",
          });
        }
      }



      // Prepare user data object
      const userData = {
        name,
        email,
        password,
        role,
        phone,
      };

      // Add role-specific fields (using the potentially generated IDs)
      if (role === "student") {
        userData.course = course;
        userData.branch = branch;
        userData.semester = semester;
        userData.section = section;
        userData.admissionNumber = admissionNumber;
      } else if (role === "faculty") {
        userData.department = department;
        userData.employeeId = employeeId;
      }

      // Create a new User instance
      user = new User(userData);

      // Save the user to the database
      await user.save();



      // Respond with success message, token, and user details
      res.status(201).json({
        success: true,
        message: "User added successfully",

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
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error("Error adding user:", err.message);
      res.status(500).json({
        success: false,
        message: "Server error during user creation",
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      })
    }

    // Soft delete by setting isActive to false
    // user.isActive = false
    // await user.save()

    // Alternative: Hard delete
    await user.deleteOne()

    res.json({
      success: true,
      message: "User deleted successfully"
    })

  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    })
  }
})

// @route   PUT /api/users/:id
// @desc    Update user details
// @access  Private (Admin only)
router.put("/:id",
  [
    auth,
    authorize("admin"),
    // Validation middleware
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Please include a valid email"),
    body("role").optional().isIn(["student", "faculty", "admin"]).withMessage("Invalid role"),
    body("course").optional().isString(),
    body("branch").optional().isString(),
    body("semester").optional().isInt({ min: 1, max: 8 }),
    body("section").optional().isString(),
    body("department").optional().isString(),
    body("phone").optional().matches(/^[0-9]{10}$/).withMessage("Phone must be 10 digits"),
  ],
  async (req, res) => {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array()
        });
      }

      // Find user
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Prevent email duplication
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Email already in use"
          });
        }
      }

      // Update user fields
      const updateFields = {
        ...req.body,
        updatedAt: Date.now()
      };

      // Remove sensitive/immutable fields
      delete updateFields.password;
      delete updateFields.resetPasswordToken;
      delete updateFields.resetPasswordExpire;

      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select("-password -resetPasswordToken -resetPasswordExpire");

      res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser
      });

    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user",
        error: error.message
      });
    }
  }
);

module.exports = router
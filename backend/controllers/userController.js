import User from "../models/User.js"
import Course from "../models/Course.js"
import Attendance from "../models/Attendance.js"

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 10 } = req.query

    const query = {}
    if (role) query.role = role
    if (department) query.department = department

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await User.countDocuments(query)

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password")

    res.json(updatedUser)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    await User.findByIdAndDelete(req.params.id)

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id
    const userRole = req.user.role

    let stats = {}

    if (userRole === "student") {
      // Get enrolled courses
      const enrolledCourses = await Course.find({ students: userId }).countDocuments()

      // Get attendance stats
      const totalAttendance = await Attendance.find({ student: userId }).countDocuments()
      const presentAttendance = await Attendance.find({
        student: userId,
        status: "present",
      }).countDocuments()

      const attendancePercentage = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0

      stats = {
        enrolledCourses,
        totalClasses: totalAttendance,
        attendedClasses: presentAttendance,
        attendancePercentage: Math.round(attendancePercentage),
      }
    } else if (userRole === "faculty") {
      // Get courses taught
      const coursesTaught = await Course.find({ faculty: userId }).countDocuments()

      // Get total students across all courses
      const courses = await Course.find({ faculty: userId })
      const totalStudents = courses.reduce((sum, course) => sum + course.students.length, 0)

      stats = {
        coursesTaught,
        totalStudents,
      }
    } else if (userRole === "admin") {
      // Get overall stats
      const totalUsers = await User.countDocuments()
      const totalStudents = await User.countDocuments({ role: "student" })
      const totalFaculty = await User.countDocuments({ role: "faculty" })
      const totalCourses = await Course.countDocuments()

      stats = {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalCourses,
      }
    }

    res.json(stats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { getUsers, getUserById, updateUser, deleteUser, getDashboardStats }

const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Attendance = require("../models/Attendance")
const Course = require("../models/Course")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/attendance
// @desc    Get attendance records with filters
// @access  Private
router.get(
  "/",
  [
    auth,
    query("course").optional().isMongoId(),
    query("student").optional().isMongoId(),
    query("date").optional().isISO8601(),
    query("status").optional().isIn(["present", "absent", "late"]),
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

      const { course, student, date, status, page = 1, limit = 10 } = req.query

      // Build filter object
      const filter = {}
      if (course) filter.course = course
      if (student) filter.student = student
      if (date) filter.date = new Date(date)
      if (status) filter.status = status

      // Role-based filtering
      if (req.user.role === "student") {
        filter.student = req.user.id
      } else if (req.user.role === "faculty") {
        filter.markedBy = req.user.id
      }

      const attendanceRecords = await Attendance.find(filter)
        .populate("student", "name email admissionNumber")
        .populate("course", "name code")
        .populate("markedBy", "name email")
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .sort({ date: -1 })

      const total = await Attendance.countDocuments(filter)

      res.json({
        success: true,
        records: attendanceRecords || [],
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      })
    } catch (error) {
      console.error("Get attendance error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   POST /api/attendance
// @desc    Mark attendance
// @access  Private (Faculty/Admin)
router.post(
  "/",
  [
    auth,
    authorize("faculty", "admin"),
    body("course").isMongoId().withMessage("Valid course ID is required"),
    body("students").isArray({ min: 1 }).withMessage("Students array is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("topic").notEmpty().withMessage("Topic is required"),
    body("lecture").isInt({ min: 1 }).withMessage("Valid lecture number is required"),
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

      const { course, students, date, topic, lecture } = req.body

      // Validate course exists
      const courseExists = await Course.findById(course)
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        })
      }

      const attendanceDate = new Date(date)
      const attendanceRecords = []

      // Create attendance records for each student
      for (const studentData of students) {
        const { studentId, status } = studentData

        // Check if attendance already exists for this student, course, and date
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          course,
          date: attendanceDate,
        })

        if (existingAttendance) {
          // Update existing attendance
          existingAttendance.status = status
          existingAttendance.topic = topic
          existingAttendance.lecture = lecture
          existingAttendance.markedBy = req.user.id
          await existingAttendance.save()
          attendanceRecords.push(existingAttendance)
        } else {
          // Create new attendance record
          const attendanceRecord = new Attendance({
            student: studentId,
            course,
            date: attendanceDate,
            status,
            topic,
            lecture,
            markedBy: req.user.id,
          })
          await attendanceRecord.save()
          attendanceRecords.push(attendanceRecord)
        }
      }

      res.status(201).json({
        success: true,
        message: "Attendance marked successfully",
        records: attendanceRecords,
      })
    } catch (error) {
      console.error("Mark attendance error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Faculty/Admin)
router.put("/:id", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      })
    }

    const { status, topic, lecture } = req.body

    if (status) attendance.status = status
    if (topic) attendance.topic = topic
    if (lecture) attendance.lecture = lecture

    await attendance.save()
    await attendance.populate("student", "name email admissionNumber")
    await attendance.populate("course", "name code")

    res.json({
      success: true,
      message: "Attendance updated successfully",
      record: attendance,
    })
  } catch (error) {
    console.error("Update attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/attendance/students/:studentId/attendance
// @desc    Get student attendance with statistics
// @access  Private
router.get("/students/:studentId/attendance", auth, async (req, res) => {
  try {
    const { studentId } = req.params
    const { courseId } = req.query

    // Check access permissions
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const filter = { student: studentId }
    if (courseId) filter.course = courseId

    const records = await Attendance.find(filter)
      .populate("course", "name code")
      .populate("markedBy", "name email")
      .sort({ date: -1 })

    // Calculate statistics
    const totalClasses = records.length
    const presentClasses = records.filter((r) => r.status === "present" || r.status === "late").length
    const absentClasses = records.filter((r) => r.status === "absent").length
    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

    // Group by course if no specific course requested
    const courseWiseStats = {}
    if (!courseId) {
      for (const record of records) {
        const courseId = record.course._id.toString()
        if (!courseWiseStats[courseId]) {
          courseWiseStats[courseId] = {
            course: record.course,
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0,
            percentage: 0,
          }
        }
        courseWiseStats[courseId].totalClasses++
        if (record.status === "present" || record.status === "late") {
          courseWiseStats[courseId].presentClasses++
        } else {
          courseWiseStats[courseId].absentClasses++
        }
      }

      // Calculate percentages
      for (const courseId in courseWiseStats) {
        const stats = courseWiseStats[courseId]
        stats.percentage = stats.totalClasses > 0 ? Math.round((stats.presentClasses / stats.totalClasses) * 100) : 0
      }
    }

    res.json({
      success: true,
      records: records || [],
      stats: {
        totalClasses,
        presentClasses,
        absentClasses,
        percentage,
      },
      courseWiseStats: Object.values(courseWiseStats),
    })
  } catch (error) {
    console.error("Get student attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/attendance/courses/:courseId/attendance
// @desc    Get course attendance statistics
// @access  Private (Faculty/Admin)
router.get("/courses/:courseId/attendance", [auth, authorize("faculty", "admin")], async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findById(courseId).populate("students", "name email admissionNumber")
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      })
    }

    const records = await Attendance.find({ course: courseId })
      .populate("student", "name email admissionNumber")
      .sort({ date: -1 })

    // Calculate student-wise statistics
    const studentStats = {}
    for (const student of course.students) {
      const studentId = student._id.toString()
      const studentRecords = records.filter((r) => r.student._id.toString() === studentId)
      const totalClasses = studentRecords.length
      const presentClasses = studentRecords.filter((r) => r.status === "present" || r.status === "late").length
      const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

      studentStats[studentId] = {
        student,
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        percentage,
      }
    }

    // Overall course statistics
    const totalRecords = records.length
    const totalPresent = records.filter((r) => r.status === "present" || r.status === "late").length
    const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

    res.json({
      success: true,
      course: {
        name: course.name,
        code: course.code,
      },
      records: records || [],
      studentStats: Object.values(studentStats),
      overallStats: {
        totalRecords,
        totalPresent,
        totalAbsent: totalRecords - totalPresent,
        overallPercentage,
      },
    })
  } catch (error) {
    console.error("Get course attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/attendance/calculate-needed
// @desc    Calculate needed classes for target percentage
// @access  Private (Student)
router.post(
  "/calculate-needed",
  [
    auth,
    authorize("student"),
    body("courseId").isMongoId().withMessage("Valid course ID is required"),
    body("targetPercentage").isInt({ min: 1, max: 100 }).withMessage("Valid target percentage is required"),
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

      const { courseId, targetPercentage } = req.body

      const records = await Attendance.find({
        student: req.user.id,
        course: courseId,
      })

      const totalClasses = records.length
      const presentClasses = records.filter((r) => r.status === "present" || r.status === "late").length
      const currentPercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0

      let classesNeeded = 0
      let canSkip = 0

      if (currentPercentage < targetPercentage) {
        // Calculate classes needed to reach target
        // (presentClasses + x) / (totalClasses + x) = targetPercentage / 100
        // Solving for x: x = (targetPercentage * totalClasses - 100 * presentClasses) / (100 - targetPercentage)
        classesNeeded = Math.ceil((targetPercentage * totalClasses - 100 * presentClasses) / (100 - targetPercentage))
      } else if (currentPercentage > targetPercentage) {
        // Calculate how many classes can be skipped while maintaining target
        // (presentClasses) / (totalClasses + x) = targetPercentage / 100
        // Solving for x: x = (100 * presentClasses) / targetPercentage - totalClasses
        canSkip = Math.floor((100 * presentClasses) / targetPercentage - totalClasses)
      }

      res.json({
        success: true,
        currentStats: {
          totalClasses,
          presentClasses,
          currentPercentage: Math.round(currentPercentage),
        },
        calculation: {
          targetPercentage,
          classesNeeded: Math.max(0, classesNeeded),
          canSkip: Math.max(0, canSkip),
          message:
            currentPercentage < targetPercentage
              ? `You need to attend ${classesNeeded} more classes to reach ${targetPercentage}%`
              : currentPercentage > targetPercentage
                ? `You can skip ${canSkip} classes and still maintain ${targetPercentage}%`
                : `You are exactly at ${targetPercentage}%`,
        },
      })
    } catch (error) {
      console.error("Calculate needed classes error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
// @access  Private (Admin/Faculty)
router.get("/stats", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const totalRecords = await Attendance.countDocuments()
    const presentRecords = await Attendance.countDocuments({
      status: { $in: ["present", "late"] },
    })
    const absentRecords = await Attendance.countDocuments({ status: "absent" })

    const overallPercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

    // Get recent attendance trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRecords = await Attendance.find({
      date: { $gte: thirtyDaysAgo },
    })

    const dailyStats = {}
    for (const record of recentRecords) {
      const dateKey = record.date.toISOString().split("T")[0]
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { total: 0, present: 0 }
      }
      dailyStats[dateKey].total++
      if (record.status === "present" || record.status === "late") {
        dailyStats[dateKey].present++
      }
    }

    const trends = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      percentage: Math.round((stats.present / stats.total) * 100),
      total: stats.total,
      present: stats.present,
    }))

    res.json({
      success: true,
      stats: {
        totalRecords,
        presentRecords,
        absentRecords,
        overallPercentage,
      },
      trends: trends.sort((a, b) => new Date(a.date) - new Date(b.date)),
    })
  } catch (error) {
    console.error("Get attendance stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router

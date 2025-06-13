import Attendance from "../models/Attendance.js"
import Course from "../models/Course.js"
import User from "../models/User.js"
import { calculateAttendancePercentage, calculateClassesNeeded } from "../utils/helpers.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Mark attendance for students
// @route   POST /api/attendance
// @access  Private/Faculty
const markAttendance = async (req, res) => {
  try {
    const { courseId, date, attendanceData } = req.body

    if (!courseId || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is authorized for this course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to mark attendance for this course" })
    }

    // Increment total classes for the course
    course.totalClasses += 1
    await course.save()

    // Process attendance data
    const attendanceRecords = []
    const absentStudents = []

    for (const record of attendanceData) {
      const { studentId, status } = record

      // Check if student exists
      const student = await User.findById(studentId)
      if (!student) {
        continue
      }

      // Create or update attendance record
      const attendanceRecord = await Attendance.findOneAndUpdate(
        {
          student: studentId,
          course: courseId,
          date: new Date(date),
        },
        {
          status,
          markedBy: req.user._id,
        },
        { new: true, upsert: true },
      )

      attendanceRecords.push(attendanceRecord)

      // Track absent students for notification
      if (status === "absent") {
        absentStudents.push(student._id)
      }
    }

    // Send notification to absent students
    if (absentStudents.length > 0) {
      await sendNotification({
        title: "Absence Recorded",
        message: `You were marked absent for ${course.name} (${course.code}) on ${new Date(date).toLocaleDateString()}`,
        type: "warning",
        sender: req.user._id,
        recipients: "specific-users",
        specificUsers: absentStudents,
        relatedTo: {
          model: "Course",
          id: course._id,
        },
        sentVia: ["app"],
      })
    }

    res.status(201).json({
      message: "Attendance marked successfully",
      attendanceRecords,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get attendance for a course
// @route   GET /api/attendance/course/:courseId
// @access  Private/Faculty
const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params
    const { date } = req.query

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Build query
    const query = { course: courseId }
    if (date) {
      query.date = new Date(date)
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate("student", "name email studentId")
      .sort({ date: -1 })

    res.json(attendanceRecords)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get student attendance for a course
// @route   GET /api/attendance/student/:studentId/course/:courseId
// @access  Private
const getStudentCourseAttendance = async (req, res) => {
  try {
    const { studentId, courseId } = req.params

    // Check if student exists
    const student = await User.findById(studentId)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check authorization
    if (req.user.role !== "admin" && req.user.role !== "faculty" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: "Not authorized to view this attendance" })
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: studentId,
      course: courseId,
    }).sort({ date: -1 })

    // Calculate attendance percentage
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length
    const totalClasses = course.totalClasses
    const percentage = calculateAttendancePercentage(presentCount, totalClasses)

    res.json({
      studentId,
      courseId,
      courseName: course.name,
      courseCode: course.code,
      attendanceRecords,
      summary: {
        presentCount,
        totalClasses,
        percentage,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Calculate classes needed to reach target percentage
// @route   GET /api/attendance/calculate-needed
// @access  Private
const calculateNeededClasses = async (req, res) => {
  try {
    const { studentId, courseId, targetPercentage } = req.query

    if (!studentId || !courseId || !targetPercentage) {
      return res.status(400).json({ message: "Missing required parameters" })
    }

    // Check if student exists
    const student = await User.findById(studentId)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: studentId,
      course: courseId,
    })

    // Calculate current attendance
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length
    const totalClasses = course.totalClasses
    const currentPercentage = calculateAttendancePercentage(presentCount, totalClasses)

    // Calculate classes needed
    const classesNeeded = calculateClassesNeeded(presentCount, totalClasses, Number.parseFloat(targetPercentage))

    res.json({
      studentId,
      courseId,
      courseName: course.name,
      courseCode: course.code,
      currentAttendance: {
        presentCount,
        totalClasses,
        percentage: currentPercentage,
      },
      targetPercentage: Number.parseFloat(targetPercentage),
      classesNeeded,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Faculty
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Check if attendance record exists
    const attendanceRecord = await Attendance.findById(id)
    if (!attendanceRecord) {
      return res.status(404).json({ message: "Attendance record not found" })
    }

    // Check if course exists
    const course = await Course.findById(attendanceRecord.course)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is authorized for this course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update attendance for this course" })
    }

    // Update attendance record
    attendanceRecord.status = status
    attendanceRecord.markedBy = req.user._id
    await attendanceRecord.save()

    res.json({
      message: "Attendance updated successfully",
      attendanceRecord,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { markAttendance, getCourseAttendance, getStudentCourseAttendance, calculateNeededClasses, updateAttendance }

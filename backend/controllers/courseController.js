import Course from "../models/Course.js"
import User from "../models/User.js"
import Attendance from "../models/Attendance.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Faculty
const createCourse = async (req, res) => {
  try {
    const { name, code, description, semester, branch, syllabus } = req.body

    // Check if course code already exists
    const courseExists = await Course.findOne({ code })

    if (courseExists) {
      return res.status(400).json({ message: "Course with this code already exists" })
    }

    // Create course with faculty as creator
    const course = await Course.create({
      name,
      code,
      description,
      semester,
      branch,
      faculty: req.user._id,
      syllabus,
    })

    if (course) {
      // Send notification about new course
      await sendNotification({
        title: "New Course Added",
        message: `A new course "${name}" (${code}) has been added for ${branch} - Semester ${semester}`,
        type: "info",
        sender: req.user._id,
        recipients: "students",
        relatedTo: {
          model: "Course",
          id: course._id,
        },
        sentVia: ["app"],
      })

      res.status(201).json(course)
    } else {
      res.status(400).json({ message: "Invalid course data" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const { semester, branch } = req.query

    const filter = {}

    if (semester) filter.semester = semester
    if (branch) filter.branch = branch

    // If user is a student, only show courses for their semester and branch
    if (req.user.role === "student") {
      filter.semester = req.user.semester
      filter.branch = req.user.branch
    }

    const courses = await Course.find(filter).populate("faculty", "name email").sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("faculty", "name email")
      .populate("students", "name email studentId")

    if (course) {
      res.json(course)
    } else {
      res.status(404).json({ message: "Course not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Faculty
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is the creator of the course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this course" })
    }

    course.name = req.body.name || course.name
    course.description = req.body.description || course.description
    course.semester = req.body.semester || course.semester
    course.branch = req.body.branch || course.branch
    course.syllabus = req.body.syllabus || course.syllabus

    const updatedCourse = await course.save()

    res.json(updatedCourse)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    await course.deleteOne()

    // Delete all attendance records for this course
    await Attendance.deleteMany({ course: req.params.id })

    res.json({ message: "Course removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Add students to course
// @route   POST /api/courses/:id/students
// @access  Private/Faculty
const addStudentsToCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is the creator of the course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this course" })
    }

    const { studentIds } = req.body

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: "Student IDs are required" })
    }

    // Find students by their IDs
    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
    })

    if (students.length === 0) {
      return res.status(404).json({ message: "No valid students found" })
    }

    // Add students to course
    for (const student of students) {
      if (!course.students.includes(student._id)) {
        course.students.push(student._id)
      }
    }

    await course.save()

    // Send notification to added students
    await sendNotification({
      title: "Added to Course",
      message: `You have been added to the course "${course.name}" (${course.code})`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: students.map((student) => student._id),
      relatedTo: {
        model: "Course",
        id: course._id,
      },
      sentVia: ["app", "email"],
    })

    res.json({ message: "Students added to course", course })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Remove student from course
// @route   DELETE /api/courses/:id/students/:studentId
// @access  Private/Faculty
const removeStudentFromCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is the creator of the course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this course" })
    }

    // Remove student from course
    course.students = course.students.filter((studentId) => studentId.toString() !== req.params.studentId)

    await course.save()

    res.json({ message: "Student removed from course", course })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addStudentsToCourse,
  removeStudentFromCourse,
}

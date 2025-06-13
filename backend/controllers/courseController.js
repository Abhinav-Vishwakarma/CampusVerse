import Course from "../models/Course.js"
import { uploadFile } from "../services/googleDriveService.js"

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const { semester, branch, page = 1, limit = 10 } = req.query

    const query = {}
    if (semester) query.semester = semester
    if (branch) query.branch = branch

    // If user is a student, only show courses they're enrolled in
    if (req.user.role === "student") {
      query.students = req.user._id
    }

    const courses = await Course.find(query)
      .populate("faculty", "name email")
      .populate("students", "name email studentId")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Course.countDocuments(query)

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
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

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Faculty/Admin
const createCourse = async (req, res) => {
  try {
    const { name, code, description, semester, branch, students } = req.body

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code })
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists" })
    }

    const course = await Course.create({
      name,
      code,
      description,
      semester,
      branch,
      faculty: req.user._id,
      students: students || [],
    })

    const populatedCourse = await Course.findById(course._id)
      .populate("faculty", "name email")
      .populate("students", "name email studentId")

    res.status(201).json(populatedCourse)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Faculty/Admin
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if user is authorized to update this course
    if (req.user.role !== "admin" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this course" })
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("faculty", "name email")
      .populate("students", "name email studentId")

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

    await Course.findByIdAndDelete(req.params.id)

    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll
// @access  Private/Student
const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if student is already enrolled
    if (course.students.includes(req.user._id)) {
      return res.status(400).json({ message: "Already enrolled in this course" })
    }

    course.students.push(req.user._id)
    await course.save()

    const updatedCourse = await Course.findById(course._id)
      .populate("faculty", "name email")
      .populate("students", "name email studentId")

    res.json(updatedCourse)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Upload course material
// @route   POST /api/courses/:id/materials
// @access  Private/Faculty
const uploadCourseMaterial = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if user is authorized to upload materials
    if (req.user.role !== "admin" && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to upload materials for this course" })
    }

    const { title, file } = req.body

    // Upload file to Google Drive
    const uploadedFile = await uploadFile(req.user, file, title, "application/pdf")

    course.materials.push({
      title,
      fileUrl: uploadedFile.webViewLink,
    })

    await course.save()

    res.json(course)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, enrollInCourse, uploadCourseMaterial }

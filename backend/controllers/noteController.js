import Note from "../models/Note.js"
import PYQ from "../models/PYQ.js"
import Course from "../models/Course.js"
import { uploadFile } from "../services/googleDriveService.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Upload a new note
// @route   POST /api/notes
// @access  Private/Faculty
const uploadNote = async (req, res) => {
  try {
    const { title, content, courseId, semester, branch, tags } = req.body

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is authorized for this course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to upload notes for this course" })
    }

    let fileUrl = null

    // Process file upload if provided
    if (req.file) {
      // Check if user has Google Drive auth
      if (!req.user.googleDriveAuth || !req.user.googleDriveAuth.accessToken) {
        return res.status(400).json({
          message: "Google Drive authentication required for file upload",
        })
      }

      // Upload file to Google Drive
      const uploadResult = await uploadFile(
        req.user,
        req.file.buffer,
        `Note_${title}_${course.code}.pdf`,
        req.file.mimetype,
      )

      fileUrl = uploadResult.webViewLink
    }

    // Create note
    const note = await Note.create({
      title,
      content,
      fileUrl,
      course: courseId,
      semester,
      branch,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    })

    // Send notification to students
    await sendNotification({
      title: "New Note Available",
      message: `A new note "${title}" has been uploaded for ${course.name}`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: course.students,
      relatedTo: {
        model: "Course",
        id: course._id,
      },
      sentVia: ["app"],
    })

    res.status(201).json(note)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const { courseId, semester, branch, search } = req.query

    const filter = {}

    if (courseId) filter.course = courseId
    if (semester) filter.semester = semester
    if (branch) filter.branch = branch

    // Search in title or content
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    // If user is a student, only show notes for their semester and branch
    if (req.user.role === "student") {
      filter.semester = req.user.semester
      filter.branch = req.user.branch
    }

    const notes = await Note.find(filter)
      .populate("course", "name code")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })

    res.json(notes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate("course", "name code").populate("uploadedBy", "name email")

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    res.json(note)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private/Faculty
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    // Check if user is authorized to update
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this note" })
    }

    const { title, content, tags } = req.body

    // Update fields
    if (title) note.title = title
    if (content) note.content = content
    if (tags) note.tags = tags.split(",").map((tag) => tag.trim())

    // Process file upload if provided
    if (req.file) {
      // Check if user has Google Drive auth
      if (!req.user.googleDriveAuth || !req.user.googleDriveAuth.accessToken) {
        return res.status(400).json({
          message: "Google Drive authentication required for file upload",
        })
      }

      // Upload new file to Google Drive
      const uploadResult = await uploadFile(
        req.user,
        req.file.buffer,
        `Note_${note.title}_Updated.pdf`,
        req.file.mimetype,
      )

      note.fileUrl = uploadResult.webViewLink
    }

    const updatedNote = await note.save()

    res.json(updatedNote)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private/Faculty/Admin
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    // Check if user is authorized to delete
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this note" })
    }

    await note.deleteOne()

    res.json({ message: "Note removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Upload a new PYQ
// @route   POST /api/notes/pyq
// @access  Private/Faculty
const uploadPYQ = async (req, res) => {
  try {
    const { title, courseId, examType, year, semester, branch } = req.body

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if faculty is authorized for this course
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to upload PYQ for this course" })
    }

    // File is required for PYQ
    if (!req.file) {
      return res.status(400).json({ message: "File is required for PYQ upload" })
    }

    // Check if user has Google Drive auth
    if (!req.user.googleDriveAuth || !req.user.googleDriveAuth.accessToken) {
      return res.status(400).json({
        message: "Google Drive authentication required for file upload",
      })
    }

    // Upload file to Google Drive
    const uploadResult = await uploadFile(
      req.user,
      req.file.buffer,
      `PYQ_${title}_${course.code}_${year}.pdf`,
      req.file.mimetype,
    )

    // Create PYQ
    const pyq = await PYQ.create({
      title,
      fileUrl: uploadResult.webViewLink,
      course: courseId,
      examType,
      year,
      semester,
      branch,
      uploadedBy: req.user._id,
    })

    // Send notification to students
    await sendNotification({
      title: "New PYQ Available",
      message: `A new previous year question paper "${title}" has been uploaded for ${course.name}`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: course.students,
      relatedTo: {
        model: "Course",
        id: course._id,
      },
      sentVia: ["app"],
    })

    res.status(201).json(pyq)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all PYQs
// @route   GET /api/notes/pyq
// @access  Private
const getPYQs = async (req, res) => {
  try {
    const { courseId, examType, year, semester, branch } = req.query

    const filter = {}

    if (courseId) filter.course = courseId
    if (examType) filter.examType = examType
    if (year) filter.year = year
    if (semester) filter.semester = semester
    if (branch) filter.branch = branch

    // If user is a student, only show PYQs for their semester and branch
    if (req.user.role === "student") {
      filter.semester = req.user.semester
      filter.branch = req.user.branch
    }

    const pyqs = await PYQ.find(filter)
      .populate("course", "name code")
      .populate("uploadedBy", "name email")
      .sort({ year: -1, createdAt: -1 })

    res.json(pyqs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get PYQ by ID
// @route   GET /api/notes/pyq/:id
// @access  Private
const getPYQById = async (req, res) => {
  try {
    const pyq = await PYQ.findById(req.params.id).populate("course", "name code").populate("uploadedBy", "name email")

    if (!pyq) {
      return res.status(404).json({ message: "PYQ not found" })
    }

    res.json(pyq)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete PYQ
// @route   DELETE /api/notes/pyq/:id
// @access  Private/Faculty/Admin
const deletePYQ = async (req, res) => {
  try {
    const pyq = await PYQ.findById(req.params.id)

    if (!pyq) {
      return res.status(404).json({ message: "PYQ not found" })
    }

    // Check if user is authorized to delete
    if (pyq.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this PYQ" })
    }

    await pyq.deleteOne()

    res.json({ message: "PYQ removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { uploadNote, getNotes, getNoteById, updateNote, deleteNote, uploadPYQ, getPYQs, getPYQById, deletePYQ }

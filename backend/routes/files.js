const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const File = require("../models/File")
const { body, validationResult } = require("express-validator")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Create uploads directory if it doesn't exist
const uploadsDir = "uploads"
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.type || "other"
    const uploadPath = path.join(uploadsDir, fileType)
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    const filename = file.fieldname + "-" + uniqueSuffix + extension
    cb(null, filename)
  }
})

// File filter for security
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    "assignment": [".pdf", ".doc", ".docx", ".txt", ".zip"],
    "note": [".pdf", ".doc", ".docx", ".txt", ".md"],
    "profile": [".jpg", ".jpeg", ".png", ".gif"],
    "resume": [".pdf", ".doc", ".docx"],
    "document": [".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx"],
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    "other": [".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".zip"]
  }
  
  const fileType = req.body.type || "other"
  const fileExtension = path.extname(file.originalname).toLowerCase()
  
  if (allowedTypes[fileType] && allowedTypes[fileType].includes(fileExtension)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${fileExtension} not allowed for ${fileType} uploads`), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
})

// @route   POST /api/files/upload
// @desc    Upload single file
// @access  Private
router.post("/upload", 
  auth,
  upload.single("file"),
  [
    body("type")
      .isIn(["assignment", "note", "profile", "resume", "document", "image", "other"])
      .withMessage("Invalid file type")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        })
      }

      // Create file record in database
      const fileRecord = new File({
        name: req.file.filename,
        originalName: req.file.originalname,
        type: req.body.type,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.body.type}/${req.file.filename}`,
        path: req.file.path,
        uploadedBy: req.user.id,
        relatedTo: req.body.relatedTo ? {
          model: req.body.relatedToModel,
          id: req.body.relatedTo
        } : undefined,
        metadata: {
          course: req.body.course || undefined,
          branch: req.body.branch || undefined,
          semester: req.body.semester ? parseInt(req.body.semester) : undefined,
          tags: req.body.tags ? req.body.tags.split(",").map(tag => tag.trim()) : []
        }
      })

      await fileRecord.save()

      res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          id: fileRecord._id,
          name: fileRecord.name,
          originalName: fileRecord.originalName,
          type: fileRecord.type,
          size: fileRecord.size,
          url: fileRecord.url,
          createdAt: fileRecord.createdAt
        }
      })

    } catch (error) {
      // Clean up uploaded file if database save fails
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }
      
      console.error("File upload error:", error)
      res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error.message
      })
    }
  }
)

// @route   POST /api/files/upload-multiple
// @desc    Upload multiple files
// @access  Private
router.post("/upload-multiple",
  auth,
  upload.array("files", 10), // Maximum 10 files
  [
    body("type")
      .isIn(["assignment", "note", "profile", "resume", "document", "image", "other"])
      .withMessage("Invalid file type")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          req.files.forEach(file => fs.unlinkSync(file.path))
        }
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array()
        })
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded"
        })
      }

      const uploadedFiles = []
      const failedFiles = []

      // Process each file
      for (const file of req.files) {
        try {
          const fileRecord = new File({
            name: file.filename,
            originalName: file.originalname,
            type: req.body.type,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/${req.body.type}/${file.filename}`,
            path: file.path,
            uploadedBy: req.user.id,
            relatedTo: req.body.relatedTo ? {
              model: req.body.relatedToModel,
              id: req.body.relatedTo
            } : undefined,
            metadata: {
              course: req.body.course || undefined,
              branch: req.body.branch || undefined,
              semester: req.body.semester ? parseInt(req.body.semester) : undefined,
              tags: req.body.tags ? req.body.tags.split(",").map(tag => tag.trim()) : []
            }
          })

          await fileRecord.save()
          uploadedFiles.push({
            id: fileRecord._id,
            name: fileRecord.name,
            originalName: fileRecord.originalName,
            type: fileRecord.type,
            size: fileRecord.size,
            url: fileRecord.url,
            createdAt: fileRecord.createdAt
          })
        } catch (error) {
          failedFiles.push({
            filename: file.originalname,
            error: error.message
          })
          // Clean up failed file
          fs.unlinkSync(file.path)
        }
      }

      res.json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: {
          uploaded: uploadedFiles,
          failed: failedFiles,
          total: req.files.length,
          successful: uploadedFiles.length
        }
      })

    } catch (error) {
      // Clean up all uploaded files if general error
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path))
      }
      
      console.error("Multiple file upload error:", error)
      res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error.message
      })
    }
  }
)

// @route   GET /api/files/:fileId
// @desc    Get metadata of a file
// @access  Private
router.get("/:fileId", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)
      .populate("uploadedBy", "name email")
      .populate("metadata.course", "name code")

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      })
    }

    // Check if user has access to this file
    // (You might want to implement more sophisticated access control)
    if (file.uploadedBy._id.toString() !== req.user.id && file.isActive) {
      // Allow access for now, but you can add role-based checks here
    }

    res.json({
      success: true,
      data: file
    })

  } catch (error) {
    console.error("Get file error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve file",
      error: error.message
    })
  }
})

// @route   GET /api/files/type/:type
// @desc    Get all files by type
// @access  Private
router.get("/type/:type", auth, async (req, res) => {
  try {
    const { type } = req.params
    const { page = 1, limit = 20, course, branch, semester } = req.query

    // Build query
    const query = {
      type: type,
      isActive: true
    }

    // Add filters if provided
    if (course) query["metadata.course"] = course
    if (branch) query["metadata.branch"] = branch
    if (semester) query["metadata.semester"] = parseInt(semester)

    const files = await File.find(query)
      .populate("uploadedBy", "name email")
      .populate("metadata.course", "name code")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-path") // Don't send file system path for security

    const total = await File.countDocuments(query)

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    })

  } catch (error) {
    console.error("Get files by type error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve files",
      error: error.message
    })
  }
})

// @route   DELETE /api/files/:fileId
// @desc    Delete a file
// @access  Private
router.delete("/:fileId", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      })
    }

    // Check if user owns the file or has admin privileges
    if (file.uploadedBy.toString() !== req.user.id) {
      // You might want to add role-based authorization here
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this file"
      })
    }

    // Delete file from filesystem
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }

    // Remove from database
    await File.findByIdAndDelete(req.params.fileId)

    res.json({
      success: true,
      message: "File deleted successfully"
    })

  } catch (error) {
    console.error("Delete file error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
      error: error.message
    })
  }
})

// @route   GET /api/files/download/:fileId
// @desc    Download a file
// @access  Private
router.get("/download/:fileId", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId)

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      })
    }

    if (!file.isActive) {
      return res.status(410).json({
        success: false,
        message: "File no longer available"
      })
    }

    // Check if file exists on filesystem
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      })
    }

    // Increment download counter
    await File.findByIdAndUpdate(req.params.fileId, {
      $inc: { downloads: 1 }
    })

    // Set appropriate headers
    res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`)
    res.setHeader("Content-Type", file.mimeType)

    // Send file
    res.sendFile(path.resolve(file.path))

  } catch (error) {
    console.error("Download file error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to download file",
      error: error.message
    })
  }
})

module.exports = router
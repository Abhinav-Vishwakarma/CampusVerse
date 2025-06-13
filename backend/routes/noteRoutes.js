import express from "express"
import multer from "multer"
import {
  uploadNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  uploadPYQ,
  getPYQs,
  getPYQById,
  deletePYQ,
} from "../controllers/noteController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "text/plain"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only PDF, JPG, PNG, and TXT files are allowed"), false)
    }
  },
})

// All routes are protected
router.use(protect)

// Public routes (all authenticated users)
router.get("/", getNotes)
router.get("/:id", getNoteById)
router.get("/pyq", getPYQs)
router.get("/pyq/:id", getPYQById)

// Faculty and Admin routes
router.post("/", roleCheck("faculty", "admin"), upload.single("file"), uploadNote)
router.put("/:id", roleCheck("faculty", "admin"), upload.single("file"), updateNote)
router.delete("/:id", roleCheck("faculty", "admin"), deleteNote)
router.post("/pyq", roleCheck("faculty", "admin"), upload.single("file"), uploadPYQ)
router.delete("/pyq/:id", roleCheck("faculty", "admin"), deletePYQ)

export default router

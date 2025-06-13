import express from "express"
import multer from "multer"
import {
  createPlacement,
  getPlacements,
  getPlacementById,
  updatePlacement,
  deletePlacement,
  applyForPlacement,
  updateApplicantStatus,
  getPlacementStatistics,
} from "../controllers/placementController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"), false)
    }
  },
})

// All routes are protected
router.use(protect)

// Public routes (all authenticated users)
router.get("/", getPlacements)
router.get("/:id", getPlacementById)

// Student routes
router.post("/:id/apply", upload.single("resume"), applyForPlacement)

// Faculty and Admin routes
router.post("/", roleCheck("faculty", "admin"), createPlacement)
router.put("/:id", roleCheck("faculty", "admin"), updatePlacement)
router.put("/:id/applicants/:applicantId", roleCheck("faculty", "admin"), updateApplicantStatus)
router.get("/statistics", roleCheck("faculty", "admin"), getPlacementStatistics)

// Admin only routes
router.delete("/:id", roleCheck("admin"), deletePlacement)

export default router

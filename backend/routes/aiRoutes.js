import express from "express"
import {
  getAICredits,
  generateCareerRoadmap,
  generateAIResume,
  checkResumeATS,
  getAIUsageHistory,
  getAIStatistics,
} from "../controllers/aiController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// All authenticated users
router.get("/credits", getAICredits)
router.post("/roadmap", generateCareerRoadmap)
router.post("/resume", generateAIResume)
router.post("/ats-check", checkResumeATS)
router.get("/history", getAIUsageHistory)

// Admin only routes
router.get("/statistics", roleCheck("admin"), getAIStatistics)

export default router

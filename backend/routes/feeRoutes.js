import express from "express"
import {
  createFeeRecord,
  getFeeRecords,
  getStudentFeeRecords,
  getFeeById,
  updateFeeRecord,
  addPaymentTransaction,
  getOverdueFees,
  getFeeStatistics,
  deleteFeeRecord,
} from "../controllers/feeController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Student routes
router.get("/student", roleCheck("student"), getStudentFeeRecords)

// Admin only routes
router.post("/", roleCheck("admin"), createFeeRecord)
router.get("/", roleCheck("admin"), getFeeRecords)
router.put("/:id", roleCheck("admin"), updateFeeRecord)
router.post("/:id/payment", roleCheck("admin"), addPaymentTransaction)
router.get("/overdue", roleCheck("admin"), getOverdueFees)
router.get("/statistics", roleCheck("admin"), getFeeStatistics)
router.delete("/:id", roleCheck("admin"), deleteFeeRecord)

// All authenticated users (with proper authorization check in controller)
router.get("/:id", getFeeById)

export default router

import express from "express"
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
} from "../controllers/eventController.js"
import { protect } from "../middleware/auth.js"
import roleCheck from "../middleware/roleCheck.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Public routes (all authenticated users)
router.get("/", getEvents)
router.get("/:id", getEventById)
router.post("/:id/register", registerForEvent)

// Faculty and Admin routes
router.post("/", roleCheck("faculty", "admin"), createEvent)
router.put("/:id", roleCheck("faculty", "admin"), updateEvent)
router.delete("/:id", roleCheck("faculty", "admin"), deleteEvent)
router.get("/:id/registrations", roleCheck("faculty", "admin"), getEventRegistrations)

export default router

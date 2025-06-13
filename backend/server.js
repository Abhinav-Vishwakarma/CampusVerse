import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname } from "path"
import connectDB from "./config/db.js"
import { errorHandler, notFound } from "./middleware/errorHandler.js"

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Import routes
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import courseRoutes from "./routes/courseRoutes.js"
import attendanceRoutes from "./routes/attendanceRoutes.js"
import eventRoutes from "./routes/eventRoutes.js"
import placementRoutes from "./routes/placementRoutes.js"
import quizRoutes from "./routes/quizRoutes.js"
import noteRoutes from "./routes/noteRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import feeRoutes from "./routes/feeRoutes.js"

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/placements", placementRoutes)
app.use("/api/quiz", quizRoutes)
app.use("/api/notes", noteRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/fees", feeRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    message: "Smart Campus Portal API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`)
  // Close server & exit process
  server.close(() => {
    process.exit(1)
  })
})

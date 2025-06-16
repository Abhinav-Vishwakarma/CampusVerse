const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const app = express()

// Security middleware
app.use(helmet())
const allowedOrigins = [
    'https://campus-verse-sandy.vercel.app',    
    'http://localhost:3000'
  ];
  
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin OR if origin is in the allowed list
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        const msg = 'CORS Error: Origin ' + origin + ' not allowed.';
        console.error(msg);
        callback(new Error(msg), false);
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization",
    optionsSuccessStatus: 200
  };
app.use(cors(corsOptions));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use("/api/", limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Static files
app.use("/uploads", express.static("uploads"))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/campusverse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/users"))
app.use("/api/courses", require("./routes/courses"))
app.use("/api/quizzes", require("./routes/quizzes"))
app.use("/api/attendance", require("./routes/attendance"))
app.use("/api/assignments", require("./routes/assignments"))
app.use("/api/fees", require("./routes/fees"))
app.use("/api/events", require("./routes/events"))
app.use("/api/placements", require("./routes/placements"))
app.use("/api/notes", require("./routes/notes"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/api/ai", require("./routes/ai"))
app.use("/api/analytics", require("./routes/analytics"))
app.use("/api/files", require("./routes/files"))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Healthy",
  })
})

// 404 handler (should be last)
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

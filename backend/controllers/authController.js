import User from "../models/User.js"
import AICredit from "../models/AICredit.js"
import generateToken from "../utils/generateToken.js"
import { sendEmail } from "../utils/emailService.js"
import { oauth2Client } from "../config/googleDrive.js"

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, facultyId, department, semester, branch } = req.body

    // Check if user already exists
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId,
      facultyId,
      department,
      semester,
      branch,
    })

    if (user) {
      // Initialize AI credits for the user
      await AICredit.create({
        user: user._id,
        totalCredits: 10,
        lastRefillDate: new Date(),
      })

      // Send welcome email
      await sendEmail(
        email,
        "Welcome to Smart Campus Portal",
        `Hi ${name}, welcome to Smart Campus Portal! Your account has been created successfully.`,
        `<h1>Welcome to Smart Campus Portal!</h1>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully.</p>
        <p>You can now log in to access all the features of the portal.</p>`,
      )

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      })
    } else {
      res.status(400).json({ message: "Invalid user data" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      })
    } else {
      res.status(401).json({ message: "Invalid email or password" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    if (user) {
      res.json(user)
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email

      if (req.body.password) {
        user.password = req.body.password
      }

      if (req.body.profilePicture) {
        user.profilePicture = req.body.profilePicture
      }

      const updatedUser = await user.save()

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        token: generateToken(updatedUser._id),
      })
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get Google Drive auth URL
// @route   GET /api/auth/google-drive
// @access  Private
const getGoogleDriveAuthUrl = async (req, res) => {
  try {
    const scopes = ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.appdata"]

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: req.user._id.toString(), // Pass user ID as state
    })

    res.json({ url })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Handle Google Drive auth callback
// @route   GET /api/auth/google-drive/callback
// @access  Public
const handleGoogleDriveCallback = async (req, res) => {
  try {
    const { code, state } = req.query

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code or state parameter" })
    }

    // Get tokens from Google
    const { tokens } = await oauth2Client.getToken(code)

    // Update user with tokens
    const user = await User.findByIdAndUpdate(
      state,
      {
        "googleDriveAuth.accessToken": tokens.access_token,
        "googleDriveAuth.refreshToken": tokens.refresh_token,
        "googleDriveAuth.expiryDate": tokens.expiry_date,
      },
      { new: true },
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL}/google-drive-success`)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { registerUser, loginUser, getUserProfile, updateUserProfile, getGoogleDriveAuthUrl, handleGoogleDriveCallback }

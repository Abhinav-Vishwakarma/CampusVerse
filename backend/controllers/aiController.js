import AICredit from "../models/AICredit.js"
import { generateRoadmap, generateResume, checkATSScore } from "../services/geminiService.js"
import { uploadFile } from "../services/googleDriveService.js"
import { sendNotification } from "../services/notificationService.js"

// @desc    Get user's AI credits
// @route   GET /api/ai/credits
// @access  Private
const getAICredits = async (req, res) => {
  try {
    let aiCredit = await AICredit.findOne({ user: req.user._id })

    if (!aiCredit) {
      // Create AI credit record if it doesn't exist
      aiCredit = await AICredit.create({
        user: req.user._id,
        totalCredits: 10,
        lastRefillDate: new Date(),
      })
    }

    // Check if daily refill is needed
    const now = new Date()
    const lastRefill = new Date(aiCredit.lastRefillDate)
    const daysDifference = Math.floor((now - lastRefill) / (1000 * 60 * 60 * 24))

    if (daysDifference >= 1) {
      // Refill credits to 10
      aiCredit.totalCredits = 10
      aiCredit.lastRefillDate = now
      aiCredit.transactions.push({
        action: "refill",
        creditsUsed: -10, // Negative value indicates credit addition
        description: "Daily credit refill",
      })
      await aiCredit.save()
    }

    res.json(aiCredit)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Generate career roadmap
// @route   POST /api/ai/roadmap
// @access  Private
const generateCareerRoadmap = async (req, res) => {
  try {
    const { skills, currentLevel, careerGoals, timeframe } = req.body

    // Check if required fields are provided
    if (!skills || !currentLevel || !careerGoals || !timeframe) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check AI credits
    const aiCredit = await AICredit.findOne({ user: req.user._id })
    if (!aiCredit || aiCredit.totalCredits < 3) {
      return res.status(400).json({ message: "Insufficient AI credits. You need 3 credits for roadmap generation." })
    }

    // Generate roadmap using Gemini AI
    const roadmapData = await generateRoadmap({
      skills,
      currentLevel,
      careerGoals,
      timeframe,
    })

    // Deduct credits
    aiCredit.totalCredits -= 3
    aiCredit.transactions.push({
      action: "roadmap",
      creditsUsed: 3,
      description: "Career roadmap generation",
    })
    await aiCredit.save()

    // Save roadmap to Google Drive if user has authentication
    let driveFileUrl = null
    if (req.user.googleDriveAuth && req.user.googleDriveAuth.accessToken) {
      try {
        const roadmapContent = `# Career Roadmap for ${req.user.name}\n\n${roadmapData.roadmap}`
        const uploadResult = await uploadFile(
          req.user,
          Buffer.from(roadmapContent, "utf8"),
          `Career_Roadmap_${req.user.name}_${new Date().toISOString().split("T")[0]}.md`,
          "text/markdown",
        )
        driveFileUrl = uploadResult.webViewLink
      } catch (driveError) {
        console.error("Error saving to Google Drive:", driveError)
        // Continue without saving to drive
      }
    }

    // Send notification
    await sendNotification({
      title: "Career Roadmap Generated",
      message: "Your personalized career roadmap has been generated successfully!",
      type: "success",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [req.user._id],
      sentVia: ["app"],
    })

    res.json({
      roadmap: roadmapData.roadmap,
      generatedAt: roadmapData.generatedAt,
      driveFileUrl,
      creditsRemaining: aiCredit.totalCredits,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Generate resume
// @route   POST /api/ai/resume
// @access  Private
const generateAIResume = async (req, res) => {
  try {
    const { name, email, phone, location, education, experience, skills, projects } = req.body

    // Check if required fields are provided
    if (!name || !email || !education || !skills) {
      return res.status(400).json({ message: "Name, email, education, and skills are required" })
    }

    // Check AI credits
    const aiCredit = await AICredit.findOne({ user: req.user._id })
    if (!aiCredit || aiCredit.totalCredits < 2) {
      return res.status(400).json({ message: "Insufficient AI credits. You need 2 credits for resume generation." })
    }

    // Generate resume using Gemini AI
    const resumeData = await generateResume({
      name,
      email,
      phone,
      location,
      education,
      experience: experience || [],
      skills,
      projects: projects || [],
    })

    // Deduct credits
    aiCredit.totalCredits -= 2
    aiCredit.transactions.push({
      action: "resume",
      creditsUsed: 2,
      description: "AI resume generation",
    })
    await aiCredit.save()

    // Save resume to Google Drive if user has authentication
    let driveFileUrl = null
    if (req.user.googleDriveAuth && req.user.googleDriveAuth.accessToken) {
      try {
        const uploadResult = await uploadFile(
          req.user,
          Buffer.from(resumeData.resumeContent, "utf8"),
          `Resume_${name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.md`,
          "text/markdown",
        )
        driveFileUrl = uploadResult.webViewLink
      } catch (driveError) {
        console.error("Error saving to Google Drive:", driveError)
        // Continue without saving to drive
      }
    }

    // Send notification
    await sendNotification({
      title: "Resume Generated",
      message: "Your AI-generated resume has been created successfully!",
      type: "success",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [req.user._id],
      sentVia: ["app"],
    })

    res.json({
      resumeContent: resumeData.resumeContent,
      generatedAt: resumeData.generatedAt,
      driveFileUrl,
      creditsRemaining: aiCredit.totalCredits,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Check ATS score
// @route   POST /api/ai/ats-check
// @access  Private
const checkResumeATS = async (req, res) => {
  try {
    const { resumeContent, jobDescription } = req.body

    // Check if required fields are provided
    if (!resumeContent || !jobDescription) {
      return res.status(400).json({ message: "Resume content and job description are required" })
    }

    // Check AI credits
    const aiCredit = await AICredit.findOne({ user: req.user._id })
    if (!aiCredit || aiCredit.totalCredits < 2) {
      return res.status(400).json({ message: "Insufficient AI credits. You need 2 credits for ATS checking." })
    }

    // Check ATS score using Gemini AI
    const atsData = await checkATSScore(resumeContent, jobDescription)

    // Deduct credits
    aiCredit.totalCredits -= 2
    aiCredit.transactions.push({
      action: "ats-check",
      creditsUsed: 2,
      description: "ATS score checking",
    })
    await aiCredit.save()

    // Save ATS report to Google Drive if user has authentication
    let driveFileUrl = null
    if (req.user.googleDriveAuth && req.user.googleDriveAuth.accessToken) {
      try {
        const reportContent = `# ATS Score Report for ${req.user.name}\n\n${JSON.stringify(atsData, null, 2)}`
        const uploadResult = await uploadFile(
          req.user,
          Buffer.from(reportContent, "utf8"),
          `ATS_Report_${req.user.name}_${new Date().toISOString().split("T")[0]}.md`,
          "text/markdown",
        )
        driveFileUrl = uploadResult.webViewLink
      } catch (driveError) {
        console.error("Error saving to Google Drive:", driveError)
        // Continue without saving to drive
      }
    }

    // Send notification
    await sendNotification({
      title: "ATS Score Report Ready",
      message: "Your resume ATS compatibility report has been generated!",
      type: "success",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [req.user._id],
      sentVia: ["app"],
    })

    res.json({
      ...atsData,
      driveFileUrl,
      creditsRemaining: aiCredit.totalCredits,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get AI usage history
// @route   GET /api/ai/history
// @access  Private
const getAIUsageHistory = async (req, res) => {
  try {
    const aiCredit = await AICredit.findOne({ user: req.user._id })

    if (!aiCredit) {
      return res.json({ transactions: [] })
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = aiCredit.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({
      totalCredits: aiCredit.totalCredits,
      lastRefillDate: aiCredit.lastRefillDate,
      transactions: sortedTransactions,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Admin: Get AI usage statistics
// @route   GET /api/ai/statistics
// @access  Private/Admin
const getAIStatistics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view AI statistics" })
    }

    // Get all AI credit records
    const aiCredits = await AICredit.find({}).populate("user", "name email role")

    // Calculate statistics
    const totalUsers = aiCredits.length
    let totalCreditsUsed = 0
    const actionStats = {
      roadmap: 0,
      resume: 0,
      "ats-check": 0,
    }

    for (const aiCredit of aiCredits) {
      for (const transaction of aiCredit.transactions) {
        if (transaction.creditsUsed > 0) {
          // Only count credit usage, not refills
          totalCreditsUsed += transaction.creditsUsed
          if (actionStats[transaction.action] !== undefined) {
            actionStats[transaction.action]++
          }
        }
      }
    }

    res.json({
      totalUsers,
      totalCreditsUsed,
      actionStats,
      averageCreditsPerUser: totalUsers > 0 ? totalCreditsUsed / totalUsers : 0,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export { getAICredits, generateCareerRoadmap, generateAIResume, checkResumeATS, getAIUsageHistory, getAIStatistics }

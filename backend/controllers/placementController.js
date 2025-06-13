import Placement from "../models/Placement.js"
import User from "../models/User.js"
import { sendNotification } from "../services/notificationService.js"
import { uploadFile } from "../services/googleDriveService.js"

// @desc    Create a new placement opportunity
// @route   POST /api/placements
// @access  Private/Admin/Faculty
const createPlacement = async (req, res) => {
  try {
    const {
      company,
      role,
      packageValue,
      location,
      eligibilityCriteria,
      applicationDeadline,
      driveDate,
      description,
      status,
    } = req.body

    // Create placement opportunity
    const placement = await Placement.create({
      company,
      role,
      packageValue,
      location,
      eligibilityCriteria,
      applicationDeadline,
      driveDate,
      description,
      status,
      createdBy: req.user._id,
    })

    if (placement) {
      // Send notification about new placement opportunity
      await sendNotification({
        title: "New Placement Opportunity",
        message: `${company} is hiring for ${role} with package ${packageValue} LPA`,
        type: "info",
        sender: req.user._id,
        recipients: "students",
        relatedTo: {
          model: "Placement",
          id: placement._id,
        },
        sentVia: ["app", "email"],
      })

      res.status(201).json(placement)
    } else {
      res.status(400).json({ message: "Invalid placement data" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get all placement opportunities
// @route   GET /api/placements
// @access  Private
const getPlacements = async (req, res) => {
  try {
    const { status, company } = req.query

    const filter = {}

    if (status) filter.status = status
    if (company) filter.company = { $regex: company, $options: "i" }

    // If user is a student, filter by eligibility
    if (req.user.role === "student") {
      const student = await User.findById(req.user._id)

      filter.$or = [
        { "eligibilityCriteria.branches": { $in: [student.branch] } },
        { "eligibilityCriteria.branches": { $size: 0 } }, // Empty array means all branches
      ]

      // Filter by CGPA if specified
      if (student.cgpa) {
        filter.$or.push({
          $or: [
            { "eligibilityCriteria.cgpa": { $lte: student.cgpa } },
            { "eligibilityCriteria.cgpa": { $exists: false } },
          ],
        })
      }
    }

    const placements = await Placement.find(filter).populate("createdBy", "name email").sort({ applicationDeadline: 1 })

    res.json(placements)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get placement by ID
// @route   GET /api/placements/:id
// @access  Private
const getPlacementById = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("applicants.student", "name email studentId")

    if (placement) {
      res.json(placement)
    } else {
      res.status(404).json({ message: "Placement opportunity not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update placement opportunity
// @route   PUT /api/placements/:id
// @access  Private/Admin/Faculty
const updatePlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)

    if (!placement) {
      return res.status(404).json({ message: "Placement opportunity not found" })
    }

    // Check if user is authorized to update
    if (placement.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this placement" })
    }

    const {
      company,
      role,
      packageValue,
      location,
      eligibilityCriteria,
      applicationDeadline,
      driveDate,
      description,
      status,
    } = req.body

    // Update fields
    if (company) placement.company = company
    if (role) placement.role = role
    if (packageValue) placement.packageValue = packageValue
    if (location) placement.location = location
    if (eligibilityCriteria) placement.eligibilityCriteria = eligibilityCriteria
    if (applicationDeadline) placement.applicationDeadline = applicationDeadline
    if (driveDate) placement.driveDate = driveDate
    if (description) placement.description = description
    if (status) placement.status = status

    const updatedPlacement = await placement.save()

    // Send notification about updated placement
    if (status === "ongoing" || status === "upcoming") {
      await sendNotification({
        title: "Placement Opportunity Updated",
        message: `The placement opportunity for ${updatedPlacement.company} (${updatedPlacement.role}) has been updated`,
        type: "info",
        sender: req.user._id,
        recipients: "students",
        relatedTo: {
          model: "Placement",
          id: updatedPlacement._id,
        },
        sentVia: ["app"],
      })
    }

    res.json(updatedPlacement)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Delete placement opportunity
// @route   DELETE /api/placements/:id
// @access  Private/Admin
const deletePlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)

    if (!placement) {
      return res.status(404).json({ message: "Placement opportunity not found" })
    }

    // Only admin can delete placements
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete placements" })
    }

    await placement.deleteOne()

    res.json({ message: "Placement opportunity removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Apply for a placement opportunity
// @route   POST /api/placements/:id/apply
// @access  Private/Student
const applyForPlacement = async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)

    if (!placement) {
      return res.status(404).json({ message: "Placement opportunity not found" })
    }

    // Check if application deadline has passed
    if (new Date(placement.applicationDeadline) < new Date()) {
      return res.status(400).json({ message: "Application deadline has passed" })
    }

    // Check if already applied
    const alreadyApplied = placement.applicants.some(
      (applicant) => applicant.student.toString() === req.user._id.toString(),
    )

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied for this placement" })
    }

    // Check eligibility
    const student = await User.findById(req.user._id)

    // Check branch eligibility
    if (
      placement.eligibilityCriteria.branches &&
      placement.eligibilityCriteria.branches.length > 0 &&
      !placement.eligibilityCriteria.branches.includes(student.branch)
    ) {
      return res.status(400).json({ message: "Not eligible: Branch criteria not met" })
    }

    // Check CGPA eligibility
    if (placement.eligibilityCriteria.cgpa && (!student.cgpa || student.cgpa < placement.eligibilityCriteria.cgpa)) {
      return res.status(400).json({ message: "Not eligible: CGPA criteria not met" })
    }

    // Check backlog eligibility
    if (placement.eligibilityCriteria.backlogAllowed === false && student.backlog > 0) {
      return res.status(400).json({ message: "Not eligible: Backlog criteria not met" })
    }

    // Process resume upload if provided
    let resumeUrl = null
    if (req.file) {
      // Check if user has Google Drive auth
      if (!student.googleDriveAuth || !student.googleDriveAuth.accessToken) {
        return res.status(400).json({
          message: "Google Drive authentication required for resume upload",
        })
      }

      // Upload resume to Google Drive
      const uploadResult = await uploadFile(
        student,
        req.file.buffer,
        `Resume_${student.name}_${placement.company}.pdf`,
        "application/pdf",
      )

      resumeUrl = uploadResult.webViewLink
    }

    // Add student to applicants
    placement.applicants.push({
      student: req.user._id,
      status: "applied",
      resumeUrl,
      applicationDate: new Date(),
    })

    await placement.save()

    // Send notification to student
    await sendNotification({
      title: "Application Submitted",
      message: `Your application for ${placement.company} (${placement.role}) has been submitted successfully`,
      type: "success",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [req.user._id],
      relatedTo: {
        model: "Placement",
        id: placement._id,
      },
      sentVia: ["app", "email"],
    })

    // Send notification to placement coordinator
    await sendNotification({
      title: "New Placement Application",
      message: `${student.name} has applied for ${placement.company} (${placement.role})`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [placement.createdBy],
      relatedTo: {
        model: "Placement",
        id: placement._id,
      },
      sentVia: ["app"],
    })

    res.json({
      message: "Successfully applied for the placement",
      placement,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Update applicant status
// @route   PUT /api/placements/:id/applicants/:applicantId
// @access  Private/Admin/Faculty
const updateApplicantStatus = async (req, res) => {
  try {
    const { id, applicantId } = req.params
    const { status } = req.body

    const placement = await Placement.findById(id)

    if (!placement) {
      return res.status(404).json({ message: "Placement opportunity not found" })
    }

    // Check if user is authorized
    if (placement.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update applicant status" })
    }

    // Find applicant
    const applicant = placement.applicants.id(applicantId)

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" })
    }

    // Update status
    applicant.status = status
    await placement.save()

    // Send notification to student
    await sendNotification({
      title: "Application Status Updated",
      message: `Your application status for ${placement.company} (${placement.role}) has been updated to ${status}`,
      type: "info",
      sender: req.user._id,
      recipients: "specific-users",
      specificUsers: [applicant.student],
      relatedTo: {
        model: "Placement",
        id: placement._id,
      },
      sentVia: ["app", "email"],
    })

    res.json({
      message: "Applicant status updated successfully",
      placement,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// @desc    Get placement statistics
// @route   GET /api/placements/statistics
// @access  Private/Admin/Faculty
const getPlacementStatistics = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== "admin" && req.user.role !== "faculty") {
      return res.status(403).json({ message: "Not authorized to view placement statistics" })
    }

    const { academicYear, branch } = req.query

    const filter = { status: "completed" }

    // Filter by academic year if provided
    if (academicYear) {
      const startDate = new Date(`${academicYear}-06-01`) // June 1st of the academic year
      const endDate = new Date(`${Number.parseInt(academicYear) + 1}-05-31`) // May 31st of the next year

      filter.driveDate = {
        $gte: startDate,
        $lte: endDate,
      }
    }

    // Get all completed placements
    const placements = await Placement.find(filter)

    // Calculate statistics
    let totalStudentsPlaced = 0
    const totalCompanies = new Set()
    const branchWiseStats = {}
    const packageStats = {
      highest: 0,
      average: 0,
      totalPackage: 0,
      totalStudents: 0,
    }

    for (const placement of placements) {
      totalCompanies.add(placement.company)

      // Count selected students
      const selectedApplicants = placement.applicants.filter((applicant) => applicant.status === "selected")

      for (const applicant of selectedApplicants) {
        totalStudentsPlaced++
        packageStats.totalPackage += placement.packageValue
        packageStats.totalStudents++

        if (placement.packageValue > packageStats.highest) {
          packageStats.highest = placement.packageValue
        }

        // Get student details for branch-wise stats
        const student = await User.findById(applicant.student)

        if (student && (!branch || student.branch === branch)) {
          if (!branchWiseStats[student.branch]) {
            branchWiseStats[student.branch] = {
              totalPlaced: 0,
              highestPackage: 0,
              averagePackage: 0,
              totalPackage: 0,
            }
          }

          branchWiseStats[student.branch].totalPlaced++
          branchWiseStats[student.branch].totalPackage += placement.packageValue

          if (placement.packageValue > branchWiseStats[student.branch].highestPackage) {
            branchWiseStats[student.branch].highestPackage = placement.packageValue
          }
        }
      }
    }

    // Calculate averages
    if (packageStats.totalStudents > 0) {
      packageStats.average = packageStats.totalPackage / packageStats.totalStudents
    }

    // Calculate branch-wise averages
    for (const branchKey in branchWiseStats) {
      if (branchWiseStats[branchKey].totalPlaced > 0) {
        branchWiseStats[branchKey].averagePackage =
          branchWiseStats[branchKey].totalPackage / branchWiseStats[branchKey].totalPlaced
      }
    }

    res.json({
      totalStudentsPlaced,
      totalCompanies: totalCompanies.size,
      packageStats,
      branchWiseStats,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

export {
  createPlacement,
  getPlacements,
  getPlacementById,
  updatePlacement,
  deletePlacement,
  applyForPlacement,
  updateApplicantStatus,
  getPlacementStatistics,
}

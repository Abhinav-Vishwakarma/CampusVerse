const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");
const Quiz = require("../models/Quiz");
const Fee = require("../models/Fee");
const Event = require("../models/Event");
const Placement = require("../models/Placement");
const { Note } = require("../models/Note");
const { auth, authorize } = require("../middleware/auth"); // Assuming auth and authorize are exported from auth.js

// Middleware for admin/faculty authorization - This line is now a comment
// because the middleware is applied directly to routes.

// GET /api/analytics/dashboard - System-wide dashboard stats
router.get("/dashboard", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCourses,
      totalAssignments,
      totalQuizzes,
      totalEvents,
      totalPlacements,
      recentUsers,
      recentAssignments,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "faculty", isActive: true }),
      Course.countDocuments({ isActive: true }),
      Assignment.countDocuments({ isActive: true }),
      Quiz.countDocuments({ isActive: true }),
      Event.countDocuments({ isActive: true }),
      Placement.countDocuments({ isActive: true }),
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role createdAt"),
      Assignment.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("course", "name code")
        .select("title course dueDate createdAt"),
    ]);

    // Calculate submission rates
const assignmentStats = await Assignment.aggregate([
  { $match: { isActive: true } },
  {
    $project: {
      // Use $ifNull to provide an empty array if 'submissions' is missing or null
      totalSubmissions: { $size: { $ifNull: ["$submissions", []] } },
      // Use $ifNull to provide an empty array if 'course.students' is missing or null
      // Note: If 'course' itself can be missing/null before 'course.students',
      // you might need a nested $ifNull or a $lookup stage to ensure 'course' is there.
      // Assuming 'course' always exists and 'students' might be missing within it.
      totalStudents: { $size: { $ifNull: ["$course.students", []] } },
      // Include other fields if needed for the next stages
      _id: 1, // Always include _id if you need it later, or explicitly exclude it
    },
  },
  {
    $group: {
      _id: null,
      avgSubmissionRate: {
        $avg: {
          $cond: [
            { $eq: ["$totalStudents", 0] },
            0,
            { $divide: ["$totalSubmissions", "$totalStudents"] },
          ],
        },
      },
    },
  },
]);

    const stats = {
      users: {
        total: totalUsers,
        students: totalStudents,
        faculty: totalFaculty,
        admin: totalUsers - totalStudents - totalFaculty,
      },
      courses: totalCourses,
      assignments: {
        total: totalAssignments,
        submissionRate: assignmentStats[0]?.avgSubmissionRate || 0,
      },
      quizzes: totalQuizzes,
      events: totalEvents,
      placements: totalPlacements,
      recent: {
        users: recentUsers,
        assignments: recentAssignments,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message,
    });
  }
});

// GET /api/analytics/users - User analytics
router.get("/users", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { branch, semester, role } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (branch) filter.branch = branch;
    if (semester) filter.semester = parseInt(semester);
    if (role) filter.role = role;

    const [
      usersByRole,
      usersByBranch,
      usersBySemester,
      recentRegistrations,
    ] = await Promise.all([
      User.aggregate([
        { $match: filter },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { ...filter, role: "student" } },
        { $group: { _id: "$branch", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { ...filter, role: "student" } },
        { $group: { _id: "$semester", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        byRole: usersByRole,
        byBranch: usersByBranch,
        bySemester: usersBySemester,
        recentRegistrations,
      },
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: error.message,
    });
  }
});

// GET /api/analytics/courses - Course analytics
router.get("/courses", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { branch, semester } = req.query;

    const filter = { isActive: true };
    if (branch) filter.branch = branch;
    if (semester) filter.semester = parseInt(semester);

    const [
      coursesByBranch,
      coursesBySemester,
      popularCourses,
      courseEnrollments,
    ] = await Promise.all([
      Course.aggregate([
        { $match: filter },
        { $group: { _id: "$branch", count: { $sum: 1 } } },
      ]),
      Course.aggregate([
        { $match: filter },
        { $group: { _id: "$semester", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Course.aggregate([
        { $match: filter },
        {
          $project: {
            name: 1,
            code: 1,
            enrollmentCount: { $size: "$students" },
          },
        },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 10 },
      ]),
      Course.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalEnrollments: { $sum: { $size: "$students" } },
            avgEnrollment: { $avg: { $size: "$students" } },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        byBranch: coursesByBranch,
        bySemester: coursesBySemester,
        popular: popularCourses,
        enrollments: courseEnrollments[0] || { totalEnrollments: 0, avgEnrollment: 0 },
      },
    });
  } catch (error) {
    console.error("Course analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course analytics",
      error: error.message,
    });
  }
});

// GET /api/analytics/attendance - Attendance analytics
router.get("/attendance", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { branch, semester, startDate, endDate } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [
      overallAttendance,
      attendanceByBranch,
      attendanceByStatus,
      recentAttendance,
    ] = await Promise.all([
      Attendance.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        ...(branch ? [{ $match: { "studentInfo.branch": branch } }] : []),
        ...(semester ? [{ $match: { "studentInfo.semester": parseInt(semester) } }] : []),
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "student",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        {
          $group: {
            _id: "$studentInfo.branch",
            present: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            branch: "$_id",
            present: 1,
            absent: 1,
            late: 1,
            total: 1,
            percentage: {
              $multiply: [{ $divide: ["$present", "$total"] }, 100],
            },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Attendance.find(filter)
        .sort({ date: -1 })
        .limit(20)
        .populate("student", "name admissionNumber")
        .populate("course", "name code")
        .select("student course status date topic"),
    ]);

    res.json({
      success: true,
      data: {
        overall: overallAttendance,
        byBranch: attendanceByBranch,
        byStatus: attendanceByStatus,
        recent: recentAttendance,
      },
    });
  } catch (error) {
    console.error("Attendance analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance analytics",
      error: error.message,
    });
  }
});

// GET /api/analytics/performance - Performance analytics
router.get("/performance", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { branch, semester } = req.query;

    const [
      quizPerformance,
      assignmentPerformance,
      topPerformers,
    ] = await Promise.all([
      Quiz.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$attempts" },
        {
          $lookup: {
            from: "users",
            localField: "attempts.student",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        ...(branch ? [{ $match: { "studentInfo.branch": branch } }] : []),
        ...(semester ? [{ $match: { "studentInfo.semester": parseInt(semester) } }] : []),
        {
          $group: {
            _id: "$studentInfo.branch",
            avgScore: { $avg: "$attempts.percentage" },
            totalAttempts: { $sum: 1 },
            passCount: {
              $sum: {
                $cond: [{ $gte: ["$attempts.percentage", 60] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            branch: "$_id",
            avgScore: { $round: ["$avgScore", 2] },
            totalAttempts: 1,
            passRate: {
              $round: [{ $multiply: [{ $divide: ["$passCount", "$totalAttempts"] }, 100] }, 2],
            },
          },
        },
      ]),
      Assignment.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$submissions" },
        {
          $lookup: {
            from: "users",
            localField: "submissions.student",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        ...(branch ? [{ $match: { "studentInfo.branch": branch } }] : []),
        ...(semester ? [{ $match: { "studentInfo.semester": parseInt(semester) } }] : []),
        {
          $group: {
            _id: "$studentInfo.branch",
            avgMarks: { $avg: "$submissions.marks" },
            totalSubmissions: { $sum: 1 },
          },
        },
        {
          $project: {
            branch: "$_id",
            avgMarks: { $round: ["$avgMarks", 2] },
            totalSubmissions: 1,
          },
        },
      ]),
      User.aggregate([
        { $match: { role: "student", isActive: true } },
        ...(branch ? [{ $match: { branch } }] : []),
        ...(semester ? [{ $match: { semester: parseInt(semester) } }] : []),
        {
          $lookup: {
            from: "quizzes",
            let: { studentId: "$_id" },
            pipeline: [
              { $unwind: "$attempts" },
              { $match: { $expr: { $eq: ["$attempts.student", "$$studentId"] } } },
              { $group: { _id: null, avgScore: { $avg: "$attempts.percentage" } } },
            ],
            as: "quizStats",
          },
        },
        {
          $project: {
            name: 1,
            admissionNumber: 1,
            branch: 1,
            semester: 1,
            avgQuizScore: { $ifNull: [{ $arrayElemAt: ["$quizStats.avgScore", 0] }, 0] },
          },
        },
        { $sort: { avgQuizScore: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        quiz: quizPerformance,
        assignment: assignmentPerformance,
        topPerformers,
      },
    });
  } catch (error) {
    console.error("Performance analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance analytics",
      error: error.message,
    });
  }
});

// GET /api/analytics/placements - Placement analytics
router.get("/placements", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const [
      placementsByCompany,
      applicationStats,
      salaryRanges,
      recentPlacements,
    ] = await Promise.all([
      Placement.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$company", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Placement.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$applications" },
        {
          $group: {
            _id: "$applications.status",
            count: { $sum: 1 },
          },
        },
      ]),
      Placement.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ["$salary.min", 300000] }, then: "0-3 LPA" },
                  { case: { $lt: ["$salary.min", 500000] }, then: "3-5 LPA" },
                  { case: { $lt: ["$salary.min", 800000] }, then: "5-8 LPA" },
                  { case: { $lt: ["$salary.min", 1200000] }, then: "8-12 LPA" },
                ],
                default: "12+ LPA",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Placement.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("jobTitle company salary.min salary.max applicationDeadline createdAt"),
    ]);

    res.json({
      success: true,
      data: {
        byCompany: placementsByCompany,
        applicationStats,
        salaryRanges,
        recent: recentPlacements,
      },
    });
  } catch (error) {
    console.error("Placement analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch placement analytics",
      error: error.message,
    });
  }
});

// GET /api/analytics/fees - Fee analytics
router.get("/fees", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester);

    const [
      feesByStatus,
      feesByType,
      paymentMethods,
      overdueStats,
    ] = await Promise.all([
      Fee.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]),
      Fee.aggregate([
        { $match: filter },
        { $group: { _id: "$feeType", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]),
      Fee.aggregate([
        { $match: filter },
        { $unwind: "$payments" },
        { $group: { _id: "$payments.paymentMethod", count: { $sum: 1 }, total: { $sum: "$payments.amount" } } },
      ]),
      Fee.aggregate([
        { $match: { ...filter, status: "overdue" } },
        { $group: { _id: null, count: { $sum: 1 }, totalOverdue: { $sum: "$balance" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        byStatus: feesByStatus,
        byType: feesByType,
        paymentMethods,
        overdue: overdueStats[0] || { count: 0, totalOverdue: 0 },
      },
    });
  } catch (error) {
    console.error("Fee analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee analytics",
      error: error.message,
    });
  }
});

// POST /api/analytics/custom-report - Generate custom report
router.post("/custom-report", [auth, authorize("admin", "faculty")], async (req, res) => {
  try {
    const { reportType, filters = {}, dateRange } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: "Report type is required",
      });
    }

    let data = {};

    switch (reportType) {
      case "user-activity":
        data = await generateUserActivityReport(filters, dateRange);
        break;
      case "course-performance":
        data = await generateCoursePerformanceReport(filters, dateRange);
        break;
      case "attendance-summary":
        data = await generateAttendanceSummaryReport(filters, dateRange);
        break;
      case "fee-collection":
        data = await generateFeeCollectionReport(filters, dateRange);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    res.json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date(),
        filters,
        dateRange,
        ...data,
      },
    });
  } catch (error) {
    console.error("Custom report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate custom report",
      error: error.message,
    });
  }
});

// Helper functions for custom reports
async function generateUserActivityReport(filters, dateRange) {
  const dateFilter = dateRange
    ? { createdAt: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) } }
    : {};

  const userFilter = { ...dateFilter, isActive: true };
  if (filters.role) userFilter.role = filters.role;
  if (filters.branch) userFilter.branch = filters.branch;

  const users = await User.find(userFilter)
    .select("name email role branch semester createdAt")
    .sort({ createdAt: -1 });

  return { users, totalCount: users.length };
}

async function generateCoursePerformanceReport(filters, dateRange) {
  const courses = await Course.find({ isActive: true })
    .populate("faculty", "name")
    .select("name code branch semester students faculty");

  return { courses, totalCount: courses.length };
}

async function generateAttendanceSummaryReport(filters, dateRange) {
  const dateFilter = dateRange
    ? { date: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) } }
    : {};

  const attendance = await Attendance.find(dateFilter)
    .populate("student", "name admissionNumber branch")
    .populate("course", "name code")
    .sort({ date: -1 });

  return { attendance, totalCount: attendance.length };
}

async function generateFeeCollectionReport(filters, dateRange) {
  const feeFilter = {};
  if (filters.academicYear) feeFilter.academicYear = filters.academicYear;
  if (filters.semester) feeFilter.semester = parseInt(filters.semester);

  const fees = await Fee.find(feeFilter)
    .populate("student", "name admissionNumber branch")
    .sort({ createdAt: -1 });

  return { fees, totalCount: fees.length };
}

module.exports = router;
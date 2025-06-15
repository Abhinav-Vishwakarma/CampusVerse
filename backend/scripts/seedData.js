const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const User = require("../models/User")
const Course = require("../models/Course")
const Quiz = require("../models/Quiz")
const Attendance = require("../models/Attendance")
const Assignment = require("../models/Assignment")
const Fee = require("../models/Fee")
const Event = require("../models/Event")
const Placement = require("../models/Placement")
const { Note, PYQ } = require("../models/Note")
const Notification = require("../models/Notification")

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/campusverse", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Clear existing data
    await User.deleteMany({})
    await Course.deleteMany({})
    await Quiz.deleteMany({})
    await Attendance.deleteMany({})
    await Assignment.deleteMany({})
    await Fee.deleteMany({})
    await Event.deleteMany({})
    await Placement.deleteMany({})
    await Note.deleteMany({})
    await PYQ.deleteMany({})
    await Notification.deleteMany({})

    console.log("🗑️  Cleared existing data")

    // Create Users
    const hashedPassword = await bcrypt.hash("password123", 10)

    // Admin Users
    const adminUsers = await User.create([
      {
        name: "Admin User",
        email: "admin@campusverse.com",
        password: hashedPassword,
        role: "admin",
        phone: "+91-9876543210",
        aiCredits: 100,
      },
      {
        name: "System Administrator",
        email: "sysadmin@campusverse.com",
        password: hashedPassword,
        role: "admin",
        phone: "+91-9876543211",
        aiCredits: 100,
      },
    ])

    // Faculty Users
    const facultyUsers = await User.create([
      {
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@campusverse.com",
        password: hashedPassword,
        role: "faculty",
        department: "Computer Science",
        employeeId: "FAC2024001",
        phone: "+91-9876543212",
        aiCredits: 50,
      },
      {
        name: "Prof. Priya Sharma",
        email: "priya.sharma@campusverse.com",
        password: hashedPassword,
        role: "faculty",
        department: "Information Technology",
        employeeId: "FAC2024002",
        phone: "+91-9876543213",
        aiCredits: 50,
      },
      {
        name: "Dr. Amit Singh",
        email: "amit.singh@campusverse.com",
        password: hashedPassword,
        role: "faculty",
        department: "Electronics",
        employeeId: "FAC2024003",
        phone: "+91-9876543214",
        aiCredits: 50,
      },
      {
        name: "Prof. Neha Gupta",
        email: "neha.gupta@campusverse.com",
        password: hashedPassword,
        role: "faculty",
        department: "Mechanical",
        employeeId: "FAC2024004",
        phone: "+91-9876543215",
        aiCredits: 50,
      },
    ])

    // Student Users
    const studentUsers = await User.create([
      {
        name: "Arjun Patel",
        email: "arjun.patel@student.campusverse.com",
        password: hashedPassword,
        role: "student",
        course: "B.Tech",
        branch: "Computer Science",
        semester: 6,
        section: "A",
        admissionNumber: "CS2021001",
        phone: "+91-9876543216",
        aiCredits: 10,
      },
      {
        name: "Sneha Reddy",
        email: "sneha.reddy@student.campusverse.com",
        password: hashedPassword,
        role: "student",
        course: "B.Tech",
        branch: "Computer Science",
        semester: 6,
        section: "A",
        admissionNumber: "CS2021002",
        phone: "+91-9876543217",
        aiCredits: 10,
      },
      {
        name: "Rohit Sharma",
        email: "rohit.sharma@student.campusverse.com",
        password: hashedPassword,
        role: "student",
        course: "B.Tech",
        branch: "Information Technology",
        semester: 4,
        section: "B",
        admissionNumber: "IT2022001",
        phone: "+91-9876543218",
        aiCredits: 10,
      },
      {
        name: "Kavya Nair",
        email: "kavya.nair@student.campusverse.com",
        password: hashedPassword,
        role: "student",
        course: "B.Tech",
        branch: "Electronics",
        semester: 4,
        section: "A",
        admissionNumber: "EC2022001",
        phone: "+91-9876543219",
        aiCredits: 10,
      },
      {
        name: "Vikram Singh",
        email: "vikram.singh@student.campusverse.com",
        password: hashedPassword,
        role: "student",
        course: "B.Tech",
        branch: "Mechanical",
        semester: 2,
        section: "A",
        admissionNumber: "ME2023001",
        phone: "+91-9876543220",
        aiCredits: 10,
      },
    ])

    console.log("👥 Created users")

    // Create Courses
    const courses = await Course.create([
      {
        name: "Data Structures and Algorithms",
        code: "CS301",
        description: "Comprehensive study of data structures and algorithms",
        semester: 6,
        branch: "Computer Science",
        credits: 4,
        faculty: facultyUsers[0]._id,
        students: [studentUsers[0]._id, studentUsers[1]._id],
        syllabus: "Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, Searching",
      },
      {
        name: "Database Management Systems",
        code: "CS302",
        description: "Introduction to database concepts and SQL",
        semester: 6,
        branch: "Computer Science",
        credits: 3,
        faculty: facultyUsers[0]._id,
        students: [studentUsers[0]._id, studentUsers[1]._id],
      },
      {
        name: "Web Technologies",
        code: "IT201",
        description: "HTML, CSS, JavaScript, and modern web frameworks",
        semester: 4,
        branch: "Information Technology",
        credits: 3,
        faculty: facultyUsers[1]._id,
        students: [studentUsers[2]._id],
      },
      {
        name: "Digital Electronics",
        code: "EC201",
        description: "Digital circuits and logic design",
        semester: 4,
        branch: "Electronics",
        credits: 4,
        faculty: facultyUsers[2]._id,
        students: [studentUsers[3]._id],
      },
      {
        name: "Engineering Mechanics",
        code: "ME101",
        description: "Fundamentals of mechanics and statics",
        semester: 2,
        branch: "Mechanical",
        credits: 3,
        faculty: facultyUsers[3]._id,
        students: [studentUsers[4]._id],
      },
    ])

    console.log("📚 Created courses")

    // Create Quizzes
    const quizzes = await Quiz.create([
      {
        title: "Data Structures Quiz 1",
        description: "Quiz on Arrays and Linked Lists",
        course: courses[0]._id,
        faculty: facultyUsers[0]._id,
        branch: "Computer Science",
        section: "A",
        duration: 30,
        totalMarks: 20,
        passingMarks: 12,
        code: "DSA001",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-01-20"),
        questions: [
          {
            question: "What is the time complexity of accessing an element in an array?",
            options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
            correctAnswer: 0,
            marks: 2,
          },
          {
            question: "Which data structure follows LIFO principle?",
            options: ["Queue", "Stack", "Array", "Linked List"],
            correctAnswer: 1,
            marks: 2,
          },
        ],
        attempts: [
          {
            student: studentUsers[0]._id,
            answers: [
              { question: 0, selectedOption: 0 },
              { question: 1, selectedOption: 1 },
            ],
            score: 4,
            percentage: 20,
            startTime: new Date("2024-01-16T10:00:00"),
            endTime: new Date("2024-01-16T10:15:00"),
          },
        ],
      },
      {
        title: "Database Quiz 1",
        description: "Quiz on SQL Basics",
        course: courses[1]._id,
        faculty: facultyUsers[0]._id,
        branch: "Computer Science",
        section: "A",
        duration: 45,
        totalMarks: 25,
        passingMarks: 15,
        code: "DB001",
        startDate: new Date("2024-01-20"),
        endDate: new Date("2024-01-25"),
        questions: [
          {
            question: "Which SQL command is used to retrieve data?",
            options: ["INSERT", "SELECT", "UPDATE", "DELETE"],
            correctAnswer: 1,
            marks: 3,
          },
        ],
      },
    ])

    console.log("🧠 Created quizzes")

    // Create Attendance Records
    const attendanceRecords = []
    const startDate = new Date("2024-01-01")
    const endDate = new Date("2024-01-31")

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        // Skip weekends
        // CS students attendance
        attendanceRecords.push({
          student: studentUsers[0]._id,
          course: courses[0]._id,
          date: new Date(d),
          status: Math.random() > 0.2 ? "present" : "absent",
          topic: `DSA Lecture ${Math.floor(Math.random() * 20) + 1}`,
          lecture: Math.floor(Math.random() * 5) + 1,
          markedBy: facultyUsers[0]._id,
        })

        attendanceRecords.push({
          student: studentUsers[1]._id,
          course: courses[0]._id,
          date: new Date(d),
          status: Math.random() > 0.15 ? "present" : "absent",
          topic: `DSA Lecture ${Math.floor(Math.random() * 20) + 1}`,
          lecture: Math.floor(Math.random() * 5) + 1,
          markedBy: facultyUsers[0]._id,
        })
      }
    }

    await Attendance.create(attendanceRecords)
    console.log("📊 Created attendance records")

    // Create Assignments
    const assignments = await Assignment.create([
      {
        title: "Implement Binary Search Tree",
        description: "Create a complete BST implementation with insert, delete, and search operations",
        course: courses[0]._id,
        faculty: facultyUsers[0]._id,
        branch: "Computer Science",
        section: "A",
        dueDate: new Date("2024-02-15"),
        totalMarks: 50,
        instructions: "Use any programming language. Include proper documentation.",
        submissions: [
          {
            student: studentUsers[0]._id,
            submissionText: "BST implementation completed with all required operations.",
            attachments: [
              {
                fileName: "bst_implementation.cpp",
                fileUrl: "/uploads/assignments/bst_implementation.cpp",
                fileSize: 2048,
              },
            ],
            marks: 45,
            feedback: "Excellent implementation. Good code structure.",
            gradedAt: new Date("2024-02-16"),
            gradedBy: facultyUsers[0]._id,
          },
        ],
      },
      {
        title: "Database Design Project",
        description: "Design a database for a library management system",
        course: courses[1]._id,
        faculty: facultyUsers[0]._id,
        branch: "Computer Science",
        section: "A",
        dueDate: new Date("2024-02-20"),
        totalMarks: 40,
        instructions: "Create ER diagram and normalize to 3NF",
      },
    ])

    console.log("📝 Created assignments")

    // Create Fee Records
    const currentYear = new Date().getFullYear()
    const fees = await Fee.create([
      {
        student: studentUsers[0]._id,
        feeType: "tuition",
        amount: 50000,
        dueDate: new Date(`${currentYear}-07-15`),
        semester: 6,
        academicYear: `${currentYear}-${currentYear + 1}`,
        description: "Semester 6 Tuition Fee",
        status: "paid",
        payments: [
          {
            amount: 50000,
            paymentMethod: "online",
            transactionId: "TXN123456789",
            receipt: "RCP001",
          },
        ],
        createdBy: adminUsers[0]._id,
      },
      {
        student: studentUsers[1]._id,
        feeType: "tuition",
        amount: 50000,
        dueDate: new Date(`${currentYear}-07-15`),
        semester: 6,
        academicYear: `${currentYear}-${currentYear + 1}`,
        description: "Semester 6 Tuition Fee",
        status: "pending",
        createdBy: adminUsers[0]._id,
      },
      {
        student: studentUsers[0]._id,
        feeType: "hostel",
        amount: 25000,
        dueDate: new Date(`${currentYear}-08-01`),
        semester: 6,
        academicYear: `${currentYear}-${currentYear + 1}`,
        description: "Hostel Fee",
        status: "partial",
        payments: [
          {
            amount: 15000,
            paymentMethod: "card",
            transactionId: "TXN987654321",
            receipt: "RCP002",
          },
        ],
        createdBy: adminUsers[0]._id,
      },
    ])

    console.log("💰 Created fee records")

    // Create Events
    const events = await Event.create([
      {
        title: "Tech Fest 2024",
        description: "Annual technical festival with competitions and workshops",
        startDate: new Date("2024-03-15"),
        endDate: new Date("2024-03-17"),
        location: "Main Auditorium",
        eventType: "cultural",
        organizer: adminUsers[0]._id,
        maxRegistrations: 500,
        registrations: [
          {
            student: studentUsers[0]._id,
            status: "registered",
          },
          {
            student: studentUsers[1]._id,
            status: "registered",
          },
        ],
      },
      {
        title: "Placement Drive - TCS",
        description: "Campus placement drive by Tata Consultancy Services",
        startDate: new Date("2024-02-20"),
        endDate: new Date("2024-02-20"),
        location: "Placement Cell",
        eventType: "placement",
        organizer: adminUsers[1]._id,
        maxRegistrations: 100,
        registrations: [
          {
            student: studentUsers[0]._id,
            status: "registered",
          },
        ],
      },
    ])

    console.log("🎉 Created events")

    // Create Placements
    const placements = await Placement.create([
      {
        jobTitle: "Software Developer",
        company: "TCS",
        description: "Full-stack development role for fresh graduates",
        location: "Bangalore, Mumbai, Pune",
        salary: {
          min: 350000,
          max: 450000,
        },
        requirements: ["B.Tech in CS/IT/ECE", "Good programming skills", "Problem-solving abilities"],
        eligibilityCriteria: {
          minCGPA: 7.0,
          branches: ["Computer Science", "Information Technology", "Electronics"],
          passingYear: 2024,
        },
        applicationDeadline: new Date("2024-02-25"),
        applications: [
          {
            student: studentUsers[0]._id,
            coverLetter: "I am interested in this position...",
            resume: "/uploads/resumes/arjun_resume.pdf",
            status: "pending",
          },
        ],
        postedBy: adminUsers[1]._id,
      },
      {
        jobTitle: "Data Analyst",
        company: "Infosys",
        description: "Data analysis and visualization role",
        location: "Hyderabad, Chennai",
        salary: {
          min: 400000,
          max: 500000,
        },
        requirements: ["Strong analytical skills", "Knowledge of SQL, Python", "Data visualization tools"],
        eligibilityCriteria: {
          minCGPA: 7.5,
          branches: ["Computer Science", "Information Technology"],
          passingYear: 2024,
        },
        applicationDeadline: new Date("2024-03-01"),
        postedBy: adminUsers[1]._id,
      },
    ])

    console.log("💼 Created placements")

    // Create Notes
    const notes = await Note.create([
      {
        title: "Data Structures Notes - Chapter 1",
        content: "Introduction to Data Structures and their importance",
        course: courses[0]._id,
        semester: 6,
        branch: "Computer Science",
        subject: "Data Structures",
        tags: ["arrays", "introduction", "basics"],
        fileUrl: "/uploads/notes/ds_chapter1.pdf",
        fileSize: 1024000,
        downloads: 25,
        likes: [studentUsers[0]._id, studentUsers[1]._id],
        comments: [
          {
            user: studentUsers[1]._id,
            comment: "Very helpful notes!",
          },
        ],
        uploadedBy: facultyUsers[0]._id,
      },
      {
        title: "SQL Query Examples",
        content: "Common SQL queries with examples",
        course: courses[1]._id,
        semester: 6,
        branch: "Computer Science",
        subject: "Database Management",
        tags: ["sql", "queries", "examples"],
        fileUrl: "/uploads/notes/sql_examples.pdf",
        fileSize: 512000,
        downloads: 18,
        uploadedBy: facultyUsers[0]._id,
      },
    ])

    // Create PYQs
    const pyqs = await PYQ.create([
      {
        title: "Data Structures Mid-Term 2023",
        year: 2023,
        examType: "mid-term",
        course: courses[0]._id,
        semester: 6,
        branch: "Computer Science",
        fileUrl: "/uploads/pyqs/ds_midterm_2023.pdf",
        fileSize: 256000,
        downloads: 45,
        uploadedBy: facultyUsers[0]._id,
      },
      {
        title: "Database End-Term 2023",
        year: 2023,
        examType: "end-term",
        course: courses[1]._id,
        semester: 6,
        branch: "Computer Science",
        fileUrl: "/uploads/pyqs/db_endterm_2023.pdf",
        fileSize: 384000,
        downloads: 32,
        uploadedBy: facultyUsers[0]._id,
      },
    ])

    console.log("📄 Created notes and PYQs")

    // Create Notifications
    const notifications = await Notification.create([
      {
        title: "Welcome to CampusVerse!",
        message: "Welcome to the new academic management system. Explore all features and stay updated.",
        type: "announcement",
        targetAudience: "all",
        priority: "high",
        createdBy: adminUsers[0]._id,
        readBy: [
          {
            user: studentUsers[0]._id,
          },
        ],
      },
      {
        title: "Assignment Deadline Reminder",
        message: "Your BST implementation assignment is due tomorrow. Please submit on time.",
        type: "reminder",
        targetAudience: "individual",
        targetUsers: [studentUsers[0]._id, studentUsers[1]._id],
        priority: "medium",
        createdBy: facultyUsers[0]._id,
      },
      {
        title: "Fee Payment Due",
        message: "Your semester fee payment is overdue. Please clear your dues immediately.",
        type: "alert",
        targetAudience: "individual",
        targetUsers: [studentUsers[1]._id],
        priority: "urgent",
        createdBy: adminUsers[0]._id,
      },
      {
        title: "Tech Fest Registration Open",
        message: "Registration for Tech Fest 2024 is now open. Register before seats fill up!",
        type: "event",
        targetAudience: "students",
        priority: "medium",
        createdBy: adminUsers[0]._id,
      },
    ])

    console.log("🔔 Created notifications")

    console.log("✅ Database seeding completed successfully!")
    console.log("\n📊 Summary:")
    console.log(`👥 Users: ${adminUsers.length + facultyUsers.length + studentUsers.length}`)
    console.log(`📚 Courses: ${courses.length}`)
    console.log(`🧠 Quizzes: ${quizzes.length}`)
    console.log(`📊 Attendance Records: ${attendanceRecords.length}`)
    console.log(`📝 Assignments: ${assignments.length}`)
    console.log(`💰 Fee Records: ${fees.length}`)
    console.log(`🎉 Events: ${events.length}`)
    console.log(`💼 Placements: ${placements.length}`)
    console.log(`📄 Notes: ${notes.length}`)
    console.log(`📋 PYQs: ${pyqs.length}`)
    console.log(`🔔 Notifications: ${notifications.length}`)

    console.log("\n🔑 Test Login Credentials:")
    console.log("Admin: admin@campusverse.com / password123")
    console.log("Faculty: rajesh.kumar@campusverse.com / password123")
    console.log("Student: arjun.patel@student.campusverse.com / password123")
  } catch (error) {
    console.error("❌ Seeding error:", error)
  } finally {
    mongoose.connection.close()
  }
}

seedData()

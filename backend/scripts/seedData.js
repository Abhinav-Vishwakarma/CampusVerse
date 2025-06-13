import dotenv from "dotenv"
import User from "../models/User.js"
import Course from "../models/Course.js"
import AICredit from "../models/AICredit.js"
import connectDB from "../config/db.js"

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Course.deleteMany({})
    await AICredit.deleteMany({})

    console.log("Existing data cleared")

    // Create admin user
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@smartcampus.edu",
      password: "admin123",
      role: "admin",
    })

    // Create faculty users
    const faculty1 = await User.create({
      name: "Dr. John Smith",
      email: "john.smith@smartcampus.edu",
      password: "faculty123",
      role: "faculty",
      facultyId: "FAC001",
      department: "Computer Science",
    })

    const faculty2 = await User.create({
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@smartcampus.edu",
      password: "faculty123",
      role: "faculty",
      facultyId: "FAC002",
      department: "Information Technology",
    })

    // Create student users
    const students = []
    for (let i = 1; i <= 10; i++) {
      const student = await User.create({
        name: `Student ${i}`,
        email: `student${i}@smartcampus.edu`,
        password: "student123",
        role: "student",
        studentId: `STU${i.toString().padStart(3, "0")}`,
        department: i <= 5 ? "Computer Science" : "Information Technology",
        semester: Math.ceil(i / 2),
        branch: i <= 5 ? "CSE" : "IT",
      })
      students.push(student)

      // Create AI credits for each student
      await AICredit.create({
        user: student._id,
        totalCredits: 10,
        lastRefillDate: new Date(),
      })
    }

    // Create courses
    const course1 = await Course.create({
      name: "Data Structures and Algorithms",
      code: "CS101",
      description: "Introduction to fundamental data structures and algorithms",
      semester: 3,
      branch: "CSE",
      faculty: faculty1._id,
      students: students.slice(0, 5).map((s) => s._id),
      totalClasses: 45,
    })

    const course2 = await Course.create({
      name: "Database Management Systems",
      code: "IT201",
      description: "Comprehensive study of database design and management",
      semester: 4,
      branch: "IT",
      faculty: faculty2._id,
      students: students.slice(5, 10).map((s) => s._id),
      totalClasses: 40,
    })

    console.log("Sample data created successfully!")
    console.log("Admin credentials: admin@smartcampus.edu / admin123")
    console.log("Faculty credentials: john.smith@smartcampus.edu / faculty123")
    console.log("Student credentials: student1@smartcampus.edu / student123")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding data:", error)
    process.exit(1)
  }
}

seedData()

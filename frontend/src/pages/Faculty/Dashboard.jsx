"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { BookOpen, Users, ClipboardList, FileText, BarChart3, Clock, Award } from "lucide-react"

const FacultyDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [recentActivities, setRecentActivities] = useState([])
  const [upcomingClasses, setUpcomingClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Mock dashboard data
      const mockStats = {
        totalStudents: 150,
        activeQuizzes: 3,
        pendingAssignments: 12,
        coursesTeaching: 4,
        attendanceRate: 85,
        avgQuizScore: 78,
      }

      const mockActivities = [
        {
          id: 1,
          type: "quiz",
          title: "Data Structures Quiz created",
          time: "2 hours ago",
          course: "CS301",
        },
        {
          id: 2,
          type: "assignment",
          title: "New assignment submissions received",
          time: "4 hours ago",
          course: "CS302",
        },
        {
          id: 3,
          type: "attendance",
          title: "Attendance marked for CS301",
          time: "1 day ago",
          course: "CS301",
        },
      ]

      const mockUpcomingClasses = [
        {
          id: 1,
          course: "Data Structures",
          code: "CS301",
          time: "10:00 AM",
          room: "Room 101",
          students: 45,
        },
        {
          id: 2,
          course: "Database Management",
          code: "CS302",
          time: "2:00 PM",
          room: "Room 205",
          students: 38,
        },
      ]

      setStats(mockStats)
      setRecentActivities(mockActivities)
      setUpcomingClasses(mockUpcomingClasses)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    {
      title: "Create Quiz",
      description: "Create and manage quizzes",
      icon: ClipboardList,
      path: "/quizzes",
      color: "blue",
    },
    {
      title: "Mark Attendance",
      description: "Take attendance for classes",
      icon: Users,
      path: "/attendance",
      color: "green",
    },
    {
      title: "Upload Materials",
      description: "Share course materials",
      icon: FileText,
      path: "/materials",
      color: "purple",
    },
    {
      title: "View Performance",
      description: "Track student performance",
      icon: BarChart3,
      path: "/performance",
      color: "yellow",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name || "Faculty"}!</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your classes today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Quizzes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingAssignments}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Teaching</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.coursesTeaching}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.attendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Quiz Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgQuizScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const IconComponent = link.icon
              return (
                <button
                  key={index}
                  onClick={() => navigate(link.path)}
                  className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all text-left group hover:border-${link.color}-300`}
                >
                  <div className={`p-2 bg-${link.color}-100 dark:bg-${link.color}-900 rounded-lg w-fit mb-3`}>
                    <IconComponent className={`w-5 h-5 text-${link.color}-600 dark:text-${link.color}-400`} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{link.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Classes</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {upcomingClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{classItem.course}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem.code} • {classItem.room} • {classItem.students} students
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{classItem.time}</p>
                  <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {activity.type === "quiz" && <ClipboardList className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  {activity.type === "assignment" && <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  {activity.type === "attendance" && <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.course} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyDashboard

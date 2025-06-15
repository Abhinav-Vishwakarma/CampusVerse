"use client"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Home,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Brain,
  Bell,
  Briefcase,
  Award,
  Upload,
} from "lucide-react"

const Sidebar = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getMenuItems = () => {
    const baseItems = [{ icon: Home, label: "Dashboard", path: "/dashboard" }]

    if (user?.role === "student") {
      return [
        ...baseItems,
        { icon: BookOpen, label: "Courses", path: "/courses" },
        { icon: Award, label: "Performance", path: "/performance" },
        { icon: ClipboardList, label: "Attendance", path: "/attendance" },
        { icon: GraduationCap, label: "Quizzes", path: "/quizzes" },
        { icon: Upload, label: "Assignments", path: "/assignments" },
        { icon: FileText, label: "Notes & PYQs", path: "/notes" },
        { icon: Brain, label: "AI Features", path: "/ai" },
        { icon: CreditCard, label: "Fee Records", path: "/fees" },
        { icon: Briefcase, label: "Placement Records", path: "/placements" },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ]
    }

    if (user?.role === "faculty") {
      return [
        ...baseItems,
        { icon: GraduationCap, label: "Quiz Management", path: "/quizzes" },
        { icon: ClipboardList, label: "Attendance", path: "/attendance" },
        { icon: Upload, label: "Assignments", path: "/assignments" },
        { icon: FileText, label: "Course Materials", path: "/materials" },
        { icon: Award, label: "Performance Tracking", path: "/performance" },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ]
    }

    if (user?.role === "admin") {
      return [
        ...baseItems,
        { icon: BookOpen, label: "Course Management", path: "/courses" },
        { icon: Users, label: "User Management", path: "/users" },
        { icon: Brain, label: "AI + Fee Management", path: "/ai-fee-management" },
        { icon: Briefcase, label: "Placement Management", path: "/placement-management" },
        { icon: BarChart3, label: "Analytics", path: "/analytics" },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <div className="p-6">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sidebar

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
        { icon: ClipboardList, label: "Attendance", path: "/attendance" },
        { icon: GraduationCap, label: "Quizzes", path: "/quizzes" },
        { icon: Upload, label: "Assignments", path: "/assignments" },
        { icon: FileText, label: "Notes & PYQs", path: "/notes" },
        { icon: Brain, label: "AI Features", path: "/ai" },
        { icon: CreditCard, label: "Fee Records", path: "/fees" },
        { icon: Briefcase, label: "Placement Records", path: "/placements" },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        // { icon: Settings, label: "Settings", path: "/settings" },
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
        // { icon: Settings, label: "Settings", path: "/settings" },
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
        // { icon: Settings, label: "Settings", path: "/settings" },
      ]
    }
    return baseItems
  }

  const menuItems = getMenuItems()

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <aside
      className="fixed left-0 top-0 z-30 h-screen w-64 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-xl flex flex-col"
      style={{ borderTopRightRadius: "2rem", borderBottomRightRadius: "2rem" }}
    >
      <div className="flex items-center justify-center h-20 mb-4 mt-2">
        <span className="text-2xl font-extrabold text-white tracking-wide drop-shadow-lg">CampusVerse</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <li key={index}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-full transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg scale-105"
                        : "text-blue-100 hover:bg-blue-800 hover:text-white"
                    }
                  `}
                  style={{
                    boxShadow: isActive
                      ? "0 4px 24px 0 rgba(59,130,246,0.15)"
                      : undefined,
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-4 text-xs text-blue-200 opacity-70 text-center">
        &copy; {new Date().getFullYear()} CampusVerse
      </div>
    </aside>
  )
}

export default Sidebar

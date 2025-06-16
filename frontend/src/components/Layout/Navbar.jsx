"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Bell, Sun, Moon, ChevronDown, LogOut, User, Settings as SettingsIcon } from "lucide-react"

const Navbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications } = useNotification()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  return (
    <nav className="bg-white/80 dark:bg-gray-900/90 shadow-md border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg z-40 sticky top-0 transition-all">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 tracking-wide drop-shadow-lg select-none">
              CampusVerse
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors shadow"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors shadow relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
              {/* Animated Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 animate-slide-in-right">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification._id || notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-800/40 transition-colors cursor-pointer ${
                            !notification.read ? "bg-blue-50 dark:bg-blue-900/30" : ""
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => {
                        navigate("/notifications")
                        setShowNotifications(false)
                      }}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile((v) => !v)}
                className="flex items-center space-x-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors shadow"
                aria-label="Profile"
              >
                <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-white text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</span>
                <ChevronDown className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`} />
              </button>
              {/* Animated Profile Dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 animate-fade-in">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-white text-lg font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                      <p
                        className="text-xs text-gray-500 dark:text-gray-400 break-all block"
                        title={user?.email}
                        style={{ maxWidth: 180, wordBreak: "break-all" }}
                      >
                        {user?.email}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate("/profile")
                        setShowProfile(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-800/40 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" /> Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings")
                        setShowProfile(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-800/40 transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4 mr-2" /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Animations */}
      <style>
        {`
          .animate-fade-in {
            animation: fadeIn 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          .animate-slide-in-right {
            animation: slideInRight 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(16px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px);}
            to { opacity: 1; transform: translateX(0);}
          }
        `}
      </style>
    </nav>
  )
}

export default Navbar

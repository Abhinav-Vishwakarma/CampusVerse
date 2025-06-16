"use client"


import { useAuth } from "../../contexts/AuthContext"
import AnalyticsPage from "./AnalyticsPage"
const AdminDashboard = () => {
  const { user } = useAuth()
  

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">Welcome back, {user?.name}! Here's what's happening in your campus.</p>
      </div>
      <AnalyticsPage />
    </div>
  )
}

export default AdminDashboard

"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import { useTheme } from "./contexts/ThemeContext"
import Navbar from "./components/Layout/Navbar"
import Sidebar from "./components/Layout/Sidebar"
import Login from "./pages/Auth/Login"
import Register from "./pages/Auth/Register"
import StudentDashboard from "./pages/Student/Dashboard"
import QuizTaking from "./pages/Quiz/QuizTaking"
import NotificationToast from "./components/UI/NotificationToast"
import LoadingSpinner from "./components/UI/LoadingSpinner"
import StudentCoursesPage from "./pages/Student/CoursesPage"
import PerformancePage from "./pages/Student/PerformancePage"
import AssignmentsPage from "./pages/Student/AssignmentsPage"
import FeeRecordsPage from "./pages/Student/FeeRecordsPage"
import PlacementRecordsPage from "./pages/Student/PlacementRecordsPage"
import CourseDetails from "./pages/Courses/CourseDetails"
import QuizCodeEntry from "./pages/Quiz/QuizCodeEntry"
import NotesPage from "./pages/Notes/NotesPage"
import AIFeaturesPage from "./pages/AI/AIFeaturesPage"
import EventsPage from "./pages/Events/EventsPage"
import UserManagement from "./pages/Admin/UserManagement"
import AnalyticsPage from "./pages/Admin/AnalyticsPage"
import ProfilePage from "./pages/Profile/ProfilePage"
import SettingsPage from "./pages/Settings/SettingsPage"
import NotificationCenter from "./pages/Notifications/NotificationCenter"
import FeeManagement from "./pages/Admin/FeeManagement"
import FacultyDashboard from "./pages/Faculty/Dashboard"
import AdminDashboard from "./pages/Admin/Dashboard"
import QuizManagement from "./pages/Faculty/QuizManagement"
import AttendanceManagement from "./pages/Faculty/AttendanceManagement"
import CourseMaterials from "./pages/Faculty/CourseMaterials"
import AssignmentManagement from "./pages/Faculty/AssignmentManagement"
import PerformanceTracking from "./pages/Faculty/PerformanceTracking"
import AIFeeManagement from "./pages/Admin/AIFeeManagement"
import PlacementManagement from "./pages/Admin/PlacementManagement"
import NotificationManagement from "./pages/Admin/NotificationManagement"
import CoursesPage from "./pages/Courses/CoursesPage"
import QuizzesPage from "./pages/Quiz/QuizzesPage"
import AttendancePage from "./pages/Attendance/AttendancePage"

function App() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
        <Router>
          <NotificationToast />
          {user ? (
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <main className="p-6">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                      path="/dashboard"
                      element={
                        user.role === "student" ? (
                          <StudentDashboard />
                        ) : user.role === "faculty" ? (
                          <FacultyDashboard />
                        ) : user.role === "admin" ? (
                          <AdminDashboard />
                        ) : (
                          <Navigate to="/login" replace />
                        )
                      }
                    />

                    {/* Student Routes */}
                    {user.role === "student" && (
                      <>
                        <Route path="/courses" element={<StudentCoursesPage />} />
                        <Route path="/performance" element={<PerformancePage />} />
                        <Route path="/assignments" element={<AssignmentsPage />} />
                        <Route path="/fees" element={<FeeRecordsPage />} />
                        <Route path="/placements" element={<PlacementRecordsPage />} />
                        <Route path="/quizzes" element={<QuizzesPage />} />
                        <Route path="/attendance" element={<AttendancePage />} />

                      </>
                    )}

                    {/* Faculty Routes */}
                    {user.role === "faculty" && (
                      <>
                        <Route path="/quizzes" element={<QuizManagement />} />
                        <Route path="/attendance" element={<AttendanceManagement />} />
                        <Route path="/assignments" element={<AssignmentManagement />} />
                        <Route path="/materials" element={<CourseMaterials />} />
                        <Route path="/performance" element={<PerformanceTracking />} />
                        <Route
                          path="/notifications"
                          element={<NotificationManagement />}
                        />
                      </>
                    )}

                    {/* Admin Routes */}
                    {user.role === "admin" && (
                      <>
                        <Route path="/courses" element={<CoursesPage />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/ai-fee-management" element={<AIFeeManagement />} />
                        <Route path="/placement-management" element={<PlacementManagement />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                      </>
                    )}

                    {/* Common Routes */}
                    <Route path="/courses/:id" element={<CourseDetails />} />
                    <Route path="/quiz/:quizId" element={<QuizTaking />} />
                    <Route path="/quiz-code" element={<QuizCodeEntry />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/ai" element={<AIFeaturesPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route
                      path="/notifications"
                      element={user.role === "admin" ? <NotificationManagement /> : <NotificationCenter />}
                    />

                    <Route path="/fee-management" element={<FeeManagement />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </Router>
      </div>
    </div>
  )
}

export default App

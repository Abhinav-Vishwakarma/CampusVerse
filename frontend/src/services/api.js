const API_BASE_URL = "http://localhost:5000/api"

// Create axios-like instance for consistent API calls
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const token = localStorage.getItem("campusverse_token")

  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  }

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json().catch(() => null)
    return { data: data || null, status: response.status }
  } catch (error) {
    throw new Error(error.message || "Network error occurred")
  }
}

// Auth API
export const authAPI = {
  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: userData,
    }),

  getProfile: () => apiRequest("/auth/profile"),

  updateProfile: (userData) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: userData,
    }),

  logout: () => apiRequest("/auth/logout", { method: "POST" }),

  forgotPassword: (email) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token, password) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: { token, password },
    }),
}

// Users API
export const usersAPI = {
  getUsers: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/users${queryParams ? `?${queryParams}` : ""}`)
  },

  searchUsers: (params) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/users/search?${queryString}`)
  },

  getSuggestions: (query) => {
    return apiRequest(`/users/suggestions?q=${query}`)
  },

  getFilters: () => {
    return apiRequest('/users/filters')
  },

  getUser: (id) => apiRequest(`/users/${id}`),

  createUser: (userData) =>
    apiRequest("/users", {
      method: "POST",
      body: userData,
    }),

  updateUser: (id, userData) =>
    apiRequest(`/users/${id}`, {
      method: "PUT",
      body: userData,
    }),

  deleteUser: (id) => apiRequest(`/users/${id}`, { method: "DELETE" }),

  getUsersByRole: (role) => apiRequest(`/users/role/${role}`),

  bulkCreateUsers: (usersData) =>
    apiRequest("/users/bulk", {
      method: "POST",
      body: { users: usersData },
    }),
}

// Courses API
export const coursesAPI = {
  getCourses: (filters = {}) => {
    const queryParams = new URLSearchParams()
    if (filters.branch) queryParams.append('branch', filters.branch)
    if (filters.semester) queryParams.append('semester', filters.semester)
    if (filters.faculty) queryParams.append('faculty', filters.faculty)
    if (filters.active !== undefined) queryParams.append('active', filters.active)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)
    
    return apiRequest(`/courses?${queryParams.toString()}`)
  },
  getCourse: (id) => 
    apiRequest(`/courses/${id}`),

  createCourse: (data) => 
    apiRequest('/courses', {
      method: 'POST',
      body: data
    }),

  updateCourse: (id, data) => 
    apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: data
    }),

  deleteCourse: (id) => 
    apiRequest(`/courses/${id}`, {
      method: 'DELETE'
    }),

  enrollStudent: (courseId, studentId) => 
    apiRequest(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: { studentId }
    }),

  unenrollStudent: (courseId, studentId) => 
    apiRequest(`/courses/${courseId}/unenroll`, {
      method: 'POST',
      body: { studentId }
    }),

  getCourseStudents: (courseId) => 
    apiRequest(`/courses/${courseId}/students`),

  getStudentCourses: (studentId) => 
    apiRequest(`/courses/students/${studentId}/courses`)
}

// Quiz API
export const quizAPI = {
  getQuizzes: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/quizzes${queryParams ? `?${queryParams}` : ""}`)
  },

  getQuiz: (id) => apiRequest(`/quizzes/${id}`),

  createQuiz: (quizData) =>
    apiRequest("/quizzes", {
      method: "POST",
      body: quizData,
    }),

  updateQuiz: (id, quizData) =>
    apiRequest(`/quizzes/${id}`, {
      method: "PUT",
      body: quizData,
    }),

  deleteQuiz: (id) => apiRequest(`/quizzes/${id}`, { method: "DELETE" }),

  verifyQuizCode: (code) =>
    apiRequest("/quizzes/verify-code", {
      method: "POST",
      body: { code },
    }),

  attemptQuiz: (quizId, answers) =>
    apiRequest(`/quizzes/${quizId}/attempt`, {
      method: "POST",
      body: { answers },
    }),

  updateAttempt: (quizId, attemptId, data) =>
    apiRequest(`/quizzes/${quizId}/attempts/${attemptId}`, {
      method: "PUT",
      body: data,
    }),

  getStudentAttempts: (studentId) => apiRequest(`/students/${studentId}/quiz-attempts`),

  getQuizAttempts: (quizId) => apiRequest(`/quizzes/${quizId}/attempts`),

  generateQuizCode: (quizId) => apiRequest(`/quizzes/${quizId}/generate-code`, { method: "POST" }),

  getQuizResults: (quizId) =>
    apiRequest(`/quizzes/results/${quizId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
  cancelQuiz: (quizId) =>
    apiRequest(`/quizzes/cancel/${quizId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
}

// Attendance API
export const attendanceAPI = {
  getAttendance: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/attendance${queryParams ? `?${queryParams}` : ""}`)
  },

  markAttendance: (attendanceData) =>
    apiRequest("/attendance", {
      method: "POST",
      body: attendanceData,
    }),

  updateAttendance: (id, attendanceData) =>
    apiRequest(`/attendance/${id}`, {
      method: "PUT",
      body: attendanceData,
    }),

  getStudentAttendance: (studentId, courseId = null) => {
    const endpoint = courseId
      ? `/students/${studentId}/attendance?courseId=${courseId}`
      : `/students/${studentId}/attendance`
    return apiRequest(endpoint)
  },

  getCourseAttendance: (courseId) => apiRequest(`/courses/${courseId}/attendance`),

  calculateNeeded: (data) =>
    apiRequest("/attendance/calculate-needed", {
      method: "POST",
      body: data,
    }),

  getAttendanceStats: (studentId, courseId) =>
    apiRequest(`/attendance/stats?studentId=${studentId}&courseId=${courseId}`),
}

// Assignments API
export const assignmentsAPI = {
  getAssignments: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/assignments${queryParams ? `?${queryParams}` : ""}`)
  },

  getAssignment: (id) => apiRequest(`/assignments/${id}`),

  createAssignment: (assignmentData) =>
    apiRequest("/assignments", {
      method: "POST",
      body: assignmentData,
    }),

  updateAssignment: (id, assignmentData) =>
    apiRequest(`/assignments/${id}`, {
      method: "PUT",
      body: assignmentData,
    }),

  deleteAssignment: (id) => apiRequest(`/assignments/${id}`, { method: "DELETE" }),

  submitAssignment: (assignmentId, submissionData) =>
    apiRequest(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: submissionData,
    }),

  gradeSubmission: (assignmentId, submissionId, gradeData) =>
    apiRequest(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
      method: "PUT",
      body: gradeData,
    }),

  getStudentAssignments: (studentId) => apiRequest(`/assignments/students/${studentId}/assignments`),

  getAssignmentSubmissions: (assignmentId) => apiRequest(`/assignments/${assignmentId}/submissions`),
}

// Fees API
export const feesAPI = {
  // getFees: (filters = {}) => {
  //   const queryParams = new URLSearchParams(filters).toString()
  //   return apiRequest(`/fees${queryParams ? `?${queryParams}` : ""}`)
  // },
  getFees: (params = {}) =>
    apiRequest(`/fees?${new URLSearchParams({
      ...params,
      timestamp: Date.now() // Prevent caching
    })}`),

  getFee: (id) => apiRequest(`/fees/${id}`),

  createFee: (feeData) =>
    apiRequest("/fees", {
      method: "POST",
      body: feeData,
    }),

  updateFee: (id, feeData) =>
    apiRequest(`/fees/${id}`, {
      method: "PUT",
      body: feeData,
    }),

  deleteFee: (id) => apiRequest(`/fees/${id}`, { method: "DELETE" }),

  payFee: (feeId, paymentData) =>
    apiRequest(`/fees/${feeId}/pay`, {
      method: "POST",
      body: paymentData,
    }),

  getStudentFees: (studentId) => apiRequest(`/fees/${studentId}`),

  getOverdueFees: () => apiRequest("/fees/overdue"),

  bulkCreateFees: (feesData) =>
    apiRequest("/fees/bulk", {
      method: "POST",
      body: { fees: feesData },
    }),

  getFeeStats: () => apiRequest("/fees/stats"),
}

// Events API
export const eventsAPI = {
  getEvents: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/events${queryParams ? `?${queryParams}` : ""}`)
  },

  getEvent: (id) => apiRequest(`/events/${id}`),

  createEvent: (eventData) =>
    apiRequest("/events", {
      method: "POST",
      body: eventData,
    }),

  updateEvent: (id, eventData) =>
    apiRequest(`/events/${id}`, {
      method: "PUT",
      body: eventData,
    }),

  deleteEvent: (id) => apiRequest(`/events/${id}`, { method: "DELETE" }),

  registerForEvent: (eventId, studentId) =>
    apiRequest(`/events/${eventId}/register`, {
      method: "POST",
      body: { studentId },
    }),

  unregisterFromEvent: (eventId, studentId) =>
    apiRequest(`/events/${eventId}/unregister`, {
      method: "POST",
      body: { studentId },
    }),

  getEventRegistrations: (eventId) => apiRequest(`/events/${eventId}/registrations`),
}

// Placements API
export const placementsAPI = {
  getPlacements: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/placements${queryParams ? `?${queryParams}` : ""}`)
  },

  getPlacement: (id) => apiRequest(`/placements/${id}`),

  createPlacement: (placementData) =>
    apiRequest("/placements", {
      method: "POST",
      body: placementData,
    }),

  updatePlacement: (id, placementData) =>
    apiRequest(`/placements/${id}`, {
      method: "PUT",
      body: placementData,
    }),

  deletePlacement: (id) => apiRequest(`/placements/${id}`, { method: "DELETE" }),

  applyForPlacement: (placementId, applicationData) =>
    apiRequest(`/placements/${placementId}/apply`, {
      method: "POST",
      body: applicationData,
    }),

  updateApplicationStatus: (placementId, applicationId, status) =>
    apiRequest(`/placements/${placementId}/applications/${applicationId}`, {
      method: "PUT",
      body: { status },
    }),

  getStudentApplications: (studentId) => apiRequest(`/students/${studentId}/placement-applications`),

  getPlacementApplications: (placementId) => apiRequest(`/placements/${placementId}/applications`),

  getPlacementStats: () => apiRequest("/placements/stats"),
}

// Notes API
export const notesAPI = {
  getNotes: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/notes${queryParams ? `?${queryParams}` : ""}`)
  },

  getNote: (id) => apiRequest(`/notes/${id}`),

  createNote: (noteData) =>
    apiRequest("/notes", {
      method: "POST",
      body: noteData,
    }),

  updateNote: (id, noteData) =>
    apiRequest(`/notes/${id}`, {
      method: "PUT",
      body: noteData,
    }),

  deleteNote: (id) => apiRequest(`/notes/${id}`, { method: "DELETE" }),

  getPYQs: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/notes/pyqs${queryParams ? `?${queryParams}` : ""}`)
  },

  createPYQ: (pyqData) =>
    apiRequest("/pyqs", {
      method: "POST",
      body: pyqData,
    }),

  downloadNote: (id) => apiRequest(`/notes/${id}/download`),

  likeNote: (id) => apiRequest(`/notes/${id}/like`, { method: "POST" }),

  commentOnNote: (id, comment) =>
    apiRequest(`/notes/${id}/comments`, {
      method: "POST",
      body: { comment },
    }),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (filters = {}) => 
    apiRequest(`/notifications?${new URLSearchParams(filters)}`),

  getNotification: (id) => 
    apiRequest(`/notifications/${id}`),

  createNotification: (data) => 
    apiRequest('/notifications', {
      method: 'POST',
      body: data
    }),

  updateNotification: (id, data) => 
    apiRequest(`/notifications/${id}`, {
      method: 'PUT',
      body: data
    }),

  deleteNotification: (id) => 
    apiRequest(`/notifications/${id}`, {
      method: 'DELETE'
    }),

  markAsRead: (id, userId) => 
    apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
      body: { userId }
    }),

  markAllAsRead: (userId) => 
    apiRequest(`/users/${userId}/notifications/read-all`, {
      method: 'PUT'
    }),

  getUserNotifications: (userId, params = {}) => 
    apiRequest(`/notifications/users/${userId}/notifications?${new URLSearchParams(params)}`),

  createBulkNotifications: (notifications, createdBy) => 
    apiRequest('/notifications/bulk', {
      method: 'POST',
      body: { notifications, createdBy }
    })
}

// AI Features API
export const aiAPI = {
  getCredits: (userId) => apiRequest(`/ai/credits/${userId}`),

  updateCredits: (userId, credits) =>
    apiRequest(`/ai/credits/${userId}`, {
      method: "PUT",
      body: { credits },
    }),

  generateResume: (userData) =>
    apiRequest("/ai/resume/generate", {
      method: "POST",
      body: userData,
    }),

  checkATS: (resumeData) =>
    apiRequest("/ai/ats/check", {
      method: "POST",
      body: resumeData,
    }),

  generateRoadmap: (preferences) =>
    apiRequest("/ai/roadmap/generate", {
      method: "POST",
      body: preferences,
    }),

  getCreditHistory: (userId) => apiRequest(`/ai/credits/${userId}/history`),

  bulkAllocateCredits: (allocationsData) =>
    apiRequest("/ai/credits/bulk-allocate", {
      method: "POST",
      body: allocationsData,
    }),
}

// Analytics API
export const analyticsAPI = {
  getDashboardStats: () => apiRequest("/analytics/dashboard"),

  getUserStats: () => apiRequest("/analytics/users"),

  getCourseStats: () => apiRequest("/analytics/courses"),

  getAttendanceStats: () => apiRequest("/analytics/attendance"),

  getPerformanceStats: () => apiRequest("/analytics/performance"),

  getPlacementStats: () => apiRequest("/analytics/placements"),

  getFeeStats: () => apiRequest("/analytics/fees"),

  getCustomReport: (reportParams) =>
    apiRequest("/analytics/custom-report", {
      method: "POST",
      body: reportParams,
    }),
}

// File Upload API
export const fileAPI = {
  uploadFile: (file, type = "general") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    return apiRequest("/files/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  },

  uploadMultipleFiles: (files, type = "general") => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    formData.append("type", type)

    return apiRequest("/files/upload-multiple", {
      method: "POST",
      body: formData,
      headers: {},
    })
  },

  deleteFile: (fileId) => apiRequest(`/files/${fileId}`, { method: "DELETE" }),

  getFile: (fileId) => apiRequest(`/files/${fileId}`),

  getFilesByType: (type) => apiRequest(`/files/type/${type}`),
}

export default {
  authAPI,
  usersAPI,
  coursesAPI,
  quizAPI,
  attendanceAPI,
  assignmentsAPI,
  feesAPI,
  eventsAPI,
  placementsAPI,
  notesAPI,
  notificationsAPI,
  aiAPI,
  analyticsAPI,
  fileAPI,
}

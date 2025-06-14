// src/services/attendanceService.js
import axiosInstance from './axiosInstance';

const ATTENDANCE_BASE_URL = '/attendance';

export const attendanceService = {
    /**
     * Record attendance (Faculty and Admin).
     * POST /api/attendance
     * @param {object} attendanceData - Data for recording attendance.
     */
    recordAttendance: async (attendanceData) => {
        try {
            const response = await axiosInstance.post(ATTENDANCE_BASE_URL, attendanceData);
            return response.data;
        } catch (error) {
            console.error('Error recording attendance:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to record attendance.');
        }
    },

    /**
     * Get attendance for a specific course (Faculty and Admin).
     * GET /api/attendance/course/:courseId
     * @param {string} courseId - The ID of the course.
     */
    getCourseAttendance: async (courseId) => {
        try {
            const response = await axiosInstance.get(`${ATTENDANCE_BASE_URL}/course/${courseId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching attendance for course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch attendance for course ${courseId}.`);
        }
    },

    /**
     * Update attendance record (Faculty and Admin).
     * PUT /api/attendance/:id
     * @param {string} attendanceId - The ID of the attendance record.
     * @param {object} updatedData - Updated attendance data.
     */
    updateAttendance: async (attendanceId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${ATTENDANCE_BASE_URL}/${attendanceId}`, updatedData);
            return response.data;
        } catch (error) {
            console.error(`Error updating attendance ${attendanceId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update attendance ${attendanceId}.`);
        }
    },

    /**
     * Get a student's attendance for a specific course.
     * GET /api/attendance/student/:studentId/course/:courseId
     * @param {string} studentId - The ID of the student.
     * @param {string} courseId - The ID of the course.
     */
    getStudentCourseAttendance: async (studentId, courseId) => {
        try {
            const response = await axiosInstance.get(`${ATTENDANCE_BASE_URL}/student/${studentId}/course/${courseId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching student ${studentId} attendance for course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch student attendance for course ${courseId}.`);
        }
    },

    /**
     * Calculate needed attendance for a student.
     * GET /api/attendance/calculate-needed
     */
    calculateNeededAttendance: async () => {
        try {
            const response = await axiosInstance.get(`${ATTENDANCE_BASE_URL}/calculate-needed`);
            return response.data;
        } catch (error) {
            console.error('Error calculating needed attendance:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to calculate needed attendance.');
        }
    },
};
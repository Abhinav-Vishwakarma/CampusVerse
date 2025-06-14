// src/services/courseService.js
import axiosInstance from './axiosInstance';

const COURSE_BASE_URL = '/courses'; // Base path for courses routes

export const courseService = {
    /**
     * Get all courses.
     * GET /api/courses
     */
    getAllCourses: async () => {
        try {
            const response = await axiosInstance.get(COURSE_BASE_URL);
            return response.data; // Assuming data is an array of courses
        } catch (error) {
            console.error('Error fetching all courses:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch courses.');
        }
    },

    /**
     * Get a specific course by ID.
     * GET /api/courses/:id
     * @param {string} courseId - The ID of the course.
     */
    getCourseById: async (courseId) => {
        try {
            const response = await axiosInstance.get(`${COURSE_BASE_URL}/${courseId}`);
            return response.data; // Assuming data is the course object
        } catch (error) {
            console.error(`Error fetching course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch course ${courseId}.`);
        }
    },

    /**
     * Create a new course (Faculty and Admin).
     * POST /api/courses
     * @param {object} courseData - Data for the new course.
     */
    createCourse: async (courseData) => {
        try {
            const response = await axiosInstance.post(COURSE_BASE_URL, courseData);
            return response.data; // Assuming data is the newly created course
        } catch (error) {
            console.error('Error creating course:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create course.');
        }
    },

    /**
     * Update an existing course (Faculty and Admin).
     * PUT /api/courses/:id
     * @param {string} courseId - The ID of the course to update.
     * @param {object} updatedData - The updated course data.
     */
    updateCourse: async (courseId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${COURSE_BASE_URL}/${courseId}`, updatedData);
            return response.data; // Assuming data is the updated course
        } catch (error) {
            console.error(`Error updating course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update course ${courseId}.`);
        }
    },

    /**
     * Delete a course (Admin only).
     * DELETE /api/courses/:id
     * @param {string} courseId - The ID of the course to delete.
     */
    deleteCourse: async (courseId) => {
        try {
            const response = await axiosInstance.delete(`${COURSE_BASE_URL}/${courseId}`);
            return response.data; // Or a success message/status
        } catch (error) {
            console.error(`Error deleting course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete course ${courseId}.`);
        }
    },

    /**
     * Enroll a student in a course (Student only).
     * POST /api/courses/:id/enroll
     * @param {string} courseId - The ID of the course to enroll in.
     */
    enrollInCourse: async (courseId) => {
        try {
            const response = await axiosInstance.post(`${COURSE_BASE_URL}/${courseId}/enroll`);
            return response.data; // Success message or enrollment confirmation
        } catch (error) {
            console.error(`Error enrolling in course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to enroll in course ${courseId}.`);
        }
    },

    /**
     * Add course materials (Faculty and Admin).
     * POST /api/courses/:id/materials
     * @param {string} courseId - The ID of the course to add materials to.
     * @param {object} materialData - Data for the course material.
     */
    addCourseMaterial: async (courseId, materialData) => {
        try {
            const response = await axiosInstance.post(`${COURSE_BASE_URL}/${courseId}/materials`, materialData);
            return response.data; // Success message or material details
        } catch (error) {
            console.error(`Error adding material to course ${courseId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to add material to course ${courseId}.`);
        }
    },
};
// src/services/aiService.js
import axiosInstance from './axiosInstance';

const AI_BASE_URL = '/ai'; // Base path for AI routes

export const aiService = {
    /**
     * Gets available AI credits for the current user.
     * GET /api/ai/credits
     */
    getAiCredits: async () => {
        try {
            const response = await axiosInstance.get(`${AI_BASE_URL}/credits`);
            return response.data; // Assuming data contains credits info
        } catch (error) {
            console.error('Error fetching AI credits:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch AI credits.');
        }
    },

    /**
     * Generates a career roadmap based on provided data.
     * POST /api/ai/roadmap
     * @param {object} data - Data for roadmap generation (e.g., skills, interests).
     */
    generateRoadmap: async (data) => {
        try {
            const response = await axiosInstance.post(`${AI_BASE_URL}/roadmap`, data);
            return response.data; // Assuming data contains the generated roadmap
        } catch (error) {
            console.error('Error generating roadmap:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to generate roadmap.');
        }
    },

    /**
     * Generates an AI-powered resume.
     * POST /api/ai/resume
     * @param {object} data - Data for resume generation.
     */
    generateResume: async (data) => {
        try {
            const response = await axiosInstance.post(`${AI_BASE_URL}/resume`, data);
            return response.data; // Assuming data contains the generated resume
        } catch (error) {
            console.error('Error generating resume:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to generate resume.');
        }
    },

    /**
     * Performs an ATS (Applicant Tracking System) check on a resume.
     * POST /api/ai/ats-check
     * @param {object} data - Resume content for ATS check.
     */
    performAtsCheck: async (data) => {
        try {
            const response = await axiosInstance.post(`${AI_BASE_URL}/ats-check`, data);
            return response.data; // Assuming data contains ATS check results
        } catch (error) {
            console.error('Error performing ATS check:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to perform ATS check.');
        }
    },

    /**
     * Gets the user's AI history.
     * GET /api/ai/history
     */
    getAiHistory: async () => {
        try {
            const response = await axiosInstance.get(`${AI_BASE_URL}/history`);
            return response.data; // Assuming data contains AI usage history
        } catch (error) {
            console.error('Error fetching AI history:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch AI history.');
        }
    },

    /**
     * Gets AI usage statistics (Admin only).
     * GET /api/ai/statistics
     */
    getAiStatistics: async () => {
        try {
            const response = await axiosInstance.get(`${AI_BASE_URL}/statistics`);
            return response.data; // Assuming data contains AI statistics
        } catch (error) {
            console.error('Error fetching AI statistics:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch AI statistics.');
        }
    },
};
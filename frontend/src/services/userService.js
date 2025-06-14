// src/services/userService.js
import axiosInstance from './axiosInstance';

const USER_BASE_URL = '/users';

export const userService = {
    /**
     * Get all users (Admin only).
     * GET /api/users/
     */
    getAllUsers: async () => {
        try {
            const response = await axiosInstance.get(`${USER_BASE_URL}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching all users:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch all users.');
        }
    },

    /**
     * Get dashboard statistics (User-specific).
     * GET /api/users/dashboard-stats
     */
    getDashboardStats: async () => {
        try {
            const response = await axiosInstance.get(`${USER_BASE_URL}/dashboard-stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard statistics:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch dashboard statistics.');
        }
    },

    /**
     * Get a specific user by ID.
     * GET /api/users/:id
     * @param {string} userId - The ID of the user.
     */
    getUserById: async (userId) => {
        try {
            const response = await axiosInstance.get(`${USER_BASE_URL}/${userId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch user ${userId}.`);
        }
    },

    /**
     * Update a user by ID (Admin only).
     * PUT /api/users/:id
     * @param {string} userId - The ID of the user to update.
     * @param {object} updatedData - The updated user data.
     */
    updateUser: async (userId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${USER_BASE_URL}/${userId}`, updatedData);
            return response.data;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update user ${userId}.`);
        }
    },

    /**
     * Delete a user by ID (Admin only).
     * DELETE /api/users/:id
     * @param {string} userId - The ID of the user to delete.
     */
    deleteUser: async (userId) => {
        try {
            const response = await axiosInstance.delete(`${USER_BASE_URL}/${userId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete user ${userId}.`);
        }
    },
};
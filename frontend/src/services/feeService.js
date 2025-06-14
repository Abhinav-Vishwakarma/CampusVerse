// src/services/feeService.js
import axiosInstance from './axiosInstance';

const FEE_BASE_URL = '/fees';

export const feeService = {
    /**
     * Get student's fees (Student only).
     * GET /api/fees/student
     */
    getStudentFees: async () => {
        try {
            const response = await axiosInstance.get(`${FEE_BASE_URL}/student`);
            return response.data;
        } catch (error) {
            console.error('Error fetching student fees:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch student fees.');
        }
    },

    /**
     * Create a new fee record (Admin only).
     * POST /api/fees
     * @param {object} feeData - Data for the new fee record.
     */
    createFee: async (feeData) => {
        try {
            const response = await axiosInstance.post(FEE_BASE_URL, feeData);
            return response.data;
        } catch (error) {
            console.error('Error creating fee record:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create fee record.');
        }
    },

    /**
     * Get all fee records (Admin only).
     * GET /api/fees
     */
    getAllFees: async () => {
        try {
            const response = await axiosInstance.get(FEE_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all fees:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch all fees.');
        }
    },

    /**
     * Get a specific fee record by ID.
     * GET /api/fees/:id
     * @param {string} feeId - The ID of the fee record.
     */
    getFeeById: async (feeId) => {
        try {
            const response = await axiosInstance.get(`${FEE_BASE_URL}/${feeId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching fee ${feeId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch fee ${feeId}.`);
        }
    },

    /**
     * Update a fee record (Admin only).
     * PUT /api/fees/:id
     * @param {string} feeId - The ID of the fee record to update.
     * @param {object} updatedData - The updated fee data.
     */
    updateFee: async (feeId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${FEE_BASE_URL}/${feeId}`, updatedData);
            return response.data;
        } catch (error) {
            console.error(`Error updating fee ${feeId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update fee ${feeId}.`);
        }
    },

    /**
     * Record a payment for a fee (Admin only).
     * POST /api/fees/:id/payment
     * @param {string} feeId - The ID of the fee record to record payment for.
     * @param {object} paymentData - Payment details.
     */
    recordPayment: async (feeId, paymentData) => {
        try {
            const response = await axiosInstance.post(`${FEE_BASE_URL}/${feeId}/payment`, paymentData);
            return response.data;
        } catch (error) {
            console.error(`Error recording payment for fee ${feeId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to record payment for fee ${feeId}.`);
        }
    },

    /**
     * Get overdue fees (Admin only).
     * GET /api/fees/overdue
     */
    getOverdueFees: async () => {
        try {
            const response = await axiosInstance.get(`${FEE_BASE_URL}/overdue`);
            return response.data;
        } catch (error) {
            console.error('Error fetching overdue fees:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch overdue fees.');
        }
    },

    /**
     * Get fee statistics (Admin only).
     * GET /api/fees/statistics
     */
    getFeeStatistics: async () => {
        try {
            const response = await axiosInstance.get(`${FEE_BASE_URL}/statistics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching fee statistics:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch fee statistics.');
        }
    },

    /**
     * Delete a fee record (Admin only).
     * DELETE /api/fees/:id
     * @param {string} feeId - The ID of the fee record to delete.
     */
    deleteFee: async (feeId) => {
        try {
            const response = await axiosInstance.delete(`${FEE_BASE_URL}/${feeId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting fee ${feeId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete fee ${feeId}.`);
        }
    },
};
// src/services/placementService.js
import axiosInstance from './axiosInstance';

const PLACEMENT_BASE_URL = '/placements';

export const placementService = {
    /**
     * Get all placements.
     * GET /api/placements
     */
    getAllPlacements: async () => {
        try {
            const response = await axiosInstance.get(PLACEMENT_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all placements:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch placements.');
        }
    },

    /**
     * Get a specific placement by ID.
     * GET /api/placements/:id
     * @param {string} placementId - The ID of the placement.
     */
    getPlacementById: async (placementId) => {
        try {
            const response = await axiosInstance.get(`${PLACEMENT_BASE_URL}/${placementId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching placement ${placementId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch placement ${placementId}.`);
        }
    },

    /**
     * Apply for a placement (Student only).
     * POST /api/placements/:id/apply
     * @param {string} placementId - The ID of the placement to apply for.
     */
    applyForPlacement: async (placementId) => {
        try {
            const response = await axiosInstance.post(`${PLACEMENT_BASE_URL}/${placementId}/apply`);
            return response.data;
        } catch (error) {
            console.error(`Error applying for placement ${placementId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to apply for placement ${placementId}.`);
        }
    },

    /**
     * Create a new placement (Faculty and Admin).
     * POST /api/placements
     * @param {object} placementData - Data for the new placement.
     */
    createPlacement: async (placementData) => {
        try {
            const response = await axiosInstance.post(PLACEMENT_BASE_URL, placementData);
            return response.data;
        } catch (error) {
            console.error('Error creating placement:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create placement.');
        }
    },

    /**
     * Update an existing placement (Faculty and Admin).
     * PUT /api/placements/:id
     * @param {string} placementId - The ID of the placement to update.
     * @param {object} updatedData - The updated placement data.
     */
    updatePlacement: async (placementId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${PLACEMENT_BASE_URL}/${placementId}`, updatedData);
            return response.data;
        } catch (error) {
            console.error(`Error updating placement ${placementId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update placement ${placementId}.`);
        }
    },

    /**
     * Update applicant status for a placement (Faculty and Admin).
     * PUT /api/placements/:id/applicants/:applicantId
     * @param {string} placementId - The ID of the placement.
     * @param {string} applicantId - The ID of the applicant.
     * @param {object} statusData - Data to update applicant status.
     */
    updateApplicantStatus: async (placementId, applicantId, statusData) => {
        try {
            const response = await axiosInstance.put(`${PLACEMENT_BASE_URL}/${placementId}/applicants/${applicantId}`, statusData);
            return response.data;
        } catch (error) {
            console.error(`Error updating applicant ${applicantId} for placement ${placementId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update applicant ${applicantId}.`);
        }
    },

    /**
     * Get placement statistics (Faculty and Admin).
     * GET /api/placements/statistics
     */
    getPlacementStatistics: async () => {
        try {
            const response = await axiosInstance.get(`${PLACEMENT_BASE_URL}/statistics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching placement statistics:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch placement statistics.');
        }
    },

    /**
     * Delete a placement (Admin only).
     * DELETE /api/placements/:id
     * @param {string} placementId - The ID of the placement to delete.
     */
    deletePlacement: async (placementId) => {
        try {
            const response = await axiosInstance.delete(`${PLACEMENT_BASE_URL}/${placementId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting placement ${placementId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete placement ${placementId}.`);
        }
    },
};
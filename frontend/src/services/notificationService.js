// src/services/notificationService.js
import axiosInstance from './axiosInstance';

const NOTIFICATION_BASE_URL = '/notifications';

export const notificationService = {
    /**
     * Get all notifications for the current user.
     * GET /api/notifications
     */
    getAllNotifications: async () => {
        try {
            const response = await axiosInstance.get(NOTIFICATION_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all notifications:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch notifications.');
        }
    },

    /**
     * Get unread notification count for the current user.
     * GET /api/notifications/unread-count
     */
    getUnreadCount: async () => {
        try {
            const response = await axiosInstance.get(`${NOTIFICATION_BASE_URL}/unread-count`);
            return response.data;
        } catch (error) {
            console.error('Error fetching unread notification count:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch unread count.');
        }
    },

    /**
     * Mark a specific notification as read.
     * PUT /api/notifications/:id/read
     * @param {string} notificationId - The ID of the notification to mark as read.
     */
    markNotificationAsRead: async (notificationId) => {
        try {
            const response = await axiosInstance.put(`${NOTIFICATION_BASE_URL}/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to mark notification ${notificationId} as read.`);
        }
    },

    /**
     * Mark all notifications as read for the current user.
     * PUT /api/notifications/mark-all-read
     */
    markAllNotificationsAsRead: async () => {
        try {
            const response = await axiosInstance.put(`${NOTIFICATION_BASE_URL}/mark-all-read`);
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to mark all notifications as read.');
        }
    },

    /**
     * Create a new notification (Faculty and Admin).
     * POST /api/notifications
     * @param {object} notificationData - Data for the new notification.
     */
    createNotification: async (notificationData) => {
        try {
            const response = await axiosInstance.post(NOTIFICATION_BASE_URL, notificationData);
            return response.data;
        } catch (error) {
            console.error('Error creating notification:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create notification.');
        }
    },

    /**
     * Delete a notification (Faculty and Admin).
     * DELETE /api/notifications/:id
     * @param {string} notificationId - The ID of the notification to delete.
     */
    deleteNotification: async (notificationId) => {
        try {
            const response = await axiosInstance.delete(`${NOTIFICATION_BASE_URL}/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting notification ${notificationId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete notification ${notificationId}.`);
        }
    },

    /**
     * Send an alert notification (Admin only).
     * POST /api/notifications/alert
     * @param {object} alertData - Data for the alert notification.
     */
    sendAlert: async (alertData) => {
        try {
            const response = await axiosInstance.post(`${NOTIFICATION_BASE_URL}/alert`, alertData);
            return response.data;
        } catch (error) {
            console.error('Error sending alert notification:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to send alert notification.');
        }
    },

    /**
     * Get notification statistics (Admin only).
     * GET /api/notifications/statistics
     */
    getNotificationStatistics: async () => {
        try {
            const response = await axiosInstance.get(`${NOTIFICATION_BASE_URL}/statistics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notification statistics:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch notification statistics.');
        }
    },
};
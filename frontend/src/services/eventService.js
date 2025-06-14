// src/services/eventService.js
import axiosInstance from './axiosInstance';

const EVENT_BASE_URL = '/events';

export const eventService = {
    /**
     * Get all events.
     * GET /api/events
     */
    getAllEvents: async () => {
        try {
            const response = await axiosInstance.get(EVENT_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all events:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch events.');
        }
    },

    /**
     * Get a specific event by ID.
     * GET /api/events/:id
     * @param {string} eventId - The ID of the event.
     */
    getEventById: async (eventId) => {
        try {
            const response = await axiosInstance.get(`${EVENT_BASE_URL}/${eventId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching event ${eventId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch event ${eventId}.`);
        }
    },

    /**
     * Register for an event.
     * POST /api/events/:id/register
     * @param {string} eventId - The ID of the event to register for.
     */
    registerForEvent: async (eventId) => {
        try {
            const response = await axiosInstance.post(`${EVENT_BASE_URL}/${eventId}/register`);
            return response.data;
        } catch (error) {
            console.error(`Error registering for event ${eventId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to register for event ${eventId}.`);
        }
    },

    /**
     * Create a new event (Faculty and Admin).
     * POST /api/events
     * @param {object} eventData - Data for the new event.
     */
    createEvent: async (eventData) => {
        try {
            const response = await axiosInstance.post(EVENT_BASE_URL, eventData);
            return response.data;
        } catch (error) {
            console.error('Error creating event:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create event.');
        }
    },

    /**
     * Update an existing event (Faculty and Admin).
     * PUT /api/events/:id
     * @param {string} eventId - The ID of the event to update.
     * @param {object} updatedData - The updated event data.
     */
    updateEvent: async (eventId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${EVENT_BASE_URL}/${eventId}`, updatedData);
            return response.data;
        } catch (error) {
            console.error(`Error updating event ${eventId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update event ${eventId}.`);
        }
    },

    /**
     * Delete an event (Faculty and Admin).
     * DELETE /api/events/:id
     * @param {string} eventId - The ID of the event to delete.
     */
    deleteEvent: async (eventId) => {
        try {
            const response = await axiosInstance.delete(`${EVENT_BASE_URL}/${eventId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting event ${eventId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete event ${eventId}.`);
        }
    },

    /**
     * Get registrations for a specific event (Faculty and Admin).
     * GET /api/events/:id/registrations
     * @param {string} eventId - The ID of the event.
     */
    getEventRegistrations: async (eventId) => {
        try {
            const response = await axiosInstance.get(`${EVENT_BASE_URL}/${eventId}/registrations`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching registrations for event ${eventId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch registrations for event ${eventId}.`);
        }
    },
};
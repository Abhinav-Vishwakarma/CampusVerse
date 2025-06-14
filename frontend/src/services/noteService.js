// src/services/noteService.js
import axiosInstance from './axiosInstance';

const NOTE_BASE_URL = '/notes';
const PYQ_BASE_URL = '/notes/pyq';

export const noteService = {
    /**
     * Get all notes.
     * GET /api/notes
     */
    getAllNotes: async () => {
        try {
            const response = await axiosInstance.get(NOTE_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all notes:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch notes.');
        }
    },

    /**
     * Get a specific note by ID.
     * GET /api/notes/:id
     * @param {string} noteId - The ID of the note.
     */
    getNoteById: async (noteId) => {
        try {
            const response = await axiosInstance.get(`${NOTE_BASE_URL}/${noteId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching note ${noteId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch note ${noteId}.`);
        }
    },

    /**
     * Get all Previous Year Questions (PYQ).
     * GET /api/notes/pyq
     */
    getAllPyq: async () => {
        try {
            const response = await axiosInstance.get(PYQ_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all PYQ:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch PYQ.');
        }
    },

    /**
     * Get a specific PYQ by ID.
     * GET /api/notes/pyq/:id
     * @param {string} pyqId - The ID of the PYQ.
     */
    getPyqById: async (pyqId) => {
        try {
            const response = await axiosInstance.get(`${PYQ_BASE_URL}/${pyqId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching PYQ ${pyqId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch PYQ ${pyqId}.`);
        }
    },

    /**
     * Create a new note (Faculty and Admin).
     * POST /api/notes
     * @param {object} noteData - Data for the new note.
     */
    createNote: async (noteData) => {
        try {
            const response = await axiosInstance.post(NOTE_BASE_URL, noteData);
            return response.data;
        } catch (error) {
            console.error('Error creating note:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create note.');
        }
    },

    /**
     * Update an existing note (Faculty and Admin).
     * PUT /api/notes/:id
     * @param {string} noteId - The ID of the note to update.
     * @param {object} updatedData - The updated note data.
     */
    updateNote: async (noteId, updatedData) => {
        try {
            const response = await axiosInstance.put(`${NOTE_BASE_URL}/${noteId}`, updatedData);
            return response.data;
        } catch (error) {
            console.error(`Error updating note ${noteId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to update note ${noteId}.`);
        }
    },

    /**
     * Delete a note (Faculty and Admin).
     * DELETE /api/notes/:id
     * @param {string} noteId - The ID of the note to delete.
     */
    deleteNote: async (noteId) => {
        try {
            const response = await axiosInstance.delete(`${NOTE_BASE_URL}/${noteId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting note ${noteId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete note ${noteId}.`);
        }
    },

    /**
     * Create a new PYQ (Faculty and Admin).
     * POST /api/notes/pyq
     * @param {object} pyqData - Data for the new PYQ.
     */
    createPyq: async (pyqData) => {
        try {
            const response = await axiosInstance.post(PYQ_BASE_URL, pyqData);
            return response.data;
        } catch (error) {
            console.error('Error creating PYQ:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create PYQ.');
        }
    },

    /**
     * Delete a PYQ (Faculty and Admin).
     * DELETE /api/notes/pyq/:id
     * @param {string} pyqId - The ID of the PYQ to delete.
     */
    deletePyq: async (pyqId) => {
        try {
            const response = await axiosInstance.delete(`${PYQ_BASE_URL}/${pyqId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting PYQ ${pyqId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to delete PYQ ${pyqId}.`);
        }
    },
};
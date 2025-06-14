// src/services/authService.js
import axiosInstance from './axiosInstance';

const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile', // Used for GET and PUT profile
    GOOGLE_DRIVE_CALLBACK: '/auth/google-drive/callback', // Public
    GOOGLE_DRIVE: '/auth/google-drive', // Public
};

/**
 * Handles user login.
 * @param {object} credentials - User login credentials (e.g., { email, password }).
 * @returns {Promise<object>} - A promise that resolves with the token and user data.
 */
export const login = async (credentials) => {
    try {
        const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, credentials);
        // Assuming your backend returns { token: 'jwt_token', user: { id, name, role, ... } }
        return response.data;
    } catch (error) {
        console.error('Login API Error:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Network or server error');
    }
};

/**
 * Handles user registration.
 * @param {object} userData - User registration data (e.g., { name, email, password, role }).
 * @returns {Promise<object>} - A promise that resolves with the token and registered user data.
 */
export const register = async (userData) => {
    try {
        const response = await axiosInstance.post(AUTH_ENDPOINTS.REGISTER, userData);
        // Assuming your backend returns { token: 'jwt_token', user: { id, name, role, ... } }
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Network or server error');
    }
};

/**
 * Fetches the current authenticated user's profile details.
 * GET /api/auth/profile
 * @returns {Promise<object>} - A promise that resolves with the current user's data.
 */
export const getProfile = async () => {
    try {
        const response = await axiosInstance.get(AUTH_ENDPOINTS.PROFILE);
        return response.data; // Assuming backend returns current user's profile
    } catch (error) {
        console.error('Get Profile API Error:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Network or server error');
    }
};

/**
 * Updates the current authenticated user's profile details.
 * PUT /api/auth/profile
 * @param {object} profileData - Data to update the user's profile.
 * @returns {Promise<object>} - A promise that resolves with the updated user data.
 */
export const updateProfile = async (profileData) => {
    try {
        const response = await axiosInstance.put(AUTH_ENDPOINTS.PROFILE, profileData);
        return response.data; // Assuming backend returns the updated user profile
    } catch (error) {
        console.error('Update Profile API Error:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Network or server error');
    }
};

/**
 * Initiates Google Drive authentication.
 * GET /api/auth/google-drive
 */
export const initiateGoogleDriveAuth = async () => {
    try {
        // This likely redirects to Google's OAuth page
        // The frontend will typically just open this URL in a new window/tab
        // or redirect the current page.
        // For a simple button click, you might just link to the backend route directly.
        const response = await axiosInstance.get(AUTH_ENDPOINTS.GOOGLE_DRIVE);
        return response.data; // May return a redirect URL or success message
    } catch (error) {
        console.error('Initiate Google Drive Auth Error:', error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to initiate Google Drive authentication.');
    }
};

/**
 * Handles Google Drive callback (this is typically handled by the backend redirect).
 * GET /api/auth/google-drive/callback
 * You likely won't call this directly from the frontend; the backend handles the redirect.
 * This is more for reference.
 */
// export const handleGoogleDriveCallback = async () => { /* ... */ };


/**
 * Handles user logout.
 * Note: For JWTs, logout on the client-side often just means removing the token.
 * A backend logout endpoint might be used to invalidate tokens on the server if sessions are managed.
 * This function just clears client-side state.
 * @returns {Promise<void>}
 */
export const logout = async () => {
    // If your backend has a /logout endpoint to invalidate tokens or sessions:
    // try {
    //     await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
    // } catch (error) {
    //     console.error('Backend logout failed:', error);
    // }
    // No explicit return needed for a client-side logout
    return Promise.resolve(); // Resolve immediately for client-side token removal
};
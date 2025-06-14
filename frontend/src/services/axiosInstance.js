// src/services/axiosInstance.js
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add authorization token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Or wherever you store your token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Example: Redirect to login on 401
        if (error.response && error.response.status === 401) {
            // You might want to clear token and redirect
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Or use react-router-dom navigate
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
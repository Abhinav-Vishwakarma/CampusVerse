// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService'; // We will create this next
import { useNavigate } from 'react-router-dom';

// Create the Auth Context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores user data if authenticated
    const [isAuthenticated, setIsAuthenticated] = useState(false); // True if logged in
    const [loading, setLoading] = useState(true); // To indicate initial auth check is ongoing
    const navigate = useNavigate();

    // Function to load user from local storage or check token validity
    const loadUser = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // You might have an API endpoint to verify the token and get user data
                // For now, let's assume if token exists, user is authenticated,
                // and we'll try to fetch user details if needed.
                const userData = await authService.getCurrentUser(token); // Example: Fetch user data with token
                setUser(userData); // Set full user object
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Token validation failed or user data fetch error:', error);
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
        setLoading(false);
    };

    // Effect to load user on initial component mount
    useEffect(() => {
        loadUser();
    }, []); // Empty dependency array means this runs once on mount

    // --- Authentication Actions ---

    const login = async (credentials) => {
        setLoading(true);
        try {
            const { token, user: userData } = await authService.login(credentials);
            localStorage.setItem('token', token);
            setUser(userData); // Store full user object from backend response
            setIsAuthenticated(true);
            setLoading(false);
            // Navigate to dashboard based on role or a default dashboard
            if (userData && userData.role) {
                navigate(`/${userData.role}/dashboard`);
            } else {
                navigate('/student/dashboard'); // Default if role is not explicitly returned/handled
            }
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            // Return error for UI to display
            throw error; // Re-throw to be caught by component
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            const { token, user: registeredUser } = await authService.register(userData);
            localStorage.setItem('token', token);
            setUser(registeredUser);
            setIsAuthenticated(true);
            setLoading(false);
            if (registeredUser && registeredUser.role) {
                navigate(`/${registeredUser.role}/dashboard`);
            } else {
                navigate('/student/dashboard'); // Default
            }
            return { success: true };
        } catch (error) {
            console.error('Registration failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        // Navigate to login page after logout
        navigate('/login');
    };

    // The value provided by the context to its consumers
    const authContextValue = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        // Potentially add a refetchUser function if user data can change frequently
    };

    // Render the provider, passing the value to children
    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
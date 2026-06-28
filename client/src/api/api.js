// client/src/api/api.js
// Global API layer — all backend communication goes through here
// Uses axios to make HTTP requests to our Express backend

import axios from 'axios';

// Read the backend URL from the .env file
// VITE_API_URL=http://localhost:5000/api
// In Vite, environment variables must start with VITE_ to be accessible
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// CREATE AXIOS INSTANCE
// ============================================
// Instead of using axios directly, we create a custom instance
// with pre-configured settings that apply to every request
const api = axios.create({
    baseURL: BASE_URL,
    // baseURL is prepended to every request URL
    // So api.get('/projects') becomes http://localhost:5000/api/projects

    headers: {
        'Content-Type': 'application/json'
        // Tell the backend we are sending JSON data
    }
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
// An interceptor runs automatically before every request is sent
// We use it to attach the JWT token to every request
// So we don't have to manually add the token in every component
api.interceptors.request.use(
    (config) => {
        // Read the token from localStorage
        // localStorage is a browser storage that persists across page refreshes
        const token = localStorage.getItem('token');

        // If token exists, add it to the Authorization header
        // The backend's authMiddleware reads this header to verify the user
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
        // Return the modified config so the request can proceed
    },
    (error) => {
        // If something goes wrong before the request is sent
        return Promise.reject(error);
    }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
// Runs automatically after every response is received
// We use it to handle global errors like expired tokens
api.interceptors.response.use(
    (response) => {
        // If response is successful (2xx status), just return it
        return response;
    },
    (error) => {
        // If response has an error status

        // 401 means Unauthorized — token is expired or invalid
        if (error.response?.status === 401) {
            // Remove the invalid token from localStorage
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = '/login';
        }

        return Promise.reject(error);
        // Pass the error along so individual components can handle it
    }
);

export default api;
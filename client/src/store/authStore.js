// client/src/store/authStore.js
// Global authentication state manager using Zustand
// Any component in the app can read or update auth state from here

import { create } from 'zustand';
import api from '../api/api';

// ============================================
// WHAT IS A ZUSTAND STORE?
// A store is an object that holds:
// 1. STATE  — the data (user, token, isLoading)
// 2. ACTIONS — functions that update the state (login, logout, signup)
//
// create() takes a function that receives 'set'
// 'set' is how you update the state
// set({ user: null }) — updates the user field to null
// ============================================

const useAuthStore = create((set) => ({

    // ============================================
    // INITIAL STATE
    // ============================================

    // user — the currently logged in user object
    // null means nobody is logged in
    user: null,

    // token — the JWT token stored in memory
    // We also store it in localStorage for persistence across page refreshes
    token: localStorage.getItem('token') || null,
    // localStorage.getItem('token') reads the token from browser storage
    // If no token exists, default to null

    // isLoading — true while an auth request is in progress
    // Used to show loading spinners in the UI
    isLoading: false,

    // isAuthenticated — true if user is logged in
    // Computed from whether token exists
    isAuthenticated: !!localStorage.getItem('token'),
    // !! converts a value to boolean
    // !!null = false, !!'eyJhbGci...' = true

    // error — stores any auth error message
    // Displayed in the UI when login or signup fails
    error: null,


    // ============================================
    // ACTION 1 — signup
    // ============================================
    // Called when user submits the signup form
    // Sends name, email, password to the backend
    // Stores the returned token and user data
    // ============================================
    signup: async (name, email, password) => {
        // Set loading to true while request is in progress
        set({ isLoading: true, error: null });

        try {
            // POST /api/auth/signup
            const response = await api.post('/auth/signup', {
                name,
                email,
                password
            });

            const { token, user } = response.data;
            // Extract token and user from the response

            // Store token in localStorage so it persists after page refresh
            localStorage.setItem('token', token);

            // Update the global store with user data and token
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            return { success: true };
            // Return success so the component knows to redirect

        } catch (error) {
            // Extract error message from backend response
            const message = error.response?.data?.message || 'Signup failed';

            set({
                isLoading: false,
                error: message,
                isAuthenticated: false
            });

            return { success: false, message };
        }
    },


    // ============================================
    // ACTION 2 — login
    // ============================================
    // Called when user submits the login form
    // Verifies credentials with backend
    // Stores the returned token and user data
    // ============================================
    login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
            // POST /api/auth/login
            const response = await api.post('/auth/login', {
                email,
                password
            });

            const { token, user } = response.data;

            // Store token in localStorage
            localStorage.setItem('token', token);

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            return { success: true };

        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';

            set({
                isLoading: false,
                error: message,
                isAuthenticated: false
            });

            return { success: false, message };
        }
    },


    // ============================================
    // ACTION 3 — logout
    // ============================================
    // Clears all auth state and removes token from localStorage
    // Called when user clicks the logout button
    // ============================================
    logout: () => {
        // Remove token from localStorage
        localStorage.removeItem('token');

        // Reset all auth state to initial values
        set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
        });
    },


    // ============================================
    // ACTION 4 — getProfile
    // ============================================
    // Called when the app loads to restore the logged in user
    // Sends the stored token to the backend and gets back user data
    // This is how the app remembers who is logged in after a page refresh
    // ============================================
    getProfile: async () => {
        // If no token exists, no point making a request
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false });
            return;
        }

        set({ isLoading: true });

        try {
            // GET /api/auth/me — protected route
            // The token is automatically attached by our axios interceptor
            const response = await api.get('/auth/me');

            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false
            });

        } catch (error) {
            // Token is invalid or expired — clear everything
            localStorage.removeItem('token');

            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    },


    // ============================================
    // ACTION 5 — clearError
    // ============================================
    // Clears the error message from the store
    // Called when user starts typing again after an error
    // ============================================
    clearError: () => set({ error: null })

}));

export default useAuthStore;
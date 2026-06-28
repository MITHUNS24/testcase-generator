// client/src/pages/LoginPage.jsx
// Login page — existing users enter email and password here

import { useState } from 'react'
// useState is a React hook for storing local component state
// Example: const [email, setEmail] = useState('')
// email — the current value
// setEmail — function to update the value
// '' — the initial value

import { useNavigate, Link } from 'react-router-dom'
// useNavigate — programmatically navigate to another page
// Link — creates a clickable link that navigates without page reload

import useAuthStore from '../store/authStore'
// Import our global auth store to access login function and error state

const LoginPage = () => {
    const navigate = useNavigate()

    // Get login function, loading state, and error from global store
    const { login, isLoading, error, clearError } = useAuthStore()

    // ============================================
    // LOCAL STATE — form fields
    // ============================================
    // Each form field has its own state variable
    // When the user types, we update the state
    // When the form is submitted, we read from state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')


    // ============================================
    // HANDLE FORM SUBMIT
    // ============================================
    // Called when user clicks the Login button
    // Prevents default form submission (which would reload the page)
    // Calls the login action from our auth store
    const handleSubmit = async (e) => {
        e.preventDefault()
        // e.preventDefault() stops the browser from reloading the page
        // In React we handle form submission ourselves

        // Clear any previous errors
        clearError()

        // Call the login action from authStore
        // It sends email and password to the backend
        // Returns { success: true } or { success: false, message }
        const result = await login(email, password)

        if (result.success) {
            // Login successful — navigate to dashboard
            navigate('/dashboard')
        }
        // If login failed, the error is stored in the auth store
        // and displayed below the form automatically
    }


    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">

            {/* Login card */}
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">

                {/* Logo and title */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">TC</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="text-gray-400 mt-1">Sign in to your account</p>
                </div>

                {/* Error message */}
                {/* Only shown when error exists in the auth store */}
                {error && (
                    <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email field */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            // onChange fires every time the user types a character
                            // e.target.value is the current value of the input
                            // setEmail updates our email state variable
                            placeholder="you@example.com"
                            required
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Password field */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        // disabled prevents clicking while request is in progress
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                        {/* Show different text while loading */}
                    </button>

                </form>

                {/* Signup link */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    Don't have an account?{' '}
                    <Link
                        to="/signup"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Sign up
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default LoginPage
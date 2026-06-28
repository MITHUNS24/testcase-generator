// client/src/pages/SignupPage.jsx
// Signup page — new users create their account here

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const SignupPage = () => {
    const navigate = useNavigate()
    const { signup, isLoading, error, clearError } = useAuthStore()

    // ============================================
    // LOCAL STATE — form fields
    // ============================================
    // Three fields this time — name, email, password
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    // confirmPassword is only checked on the frontend
    // We do not send it to the backend — just verify it matches password

    // Local error for password mismatch
    // This is separate from the global auth store error
    const [localError, setLocalError] = useState('')


    // ============================================
    // HANDLE FORM SUBMIT
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLocalError('')
        clearError()

        // Check passwords match before sending to backend
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match')
            return
            // return stops the function here — no API call made
        }

        // Check password length
        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters')
            return
        }

        // Call signup action from authStore
        const result = await signup(name, email, password)

        if (result.success) {
            // Signup successful — navigate to dashboard
            navigate('/dashboard')
        }
    }


    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">

            {/* Signup card */}
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8">

                {/* Logo and title */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">TC</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-gray-400 mt-1">Start generating tests for free</p>
                </div>

                {/* Error messages */}
                {/* Show local error (password mismatch) or global auth error */}
                {(error || localError) && (
                    <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                        {localError || error}
                    </div>
                )}

                {/* Signup form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Name field */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Full name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mithun S"
                            required
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Email field */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    {/* Confirm password field */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
                    >
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </button>

                </form>

                {/* Login link */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default SignupPage
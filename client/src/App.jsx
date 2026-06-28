// client/src/App.jsx
// Root component of the React application
// Defines all routes and which component renders for each URL

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// ============================================
// PAGE IMPORTS
// We will create these files one by one
// ============================================
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'


// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
// This component wraps pages that require authentication
// If user is not logged in, redirects to /login
// If user is logged in, renders the requested page
//
// HOW IT WORKS:
// <ProtectedRoute>
//   <Dashboard />
// </ProtectedRoute>
// If authenticated → shows Dashboard
// If not authenticated → redirects to /login
// ============================================
const ProtectedRoute = ({ children }) => {
  // Read isAuthenticated from global auth store
  const { isAuthenticated, isLoading } = useAuthStore()

  // While checking auth status, show nothing
  // Prevents flash of redirect before auth is confirmed
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  // If not authenticated, redirect to login page
  // replace={true} means the login page replaces current history entry
  // So pressing Back doesn't bring them back to the protected page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated, render the requested page
  return children
}


// ============================================
// MAIN APP COMPONENT
// ============================================
const App = () => {
  // Get the getProfile action from the auth store
  const { getProfile, isAuthenticated } = useAuthStore()

  // useEffect runs after the component mounts (loads)
  // We use it to restore the logged in user on page refresh
  // If a token exists in localStorage, getProfile fetches the user data
  useEffect(() => {
    getProfile()
    // This runs once when the app first loads
    // It checks if a valid token exists and fetches the user profile
  }, [])
  // [] means run only once — when the component first mounts


  return (
    // Routes is the container for all Route definitions
    // Only the Route that matches the current URL will render
    <Routes>

      {/* PUBLIC ROUTES — accessible without login */}

      {/* Landing page — shown at the root URL */}
      <Route path="/" element={<LandingPage />} />

      {/* Login page */}
      {/* If already logged in, redirect to dashboard */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />

      {/* Signup page */}
      {/* If already logged in, redirect to dashboard */}
      <Route
        path="/signup"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <SignupPage />
        }
      />

      {/* PROTECTED ROUTES — require authentication */}

      {/* Dashboard page — shows all user projects */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* CATCH ALL — redirect unknown URLs to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}

export default App
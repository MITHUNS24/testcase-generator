// ============================================
// server/src/routes/authRoutes.js
// ============================================
// WHAT IS THIS FILE?
// This file defines the URL routes for authentication.
// It connects specific HTTP methods and URL paths
// to the controller functions that handle them.
//
// WHAT IS A ROUTE?
// A route is a combination of:
// 1. HTTP METHOD — what type of request it is
//    GET    — reading/fetching data
//    POST   — creating new data
//    PUT    — updating existing data
//    DELETE — deleting data
//
// 2. URL PATH — the address of the resource
//    /signup, /login, /me
//
// 3. HANDLER — the controller function that runs
//    signup, login, getProfile
//
// HOW DO THESE ROUTES MAP TO FULL URLs?
// In server.js we mounted these routes like this:
//   app.use('/api/auth', authRoutes)
// This means every route defined here gets prefixed with /api/auth
//
// So the full URLs become:
//   POST /api/auth/signup  → runs signup controller
//   POST /api/auth/login   → runs login controller
//   GET  /api/auth/me      → runs getProfile controller (protected)
// ============================================


// express.Router() creates a mini Express application
// that handles only its own set of routes
// Think of it as a sub-application for auth routes only
const express = require('express');
const router = express.Router();


// Import controller functions from authController.js
// These are the functions that contain the actual logic
// signup   — creates a new user account
// login    — verifies credentials and returns a token
// getProfile — returns the logged in user's data
const { signup, login, getProfile } = require('../controllers/authController');


// Import the protect middleware from authMiddleware.js
// 'protect' is used on routes that require the user to be logged in
// It checks the JWT token before allowing the request to continue
const { protect } = require('../middlewares/authMiddleware');


// ============================================
// ROUTE DEFINITIONS
// ============================================

// POST /api/auth/signup
// ACCESS: Public — anyone can hit this route without a token
// WHAT HAPPENS: Creates a new user account
// BODY REQUIRED: { name, email, password }
router.post('/signup', signup);


// POST /api/auth/login
// ACCESS: Public — anyone can hit this route without a token
// WHAT HAPPENS: Verifies credentials and returns JWT token
// BODY REQUIRED: { email, password }
router.post('/login', login);


// GET /api/auth/me
// ACCESS: Protected — requires a valid JWT token in Authorization header
// WHAT HAPPENS: Returns the currently logged in user's profile
// HOW IT WORKS:
//   1. Request hits this route
//   2. 'protect' middleware runs first — checks and verifies the token
//   3. If token is valid, protect attaches user to req.user and calls next()
//   4. getProfile controller runs — sends back req.user data
//   5. If token is invalid, protect sends 401 and getProfile never runs
router.get('/me', protect, getProfile);


// Export the router so server.js can mount it
// In server.js: app.use('/api/auth', authRoutes)
module.exports = router;
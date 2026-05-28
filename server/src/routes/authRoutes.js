// ============================================
// AUTH ROUTES - server/src/routes/authRoutes.js
// ============================================
// Routes = URL endpoints that define WHAT API calls can be made
// Controllers = Business logic that defines WHAT happens when called
// INTERVIEW TIP: Separate routes (URL definitions) from controllers (logic)

const express = require('express');
const {
  signup,
  login,
  logout,
  getCurrentUser
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Create router instance
// Router = mini app that handles routes for specific path
// Here: all /api/auth/* routes
const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// ROUTE 1: User Registration
// POST /api/auth/signup
// Body: { name, email, password }
// Returns: { token, user }
// INTERVIEW TIP: POST = create new resource
router.post('/signup', signup);

// ROUTE 2: User Login
// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user }
router.post('/login', login);

// ROUTE 3: Logout
// POST /api/auth/logout
// No body required
// Returns: success message
// Note: Actual logout handled on frontend (delete token)
router.post('/logout', logout);

// ============================================
// PROTECTED ROUTES (Requires valid JWT token)
// ============================================
// authMiddleware checks token before controller runs
// If no token or invalid token, returns 401 error
// If valid, attaches userId to request and proceeds

// ROUTE 4: Get Current User
// GET /api/auth/me
// Headers: { Authorization: "Bearer <token>" }
// Returns: { user object }
// INTERVIEW TIP: GET = retrieve resource, "me" = endpoint for current user
router.get('/me', authMiddleware, getCurrentUser);

// ============================================
// EXPORTS
// ============================================
module.exports = router;

// ============================================
// ROUTE SUMMARY & TESTING GUIDE
// ============================================
/*
ENDPOINTS CREATED:

1. POST /api/auth/signup
   Purpose: Register new user
   Request: {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123"
   }
   Response: {
     "success": true,
     "message": "User registered successfully",
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIs...",
       "user": {
         "id": "507f1f77bcf86cd799439011",
         "name": "John Doe",
         "email": "john@example.com",
         "createdAt": "2024-01-15T10:30:00Z"
       }
     }
   }

2. POST /api/auth/login
   Purpose: User login
   Request: {
     "email": "john@example.com",
     "password": "password123"
   }
   Response: Same as signup

3. POST /api/auth/logout
   Purpose: User logout (frontend mainly handles)
   Request: No body
   Response: {
     "success": true,
     "message": "Logged out successfully..."
   }

4. GET /api/auth/me
   Purpose: Get current user info
   Headers: Authorization: Bearer <token>
   Response: {
     "success": true,
     "message": "User fetched successfully",
     "data": {
       "user": { id, name, email, createdAt }
     }
   }

TESTING WITH POSTMAN/THUNDER CLIENT:

Step 1: Signup
  - Method: POST
  - URL: http://localhost:5000/api/auth/signup
  - Body (JSON): {
      "name": "Test User",
      "email": "test@example.com",
      "password": "password123"
    }
  - Copy token from response

Step 2: Login
  - Method: POST
  - URL: http://localhost:5000/api/auth/login
  - Body (JSON): {
      "email": "test@example.com",
      "password": "password123"
    }
  - Copy token from response

Step 3: Get Current User (Protected)
  - Method: GET
  - URL: http://localhost:5000/api/auth/me
  - Headers: 
      Authorization: Bearer <paste_token_here>
  - Should return user data

ERROR RESPONSES:

400 Bad Request: Missing or invalid fields
401 Unauthorized: Invalid credentials or token
409 Conflict: Email already exists
500 Server Error: Database or server issues

INTERVIEW TIPS:
- Routes define API endpoints
- Controllers contain business logic
- Middleware intercepts requests
- authMiddleware protects routes
- JWT token sent in Authorization header
- Stateless = no session storage needed
*/

// ============================================
// server/src/middlewares/authMiddleware.js
// ============================================
// WHAT IS THIS FILE?
// This file contains a middleware function called 'protect'.
// Its job is to verify that a request is coming from a logged-in user.
// It does this by checking the JWT token attached to the request.
//
// WHAT IS MIDDLEWARE?
// Middleware is a function that sits BETWEEN the incoming request
// and the final route handler that processes it.
// It has access to:
//   req  — the incoming request object (contains headers, body, params etc.)
//   res  — the response object (used to send responses back)
//   next — a function that says "I'm done, pass to the next handler"
//
// HOW DOES IT WORK IN PRACTICE?
// When a user makes a request to a protected route like GET /api/projects,
// the request first passes through this middleware.
// If the token is valid:
//   → attach the user object to req.user
//   → call next() to allow the request to continue
// If the token is invalid or missing:
//   → send a 401 Unauthorized response immediately
//   → the actual route handler never runs
//
// HOW DOES THE FRONTEND SEND THE TOKEN?
// The frontend stores the JWT token after login.
// For every protected request, it adds this header:
//   Authorization: Bearer eyJhbGci...
// This middleware reads that header and verifies the token.
// ============================================


// jsonwebtoken is used to VERIFY the token
// During login we used jwt.sign() to CREATE the token
// Here we use jwt.verify() to CHECK if the token is valid
const jwt = require('jsonwebtoken');

// We need the User model to find the actual user from the database
// After verifying the token, we extract the user ID from it
// then fetch the full user document from MongoDB
const User = require('../models/User');


// ============================================
// MIDDLEWARE FUNCTION — protect
// ============================================
// This function is exported and used in route files like this:
// router.get('/profile', protect, getProfile)
// The word 'protect' before 'getProfile' means:
// "run protect first, and only if it calls next(), run getProfile"
// ============================================
const protect = async (req, res, next) => {

    try {

        // ---- STEP 1: CHECK IF TOKEN EXISTS IN REQUEST HEADERS ----
        // The frontend sends the token in the Authorization header like this:
        // Authorization: Bearer eyJhbGci...
        // req.headers.authorization reads that header value

        const authHeader = req.headers.authorization;

        // If the header is missing OR does not start with 'Bearer '
        // it means no token was sent — the user is not logged in
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
                // 401 means Unauthorized — the user is not authenticated
            });
        }


        // ---- STEP 2: EXTRACT THE TOKEN FROM THE HEADER ----
        // The header value looks like: "Bearer eyJhbGci..."
        // We only need the token part after "Bearer "
        // .split(' ') splits the string into ['Bearer', 'eyJhbGci...']
        // [1] picks the second element — the actual token
        const token = authHeader.split(' ')[1];


        // ---- STEP 3: VERIFY THE TOKEN ----
        // jwt.verify() does two things:
        // 1. Checks if the token was signed with our JWT_SECRET
        //    (proves the token came from our server, not a fake one)
        // 2. Checks if the token has expired
        //    (tokens older than 7 days are automatically rejected)
        // If either check fails, jwt.verify() throws an error
        // which gets caught by our catch block below
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // decoded now contains the payload we put in the token during login
        // Example: { id: '64abc123def456', iat: 1616239022, exp: 1616843822 }
        // 'id' is the user's MongoDB _id
        // 'iat' is when the token was issued (issued at)
        // 'exp' is when the token expires


        // ---- STEP 4: FIND THE USER IN THE DATABASE ----
        // We use the ID from the token to find the actual user document
        // .select('-password') means: fetch everything EXCEPT the password field
        // We never want the password hash floating around in memory unnecessarily
        const user = await User.findById(decoded.id).select('-password');

        // If user was deleted from DB but token still exists, user will be null
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, user no longer exists'
            });
        }


        // ---- STEP 5: ATTACH USER TO REQUEST AND CONTINUE ----
        // We attach the full user object to req.user
        // This makes the user data available in every route handler that comes after
        // Example: in authController.js you can access req.user._id or req.user.name
        req.user = user;

        // next() tells Express: "this middleware is done, continue to the route handler"
        next();

    } catch (error) {

        // This catch block handles two main errors from jwt.verify():
        // 1. JsonWebTokenError — token is invalid or tampered with
        // 2. TokenExpiredError — token is older than 7 days

        console.error('Auth middleware error:', error.message);

        return res.status(401).json({
            success: false,
            message: 'Not authorized, token is invalid or expired'
        });
    }
};


// Export the protect function so route files can use it
// Usage in routes: const { protect } = require('../middlewares/authMiddleware')
module.exports = { protect };
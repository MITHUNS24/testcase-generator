// ============================================
// AUTH MIDDLEWARE - server/src/middlewares/authMiddleware.js
// ============================================
// Middleware = Code that runs BEFORE your route handler
// This middleware protects routes by verifying JWT token
// INTERVIEW TIP: Middleware intercepts requests, can allow/deny based on conditions

const { verifyToken, extractTokenFromHeader } = require('../utils/token');

// ============================================
// AUTH PROTECTION MIDDLEWARE
// ============================================
// Use this on routes that require user to be logged in
// Example: app.get('/api/dashboard', authMiddleware, dashboardController)
// This runs BEFORE dashboardController, checks if user is authenticated

const authMiddleware = (req, res, next) => {
  try {
    // ============================================
    // STEP 1: Extract Authorization Header
    // ============================================
    // Headers = metadata about HTTP request
    // Authorization header contains JWT token
    // Format: "Authorization: Bearer <token>"
    
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    // If not, user didn't send a token = not logged in
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing. Please provide a token.',
        code: 'NO_TOKEN'
      });
    }

    // ============================================
    // STEP 2: Extract Token from Header
    // ============================================
    // Header format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    // We need just the token part (after "Bearer ")
    
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Use: Bearer <token>',
        code: 'INVALID_FORMAT'
      });
    }

    // ============================================
    // STEP 3: Verify Token
    // ============================================
    // Check if token is valid and not expired
    
    const decoded = verifyToken(token);

    // If verification fails, decoded will be null
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    }

    // ============================================
    // STEP 4: Attach User ID to Request
    // ============================================
    // If token is valid, add userId to request object
    // Controllers can now access req.userId
    // INTERVIEW TIP: This pattern passes data between middleware and controllers
    
    req.userId = decoded.userId;
    req.token = token;

    // ============================================
    // STEP 5: Call Next Middleware/Controller
    // ============================================
    // Call next() to proceed to route handler
    // If you don't call next(), request hangs and no response sent
    
    next();

  } catch (error) {
    // Catch any unexpected errors
    console.error('Auth Middleware Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// ============================================
// OPTIONAL AUTH MIDDLEWARE
// ============================================
// Similar to authMiddleware, but doesn't fail if no token
// Useful for routes that work for both logged-in and logged-out users
// If token provided, attaches userId; if not, continues anyway

const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If no header, just continue
    if (!authHeader) {
      return next();
    }

    const token = extractTokenFromHeader(authHeader);

    // If header exists but invalid format, just continue
    if (!token) {
      return next();
    }

    // Try to verify token
    const decoded = verifyToken(token);

    // If valid, attach to request; if not, just continue without userId
    if (decoded) {
      req.userId = decoded.userId;
    }

    next();

  } catch (error) {
    console.error('Optional Auth Error:', error);
    next(); // Always continue, even on error
  }
};

// ============================================
// ADMIN CHECK MIDDLEWARE
// ============================================
// Extension for authMiddleware - checks if user is admin
// Would be used later in Phase 2+ when admin features added
// For now, just a template for future use

const adminMiddleware = async (req, res, next) => {
  try {
    // First run auth check
    // (In real app, would query database to check if user is admin)
    
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Check if user is admin (would query User model here)
    // For now, just placeholder logic
    
    next();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Admin check failed'
    });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware
};

// ============================================
// INTERVIEW TIPS - MIDDLEWARE EXECUTION FLOW
// ============================================
/*
REQUEST FLOW WITH MIDDLEWARE:

1. Client sends request with token in Authorization header
2. Request hits authMiddleware
3. Middleware extracts and verifies token
4. If valid: Middleware calls next() to pass request to controller
5. Controller processes request and sends response
6. Response sent back to client

FLOW EXAMPLE:
app.post('/api/projects', authMiddleware, projectController);

When POST /api/projects received:
  ↓
authMiddleware runs first
  ↓ (if token valid)
projectController runs
  ↓
Response sent to client

KEY CONCEPTS:
- next() = pass control to next middleware/controller
- If next() not called, response never sent
- Middleware order matters (runs left to right)
- Multiple middleware can run in sequence
*/

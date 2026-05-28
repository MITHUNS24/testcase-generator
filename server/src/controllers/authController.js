// ============================================
// AUTH CONTROLLER - server/src/controllers/authController.js
// ============================================
// Controller = Business logic handler
// Receives requests, processes data, returns responses
// INTERVIEW TIP: Controllers contain the "what to do" logic
// Separate from routes (which define "where to do it")

const User = require('../models/User');
const { generateToken } = require('../utils/token');

// ============================================
// SIGNUP CONTROLLER
// ============================================
// Handles user registration (POST /api/auth/signup)
// Steps: 1. Validate input 2. Check if user exists 3. Create user 4. Generate token

exports.signup = async (req, res) => {
  try {
    // ============================================
    // STEP 1: Extract Data from Request Body
    // ============================================
    // req.body contains data sent from frontend
    // Frontend sends: { name, email, password }
    
    const { name, email, password } = req.body;

    // ============================================
    // STEP 2: Validate Input
    // ============================================
    // Basic validation - check required fields
    // INTERVIEW TIP: Always validate user input - never trust frontend data
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check password strength
    // SECURITY: Weak passwords can be cracked easily
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // ============================================
    // STEP 3: Check if User Already Exists
    // ============================================
    // Query database for user with this email
    // If exists, can't create another account with same email
    // Email is unique identifier (like username)
    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use different email or login.'
      });
    }

    // ============================================
    // STEP 4: Create New User
    // ============================================
    // Create new User document with provided data
    // Password is automatically hashed by Mongoose pre-save hook
    // (See User.js model file for password hashing logic)
    
    const user = new User({
      name: name.trim(), // Remove extra spaces
      email: email.toLowerCase(), // Normalize email to lowercase
      password // Plain text here, gets hashed before saving
    });

    // Save user to database
    // Mongoose runs pre-save hooks here (password hashing)
    // Returns error if validation fails
    await user.save();

    // ============================================
    // STEP 5: Generate JWT Token
    // ============================================
    // Create JWT token with user ID
    // Token is sent to frontend and stored in localStorage
    // Used for future authenticated requests
    
    const token = generateToken(user._id);

    // ============================================
    // STEP 6: Send Response
    // ============================================
    // Status 201 = Created (resource successfully created)
    // Send token and user data to frontend
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    // Handle any errors during signup
    console.error('Signup Error:', error);

    // Different error handling for MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Error during signup',
      error: error.message
    });
  }
};

// ============================================
// LOGIN CONTROLLER
// ============================================
// Handles user login (POST /api/auth/login)
// Steps: 1. Validate input 2. Find user 3. Compare password 4. Generate token

exports.login = async (req, res) => {
  try {
    // ============================================
    // STEP 1: Extract Data
    // ============================================
    // Frontend sends: { email, password }
    
    const { email, password } = req.body;

    // ============================================
    // STEP 2: Validate Input
    // ============================================
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // ============================================
    // STEP 3: Find User in Database
    // ============================================
    // Query users collection for email
    // Note: .select('+password') includes password field
    // Password normally excluded (select: false in User model)
    // Need to include it here to verify during login
    
    const user = await User.findOne({ email }).select('+password');

    // If user not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        // SECURITY TIP: Don't reveal if email exists (prevents user enumeration)
      });
    }

    // ============================================
    // STEP 4: Compare Password
    // ============================================
    // Use bcrypt to safely compare plain text with hash
    // Returns true if passwords match, false if not
    // comparePassword() is custom method defined in User model
    
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ============================================
    // STEP 5: Generate Token
    // ============================================
    // Password verified, user authenticated
    // Create JWT token to send to client
    
    const token = generateToken(user._id);

    // ============================================
    // STEP 6: Send Response
    // ============================================
    // Status 200 = OK (successful)
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// ============================================
// GET CURRENT USER CONTROLLER
// ============================================
// Returns current logged-in user info
// Used to verify token validity and get user data
// Requires authentication (use authMiddleware)

exports.getCurrentUser = async (req, res) => {
  try {
    // req.userId is set by authMiddleware
    // If middleware verified token, userId is present
    
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Fetch user from database
    // MongoDB ObjectId format: req.userId
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// ============================================
// LOGOUT CONTROLLER
// ============================================
// Logout is handled on frontend (delete token from localStorage)
// Backend just sends confirmation response
// INTERVIEW TIP: With JWT, no server state to clear (stateless)

exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your token on client side.'
  });
};

// ============================================
// INTERVIEW TIPS - AUTHENTICATION FLOW
// ============================================
/*
SIGNUP PROCESS:
1. Frontend sends POST /api/auth/signup with { name, email, password }
2. signup() validates input
3. Checks if email already exists
4. Creates User document
5. Mongoose pre-save hook hashes password
6. Saves to MongoDB
7. Generates JWT token
8. Sends token + user data to frontend
9. Frontend stores token in localStorage

LOGIN PROCESS:
1. Frontend sends POST /api/auth/login with { email, password }
2. login() finds user by email
3. Retrieves password hash from database
4. Uses bcrypt.compare() to verify
5. If match: generates token
6. Sends token to frontend
7. Frontend stores in localStorage

PROTECTED REQUEST:
1. Frontend sends request with Authorization header
2. authMiddleware extracts token
3. Verifies token with JWT secret
4. If valid: attaches userId to request
5. Controller can access req.userId

KEY SECURITY CONCEPTS:
- Passwords hashed (bcrypt) - irreversible
- JWT tokens signed - can't be forged
- Secrets in .env - not in code
- Input validation - prevent injection attacks
- Error messages vague - prevent user enumeration
*/

// ============================================
// server/src/controllers/authController.js
// ============================================
// WHAT IS THIS FILE?
// This file contains the controller functions for authentication.
// A controller function receives a request, processes it,
// talks to the database if needed, and sends back a response.
//
// WHAT IS req AND res?
// Every controller function receives two main objects:
//
// req (request) — contains everything the client sent:
//   req.body    — the data sent in the request body (name, email, password)
//   req.headers — the headers sent (like Authorization token)
//   req.params  — URL parameters (like /users/:id)
//   req.user    — the logged in user (attached by authMiddleware)
//
// res (response) — used to send data back to the client:
//   res.status(200).json({...})  — send a success response
//   res.status(400).json({...})  — send a bad request error
//   res.status(401).json({...})  — send an unauthorized error
//   res.status(500).json({...})  — send a server error
//
// HTTP STATUS CODES (important to know):
//   200 — OK (request succeeded)
//   201 — Created (new resource was created successfully)
//   400 — Bad Request (client sent wrong or missing data)
//   401 — Unauthorized (not logged in or invalid token)
//   409 — Conflict (resource already exists, like duplicate email)
//   500 — Internal Server Error (something crashed on the server)
// ============================================


// Import the User model — we use this to create and find users in MongoDB
const User = require('../models/User');

// Import our token generator utility — creates JWT tokens after signup/login
const generateToken = require('../utils/token');


// ============================================
// CONTROLLER 1 — signup
// ============================================
// ROUTE:   POST /api/auth/signup
// ACCESS:  Public (anyone can access this, no token needed)
//
// WHAT IT DOES:
// 1. Reads name, email, password from the request body
// 2. Validates that all fields are present
// 3. Checks if a user with that email already exists
// 4. Creates a new user in the database
// 5. Generates a JWT token for the new user
// 6. Sends back the user data and token
//
// WHAT THE FRONTEND SENDS (req.body):
// {
//   "name": "Mithun",
//   "email": "mithun@gmail.com",
//   "password": "secret123"
// }
//
// WHAT WE SEND BACK (res.json):
// {
//   "success": true,
//   "token": "eyJhbGci...",
//   "user": { "_id": "...", "name": "Mithun", "email": "mithun@gmail.com" }
// }
// ============================================
const signup = async (req, res, next) => {
    try {

        // ---- STEP 1: READ DATA FROM REQUEST BODY ----
        // req.body contains the JSON data the frontend sent
        // We destructure it to get the three fields we need
        const { name, email, password } = req.body;


        // ---- STEP 2: VALIDATE INPUT ----
        // Check that all required fields are present
        // If any field is missing, send a 400 Bad Request response immediately
        // The 'return' ensures we stop here and don't run the rest of the function
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check password length separately for a more specific error message
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }


        // ---- STEP 3: CHECK IF EMAIL ALREADY EXISTS ----
        // User.findOne() searches the database for ONE document matching the filter
        // { email } is shorthand for { email: email }
        // If a user with this email exists, existingUser will be a user object
        // If not, existingUser will be null
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // 409 Conflict — the resource (email) already exists
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }


        // ---- STEP 4: CREATE THE NEW USER ----
        // User.create() does two things:
        // 1. Creates a new User document with the provided data
        // 2. Saves it to MongoDB
        // IMPORTANT: Before saving, our pre-save hook in User.js
        // automatically hashes the password — we do NOT hash it here manually
        const user = await User.create({
            name,
            email,
            password
            // password will be automatically hashed by the pre-save hook in User.js
        });


        // ---- STEP 5: GENERATE JWT TOKEN ----
        // Now that the user is created, generate a token for them
        // We pass user._id — the unique MongoDB ID of this user
        // The token will contain this ID so we can identify the user later
        const token = generateToken(user._id);


        // ---- STEP 6: SEND SUCCESS RESPONSE ----
        // 201 Created — a new resource was successfully created
        // We send back the token and user details
        // We do NOT send the password back — even hashed passwords stay private
        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        // If anything unexpected crashes above, pass the error to Express
        // our global error handler in server.js will catch it and send a 500 response
        next(error);
    }
};


// ============================================
// CONTROLLER 2 — login
// ============================================
// ROUTE:   POST /api/auth/login
// ACCESS:  Public (anyone can access this, no token needed)
//
// WHAT IT DOES:
// 1. Reads email and password from the request body
// 2. Validates that both fields are present
// 3. Finds the user with that email in the database
// 4. Compares the entered password with the stored hashed password
// 5. If everything matches, generates a JWT token
// 6. Sends back the user data and token
//
// WHAT THE FRONTEND SENDS (req.body):
// {
//   "email": "mithun@gmail.com",
//   "password": "secret123"
// }
//
// WHAT WE SEND BACK (res.json):
// {
//   "success": true,
//   "token": "eyJhbGci...",
//   "user": { "_id": "...", "name": "Mithun", "email": "mithun@gmail.com" }
// }
// ============================================
const login = async (req, res, next) => {
    try {

        // ---- STEP 1: READ DATA FROM REQUEST BODY ----
        const { email, password } = req.body;


        // ---- STEP 2: VALIDATE INPUT ----
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }


        // ---- STEP 3: FIND THE USER BY EMAIL ----
        // We search for a user with the provided email
        // By default, Mongoose does NOT return the password field
        // because we might have set select:false — but here we explicitly
        // use .select('+password') to include it for comparison
        // We NEED the password here to compare it with what the user entered
        const user = await User.findOne({ email }).select('+password');

        // If no user found with that email, send a vague error message
        // We say "Invalid credentials" instead of "Email not found"
        // This is intentional — we don't want to reveal which part is wrong
        // (telling hackers "email not found" helps them enumerate valid emails)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }


        // ---- STEP 4: COMPARE PASSWORDS ----
        // user.comparePassword() is the instance method we defined in User.js
        // It uses bcrypt.compare() to hash the entered password
        // and compare it to the stored hash
        // Returns true if they match, false if they don't
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
                // Same vague message — don't reveal which part is wrong
            });
        }


        // ---- STEP 5: GENERATE JWT TOKEN ----
        // Password matched — generate a fresh token for this session
        const token = generateToken(user._id);


        // ---- STEP 6: SEND SUCCESS RESPONSE ----
        // 200 OK — login was successful
        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 3 — getProfile
// ============================================
// ROUTE:   GET /api/auth/me
// ACCESS:  Protected (requires valid JWT token)
//
// WHAT IT DOES:
// Returns the currently logged in user's profile data.
// This is used when the frontend refreshes the page —
// it sends the stored token and gets back the user's data
// to restore the logged in state without asking for credentials again.
//
// NOTE: This route uses authMiddleware (protect)
// So by the time this function runs, req.user is already populated
// with the logged in user's data — we just send it back
// ============================================
const getProfile = async (req, res, next) => {
    try {

        // req.user was attached by authMiddleware after verifying the token
        // It contains the full user document from MongoDB (without password)
        // We simply send it back to the frontend
        res.status(200).json({
            success: true,
            user: req.user
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// EXPORT ALL THREE CONTROLLERS
// We export them as an object so routes can import
// specific ones they need like:
// const { signup, login, getProfile } = require('../controllers/authController')
// ============================================
module.exports = { signup, login, getProfile };
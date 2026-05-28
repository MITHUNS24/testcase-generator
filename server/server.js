// ============================================
// MAIN SERVER FILE - server/server.js
// ============================================
// This is the ENTRY POINT of your entire backend application
// When you run 'npm start' or 'node server.js', this file runs first
// It initializes Express, connects to MongoDB, and starts the server

// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

// Load environment variables from .env file
// This makes process.env.PORT, process.env.MONGO_URI, etc. available
dotenv.config();

// Create Express application instance
// This is the main application object that handles all HTTP requests
const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================
// Middleware functions execute BEFORE your route handlers
// They process incoming requests and prepare data for controllers

// 1. CORS Middleware - Allows frontend to communicate with backend
//    Without this, requests from localhost:5173 (frontend) to localhost:5000 (backend) would be blocked
//    INTERVIEW TIP: CORS prevents Cross-Site Request Forgery attacks
app.use(cors({
  origin: process.env.CLIENT_URL, // Allow only frontend URL
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. JSON Parsing Middleware - Converts incoming JSON requests to JavaScript objects
//    When frontend sends JSON data, Express can't understand it without this
//    This middleware automatically parses req.body
app.use(express.json());

// 3. URL Encoding Middleware - Handles form data submissions
//    Extended: true allows nested objects in form data
app.use(express.urlencoded({ extended: true }));

// ============================================
// CONNECT TO MONGODB
// ============================================
// This connects your application to MongoDB database
// The connection happens asynchronously (takes time)
connectDB();

// ============================================
// API ROUTES
// ============================================
// Route = URL endpoint that handles specific HTTP requests
// Example: POST /api/auth/signup handles user registration
app.use('/api/auth', authRoutes);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
// This endpoint checks if the server is running and connected to DB
// Frontend can call this to verify backend is alive
// INTERVIEW TIP: This is useful for monitoring and debugging
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Backend server is running successfully',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// ERROR HANDLING - 404 Route Not Found
// ============================================
// If request doesn't match any route, this runs
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// START SERVER
// ============================================
// Get port from .env or use default 5000
const PORT = process.env.PORT || 5000;

// Create HTTP server and listen on specified port
// server.listen() starts the server and waits for incoming requests
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   TEST CASE GENERATOR BACKEND STARTED  ║
╚════════════════════════════════════════╝
📍 Server running on: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📡 CORS enabled for: ${process.env.CLIENT_URL}
⏰ Started at: ${new Date().toLocaleString()}
  `);
});

// Handle unhandled promise rejections
// If any promise rejects without a catch, this prevents server crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;

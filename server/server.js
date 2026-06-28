// server/server.js
// This is the main entry point of the backend
// Node.js runs this file first when we start the server

// Load environment variables from .env file
// This must be the very first thing that runs
// so that process.env values are available everywhere
require('dotenv').config();

// Import the express library to create our server
const express = require('express');

// Import cors — allows our frontend (different port) to talk to this backend
const cors = require('cors');

// Import morgan — logs every incoming request to the terminal (useful for debugging)
const morgan = require('morgan');

// Import our database connection function
const connectDB = require('./src/config/db');

// Import auth routes (we will create this file next)
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const repositoryRoutes = require('./src/routes/repositoryRoutes');
const analysisRoutes = require('./src/routes/analysisRoutes');
// Create the Express application
const app = express();

// Read the port from .env file, default to 5000 if not set
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE SETUP
// Middleware runs on every request before it
// reaches the route handler
// ============================================

// Allow requests from our frontend URL
// credentials:true allows cookies and auth headers
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Log every request in the terminal during development
// Example output: POST /api/auth/signup 200 12ms
app.use(morgan('dev'));

// ============================================
// ROUTES
// Each route group handles a specific feature
// ============================================

// All auth routes will be prefixed with /api/auth
// Example: /api/auth/signup, /api/auth/login
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check route — used to verify server is running
// Visit http://localhost:5000/api/health in browser to test
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// ============================================
// START SERVER
// Connect to database first, then start listening
// ============================================

const startServer = async () => {
    // Connect to MongoDB first
    await connectDB();

    // Start listening for requests only after DB is connected
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

// Call the startup function
startServer();
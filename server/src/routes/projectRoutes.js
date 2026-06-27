// server/src/routes/projectRoutes.js
// Defines all URL routes related to projects
// Every route here is protected — requires a valid JWT token

const express = require('express');
const router = express.Router();

// Import the three project controller functions
const {
    createProject,
    getProjects,
    getProjectById
} = require('../controllers/projectController');

// Import protect middleware — guards all routes below
// No valid token = request is rejected before reaching the controller
const { protect } = require('../middlewares/authMiddleware');

// ============================================
// ROUTE DEFINITIONS
// ============================================

// POST /api/projects
// ACCESS: Protected
// WHAT: Creates a new project for the logged in user
// BODY REQUIRED: { projectName, repositoryUrl (optional) }
router.post('/', protect, createProject);

// GET /api/projects
// ACCESS: Protected
// WHAT: Returns all projects belonging to the logged in user
// Used to populate the dashboard page
router.get('/', protect, getProjects);

// GET /api/projects/:id
// ACCESS: Protected
// WHAT: Returns one specific project by its MongoDB ID
// :id is a dynamic URL parameter
// Example: GET /api/projects/6a3fddfa9d79542867a55efe
router.get('/:id', protect, getProjectById);

// Export the router
module.exports = router;
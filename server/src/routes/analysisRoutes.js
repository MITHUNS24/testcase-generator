// server/src/routes/analysisRoutes.js
// Defines URL routes for repository analysis endpoints

const express = require('express');
const router = express.Router();

const { analyzeProject, getAnalysis } = require('../controllers/analysisController');
const { protect } = require('../middlewares/authMiddleware');

// ============================================
// ROUTE DEFINITIONS
// ============================================

// POST /api/analysis/:projectId
// ACCESS: Protected
// WHAT: Triggers full repository analysis for a project
// Requires the project to have an uploaded ZIP file
router.post('/:projectId', protect, analyzeProject);

// GET /api/analysis/:projectId
// ACCESS: Protected
// WHAT: Returns stored analysis results for a project
// Called when user opens the Project Workspace page
router.get('/:projectId', protect, getAnalysis);

module.exports = router;
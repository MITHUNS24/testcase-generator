// server/src/routes/generationRoutes.js
// Defines all URL routes for test generation endpoints

const express = require('express');
const router = express.Router();

const {
    generate,
    regenerate,
    getGenerations,
    updateFeedback
} = require('../controllers/generationController');

const { protect } = require('../middlewares/authMiddleware');


// ============================================
// ROUTE DEFINITIONS
// ============================================

// POST /api/generate/tests
// ACCESS: Protected
// WHAT: Generates test cases for a project
// BODY: { projectId, testingGoal, generationType, codeSnippet, instructions }
router.post('/tests', protect, generate);

// POST /api/generate/regenerate
// ACCESS: Protected
// WHAT: Regenerates tests based on a previous generation
// BODY: { generationId, regenerationInstructions }
router.post('/regenerate', protect, regenerate);

// GET /api/generate/:projectId
// ACCESS: Protected
// WHAT: Returns all generations for a specific project
router.get('/:projectId', protect, getGenerations);

// PUT /api/generate/:generationId/feedback
// ACCESS: Protected
// WHAT: Updates feedback and quality score for a generation
router.put('/:generationId/feedback', protect, updateFeedback);


module.exports = router;
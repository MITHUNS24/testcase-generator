// server/src/controllers/generationController.js
// Handles all test generation related requests
// Calls generationService and returns results to the frontend

const {
    generateTests,
    regenerateTests,
    getProjectGenerations
} = require('../services/generationService');

const Generation = require('../models/Generation');
const Project = require('../models/Project');


// ============================================
// CONTROLLER 1 — generate
// ============================================
// ROUTE:   POST /api/generate/tests
// ACCESS:  Protected
//
// WHAT IT DOES:
// Receives the testing goal and parameters from the frontend
// Calls the generation service to run the full AI pipeline
// Returns the generated test cases
//
// WHAT THE FRONTEND SENDS (req.body):
// {
//   "projectId": "6a400be5...",
//   "testingGoal": "Test all authentication routes",
//   "generationType": "api",
//   "codeSnippet": "optional code here",
//   "instructions": "focus on edge cases"
// }
// ============================================
const generate = async (req, res, next) => {
    try {

        // ---- READ FROM REQUEST BODY ----
        const {
            projectId,
            testingGoal,
            generationType,
            codeSnippet,
            instructions
        } = req.body;

        // ---- VALIDATE INPUT ----
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        if (!testingGoal) {
            return res.status(400).json({
                success: false,
                message: 'Testing goal is required'
            });
        }

        // ---- VERIFY PROJECT EXISTS AND BELONGS TO USER ----
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to generate tests for this project'
            });
        }

        // ---- CHECK IF PROJECT HAS BEEN ANALYZED ----
        // We need the repository analysis to generate good tests
        if (project.status === 'created') {
            return res.status(400).json({
                success: false,
                message: 'Please upload and analyze a repository before generating tests'
            });
        }

        // ---- RUN THE GENERATION PIPELINE ----
        const result = await generateTests({
            projectId,
            userId: req.user._id,
            testingGoal,
            generationType: generationType || 'full',
            codeSnippet: codeSnippet || '',
            instructions: instructions || ''
        });

        // ---- SEND SUCCESS RESPONSE ----
        res.status(201).json({
            success: true,
            message: 'Tests generated successfully',
            generation: {
                _id: result.generation._id,
                generationType: result.generation.generationType,
                testingGoal: result.generation.testingGoal,
                generatedContent: result.generatedContent,
                createdAt: result.generation.createdAt
            }
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 2 — regenerate
// ============================================
// ROUTE:   POST /api/generate/regenerate
// ACCESS:  Protected
//
// WHAT IT DOES:
// Takes a previous generation ID and regeneration instructions
// Generates improved tests based on the previous output
// ============================================
const regenerate = async (req, res, next) => {
    try {

        const { generationId, regenerationInstructions } = req.body;

        if (!generationId) {
            return res.status(400).json({
                success: false,
                message: 'Generation ID is required'
            });
        }

        // ---- VERIFY THE GENERATION EXISTS AND BELONGS TO USER ----
        const existingGeneration = await Generation.findById(generationId);

        if (!existingGeneration) {
            return res.status(404).json({
                success: false,
                message: 'Generation not found'
            });
        }

        if (existingGeneration.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to regenerate this generation'
            });
        }

        // ---- RUN REGENERATION ----
        const result = await regenerateTests({
            generationId,
            userId: req.user._id,
            regenerationInstructions: regenerationInstructions || ''
        });

        res.status(201).json({
            success: true,
            message: 'Tests regenerated successfully',
            generation: {
                _id: result.generation._id,
                generationType: result.generation.generationType,
                testingGoal: result.generation.testingGoal,
                generatedContent: result.generatedContent,
                createdAt: result.generation.createdAt
            }
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 3 — getGenerations
// ============================================
// ROUTE:   GET /api/generate/:projectId
// ACCESS:  Protected
//
// WHAT IT DOES:
// Returns all generations for a specific project
// Used to show generation history in the workspace
// ============================================
const getGenerations = async (req, res, next) => {
    try {

        const { projectId } = req.params;

        // Verify project belongs to user
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view generations for this project'
            });
        }

        const generations = await getProjectGenerations(projectId);

        res.status(200).json({
            success: true,
            count: generations.length,
            generations
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 4 — updateFeedback
// ============================================
// ROUTE:   PUT /api/generate/:generationId/feedback
// ACCESS:  Protected
//
// WHAT IT DOES:
// Updates the feedback and quality score for a generation
// Called when user approves, rejects, or rates a generation
// ============================================
const updateFeedback = async (req, res, next) => {
    try {

        const { generationId } = req.params;
        const { feedback, qualityScore } = req.body;

        const generation = await Generation.findById(generationId);

        if (!generation) {
            return res.status(404).json({
                success: false,
                message: 'Generation not found'
            });
        }

        if (generation.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this generation'
            });
        }

        // Update feedback and quality score
        if (feedback) generation.feedback = feedback;
        if (qualityScore !== undefined) generation.qualityScore = qualityScore;

        await generation.save();

        res.status(200).json({
            success: true,
            message: 'Feedback updated successfully',
            generation
        });

    } catch (error) {
        next(error);
    }
};


module.exports = { generate, regenerate, getGenerations, updateFeedback };
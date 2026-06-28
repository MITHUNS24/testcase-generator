// server/src/controllers/analysisController.js
// Handles repository analysis requests
// Calls the analysis service and returns results to the frontend

const { analyzeRepository } = require('../services/analysisService');
const Project = require('../models/Project');


// ============================================
// CONTROLLER 1 — analyzeProject
// ============================================
// ROUTE:   POST /api/analysis/:projectId
// ACCESS:  Protected
//
// WHAT IT DOES:
// Triggers the full repository analysis pipeline for a project
// The project must have an uploaded ZIP file or GitHub URL
// Returns the complete analysis results
// ============================================
const analyzeProject = async (req, res, next) => {
    try {

        // ---- STEP 1: GET PROJECT ID FROM URL ----
        const { projectId } = req.params;

        // ---- STEP 2: FIND THE PROJECT ----
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // ---- STEP 3: VERIFY OWNERSHIP ----
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to analyze this project'
            });
        }

        // ---- STEP 4: CHECK IF ZIP FILE EXISTS ----
        // Analysis requires an uploaded ZIP file
        // GitHub URL analysis will be added later
        if (!project.uploadedFilePath) {
            return res.status(400).json({
                success: false,
                message: 'No repository uploaded. Please upload a ZIP file first.'
            });
        }

        // ---- STEP 5: RUN THE ANALYSIS PIPELINE ----
        // This calls our analysisService which coordinates
        // fileScanner → techDetector → routeDetector → save to MongoDB
        const result = await analyzeRepository(projectId, project.uploadedFilePath);

        // ---- STEP 6: SEND RESULTS BACK ----
        res.status(200).json({
            success: true,
            message: 'Repository analyzed successfully',
            analysis: {
                technologies: result.technologies,
                projectType: result.projectType,
                routes: result.routes,
                folderStructure: result.folderStructure,
                totalFiles: result.totalFiles,
                summary: result.summary
            }
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 2 — getAnalysis
// ============================================
// ROUTE:   GET /api/analysis/:projectId
// ACCESS:  Protected
//
// WHAT IT DOES:
// Returns the stored analysis results for a project
// Called when the user opens the Project Workspace page
// Does not re-run the analysis — just returns stored results
// ============================================
const getAnalysis = async (req, res, next) => {
    try {

        const { projectId } = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Verify ownership
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this project'
            });
        }

        // Parse the detectedRoutes JSON string back into an array
        // We stored it as a string in MongoDB
        let routes = [];
        try {
            routes = JSON.parse(project.detectedRoutes || '[]');
        } catch (parseError) {
            routes = [];
        }

        res.status(200).json({
            success: true,
            project: {
                _id: project._id,
                projectName: project.projectName,
                repositoryUrl: project.repositoryUrl,
                status: project.status,
                createdAt: project.createdAt
            },
            analysis: {
                technologies: project.detectedTechnologies,
                routes: routes,
                folderStructure: project.folderStructure,
                summary: project.repositorySummary
            }
        });

    } catch (error) {
        next(error);
    }
};


module.exports = { analyzeProject, getAnalysis };
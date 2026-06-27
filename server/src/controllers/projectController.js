// server/src/controllers/projectController.js
// Handles all project-related operations
// These functions are called by projectRoutes.js when a matching request arrives

// Import the Project model to interact with the projects collection in MongoDB
const Project = require('../models/Project');


// ============================================
// CONTROLLER 1 — createProject
// ============================================
// ROUTE:   POST /api/projects
// ACCESS:  Protected (requires valid JWT token)
//
// WHAT IT DOES:
// Creates a new project document in MongoDB
// Links it to the currently logged in user via userId
//
// WHAT THE FRONTEND SENDS (req.body):
// {
//   "projectName": "My E-commerce App",
//   "repositoryUrl": "https://github.com/username/repo" (optional)
// }
//
// WHAT WE SEND BACK:
// {
//   "success": true,
//   "project": { _id, userId, projectName, repositoryUrl, status, createdAt }
// }
// ============================================
const createProject = async (req, res, next) => {
    try {

        // ---- STEP 1: READ DATA FROM REQUEST BODY ----
        const { projectName, repositoryUrl } = req.body;

        // ---- STEP 2: VALIDATE INPUT ----
        // projectName is required — without it we cannot create a project
        if (!projectName) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // ---- STEP 3: CREATE THE PROJECT ----
        // req.user._id comes from authMiddleware
        // It is the MongoDB ID of the currently logged in user
        // We store it as userId to link this project to that user
        const project = await Project.create({
            userId: req.user._id,
            // every project is owned by the logged in user
            projectName: projectName.trim(),
            repositoryUrl: repositoryUrl || ''
            // if repositoryUrl not provided, store empty string
        });

        // ---- STEP 4: SEND SUCCESS RESPONSE ----
        // 201 Created — a new resource was successfully created
        res.status(201).json({
            success: true,
            project
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 2 — getProjects
// ============================================
// ROUTE:   GET /api/projects
// ACCESS:  Protected (requires valid JWT token)
//
// WHAT IT DOES:
// Fetches ALL projects belonging to the currently logged in user
// This is what populates the dashboard page
//
// WHAT WE SEND BACK:
// {
//   "success": true,
//   "count": 3,
//   "projects": [ {...}, {...}, {...} ]
// }
// ============================================
const getProjects = async (req, res, next) => {
    try {

        // Find all projects where userId matches the logged in user's ID
        // { userId: req.user._id } is the filter — only return THIS user's projects
        // .sort({ createdAt: -1 }) sorts by newest first
        // -1 means descending order (newest at top)
        // 1 would mean ascending order (oldest at top)
        const projects = await Project.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        // Send back all projects with a count
        // count is useful for the dashboard to show "You have 3 projects"
        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 3 — getProjectById
// ============================================
// ROUTE:   GET /api/projects/:id
// ACCESS:  Protected (requires valid JWT token)
//
// WHAT IS :id?
// :id is a URL parameter — a dynamic part of the URL
// Example: GET /api/projects/6a3fddfa9d79542867a55efe
// req.params.id would equal "6a3fddfa9d79542867a55efe"
//
// WHAT IT DOES:
// Fetches ONE specific project by its MongoDB _id
// Also verifies that the project belongs to the logged in user
// A user should NEVER be able to access another user's project
//
// WHAT WE SEND BACK:
// {
//   "success": true,
//   "project": { _id, userId, projectName, repositoryUrl, status, createdAt }
// }
// ============================================
const getProjectById = async (req, res, next) => {
    try {

        // ---- STEP 1: EXTRACT THE PROJECT ID FROM URL ----
        // req.params.id reads the :id part from the URL
        // Example URL: /api/projects/6a3fddfa9d79542867a55efe
        // req.params.id = "6a3fddfa9d79542867a55efe"
        const projectId = req.params.id;

        // ---- STEP 2: FIND THE PROJECT IN DATABASE ----
        // findById() searches for a document with the matching _id
        const project = await Project.findById(projectId);

        // ---- STEP 3: CHECK IF PROJECT EXISTS ----
        // If no project found with that ID, return 404 Not Found
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // ---- STEP 4: VERIFY OWNERSHIP ----
        // Check that this project belongs to the logged in user
        // project.userId is a MongoDB ObjectId
        // req.user._id is also a MongoDB ObjectId
        // .toString() converts both to strings for comparison
        // because ObjectId === ObjectId does not work directly
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this project'
                // 403 Forbidden — you are logged in but not allowed to access this
            });
        }

        // ---- STEP 5: SEND THE PROJECT ----
        res.status(200).json({
            success: true,
            project
        });

    } catch (error) {
        next(error);
    }
};


// Export all three controllers
module.exports = { createProject, getProjects, getProjectById };
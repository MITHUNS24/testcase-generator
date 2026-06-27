// server/src/controllers/repositoryController.js
// Handles repository uploads — ZIP file upload and GitHub URL import
// The actual file scanning and analysis happens in Phase 3
// Here we just receive and store the upload information

const Project = require('../models/Project');
const path = require('path');
// path is a built-in Node.js module — no need to install it
// It helps work with file paths in a cross-platform way
// Example: path.join('folder', 'file.txt') works on both Windows and Mac

const fs = require('fs');
// fs (file system) is another built-in Node.js module
// It lets us read, write, create, and delete files on the server


// ============================================
// CONTROLLER 1 — uploadRepository
// ============================================
// ROUTE:   POST /api/repositories/upload
// ACCESS:  Protected
//
// WHAT IT DOES:
// Receives a ZIP file uploaded by the user
// Verifies the project exists and belongs to the user
// Stores the file path on the project document
// Updates the project status to 'analyzed'
//
// HOW DOES THE FILE ARRIVE?
// Multer middleware (configured in routes) intercepts the request
// and saves the file to the server
// After multer runs, req.file contains information about the uploaded file:
// {
//   fieldname: 'repository',
//   originalname: 'myproject.zip',
//   mimetype: 'application/zip',
//   path: 'uploads/123456-myproject.zip',
//   size: 204800
// }
// ============================================
const uploadRepository = async (req, res, next) => {
    try {

        // ---- STEP 1: CHECK IF FILE WAS UPLOADED ----
        // If multer did not receive a file, req.file will be undefined
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a ZIP file'
            });
        }

        // ---- STEP 2: GET PROJECT ID FROM URL PARAMS ----
        // The route will be POST /api/repositories/upload/:projectId
        // req.params.projectId reads that dynamic part
        const { projectId } = req.params;

        // ---- STEP 3: FIND THE PROJECT ----
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // ---- STEP 4: VERIFY OWNERSHIP ----
        // Make sure this project belongs to the logged in user
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to upload to this project'
            });
        }

        // ---- STEP 5: VALIDATE FILE TYPE ----
        // Only accept ZIP files
        // req.file.mimetype contains the file type
        // req.file.originalname contains the original filename
        const allowedMimeTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-zip',
            'multipart/x-zip'
        ];

        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        // path.extname() extracts the extension from a filename
        // Example: path.extname('myproject.zip') returns '.zip'

        if (!allowedMimeTypes.includes(req.file.mimetype) && fileExtension !== '.zip') {
            // Delete the uploaded file if it is not a ZIP
            fs.unlinkSync(req.file.path);
            // fs.unlinkSync() deletes a file synchronously
            // We delete it because we do not want invalid files taking up space

            return res.status(400).json({
                success: false,
                message: 'Only ZIP files are allowed'
            });
        }

        // ---- STEP 6: UPDATE THE PROJECT ----
        // Store the file path on the project document
        // This lets us find and process the file later in Phase 3
        project.uploadedFilePath = req.file.path;
        project.status = 'analyzed';
        // Mark as analyzed — Phase 3 will do the actual analysis
        // For now we just confirm the file was received

        await project.save();
        // .save() saves the changes we made to the project document

        // ---- STEP 7: SEND SUCCESS RESPONSE ----
        res.status(200).json({
            success: true,
            message: 'Repository uploaded successfully',
            project: {
                _id: project._id,
                projectName: project.projectName,
                status: project.status,
                uploadedFilePath: project.uploadedFilePath
            }
        });

    } catch (error) {
        next(error);
    }
};


// ============================================
// CONTROLLER 2 — importGithubRepository
// ============================================
// ROUTE:   POST /api/repositories/github
// ACCESS:  Protected
//
// WHAT IT DOES:
// Accepts a GitHub repository URL from the user
// Validates the URL format
// Stores it on the project document
// In Phase 3 we will actually fetch the repository contents
// using the GitHub API
//
// WHAT THE FRONTEND SENDS (req.body):
// {
//   "projectId": "6a400be5b49575d8d7cf33c1",
//   "repositoryUrl": "https://github.com/username/repo"
// }
// ============================================
const importGithubRepository = async (req, res, next) => {
    try {

        // ---- STEP 1: READ DATA FROM REQUEST BODY ----
        const { projectId, repositoryUrl } = req.body;

        // ---- STEP 2: VALIDATE INPUT ----
        if (!projectId || !repositoryUrl) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and repository URL are required'
            });
        }

        // ---- STEP 3: VALIDATE GITHUB URL FORMAT ----
        // Make sure the URL is actually a GitHub URL
        // not just any random string
        const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
        // This is a Regular Expression (regex) — a pattern matcher
        // It checks that the URL starts with https://github.com/
        // followed by a username and repository name
        // Example valid: https://github.com/MITHUNS24/testcase-generator
        // Example invalid: https://gitlab.com/user/repo

        if (!githubUrlPattern.test(repositoryUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid GitHub repository URL'
            });
        }

        // ---- STEP 4: FIND THE PROJECT ----
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // ---- STEP 5: VERIFY OWNERSHIP ----
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this project'
            });
        }

        // ---- STEP 6: UPDATE THE PROJECT ----
        // Store the GitHub URL on the project
        // Phase 3 will use this URL to fetch the repository contents
        project.repositoryUrl = repositoryUrl;
        project.status = 'analyzed';

        await project.save();

        // ---- STEP 7: SEND SUCCESS RESPONSE ----
        res.status(200).json({
            success: true,
            message: 'GitHub repository imported successfully',
            project: {
                _id: project._id,
                projectName: project.projectName,
                repositoryUrl: project.repositoryUrl,
                status: project.status
            }
        });

    } catch (error) {
        next(error);
    }
};


// Export both controllers
module.exports = { uploadRepository, importGithubRepository };
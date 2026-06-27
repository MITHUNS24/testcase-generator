// server/src/routes/repositoryRoutes.js
// Defines routes for repository upload and GitHub import
// Also configures multer for handling ZIP file uploads

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const {
    uploadRepository,
    importGithubRepository
} = require('../controllers/repositoryController');

// Import protect middleware
const { protect } = require('../middlewares/authMiddleware');


// ============================================
// MULTER CONFIGURATION
// ============================================
// Multer needs two things:
// 1. storage — where and how to save uploaded files
// 2. fileFilter — which files to accept or reject

// STORAGE CONFIGURATION
// diskStorage saves files to the server's hard disk
// The alternative is memoryStorage which keeps files in RAM
// diskStorage is better for large ZIP files
const storage = multer.diskStorage({

    // destination — which folder to save files in
    // req  — the incoming request
    // file — information about the uploaded file
    // cb   — callback function, call it when done
    //        cb(error, destination) — null means no error
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
        // saves all uploaded files to the uploads/ folder
        // this folder must exist — we created it above
    },

    // filename — what to name the saved file
    // We use Date.now() to add a timestamp to the filename
    // This prevents two files with the same name from overwriting each other
    // Example: 1782570490-myproject.zip
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});


// FILE FILTER CONFIGURATION
// This function runs before the file is saved
// Return true to accept the file, false to reject it
const fileFilter = (req, file, cb) => {

    // Check the file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Only accept ZIP files
    if (fileExtension === '.zip') {
        cb(null, true);
        // null = no error, true = accept this file
    } else {
        cb(new Error('Only ZIP files are allowed'), false);
        // passing an Error = reject with this error message
        // false = do not accept this file
    }
};


// CREATE THE MULTER INSTANCE
// Combines storage + fileFilter into one upload handler
// limits.fileSize restricts uploads to 50MB maximum
// 50 * 1024 * 1024 = 52428800 bytes = 50MB
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
        // 50MB maximum file size
        // Larger files will be automatically rejected
    }
});


// ============================================
// ROUTE DEFINITIONS
// ============================================

// POST /api/repositories/upload/:projectId
// ACCESS: Protected
// WHAT: Accepts a ZIP file upload for a specific project
// HOW: upload.single('repository') is multer middleware
//      It processes ONE file from the form field named 'repository'
//      After it runs, req.file contains the uploaded file info
//      Then protect checks the JWT token
//      Then uploadRepository controller handles the rest
router.post(
    '/upload/:projectId',
    protect,
    upload.single('repository'),
    uploadRepository
);

// POST /api/repositories/github
// ACCESS: Protected
// WHAT: Accepts a GitHub URL and stores it on the project
// No file upload here — just a JSON body with the URL
router.post('/github', protect, importGithubRepository);


module.exports = router;
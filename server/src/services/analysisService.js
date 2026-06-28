// server/src/services/analysisService.js
// Orchestrates the complete repository analysis pipeline
// Coordinates fileScanner, techDetector, and routeDetector
// Saves results to MongoDB and returns a complete analysis summary

const { scanZipFile, buildFolderStructure } = require('../parsing/fileScanner');
const { detectTechnologies, detectProjectType } = require('../parsing/techDetector');
const { detectRoutes, groupRoutesByFile } = require('../parsing/routeDetector');
const Project = require('../models/Project');
const fs = require('fs');

// ============================================
// MAIN FUNCTION — analyzeRepository
// ============================================
// Takes a project ID and ZIP file path
// Runs the full analysis pipeline
// Saves results to MongoDB
// Returns the complete analysis result
//
// PARAMETERS:
// projectId   — MongoDB ID of the project being analyzed
// zipFilePath — path to the uploaded ZIP file on the server
//
// RETURNS:
// {
//   technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
//   projectType: 'Full-stack React + Express application with MongoDB',
//   routes: [{ method: 'GET', path: '/api/users', file: '...' }],
//   folderStructure: 'src/\n  controllers/\n  models/\n...',
//   totalFiles: 34,
//   summary: 'Full-stack React + Express application with MongoDB...'
// }
// ============================================
const analyzeRepository = async (projectId, zipFilePath) => {
    try {

        console.log(`Starting analysis for project: ${projectId}`);

        // ============================================
        // STEP 1 — SCAN THE ZIP FILE
        // ============================================
        // Extract all readable code files from the ZIP
        // Returns array of { path, content, extension } objects
        console.log('Step 1: Scanning ZIP file...');
        const files = scanZipFile(zipFilePath);

        if (files.length === 0) {
            throw new Error('No readable code files found in the uploaded ZIP');
        }

        // ============================================
        // STEP 2 — DETECT TECHNOLOGIES
        // ============================================
        // Scan file contents for technology patterns
        // Returns array of technology names
        console.log('Step 2: Detecting technologies...');
        const technologies = detectTechnologies(files);
        const projectType = detectProjectType(technologies);


        // ============================================
        // STEP 3 — DETECT API ROUTES
        // ============================================
        // Find all route definitions in code files
        // Returns array of { method, path, file } objects
        console.log('Step 3: Detecting API routes...');
        const routes = detectRoutes(files);


        // ============================================
        // STEP 4 — BUILD FOLDER STRUCTURE
        // ============================================
        // Create a visual representation of the project structure
        console.log('Step 4: Building folder structure...');
        const folderStructure = buildFolderStructure(files);


        // ============================================
        // STEP 5 — BUILD SUMMARY
        // ============================================
        // Create a plain English summary of the codebase
        // This is displayed to the user and also used as AI context in Phase 4
        const summary = buildSummary({
            projectType,
            technologies,
            routes,
            totalFiles: files.length
        });


        // ============================================
        // STEP 6 — SAVE RESULTS TO MONGODB
        // ============================================
        // Update the project document with all analysis results
        // findByIdAndUpdate() finds the project and updates specific fields
        // { new: true } returns the updated document instead of the old one
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                detectedTechnologies: technologies,
                repositorySummary: summary,
                status: 'analyzed',

                // Store routes and folder structure as JSON strings
                // We will add these fields to the Project model
                detectedRoutes: JSON.stringify(routes),
                folderStructure: folderStructure
            },
            { new: true }
        );

        // ============================================
        // STEP 7 — CLEAN UP ZIP FILE
        // ============================================
        // Delete the uploaded ZIP file from the server
        // We have extracted everything we need from it
        // Keeping it would waste disk space
        try {
            fs.unlinkSync(zipFilePath);
            console.log('ZIP file deleted after analysis');
        } catch (cleanupError) {
            // Non-critical error — log but don't fail the whole operation
            console.warn('Could not delete ZIP file:', cleanupError.message);
        }


        // ============================================
        // STEP 8 — RETURN RESULTS
        // ============================================
        const result = {
            technologies,
            projectType,
            routes,
            folderStructure,
            totalFiles: files.length,
            summary,
            project: updatedProject
        };

        console.log(`Analysis complete for project: ${projectId}`);
        return result;

    } catch (error) {
        console.error('Analysis failed:', error.message);
        throw error;
    }
};


// ============================================
// HELPER FUNCTION — buildSummary
// ============================================
// Builds a plain English summary of the analyzed codebase
// This summary is stored in MongoDB and used as AI context in Phase 4
const buildSummary = ({ projectType, technologies, routes, totalFiles }) => {

    // Start with the project type
    let summary = `${projectType}. `;

    // Add technology list
    if (technologies.length > 0) {
        summary += `Technologies detected: ${technologies.join(', ')}. `;
    }

    // Add route count
    if (routes.length > 0) {
        summary += `Found ${routes.length} API route${routes.length !== 1 ? 's' : ''}. `;

        // List the first 5 routes as examples
        const routeExamples = routes
            .slice(0, 5)
            .map(r => `${r.method} ${r.path}`)
            .join(', ');

        summary += `Routes include: ${routeExamples}`;

        if (routes.length > 5) {
            summary += ` and ${routes.length - 5} more`;
        }

        summary += '. ';
    }

    // Add file count
    summary += `Total of ${totalFiles} code files analyzed.`;

    return summary;
};


module.exports = { analyzeRepository };
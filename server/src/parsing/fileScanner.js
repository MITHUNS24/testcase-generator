// server/src/parsing/fileScanner.js
// Responsible for extracting and reading files from an uploaded ZIP
// Returns an array of file objects with path and content

const AdmZip = require('adm-zip');
const path = require('path');

// ============================================
// FILE EXTENSIONS WE CARE ABOUT
// ============================================
// We only read code files — not images, fonts, or binaries
// Reading binary files would produce garbage output
const SUPPORTED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx',  // JavaScript and TypeScript
    '.json',                         // Config files like package.json
    '.html', '.css',                 // Frontend files
    '.py',                           // Python
    '.java',                         // Java
    '.env.example',                  // Environment variable examples
    '.md'                            // Documentation
];

// ============================================
// FOLDERS TO SKIP
// ============================================
// These folders contain dependencies or build output
// They are not part of the actual codebase
const IGNORED_FOLDERS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    '.venv',
    'venv'
];

// ============================================
// MAX FILE SIZE
// ============================================
// Skip files larger than 100KB
// Very large files are usually generated or minified code
// Reading them would slow down analysis without useful information
const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes


// ============================================
// MAIN FUNCTION — scanZipFile
// ============================================
// Takes the path to an uploaded ZIP file
// Returns an array of file objects:
// [
//   { path: 'src/index.js', content: 'const express = require...' },
//   { path: 'package.json', content: '{ "name": "myapp" ... }' },
//   ...
// ]
const scanZipFile = (zipFilePath) => {
    try {

        // Create a new AdmZip instance from the file path
        // This reads the ZIP file into memory
        const zip = new AdmZip(zipFilePath);

        // getEntries() returns an array of all files inside the ZIP
        // Each entry has: entryName (path), getData() (content), header (metadata)
        const entries = zip.getEntries();

        // Array to store the files we successfully read
        const files = [];

        // Loop through every file in the ZIP
        entries.forEach((entry) => {

            // Skip directories — we only want files
            // isDirectory is true for folder entries like 'src/'
            if (entry.isDirectory) return;

            const filePath = entry.entryName;
            // filePath example: 'myproject/src/controllers/authController.js'

            // ---- CHECK 1: Skip ignored folders ----
            // Check if any part of the path contains an ignored folder name
            const pathParts = filePath.split('/');
            const isIgnored = pathParts.some(part => IGNORED_FOLDERS.includes(part));
            if (isIgnored) return;

            // ---- CHECK 2: Skip unsupported file types ----
            const fileExtension = path.extname(filePath).toLowerCase();
            if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) return;

            // ---- CHECK 3: Skip files that are too large ----
            if (entry.header.size > MAX_FILE_SIZE) return;

            // ---- READ THE FILE CONTENT ----
            try {
                // getData() returns the file content as a Buffer (raw bytes)
                // .toString('utf8') converts it to a readable string
                const content = entry.getData().toString('utf8');

                // Add this file to our results array
                files.push({
                    path: filePath,
                    content: content,
                    extension: fileExtension
                });

            } catch (readError) {
                // Some files might fail to read (encoding issues, corruption)
                // We skip them silently and continue with the rest
                console.warn(`Could not read file: ${filePath}`);
            }
        });

        console.log(`Scanned ZIP: found ${files.length} readable files`);
        return files;

    } catch (error) {
        console.error('Error scanning ZIP file:', error.message);
        throw new Error('Failed to scan ZIP file: ' + error.message);
    }
};


// ============================================
// HELPER FUNCTION — buildFolderStructure
// ============================================
// Takes the list of files and builds a visual folder structure string
// Example output:
// src/
//   controllers/
//     authController.js
//   models/
//     User.js
//   routes/
//     authRoutes.js
const buildFolderStructure = (files) => {
    // Extract just the file paths
    const paths = files.map(f => f.path);

    // Sort alphabetically so folders appear grouped together
    paths.sort();

    // Build a simple string representation
    // This is stored in MongoDB and shown to the user
    return paths.join('\n');
};


module.exports = { scanZipFile, buildFolderStructure };
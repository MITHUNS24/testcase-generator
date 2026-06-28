// server/src/services/generationService.js
// Orchestrates the complete test generation pipeline
// Coordinates promptBuilder → groqService → MongoDB storage

const { buildTestGenerationPrompt, buildRegenerationPrompt } = require('../ai/promptBuilder');
const { generateWithGroq } = require('../ai/groqService');
const Generation = require('../models/Generation');
const Project = require('../models/Project');


// ============================================
// MAIN FUNCTION — generateTests
// ============================================
// Takes a project ID and testing parameters
// Runs the full generation pipeline
// Saves results to MongoDB
// Returns the complete generation result
//
// PARAMETERS:
// projectId      — MongoDB ID of the project
// userId         — MongoDB ID of the requesting user
// testingGoal    — what the user wants to test
// generationType — type of tests to generate
// codeSnippet    — optional specific code to focus on
// instructions   — optional extra instructions
// ============================================
const generateTests = async ({
    projectId,
    userId,
    testingGoal,
    generationType = 'full',
    codeSnippet = '',
    instructions = ''
}) => {
    try {

        console.log(`Starting test generation for project: ${projectId}`);

        // ============================================
        // STEP 1 — FETCH PROJECT AND ANALYSIS
        // ============================================
        // Get the project document which contains all analysis results
        const project = await Project.findById(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // Parse the stored routes JSON string back into an array
        let routes = [];
        try {
            routes = JSON.parse(project.detectedRoutes || '[]');
        } catch (e) {
            routes = [];
        }

        // Build the analysis object from stored project data
        const analysis = {
            technologies: project.detectedTechnologies || [],
            routes: routes,
            summary: project.repositorySummary || '',
            folderStructure: project.folderStructure || ''
        };


        // ============================================
        // STEP 2 — BUILD THE PROMPT
        // ============================================
        // Use promptBuilder to create a detailed context-aware prompt
        console.log('Building generation prompt...');
        const prompt = buildTestGenerationPrompt({
            project,
            analysis,
            testingGoal,
            generationType,
            codeSnippet,
            instructions
        });


        // ============================================
        // STEP 3 — SEND TO GROQ
        // ============================================
        // Send the prompt to Groq and get back generated tests
        console.log('Sending to Groq AI...');
        const generatedContent = await generateWithGroq(prompt);


        // ============================================
        // STEP 4 — SAVE TO MONGODB
        // ============================================
        // Store the generation in the database
        // This enables history, export, and regeneration features
        console.log('Saving generation to database...');
        const generation = await Generation.create({
            projectId,
            userId,
            generationType,
            testingGoal,
            generatedContent,
            promptUsed: prompt,
            feedback: 'pending',
            isRegeneration: false
        });

        // Update project status to ready
        await Project.findByIdAndUpdate(projectId, { status: 'ready' });


        // ============================================
        // STEP 5 — RETURN RESULTS
        // ============================================
        console.log(`Generation complete for project: ${projectId}`);
        return {
            generation,
            generatedContent,
            tokensUsed: prompt.length
        };

    } catch (error) {
        console.error('Generation failed:', error.message);
        throw error;
    }
};


// ============================================
// FUNCTION — regenerateTests
// ============================================
// Regenerates tests based on a previous generation
// Called when user clicks the Regenerate button
//
// PARAMETERS:
// generationId           — ID of the previous generation to improve
// userId                 — ID of the requesting user
// regenerationInstructions — what to improve or change
// ============================================
const regenerateTests = async ({
    generationId,
    userId,
    regenerationInstructions = ''
}) => {
    try {

        console.log(`Starting regeneration for generation: ${generationId}`);

        // ---- FETCH THE PREVIOUS GENERATION ----
        const previousGeneration = await Generation.findById(generationId);

        if (!previousGeneration) {
            throw new Error('Previous generation not found');
        }

        // ---- FETCH THE PROJECT ----
        const project = await Project.findById(previousGeneration.projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        // ---- BUILD ANALYSIS OBJECT ----
        let routes = [];
        try {
            routes = JSON.parse(project.detectedRoutes || '[]');
        } catch (e) {
            routes = [];
        }

        const analysis = {
            technologies: project.detectedTechnologies || [],
            routes: routes,
            summary: project.repositorySummary || ''
        };

        // ---- BUILD REGENERATION PROMPT ----
        // This prompt includes context from the previous generation
        const prompt = buildRegenerationPrompt({
            project,
            analysis,
            testingGoal: previousGeneration.testingGoal,
            previousGeneration: previousGeneration.generatedContent,
            regenerationInstructions
        });

        // ---- SEND TO GROQ ----
        const generatedContent = await generateWithGroq(prompt);

        // ---- SAVE NEW GENERATION ----
        const newGeneration = await Generation.create({
            projectId: previousGeneration.projectId,
            userId,
            generationType: previousGeneration.generationType,
            testingGoal: previousGeneration.testingGoal,
            generatedContent,
            promptUsed: prompt,
            feedback: 'pending',
            isRegeneration: true,
            parentGenerationId: generationId
        });

        console.log(`Regeneration complete`);
        return {
            generation: newGeneration,
            generatedContent
        };

    } catch (error) {
        console.error('Regeneration failed:', error.message);
        throw error;
    }
};


// ============================================
// FUNCTION — getProjectGenerations
// ============================================
// Returns all generations for a specific project
// Used to show generation history in the workspace
const getProjectGenerations = async (projectId) => {
    try {
        const generations = await Generation.find({ projectId })
            .sort({ createdAt: -1 })
            // Sort newest first
            .select('-promptUsed')
            // Exclude the prompt field — it is large and not needed for listing
            .lean();
        // .lean() returns plain JavaScript objects instead of Mongoose documents
        // Faster and uses less memory when we don't need Mongoose methods

        return generations;
    } catch (error) {
        throw error;
    }
};


module.exports = { generateTests, regenerateTests, getProjectGenerations };
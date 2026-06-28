// server/src/services/generationService.js
// Orchestrates the complete test generation pipeline
// Now includes embedding storage and similarity search for memory system

const { buildTestGenerationPrompt, buildRegenerationPrompt } = require('../ai/promptBuilder');
const { generateWithGroq } = require('../ai/groqService');
const { storeEmbedding } = require('../embeddings/embeddingService');
const { findSimilarGenerations, buildContextFromSimilar } = require('../embeddings/similaritySearch');
const Generation = require('../models/Generation');
const Project = require('../models/Project');


// ============================================
// MAIN FUNCTION — generateTests
// ============================================
// Now includes:
// 1. Similarity search before generation (retrieves relevant past tests)
// 2. Embedding storage after generation (saves for future use)
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
        const project = await Project.findById(projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        let routes = [];
        try {
            routes = JSON.parse(project.detectedRoutes || '[]');
        } catch (e) {
            routes = [];
        }

        const analysis = {
            technologies: project.detectedTechnologies || [],
            routes: routes,
            summary: project.repositorySummary || '',
            folderStructure: project.folderStructure || ''
        };


        // ============================================
        // STEP 2 — SIMILARITY SEARCH (MEMORY SYSTEM)
        // ============================================
        // Search for similar past generations BEFORE building the prompt
        // This is what makes the platform get smarter over time
        console.log('Searching for similar past generations...');
        let similarContext = '';

        try {
            const similarGenerations = await findSimilarGenerations({
                testingGoal,
                projectId,
                userId,
                topN: 3,
                threshold: 0.5
            });

            // Build context string from similar generations
            similarContext = buildContextFromSimilar(similarGenerations);

            if (similarGenerations.length > 0) {
                console.log(`Found ${similarGenerations.length} similar past generations to use as context`);
            } else {
                console.log('No similar past generations found — generating fresh');
            }
        } catch (searchError) {
            // Non-critical — continue without context if search fails
            console.warn('Similarity search failed, continuing without context:', searchError.message);
        }


        // ============================================
        // STEP 3 — BUILD THE PROMPT
        // ============================================
        // Include similar context in the instructions
        // This injects the memory system's findings into the prompt
        const enhancedInstructions = instructions
            ? instructions + '\n' + similarContext
            : similarContext;

        console.log('Building generation prompt...');
        const prompt = buildTestGenerationPrompt({
            project,
            analysis,
            testingGoal,
            generationType,
            codeSnippet,
            instructions: enhancedInstructions
        });


        // ============================================
        // STEP 4 — SEND TO GROQ
        // ============================================
        console.log('Sending to Groq AI...');
        const generatedContent = await generateWithGroq(prompt);


        // ============================================
        // STEP 5 — SAVE TO MONGODB
        // ============================================
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
        // STEP 6 — STORE EMBEDDING (MEMORY SYSTEM)
        // ============================================
        // Store the generation as an embedding AFTER saving
        // This runs asynchronously — we don't wait for it
        // So it doesn't slow down the response to the user
        // The next generation will benefit from this embedding
        storeEmbedding({
            generation,
            projectId,
            userId,
            technologies: project.detectedTechnologies || []
        }).then(() => {
            console.log('Embedding stored successfully for future use');
        }).catch(err => {
            console.warn('Embedding storage failed (non-critical):', err.message);
        });
        // Note: we use .then().catch() instead of await
        // This means the embedding stores in the background
        // The user gets their tests immediately without waiting


        // ============================================
        // STEP 7 — RETURN RESULTS
        // ============================================
        console.log(`Generation complete for project: ${projectId}`);
        return {
            generation,
            generatedContent,
            tokensUsed: prompt.length,
            usedMemoryContext: similarContext.length > 0
            // usedMemoryContext tells the frontend if memory was used
        };

    } catch (error) {
        console.error('Generation failed:', error.message);
        throw error;
    }
};


// ============================================
// FUNCTION — regenerateTests
// ============================================
const regenerateTests = async ({
    generationId,
    userId,
    regenerationInstructions = ''
}) => {
    try {

        console.log(`Starting regeneration for generation: ${generationId}`);

        const previousGeneration = await Generation.findById(generationId);

        if (!previousGeneration) {
            throw new Error('Previous generation not found');
        }

        const project = await Project.findById(previousGeneration.projectId);

        if (!project) {
            throw new Error('Project not found');
        }

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

        // Search for similar past generations for regeneration too
        let similarContext = '';
        try {
            const similarGenerations = await findSimilarGenerations({
                testingGoal: previousGeneration.testingGoal,
                projectId: previousGeneration.projectId,
                userId,
                topN: 2,
                threshold: 0.6
            });
            similarContext = buildContextFromSimilar(similarGenerations);
        } catch (err) {
            console.warn('Similarity search failed for regeneration');
        }

        const enhancedInstructions = regenerationInstructions + '\n' + similarContext;

        const prompt = buildRegenerationPrompt({
            project,
            analysis,
            testingGoal: previousGeneration.testingGoal,
            previousGeneration: previousGeneration.generatedContent,
            regenerationInstructions: enhancedInstructions
        });

        const generatedContent = await generateWithGroq(prompt);

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

        // Store embedding for the regenerated tests too
        storeEmbedding({
            generation: newGeneration,
            projectId: previousGeneration.projectId,
            userId,
            technologies: project.detectedTechnologies || []
        }).catch(err => {
            console.warn('Embedding storage failed for regeneration:', err.message);
        });

        console.log('Regeneration complete');
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
const getProjectGenerations = async (projectId) => {
    try {
        const generations = await Generation.find({ projectId })
            .sort({ createdAt: -1 })
            .select('-promptUsed')
            .lean();

        return generations;
    } catch (error) {
        throw error;
    }
};


module.exports = { generateTests, regenerateTests, getProjectGenerations };
// server/src/embeddings/embeddingService.js
// Creates vector embeddings from text and stores them in MongoDB
// Uses @xenova/transformers to run embedding model locally
// No external API needed — model runs on your machine

const Embedding = require('../models/Embedding');

// ============================================
// EMBEDDING MODEL SETUP
// ============================================
// We use a lazy loading pattern for the model
// The model is only loaded when first needed
// This prevents slowing down server startup
let pipeline = null;
let isModelLoading = false;

// ============================================
// FUNCTION — getEmbeddingPipeline
// ============================================
// Loads the embedding model on first use
// Returns the pipeline for generating embeddings
//
// WHY LAZY LOADING?
// The model takes a few seconds to load into memory
// We don't want to delay server startup
// Instead we load it on the first embedding request
// and cache it for all subsequent requests
// ============================================
const getEmbeddingPipeline = async () => {

    // If pipeline is already loaded, return it immediately
    if (pipeline) return pipeline;

    // If model is currently loading, wait for it
    if (isModelLoading) {
        // Wait in 100ms intervals until loading is complete
        while (isModelLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return pipeline;
    }

    try {
        isModelLoading = true;
        console.log('Loading embedding model (first time only)...');

        // Dynamic import of @xenova/transformers
        // We use dynamic import because this is a CommonJS module
        // but @xenova/transformers is an ES module
        const { pipeline: transformersPipeline } = await import('@xenova/transformers');

        // Load the all-MiniLM-L6-v2 model
        // This is a small but powerful sentence embedding model
        // It converts text into 384-dimensional vectors
        // Model is downloaded automatically on first use (~90MB)
        pipeline = await transformersPipeline(
            'feature-extraction',
            // 'feature-extraction' is the task type for generating embeddings
            'Xenova/all-MiniLM-L6-v2'
            // This is the model name — small, fast, and accurate
        );

        console.log('Embedding model loaded successfully');
        isModelLoading = false;
        return pipeline;

    } catch (error) {
        isModelLoading = false;
        console.error('Failed to load embedding model:', error.message);
        throw new Error('Embedding model failed to load: ' + error.message);
    }
};


// ============================================
// FUNCTION — generateEmbedding
// ============================================
// Converts a text string into a vector embedding
//
// PARAMETER:
// text — the text to embed (testing goal + generated content)
//
// RETURNS:
// Array of numbers (the vector) — 384 dimensions
// Example: [0.123, -0.456, 0.789, ...]
// ============================================
const generateEmbedding = async (text) => {
    try {

        // Get the embedding pipeline (loads model if needed)
        const embeddingPipeline = await getEmbeddingPipeline();

        // Truncate text to prevent exceeding model's token limit
        // Most embedding models have a 512 token limit
        // We truncate to roughly 1000 characters to be safe
        const truncatedText = text.substring(0, 1000);

        // Generate the embedding
        // The model processes the text and returns a tensor
        const output = await embeddingPipeline(truncatedText, {
            pooling: 'mean',
            // 'mean' pooling averages all token embeddings into one vector
            // This gives us a single vector representing the whole text
            normalize: true
            // normalize: true scales the vector to unit length
            // This makes similarity calculations more accurate
        });

        // Convert the tensor to a regular JavaScript array
        // Array.from() converts the Float32Array to a regular array
        const vector = Array.from(output.data);

        return vector;

    } catch (error) {
        console.error('Failed to generate embedding:', error.message);
        throw new Error('Embedding generation failed: ' + error.message);
    }
};


// ============================================
// FUNCTION — storeEmbedding
// ============================================
// Generates an embedding for a generation and stores it in MongoDB
//
// PARAMETERS:
// generation   — the Generation document from MongoDB
// projectId    — MongoDB ID of the project
// userId       — MongoDB ID of the user
// technologies — array of detected technologies
// ============================================
const storeEmbedding = async ({
    generation,
    projectId,
    userId,
    technologies = []
}) => {
    try {

        console.log(`Generating embedding for generation: ${generation._id}`);

        // Build the text to embed
        // We combine the testing goal and generated content
        // This gives the embedding full context about what was tested
        const textToEmbed = `
      Testing goal: ${generation.testingGoal}
      Test type: ${generation.generationType}
      Generated tests: ${generation.generatedContent.substring(0, 500)}
    `.trim();

        // Generate the vector embedding
        const vector = await generateEmbedding(textToEmbed);

        // Store the embedding in MongoDB
        const embedding = await Embedding.create({
            projectId,
            generationId: generation._id,
            userId,
            vector,
            content: generation.generatedContent,
            metadata: {
                testingGoal: generation.testingGoal,
                generationType: generation.generationType,
                technologies,
                qualityScore: generation.qualityScore || 0,
                wasApproved: generation.feedback === 'approved'
            }
        });

        console.log(`Embedding stored: ${embedding._id}`);
        return embedding;

    } catch (error) {
        // Non-critical — log but don't fail the whole operation
        // If embedding fails, the generation still succeeds
        console.error('Failed to store embedding:', error.message);
        return null;
    }
};


module.exports = { generateEmbedding, storeEmbedding };
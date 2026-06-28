// server/src/embeddings/similaritySearch.js
// Finds past generations that are semantically similar to a new testing goal
// Uses cosine similarity to compare vector embeddings
// Results are used to provide context for new AI generations

const Embedding = require('../models/Embedding');
const { generateEmbedding } = require('./embeddingService');


// ============================================
// FUNCTION — cosineSimilarity
// ============================================
// Calculates how similar two vectors are
// Returns a number between 0 and 1
// 1 = identical, 0 = completely different
//
// MATH EXPLANATION:
// cosine similarity = (A · B) / (|A| × |B|)
// where:
// A · B = dot product (sum of element-wise multiplication)
// |A| = magnitude of vector A (square root of sum of squares)
// |B| = magnitude of vector B
//
// We don't need to divide by magnitudes if vectors are normalized
// Our embedding model normalizes vectors automatically
// ============================================
const cosineSimilarity = (vectorA, vectorB) => {

    // Vectors must be the same length to compare
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same dimensions');
    }

    // Calculate dot product
    // Multiply each pair of corresponding elements and sum them all
    let dotProduct = 0;
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
    }

    // Calculate magnitudes
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vectorA.length; i++) {
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Prevent division by zero
    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    // Return cosine similarity
    return dotProduct / (magnitudeA * magnitudeB);
};


// ============================================
// FUNCTION — findSimilarGenerations
// ============================================
// Takes a testing goal and finds the most similar past generations
// Returns the top N most similar past generations
//
// PARAMETERS:
// testingGoal  — the new testing goal to find similar generations for
// projectId    — only search within this project's embeddings
// userId       — only search within this user's embeddings
// topN         — how many similar generations to return (default 3)
// threshold    — minimum similarity score to include (default 0.5)
//
// RETURNS:
// Array of similar generation objects sorted by similarity score
// [
//   { content: '...', similarity: 0.92, metadata: {...} },
//   { content: '...', similarity: 0.78, metadata: {...} },
//   ...
// ]
// ============================================
const findSimilarGenerations = async ({
    testingGoal,
    projectId,
    userId,
    topN = 3,
    threshold = 0.5
}) => {
    try {

        console.log(`Finding similar generations for: "${testingGoal}"`);

        // ---- STEP 1: GENERATE EMBEDDING FOR THE QUERY ----
        // Convert the testing goal into a vector
        const queryVector = await generateEmbedding(testingGoal);


        // ---- STEP 2: FETCH ALL STORED EMBEDDINGS ----
        // We fetch embeddings for this user's projects
        // In production with millions of records we would use
        // a vector database like Pinecone or MongoDB Atlas Vector Search
        // For our scale, fetching and comparing in memory works fine
        const embeddings = await Embedding.find({
            userId,
            // Optionally filter by project for more relevant results
            // ...(projectId && { projectId })
        })
            .select('vector content metadata generationId')
            // Only fetch the fields we need
            // Fetching the full document would be slower
            .lean();
        // .lean() returns plain objects, faster than Mongoose documents

        if (embeddings.length === 0) {
            console.log('No embeddings found for similarity search');
            return [];
        }

        console.log(`Comparing query against ${embeddings.length} stored embeddings`);


        // ---- STEP 3: CALCULATE SIMILARITY SCORES ----
        // Compare the query vector against every stored embedding
        const similarities = embeddings.map(embedding => {
            const similarity = cosineSimilarity(queryVector, embedding.vector);
            return {
                similarity,
                content: embedding.content,
                metadata: embedding.metadata,
                generationId: embedding.generationId
            };
        });


        // ---- STEP 4: FILTER AND SORT ----
        // Keep only results above the threshold
        // Sort by similarity score (highest first)
        const filtered = similarities
            .filter(item => item.similarity >= threshold)
            // Remove results that are too dissimilar
            .sort((a, b) => b.similarity - a.similarity)
            // Sort highest similarity first
            .slice(0, topN);
        // Take only the top N results

        console.log(`Found ${filtered.length} similar generations above threshold ${threshold}`);
        return filtered;

    } catch (error) {
        // Non-critical — if similarity search fails, generation still works
        // Just without historical context
        console.error('Similarity search failed:', error.message);
        return [];
    }
};


// ============================================
// FUNCTION — buildContextFromSimilar
// ============================================
// Takes similar generations and builds a context string
// This context is injected into the AI prompt
// to improve generation quality
//
// PARAMETER:
// similarGenerations — array from findSimilarGenerations()
//
// RETURNS:
// A formatted string describing past relevant generations
// ============================================
const buildContextFromSimilar = (similarGenerations) => {

    if (!similarGenerations || similarGenerations.length === 0) {
        return '';
    }

    // Build a context section for the prompt
    const contextLines = similarGenerations.map((item, index) => {
        const score = (item.similarity * 100).toFixed(0);
        return `
### Previous Generation ${index + 1} (${score}% relevant)
Testing goal: ${item.metadata?.testingGoal || 'Unknown'}
Type: ${item.metadata?.generationType || 'full'}
${item.metadata?.wasApproved ? '✓ User approved this generation' : ''}

Previous test code:
\`\`\`javascript
${item.content.substring(0, 800)}
${item.content.length > 800 ? '// ... (truncated)' : ''}
\`\`\`
`;
    });

    return `
## Historical Context (from memory system)
The following similar test generations were found in your history.
Use these as reference to maintain consistency and avoid duplication:

${contextLines.join('\n')}

Build upon these previous generations. Don't repeat what was already tested.
Focus on new coverage and improved quality.
`;
};


module.exports = {
    cosineSimilarity,
    findSimilarGenerations,
    buildContextFromSimilar
};
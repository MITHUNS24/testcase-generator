// server/src/models/Embedding.js
// Defines the Embedding model — stores vector representations of generated tests
// These vectors enable semantic similarity search for the memory system

const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema(
    {
        // Links this embedding to a specific project
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },

        // Links this embedding to a specific generation
        generationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Generation',
            required: true
        },

        // Links this embedding to the user who owns it
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // The vector embedding — array of numbers representing the text
        // Example: [0.2, 0.8, 0.1, 0.5, 0.3, ...]
        // The length depends on the embedding model used
        // For our local model it will be 384 dimensions
        vector: {
            type: [Number],
            required: true
            // [Number] means this is an array where every item must be a Number
        },

        // The original text that was embedded
        // Stored so we can retrieve the content without joining to Generation
        content: {
            type: String,
            required: true
        },

        // Metadata about this embedding
        // Stored as a flexible object for additional context
        metadata: {
            // What testing goal this generation was for
            testingGoal: { type: String, default: '' },

            // What type of tests were generated
            generationType: { type: String, default: 'full' },

            // What technologies were detected in the project
            technologies: { type: [String], default: [] },

            // Quality score from user feedback
            qualityScore: { type: Number, default: 0 },

            // Whether the user approved this generation
            wasApproved: { type: Boolean, default: false }
        }
    },
    {
        timestamps: true
    }
);

// Index for fast lookup of all embeddings for a project
embeddingSchema.index({ projectId: 1 });

// Index for fast lookup of all embeddings for a user
embeddingSchema.index({ userId: 1 });

// Index linking embedding to its generation
embeddingSchema.index({ generationId: 1 });

const Embedding = mongoose.model('Embedding', embeddingSchema);

module.exports = Embedding;
// server/src/models/Generation.js
// Defines the Generation model — stores AI generated test cases
// Every generation request creates one document in the 'generations' collection

const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema(
    {
        // Links this generation to a specific project
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required']
        },

        // Links this generation to the user who requested it
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },

        // What type of tests were generated
        // Example: 'unit', 'integration', 'api', 'edge-case', 'full'
        generationType: {
            type: String,
            enum: ['unit', 'integration', 'api', 'edge-case', 'validation', 'full'],
            default: 'full'
        },

        // The testing goal the user provided
        // Example: "Test all authentication routes"
        testingGoal: {
            type: String,
            required: [true, 'Testing goal is required']
        },

        // The actual generated test cases from Groq
        // Stored as a string — can be Markdown formatted code
        generatedContent: {
            type: String,
            required: [true, 'Generated content is required']
        },

        // The prompt that was sent to Groq
        // Stored for debugging and regeneration purposes
        promptUsed: {
            type: String,
            default: ''
        },

        // Quality score — user can rate the generation
        // 0 means not rated yet
        qualityScore: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },

        // User feedback on the generation
        // 'pending'  — not reviewed yet
        // 'approved' — user marked as good
        // 'rejected' — user marked as bad
        feedback: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },

        // Whether this is a regeneration of a previous generation
        isRegeneration: {
            type: Boolean,
            default: false
        },

        // Reference to the original generation if this is a regeneration
        parentGenerationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Generation',
            default: null
        }
    },
    {
        // Automatically adds createdAt and updatedAt
        timestamps: true
    }
);

// Index for fast lookup of all generations for a project
generationSchema.index({ projectId: 1, createdAt: -1 });

// Index for fast lookup of all generations for a user
generationSchema.index({ userId: 1, createdAt: -1 });

const Generation = mongoose.model('Generation', generationSchema);

module.exports = Generation;
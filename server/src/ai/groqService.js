// server/src/ai/groqService.js
// Handles all communication with the Groq AI API
// Takes a prompt, sends it to Groq, and returns the generated text
// This file is the only place in the entire codebase that talks to Groq directly

const Groq = require('groq-sdk');

// ============================================
// INITIALIZE GROQ CLIENT
// ============================================
// Create a Groq client instance using our API key from .env
// This client is reused for all requests — no need to create a new one each time
const groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY
    // API key is read from environment variables
    // NEVER hardcode API keys in source code
});

// The AI model to use for generation
// llama-3.3-70b-versatile is fast and highly capable for code generation
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';


// ============================================
// MAIN FUNCTION — generateWithGroq
// ============================================
// Sends a prompt to Groq and returns the generated text
//
// PARAMETERS:
// prompt      — the full prompt string built by promptBuilder.js
// maxTokens   — maximum length of the response (default 4000)
// temperature — controls creativity (0 = focused, 1 = creative)
//               For code generation we use 0.3 — mostly focused but some variety
//
// RETURNS:
// The generated text string from Groq
// ============================================
const generateWithGroq = async (prompt, maxTokens = 4000, temperature = 0.3) => {
    try {

        console.log(`Sending prompt to Groq (${prompt.length} chars)...`);

        // ============================================
        // MAKE THE API CALL
        // ============================================
        // chat.completions.create() sends a message to the AI
        // and returns a response
        //
        // The messages array follows the chat format:
        // - 'system' role sets the overall behavior of the AI
        // - 'user' role is the actual request/prompt
        const completion = await groqClient.chat.completions.create({
            model: MODEL,

            messages: [
                {
                    role: 'system',
                    // System message sets the AI's persona and behavior
                    // This applies to every response from this request
                    content: 'You are an expert software testing engineer. Generate clean, production-quality test code. Always respond with only the code, no explanations outside code blocks.'
                },
                {
                    role: 'user',
                    // User message is the actual prompt we built
                    content: prompt
                }
            ],

            max_tokens: maxTokens,
            // max_tokens limits the response length
            // 4000 tokens is roughly 3000 words — enough for comprehensive tests

            temperature: temperature,
            // temperature controls randomness
            // 0.0 = completely deterministic (same input = same output)
            // 1.0 = very creative and varied
            // 0.3 = mostly consistent but with some variation — good for code

            // Stop sequences — if the AI generates these, it stops
            // Prevents runaway generation
            stop: null
        });

        // ============================================
        // EXTRACT THE GENERATED TEXT
        // ============================================
        // The response is a complex object
        // The actual text is nested inside choices[0].message.content
        const generatedText = completion.choices[0]?.message?.content;

        if (!generatedText) {
            throw new Error('Groq returned an empty response');
        }

        console.log(`Groq response received (${generatedText.length} chars)`);
        return generatedText;

    } catch (error) {

        // ============================================
        // ERROR HANDLING
        // ============================================
        // Different types of errors need different handling

        if (error.status === 401) {
            // 401 means the API key is invalid or missing
            throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env');
        }

        if (error.status === 429) {
            // 429 means rate limit exceeded — too many requests
            throw new Error('Groq rate limit exceeded. Please wait a moment and try again.');
        }

        if (error.status === 503) {
            // 503 means Groq service is temporarily unavailable
            throw new Error('Groq service is temporarily unavailable. Please try again later.');
        }

        // For any other error, pass the original message
        console.error('Groq API error:', error.message);
        throw new Error('AI generation failed: ' + error.message);
    }
};


// ============================================
// HELPER FUNCTION — testGroqConnection
// ============================================
// Tests if the Groq API key is valid and the service is reachable
// Called during server startup or health checks
const testGroqConnection = async () => {
    try {
        const response = await generateWithGroq(
            'Say "Groq connection successful" and nothing else.',
            50,  // very short response
            0    // no randomness
        );
        console.log('Groq connection test:', response.trim());
        return true;
    } catch (error) {
        console.error('Groq connection test failed:', error.message);
        return false;
    }
};


module.exports = { generateWithGroq, testGroqConnection };
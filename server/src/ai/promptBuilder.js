// server/src/ai/promptBuilder.js
// Builds detailed prompts for Groq AI test generation
// The quality of generated tests depends entirely on prompt quality
// A good prompt includes: context, tech stack, routes, goal, and format instructions

// ============================================
// MAIN FUNCTION — buildTestGenerationPrompt
// ============================================
// Takes all available context about the project
// Returns a detailed prompt string ready to send to Groq
//
// PARAMETERS:
// project      — the project document from MongoDB
// analysis     — the analysis results (technologies, routes, summary)
// testingGoal  — what the user wants to test
// generationType — what type of tests to generate
// codeSnippet  — optional specific code to focus on
// instructions — optional extra instructions from the user
// ============================================
const buildTestGenerationPrompt = ({
    project,
    analysis,
    testingGoal,
    generationType = 'full',
    codeSnippet = '',
    instructions = ''
}) => {

    // ============================================
    // SECTION 1 — SYSTEM CONTEXT
    // ============================================
    // This section tells the AI what role it is playing
    // and what its overall task is
    const systemContext = `You are an expert software testing engineer with deep knowledge of JavaScript, TypeScript, React, Node.js, Express, MongoDB, and modern testing frameworks like Jest, Mocha, Supertest, and React Testing Library.

Your task is to generate comprehensive, production-quality test cases based on the provided codebase context. Your tests must be:
- Specific to the actual codebase, not generic examples
- Written in JavaScript using Jest as the testing framework
- Complete with imports, setup, teardown, and assertions
- Well commented explaining what each test verifies
- Covering happy paths, edge cases, and error scenarios`;


    // ============================================
    // SECTION 2 — PROJECT CONTEXT
    // ============================================
    // Tell the AI what project it is working with
    const projectContext = `
## Project Information
Project Name: ${project.projectName}
Repository: ${project.repositoryUrl || 'Uploaded ZIP file'}
Project Summary: ${analysis.summary || 'Full-stack JavaScript application'}`;


    // ============================================
    // SECTION 3 — TECHNOLOGY STACK
    // ============================================
    // Tell the AI exactly what technologies are being used
    // This determines which testing libraries and patterns to use
    const techContext = analysis.technologies && analysis.technologies.length > 0
        ? `
## Technology Stack
${analysis.technologies.map(tech => `- ${tech}`).join('\n')}

Testing approach based on stack:
${analysis.technologies.includes('React') ? '- Frontend: Use React Testing Library and Jest for component tests' : ''}
${analysis.technologies.includes('Express') ? '- Backend: Use Supertest for API endpoint testing' : ''}
${analysis.technologies.includes('MongoDB') ? '- Database: Use Jest mocks or mongodb-memory-server for database tests' : ''}
${analysis.technologies.includes('JWT') ? '- Auth: Include tests for token generation, validation, and expiry' : ''}`
        : '';


    // ============================================
    // SECTION 4 — API ROUTES CONTEXT
    // ============================================
    // List all detected API routes so the AI knows what endpoints exist
    let routesContext = '';
    if (analysis.routes && analysis.routes.length > 0) {
        routesContext = `
## Detected API Routes
The following API routes were detected in the codebase:
${analysis.routes.map(r => `- ${r.method} ${r.path}`).join('\n')}`;
    }


    // ============================================
    // SECTION 5 — CODE SNIPPET (if provided)
    // ============================================
    // If the user pasted specific code, include it
    // This helps the AI generate tests for that exact code
    const snippetContext = codeSnippet
        ? `
## Code to Test
The user has provided the following specific code to test:
\`\`\`javascript
${codeSnippet}
\`\`\``
        : '';


    // ============================================
    // SECTION 6 — TESTING GOAL AND TYPE
    // ============================================
    // Tell the AI exactly what to test and what type of tests to generate
    const goalContext = `
## Testing Goal
${testingGoal}

## Test Types to Generate
${getTestTypeInstructions(generationType)}`;


    // ============================================
    // SECTION 7 — EXTRA INSTRUCTIONS
    // ============================================
    const extraInstructions = instructions
        ? `
## Additional Instructions
${instructions}`
        : '';


    // ============================================
    // SECTION 8 — OUTPUT FORMAT INSTRUCTIONS
    // ============================================
    // Tell the AI exactly how to format its output
    // Consistent formatting makes the output easier to display and export
    const formatInstructions = `
## Output Format Requirements
Generate the test cases in the following format:

1. Start with a brief comment explaining what is being tested
2. Include all necessary imports at the top
3. Group related tests in describe() blocks
4. Each test should have a clear descriptive name
5. Include setup (beforeEach/beforeAll) and teardown (afterEach/afterAll) where needed
6. Add inline comments explaining complex assertions
7. Use meaningful variable names and mock data
8. Format the output as clean, runnable JavaScript code

Generate comprehensive tests now. Do not include any explanation outside the code blocks.`;


    // ============================================
    // COMBINE ALL SECTIONS INTO FINAL PROMPT
    // ============================================
    const fullPrompt = [
        systemContext,
        projectContext,
        techContext,
        routesContext,
        snippetContext,
        goalContext,
        extraInstructions,
        formatInstructions
    ]
        .filter(section => section.trim() !== '')
        // filter removes empty sections
        .join('\n');

    return fullPrompt;
};


// ============================================
// HELPER FUNCTION — getTestTypeInstructions
// ============================================
// Returns specific instructions based on what type of tests to generate
const getTestTypeInstructions = (generationType) => {
    const instructions = {

        'unit': `Generate UNIT TESTS that:
- Test individual functions and methods in isolation
- Mock all external dependencies (database, API calls, modules)
- Test both success and failure scenarios
- Cover boundary conditions and edge cases
- Use Jest mocking (jest.fn(), jest.mock(), jest.spyOn())`,

        'integration': `Generate INTEGRATION TESTS that:
- Test how multiple components work together
- Test the interaction between routes, controllers, and services
- Use a test database or mock database connections
- Test complete request-response cycles
- Verify data flows correctly between layers`,

        'api': `Generate API TESTS that:
- Test every detected API endpoint
- Use Supertest to make HTTP requests
- Test all HTTP methods (GET, POST, PUT, DELETE)
- Test with valid inputs (happy path)
- Test with invalid inputs (error handling)
- Test authentication and authorization
- Verify response status codes and response body structure`,

        'edge-case': `Generate EDGE CASE TESTS that:
- Test boundary conditions (empty strings, null values, undefined)
- Test extremely large inputs
- Test special characters and SQL/NoSQL injection attempts
- Test concurrent requests
- Test expired tokens and invalid credentials
- Test missing required fields
- Test malformed request bodies`,

        'validation': `Generate VALIDATION TESTS that:
- Test input validation for all fields
- Verify required field validation
- Test data type validation
- Test field length limits
- Test email format validation
- Test password strength requirements
- Verify proper error messages are returned`,

        'full': `Generate a COMPREHENSIVE TEST SUITE that includes ALL of the following:

1. UNIT TESTS — test individual functions in isolation with mocks
2. INTEGRATION TESTS — test how components work together
3. API TESTS — test all detected endpoints with Supertest
4. EDGE CASE TESTS — test boundary conditions and invalid inputs
5. VALIDATION TESTS — test input validation and error handling

Organize the tests in separate describe() blocks for each category.
Make sure the test suite provides maximum coverage of the codebase.`
    };

    return instructions[generationType] || instructions['full'];
};


// ============================================
// HELPER FUNCTION — buildRegenerationPrompt
// ============================================
// Builds a prompt for regenerating tests with improvements
// Called when user clicks the Regenerate button
const buildRegenerationPrompt = ({
    project,
    analysis,
    testingGoal,
    previousGeneration,
    regenerationInstructions
}) => {

    const basePrompt = buildTestGenerationPrompt({
        project,
        analysis,
        testingGoal,
        generationType: 'full'
    });

    // Add context about the previous generation
    const regenerationContext = `
## Previous Generation Context
The following tests were previously generated but need improvement:

\`\`\`javascript
${previousGeneration.substring(0, 1000)}...
\`\`\`

## What to Improve
${regenerationInstructions || 'Generate improved and more comprehensive tests. Fix any issues with the previous generation and add better coverage.'}

Please generate significantly improved tests that address these concerns.`;

    return basePrompt + regenerationContext;
};


module.exports = { buildTestGenerationPrompt, buildRegenerationPrompt };
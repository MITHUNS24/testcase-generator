# AI-Powered Test Case Generator — Specification

## Project Overview
Build a full-stack AI-powered platform that generates intelligent test cases using user prompts, repository context, uploaded code, API definitions, historical generations, and AI memory embeddings. The platform must help developers automatically generate unit tests, integration tests, API tests, edge-case tests, validation tests, and negative test cases. The system must continuously improve generation quality through feedback loops, embedding memory, and prompt refinement.

## Tech Stack
Frontend uses React, Vite, Tailwind CSS, React Router, Axios, and Zustand. Backend uses Node.js, Express.js, MongoDB, Mongoose, and JWT authentication. AI integration is done through the Groq API using an OpenAI-compatible SDK. Vector embeddings are stored in MongoDB.

## Core Features

### Authentication
Must support signup, login, logout, JWT authentication, protected routes, and persistent sessions.

### Project Management
Users must be able to create projects, upload repositories as ZIP files, connect GitHub repositories, view saved generations, and manage project workspaces.

### Repository Analysis
The backend must scan repository files, detect the frontend framework, detect the backend framework, detect API routes, detect database models, detect services, and generate folder structure summaries. Supported ecosystems are React, Node.js, Express.js, MongoDB, JavaScript, and TypeScript.

### AI Test Generation
Users provide a testing goal, a code snippet or repository, and optional testing instructions. The AI must generate unit tests, integration tests, API tests, edge-case tests, validation tests, mock data, and expected outputs. All generated outputs must be editable, support regeneration, and support export.

### Memory Embedding System
The platform must store generated test cases, generate embeddings for each generation, retrieve similar historical generations, and improve future AI outputs through context retrieval.

### Feedback Loop
Users must be able to approve, reject, rate, and regenerate generations. All feedback must be stored so future prompts can be optimized.

### AI Chat Assistant
Must respond to questions such as "explain this test", "generate additional edge cases", "improve assertions", "identify missing tests", and "explain coverage gaps". Must use repository context, previous generations, and embedding retrieval to form answers.

### Export System
Must support Markdown export, PDF export, JSON export, and copy-to-clipboard.

## Frontend Pages
- Landing page: hero section, product introduction, feature showcase, authentication buttons
- Signup page
- Login page
- Dashboard: all user projects, recent generations, project statistics, empty states
- Project workspace: repository overview, generated tests, generation form, AI chat panel, export controls, generation history
- Repository analysis view: detected technologies, detected routes, folder structure, architecture summary

## Backend Architecture
- Routes layer: API routing, middleware usage, request validation
- Controllers layer: handles requests and formats responses
- Services layer: AI orchestration, repository analysis, embedding workflows, test generation logic
- AI engine: prompt construction, context retrieval, generation refinement, AI communication

## Database Collections
- Users: name, email, password, createdAt
- Projects: userId, projectName, repositoryUrl, repositorySummary, detectedTechnologies, createdAt
- Generations: projectId, generationType, generatedContent, qualityScore, feedback, createdAt
- Embeddings: projectId, embedding, content, metadata
- Chats: projectId, userMessage, assistantMessage, createdAt

## API Endpoints
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/projects
- GET /api/projects
- GET /api/projects/:id
- POST /api/repositories/upload
- POST /api/repositories/github
- POST /api/generate/tests
- POST /api/generate/regenerate
- POST /api/chat
- GET /api/export/markdown/:projectId
- GET /api/export/pdf/:projectId
- GET /api/export/json/:projectId

## Folder Structure

### Frontend (client/src/)
- api/
- components/
- pages/
- store/
- hooks/
- layouts/
- routes/
- utils/

### Backend (server/src/)
- config/
- routes/
- controllers/
- services/
- middlewares/
- models/
- ai/
- embeddings/
- parsing/
- utils/
- validators/

## Development Phases
- Phase 1: Frontend and backend initialization, MongoDB connection, authentication system
- Phase 2: Dashboard, project CRUD, repository upload
- Phase 3: File scanning, technology detection, architecture summaries
- Phase 4: Prompt system, AI integration, test generation, regeneration
- Phase 5: Embedding generation, semantic retrieval, historical context enhancement
- Phase 6: AI chat assistant, Markdown export, PDF export, JSON export

## UI and UX Requirements
Must support dark mode, be fully responsive, include loading states and skeleton loaders, include syntax-highlighted code blocks, support editable generated content, and use a clean developer-focused design.

## Security Requirements
Must hash passwords, validate JWT tokens, sanitize uploads, validate repository URLs, secure environment variables, prevent prompt injection, and validate request payloads.

## Final Expected Outcome
The completed platform must intelligently understand repositories, generate high-quality test cases, improve generation quality over time, support AI-assisted QA workflows, and scale to support developer productivity workflows.

## Codex Implementation Instructions
Build phase by phase, follow the folder structure strictly, maintain modular architecture, generate production-grade code, use reusable abstractions, implement scalable R
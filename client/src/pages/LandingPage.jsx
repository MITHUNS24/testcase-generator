// client/src/pages/LandingPage.jsx
// The first page users see when they visit the app
// Shows product introduction, features, and auth buttons

import { useNavigate } from 'react-router-dom'
// useNavigate is a React Router hook
// It gives us a function to programmatically navigate to a different page
// Example: navigate('/signup') takes the user to the signup page

const LandingPage = () => {
    // navigate is a function we call to change pages
    const navigate = useNavigate()

    return (
        // min-h-screen — makes the page at least as tall as the browser window
        // bg-gray-950 — very dark background for developer aesthetic
        // text-white — default white text
        <div className="min-h-screen bg-gray-950 text-white">

            {/* ============================================ */}
            {/* NAVBAR */}
            {/* ============================================ */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">TC</span>
                    </div>
                    <span className="text-xl font-bold text-white">TestCaseAI</span>
                </div>

                {/* Auth buttons */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-300 hover:text-white transition-colors"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Get Started
                    </button>
                </div>
            </nav>


            {/* ============================================ */}
            {/* HERO SECTION */}
            {/* ============================================ */}
            <section className="flex flex-col items-center justify-center text-center px-4 py-24">

                {/* Badge */}
                <div className="bg-purple-900/30 border border-purple-700/50 text-purple-300 text-sm px-4 py-1.5 rounded-full mb-6">
                    AI-Powered Test Generation
                </div>

                {/* Main heading */}
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
                    Generate Test Cases for Your
                    <span className="text-purple-400"> Codebase Instantly</span>
                </h1>

                {/* Subheading */}
                <p className="text-gray-400 text-xl max-w-2xl mb-10">
                    Upload your repository and let AI analyze your code, detect your tech stack,
                    and generate comprehensive unit tests, integration tests, and edge case tests automatically.
                </p>

                {/* CTA buttons */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                    >
                        Start for Free
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3 rounded-lg text-lg transition-colors"
                    >
                        Log in
                    </button>
                </div>
            </section>


            {/* ============================================ */}
            {/* FEATURES SECTION */}
            {/* ============================================ */}
            <section className="px-8 py-16 max-w-6xl mx-auto">

                <h2 className="text-3xl font-bold text-center text-white mb-12">
                    Everything you need for intelligent test generation
                </h2>

                {/* Feature cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Feature 1 */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-purple-400 text-xl">⚡</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            Instant Analysis
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Upload your repository as a ZIP or connect GitHub.
                            Our AI detects your tech stack, API routes, and database models automatically.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-purple-400 text-xl">🧠</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            AI Memory System
                        </h3>
                        <p className="text-gray-400 text-sm">
                            The platform learns from every generation.
                            Past test cases improve future outputs through vector embedding memory.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-purple-400 text-xl">📤</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            Export Anywhere
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Export generated tests as Markdown, PDF, or JSON.
                            Copy to clipboard or integrate directly into your CI/CD pipeline.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-purple-400 text-xl">🔍</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            Full Coverage
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Generates unit tests, integration tests, API tests,
                            edge case tests, validation tests, and negative tests.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-purple-400 text-xl">💬</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            AI Chat Assistant
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Ask questions about your generated tests.
                            The AI understands your codebase and gives context-aware answers.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-purple-400 text-xl">🔒</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            Secure Workspace
                        </h3>
                        <p className="text-gray-400 text-sm">
                            JWT authentication keeps your projects private.
                            Your codebase and generated tests are only visible to you.
                        </p>
                    </div>

                </div>
            </section>


            {/* ============================================ */}
            {/* FOOTER */}
            {/* ============================================ */}
            <footer className="border-t border-gray-800 px-8 py-6 text-center text-gray-500 text-sm">
                © 2026 TestCaseAI. Built for developers.
            </footer>

        </div>
    )
}

export default LandingPage
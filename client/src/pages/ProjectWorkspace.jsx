// client/src/pages/ProjectWorkspace.jsx
// Main project page — shows analysis results and test generation form
// This is the core workspace where users interact with their project

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/api'

const ProjectWorkspace = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    // ============================================
    // LOCAL STATE
    // ============================================
    const [project, setProject] = useState(null)
    const [analysis, setAnalysis] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('overview')

    // Generation form state
    const [testingGoal, setTestingGoal] = useState('')
    const [generationType, setGenerationType] = useState('full')
    const [codeSnippet, setCodeSnippet] = useState('')
    const [instructions, setInstructions] = useState('')

    // Generation results state
    const [generations, setGenerations] = useState([])
    const [activeGeneration, setActiveGeneration] = useState(null)
    const [showGenerationForm, setShowGenerationForm] = useState(false)


    // ============================================
    // FETCH PROJECT DATA ON LOAD
    // ============================================
    useEffect(() => {
        fetchProjectData()
    }, [id])

    const fetchProjectData = async () => {
        try {
            setIsLoading(true)
            setError('')
            const response = await api.get(`/analysis/${id}`)
            setProject(response.data.project)
            setAnalysis(response.data.analysis)

            // If project has been analyzed, fetch generations too
            if (response.data.project.status !== 'created') {
                fetchGenerations()
            }
        } catch (error) {
            setError('Failed to load project. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchGenerations = async () => {
        try {
            const response = await api.get(`/generate/${id}`)
            setGenerations(response.data.generations)
            // Set the most recent generation as active
            if (response.data.generations.length > 0) {
                setActiveGeneration(response.data.generations[0])
            }
        } catch (error) {
            console.error('Failed to fetch generations:', error)
        }
    }


    // ============================================
    // HANDLE ZIP UPLOAD
    // ============================================
    const handleZipUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.name.endsWith('.zip')) {
            setError('Please select a ZIP file')
            return
        }

        try {
            setIsUploading(true)
            setError('')
            const formData = new FormData()
            formData.append('repository', file)
            await api.post(`/repositories/upload/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setUploadSuccess(true)
            await fetchProjectData()
        } catch (error) {
            setError(error.response?.data?.message || 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }


    // ============================================
    // HANDLE ANALYSIS
    // ============================================
    const handleAnalyze = async () => {
        try {
            setIsAnalyzing(true)
            setError('')
            const response = await api.post(`/analysis/${id}`)
            setAnalysis(response.data.analysis)
            await fetchProjectData()
        } catch (error) {
            setError(error.response?.data?.message || 'Analysis failed')
        } finally {
            setIsAnalyzing(false)
        }
    }


    // ============================================
    // HANDLE TEST GENERATION
    // ============================================
    const handleGenerate = async (e) => {
        e.preventDefault()

        if (!testingGoal.trim()) {
            setError('Please enter a testing goal')
            return
        }

        try {
            setIsGenerating(true)
            setError('')

            const response = await api.post('/generate/tests', {
                projectId: id,
                testingGoal,
                generationType,
                codeSnippet,
                instructions
            })

            // Add new generation to the list and set it as active
            const newGeneration = response.data.generation
            setGenerations([newGeneration, ...generations])
            setActiveGeneration(newGeneration)

            // Reset form
            setTestingGoal('')
            setCodeSnippet('')
            setInstructions('')
            setShowGenerationForm(false)

            // Switch to generations tab
            setActiveTab('generations')

        } catch (error) {
            setError(error.response?.data?.message || 'Generation failed')
        } finally {
            setIsGenerating(false)
        }
    }


    // ============================================
    // HANDLE REGENERATE
    // ============================================
    const handleRegenerate = async (generationId) => {
        try {
            setIsGenerating(true)
            setError('')

            const response = await api.post('/generate/regenerate', {
                generationId,
                regenerationInstructions: 'Generate improved and more comprehensive tests'
            })

            const newGeneration = response.data.generation
            setGenerations([newGeneration, ...generations])
            setActiveGeneration(newGeneration)

        } catch (error) {
            setError(error.response?.data?.message || 'Regeneration failed')
        } finally {
            setIsGenerating(false)
        }
    }


    // ============================================
    // HANDLE FEEDBACK
    // ============================================
    const handleFeedback = async (generationId, feedback) => {
        try {
            await api.put(`/generate/${generationId}/feedback`, { feedback })
            // Update the generation in local state
            setGenerations(generations.map(g =>
                g._id === generationId ? { ...g, feedback } : g
            ))
            if (activeGeneration?._id === generationId) {
                setActiveGeneration({ ...activeGeneration, feedback })
            }
        } catch (error) {
            console.error('Failed to update feedback:', error)
        }
    }


    // ============================================
    // COPY TO CLIPBOARD
    // ============================================
    const handleCopy = (content) => {
        navigator.clipboard.writeText(content)
        alert('Copied to clipboard!')
    }


    // FORMAT DATE
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }


    // ============================================
    // LOADING STATE
    // ============================================
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-gray-400">Loading project...</div>
            </div>
        )
    }


    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* NAVBAR */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        ← Dashboard
                    </button>
                    <span className="text-gray-700">/</span>
                    <span className="text-white font-medium">{project?.projectName}</span>
                </div>
                <div className="flex items-center gap-3">
                    {project?.status === 'ready' && (
                        <button
                            onClick={() => setShowGenerationForm(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            + Generate Tests
                        </button>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full border ${project?.status === 'ready'
                            ? 'bg-green-900/30 text-green-400 border-green-700/50'
                            : project?.status === 'analyzed'
                                ? 'bg-blue-900/30 text-blue-400 border-blue-700/50'
                                : 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50'
                        }`}>
                        {project?.status}
                    </span>
                </div>
            </nav>


            <main className="max-w-6xl mx-auto px-8 py-10">

                {/* Error message */}
                {error && (
                    <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                        <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-300">✕</button>
                    </div>
                )}


                {/* ============================================ */}
                {/* REPOSITORY UPLOAD SECTION */}
                {/* ============================================ */}
                {project?.status === 'created' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
                        <h2 className="text-xl font-bold text-white mb-2">Upload Repository</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Upload your codebase as a ZIP file to start the analysis
                        </p>
                        {uploadSuccess ? (
                            <div className="bg-green-900/30 border border-green-700/50 text-green-300 px-4 py-3 rounded-lg text-sm">
                                ✅ Repository uploaded successfully. Click Analyze below.
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center">
                                <div className="text-4xl mb-3">📦</div>
                                <p className="text-gray-400 text-sm mb-4">Select a ZIP file containing your project</p>
                                <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block">
                                    {isUploading ? 'Uploading...' : 'Choose ZIP File'}
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={handleZipUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                )}


                {/* ============================================ */}
                {/* ANALYZE BUTTON */}
                {/* ============================================ */}
                {(uploadSuccess || project?.status === 'analyzed' || project?.status === 'ready') && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-semibold">Repository Analysis</h3>
                            <p className="text-gray-400 text-sm mt-0.5">
                                {analysis?.technologies?.length > 0
                                    ? `Detected: ${analysis.technologies.slice(0, 3).join(', ')}`
                                    : 'Ready to analyze your repository'
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                        >
                            {isAnalyzing ? 'Analyzing...' : '🔍 Re-analyze'}
                        </button>
                    </div>
                )}


                {/* ============================================ */}
                {/* TABS */}
                {/* ============================================ */}
                {analysis && (
                    <div>
                        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
                            {['overview', 'routes', 'structure', 'generations'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {tab}
                                    {tab === 'generations' && generations.length > 0 && (
                                        <span className="ml-1.5 bg-purple-800 text-purple-200 text-xs px-1.5 py-0.5 rounded-full">
                                            {generations.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>


                        {/* TAB 1 — Overview */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-3">Analysis Summary</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <h3 className="text-white font-semibold mb-4">Detected Technologies</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {analysis.technologies?.map((tech) => (
                                            <span key={tech} className="bg-purple-900/30 border border-purple-700/50 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* TAB 2 — Routes */}
                        {activeTab === 'routes' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <h3 className="text-white font-semibold mb-4">
                                    Detected API Routes
                                    <span className="text-gray-500 font-normal text-sm ml-2">
                                        ({analysis.routes?.length || 0} found)
                                    </span>
                                </h3>
                                {analysis.routes && analysis.routes.length > 0 ? (
                                    <div className="space-y-2">
                                        {analysis.routes.map((route, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                                                <span className={`text-xs font-bold px-2 py-1 rounded min-w-16 text-center ${route.method === 'GET' ? 'bg-green-900/50 text-green-400' :
                                                        route.method === 'POST' ? 'bg-blue-900/50 text-blue-400' :
                                                            route.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-400' :
                                                                route.method === 'DELETE' ? 'bg-red-900/50 text-red-400' :
                                                                    'bg-gray-700 text-gray-300'
                                                    }`}>
                                                    {route.method}
                                                </span>
                                                <span className="text-gray-200 font-mono text-sm">{route.path}</span>
                                                <span className="text-gray-600 text-xs ml-auto">{route.file}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No API routes detected</p>
                                )}
                            </div>
                        )}


                        {/* TAB 3 — Structure */}
                        {activeTab === 'structure' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <h3 className="text-white font-semibold mb-4">Folder Structure</h3>
                                <pre className="text-gray-300 text-sm font-mono bg-gray-800 rounded-lg p-4 overflow-auto max-h-96 leading-relaxed">
                                    {analysis.folderStructure || 'No structure available'}
                                </pre>
                            </div>
                        )}


                        {/* TAB 4 — Generations */}
                        {activeTab === 'generations' && (
                            <div className="space-y-4">

                                {/* Generate button if no generations yet */}
                                {generations.length === 0 && (
                                    <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-12 text-center">
                                        <div className="text-4xl mb-3">🧪</div>
                                        <h3 className="text-white font-semibold mb-2">No tests generated yet</h3>
                                        <p className="text-gray-400 text-sm mb-6">Generate your first test suite for this project</p>
                                        <button
                                            onClick={() => setShowGenerationForm(true)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                                        >
                                            Generate Tests
                                        </button>
                                    </div>
                                )}

                                {/* Generation list + active generation */}
                                {generations.length > 0 && (
                                    <div className="grid grid-cols-3 gap-4">

                                        {/* Left — generation history list */}
                                        <div className="col-span-1 space-y-2">
                                            <button
                                                onClick={() => setShowGenerationForm(true)}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mb-3"
                                            >
                                                + New Generation
                                            </button>
                                            {generations.map((gen) => (
                                                <div
                                                    key={gen._id}
                                                    onClick={() => setActiveGeneration(gen)}
                                                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${activeGeneration?._id === gen._id
                                                            ? 'bg-purple-900/30 border-purple-700/50'
                                                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                                                        }`}
                                                >
                                                    <p className="text-white text-sm font-medium truncate">{gen.testingGoal}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-gray-500 text-xs">{gen.generationType}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${gen.feedback === 'approved' ? 'text-green-400' :
                                                                gen.feedback === 'rejected' ? 'text-red-400' :
                                                                    'text-gray-500'
                                                            }`}>
                                                            {gen.feedback}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-xs mt-1">{formatDate(gen.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Right — active generation content */}
                                        {activeGeneration && (
                                            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">

                                                {/* Generation header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-white font-semibold">{activeGeneration.testingGoal}</h3>
                                                        <p className="text-gray-500 text-xs mt-0.5">{formatDate(activeGeneration.createdAt)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleCopy(activeGeneration.generatedContent)}
                                                            className="text-gray-400 hover:text-white text-xs border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded transition-colors"
                                                        >
                                                            Copy
                                                        </button>
                                                        <button
                                                            onClick={() => handleRegenerate(activeGeneration._id)}
                                                            disabled={isGenerating}
                                                            className="text-gray-400 hover:text-white text-xs border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded transition-colors"
                                                        >
                                                            {isGenerating ? 'Regenerating...' : '↺ Regenerate'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Feedback buttons */}
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-gray-500 text-xs">Feedback:</span>
                                                    <button
                                                        onClick={() => handleFeedback(activeGeneration._id, 'approved')}
                                                        className={`text-xs px-3 py-1 rounded transition-colors ${activeGeneration.feedback === 'approved'
                                                                ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                                                                : 'text-gray-500 border border-gray-700 hover:border-green-700/50'
                                                            }`}
                                                    >
                                                        👍 Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(activeGeneration._id, 'rejected')}
                                                        className={`text-xs px-3 py-1 rounded transition-colors ${activeGeneration.feedback === 'rejected'
                                                                ? 'bg-red-900/50 text-red-400 border border-red-700/50'
                                                                : 'text-gray-500 border border-gray-700 hover:border-red-700/50'
                                                            }`}
                                                    >
                                                        👎 Reject
                                                    </button>
                                                </div>

                                                {/* Generated content */}
                                                <pre className="text-gray-300 text-xs font-mono bg-gray-800 rounded-lg p-4 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                                                    {activeGeneration.generatedContent}
                                                </pre>

                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}

            </main>


            {/* ============================================ */}
            {/* GENERATION FORM MODAL */}
            {/* ============================================ */}
            {showGenerationForm && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50"
                    onClick={() => setShowGenerationForm(false)}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-white mb-6">Generate Tests</h2>

                        <form onSubmit={handleGenerate} className="space-y-4">

                            {/* Testing goal */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    Testing goal <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={testingGoal}
                                    onChange={(e) => setTestingGoal(e.target.value)}
                                    placeholder="e.g. Test all authentication routes"
                                    autoFocus
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {/* Generation type */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    Test type
                                </label>
                                <select
                                    value={generationType}
                                    onChange={(e) => setGenerationType(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="full">Full Suite (all types)</option>
                                    <option value="unit">Unit Tests</option>
                                    <option value="integration">Integration Tests</option>
                                    <option value="api">API Tests</option>
                                    <option value="edge-case">Edge Case Tests</option>
                                    <option value="validation">Validation Tests</option>
                                </select>
                            </div>

                            {/* Code snippet */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    Code snippet <span className="text-gray-600">(optional)</span>
                                </label>
                                <textarea
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    placeholder="Paste specific code you want to test..."
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm resize-none"
                                />
                            </div>

                            {/* Extra instructions */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    Extra instructions <span className="text-gray-600">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="e.g. Focus on edge cases, include mock data"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowGenerationForm(false)}
                                    className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    {isGenerating ? 'Generating...' : '⚡ Generate'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default ProjectWorkspace
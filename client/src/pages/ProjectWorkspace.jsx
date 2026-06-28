// client/src/pages/ProjectWorkspace.jsx
// Main project page — shows analysis results and allows repository upload
// This is the core workspace where users interact with their project

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// useParams reads URL parameters
// Example: /projects/6a400be5... → useParams() gives { id: '6a400be5...' }
import api from '../api/api'

const ProjectWorkspace = () => {
    const { id } = useParams()
    // id is the project MongoDB _id from the URL
    const navigate = useNavigate()

    // ============================================
    // LOCAL STATE
    // ============================================

    // project — the project document from MongoDB
    const [project, setProject] = useState(null)

    // analysis — the analysis results for this project
    const [analysis, setAnalysis] = useState(null)

    // isLoading — true while fetching project data
    const [isLoading, setIsLoading] = useState(true)

    // isAnalyzing — true while analysis is running
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // isUploading — true while ZIP file is being uploaded
    const [isUploading, setIsUploading] = useState(false)

    // uploadSuccess — shows success message after upload
    const [uploadSuccess, setUploadSuccess] = useState(false)

    // error — any error message to display
    const [error, setError] = useState('')

    // activeTab — controls which tab is shown in the analysis section
    const [activeTab, setActiveTab] = useState('overview')


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

            // GET /api/analysis/:projectId
            // Returns project details and stored analysis results
            const response = await api.get(`/analysis/${id}`)

            setProject(response.data.project)
            setAnalysis(response.data.analysis)

        } catch (error) {
            setError('Failed to load project. Please try again.')
            console.error('Failed to fetch project:', error)
        } finally {
            setIsLoading(false)
        }
    }


    // ============================================
    // HANDLE ZIP UPLOAD
    // ============================================
    const handleZipUpload = async (e) => {
        // e.target.files[0] is the file the user selected
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.name.endsWith('.zip')) {
            setError('Please select a ZIP file')
            return
        }

        try {
            setIsUploading(true)
            setError('')

            // FormData is used to send files in HTTP requests
            // It works like a form submission with file attachments
            const formData = new FormData()
            formData.append('repository', file)
            // 'repository' must match the field name in multer config

            // POST /api/repositories/upload/:projectId
            await api.post(`/repositories/upload/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                    // Override the default JSON content type
                    // multipart/form-data is required for file uploads
                }
            })

            setUploadSuccess(true)
            // Refresh project data to show updated status
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

            // POST /api/analysis/:projectId
            // Triggers the full analysis pipeline
            const response = await api.post(`/analysis/${id}`)

            setAnalysis(response.data.analysis)
            // Refresh project to get updated status
            await fetchProjectData()

        } catch (error) {
            setError(error.response?.data?.message || 'Analysis failed')
        } finally {
            setIsAnalyzing(false)
        }
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
                    <span className="text-white font-medium">
                        {project?.projectName}
                    </span>
                </div>

                {/* Project status badge */}
                <span className={`text-xs px-3 py-1 rounded-full border ${project?.status === 'analyzed' || project?.status === 'ready'
                        ? 'bg-green-900/30 text-green-400 border-green-700/50'
                        : 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50'
                    }`}>
                    {project?.status}
                </span>
            </nav>


            <main className="max-w-6xl mx-auto px-8 py-10">

                {/* Error message */}
                {error && (
                    <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* ============================================ */}
                {/* REPOSITORY UPLOAD SECTION */}
                {/* Shown when no repository has been uploaded yet */}
                {/* ============================================ */}
                {project?.status === 'created' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
                        <h2 className="text-xl font-bold text-white mb-2">
                            Upload Repository
                        </h2>
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
                                <p className="text-gray-400 text-sm mb-4">
                                    Select a ZIP file containing your project
                                </p>
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
                {/* Shown after upload or if GitHub URL exists */}
                {/* ============================================ */}
                {(uploadSuccess || project?.status === 'analyzed') && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-semibold">Repository Analysis</h3>
                            <p className="text-gray-400 text-sm mt-0.5">
                                {project?.status === 'analyzed'
                                    ? 'Analysis complete — results shown below'
                                    : 'Ready to analyze your repository'
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Repository'}
                        </button>
                    </div>
                )}


                {/* ============================================ */}
                {/* ANALYSIS RESULTS */}
                {/* Shown after analysis is complete */}
                {/* ============================================ */}
                {analysis && analysis.technologies && analysis.technologies.length > 0 && (
                    <div>

                        {/* Summary card */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-white mb-2">
                                Analysis Summary
                            </h2>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {analysis.summary}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
                            {['overview', 'routes', 'structure'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>


                        {/* TAB 1 — Overview (Technologies) */}
                        {activeTab === 'overview' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <h3 className="text-white font-semibold mb-4">
                                    Detected Technologies
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {analysis.technologies.map((tech) => (
                                        <span
                                            key={tech}
                                            className="bg-purple-900/30 border border-purple-700/50 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium"
                                        >
                                            {tech}
                                        </span>
                                    ))}
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
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3"
                                            >
                                                {/* HTTP method badge */}
                                                <span className={`text-xs font-bold px-2 py-1 rounded min-w-16 text-center ${route.method === 'GET' ? 'bg-green-900/50 text-green-400' :
                                                        route.method === 'POST' ? 'bg-blue-900/50 text-blue-400' :
                                                            route.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-400' :
                                                                route.method === 'DELETE' ? 'bg-red-900/50 text-red-400' :
                                                                    'bg-gray-700 text-gray-300'
                                                    }`}>
                                                    {route.method}
                                                </span>
                                                {/* Route path */}
                                                <span className="text-gray-200 font-mono text-sm">
                                                    {route.path}
                                                </span>
                                                {/* Source file */}
                                                <span className="text-gray-600 text-xs ml-auto truncate max-w-48">
                                                    {route.file}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No API routes detected in this repository
                                    </p>
                                )}
                            </div>
                        )}


                        {/* TAB 3 — Folder Structure */}
                        {activeTab === 'structure' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <h3 className="text-white font-semibold mb-4">
                                    Folder Structure
                                </h3>
                                <pre className="text-gray-300 text-sm font-mono bg-gray-800 rounded-lg p-4 overflow-auto max-h-96 leading-relaxed">
                                    {analysis.folderStructure || 'No structure available'}
                                </pre>
                            </div>
                        )}

                    </div>
                )}

            </main>
        </div>
    )
}

export default ProjectWorkspace
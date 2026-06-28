// client/src/pages/Dashboard.jsx
// Full dashboard page — fetches projects, shows them as cards,
// and allows creating new projects via a modal form

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/api'

const Dashboard = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()

    // ============================================
    // LOCAL STATE
    // ============================================

    // projects — array of all user projects fetched from backend
    const [projects, setProjects] = useState([])

    // isLoadingProjects — true while fetching projects from backend
    const [isLoadingProjects, setIsLoadingProjects] = useState(true)

    // showModal — controls whether the create project modal is visible
    const [showModal, setShowModal] = useState(false)

    // newProjectName — value of the project name input in the modal
    const [newProjectName, setNewProjectName] = useState('')

    // newRepositoryUrl — optional GitHub URL in the modal
    const [newRepositoryUrl, setNewRepositoryUrl] = useState('')

    // isCreating — true while create project request is in progress
    const [isCreating, setIsCreating] = useState(false)

    // createError — error message if project creation fails
    const [createError, setCreateError] = useState('')


    // ============================================
    // FETCH PROJECTS ON PAGE LOAD
    // ============================================
    // useEffect with [] runs once when the component mounts
    // We use it to fetch all projects from the backend
    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            setIsLoadingProjects(true)

            // GET /api/projects — returns all projects for logged in user
            // Token is automatically attached by our axios interceptor
            const response = await api.get('/projects')
            setProjects(response.data.projects)

        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            // finally runs whether request succeeded or failed
            setIsLoadingProjects(false)
        }
    }


    // ============================================
    // CREATE NEW PROJECT
    // ============================================
    const handleCreateProject = async (e) => {
        e.preventDefault()
        setCreateError('')

        if (!newProjectName.trim()) {
            setCreateError('Project name is required')
            return
        }

        try {
            setIsCreating(true)

            // POST /api/projects — creates a new project
            const response = await api.post('/projects', {
                projectName: newProjectName.trim(),
                repositoryUrl: newRepositoryUrl.trim()
            })

            // Add the new project to the top of the projects list
            // instead of refetching all projects from the server
            setProjects([response.data.project, ...projects])

            // Reset and close the modal
            setNewProjectName('')
            setNewRepositoryUrl('')
            setShowModal(false)

        } catch (error) {
            setCreateError(error.response?.data?.message || 'Failed to create project')
        } finally {
            setIsCreating(false)
        }
    }


    // ============================================
    // LOGOUT
    // ============================================
    const handleLogout = () => {
        logout()
        navigate('/')
    }


    // ============================================
    // FORMAT DATE
    // ============================================
    // Converts MongoDB timestamp to readable date
    // Example: "2026-06-27T17:44:05.523Z" → "Jun 27, 2026"
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }


    // ============================================
    // STATUS BADGE COLOR
    // ============================================
    // Returns different colors based on project status
    const getStatusColor = (status) => {
        switch (status) {
            case 'created':
                return 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50'
            case 'analyzed':
                return 'bg-blue-900/30 text-blue-400 border-blue-700/50'
            case 'ready':
                return 'bg-green-900/30 text-green-400 border-green-700/50'
            default:
                return 'bg-gray-900/30 text-gray-400 border-gray-700/50'
        }
    }


    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* ============================================ */}
            {/* NAVBAR */}
            {/* ============================================ */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">TC</span>
                    </div>
                    <span className="text-xl font-bold text-white">TestCaseAI</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{user?.name}</span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </nav>


            {/* ============================================ */}
            {/* MAIN CONTENT */}
            {/* ============================================ */}
            <main className="max-w-6xl mx-auto px-8 py-12">

                {/* Header row */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Welcome back, {user?.name} 👋
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {projects.length} project{projects.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        + New Project
                    </button>
                </div>


                {/* ============================================ */}
                {/* PROJECTS GRID */}
                {/* ============================================ */}

                {/* Loading state */}
                {isLoadingProjects && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-gray-400">Loading projects...</div>
                    </div>
                )}

                {/* Empty state — no projects yet */}
                {!isLoadingProjects && projects.length === 0 && (
                    <div className="border border-dashed border-gray-700 rounded-xl p-16 text-center">
                        <div className="text-5xl mb-4">📁</div>
                        <h3 className="text-white text-xl font-semibold mb-2">
                            No projects yet
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Create your first project to start generating test cases
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            Create Project
                        </button>
                    </div>
                )}

                {/* Projects grid — shown when projects exist */}
                {!isLoadingProjects && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.map((project) => (
                            // Each project is rendered as a card
                            // project._id is used as the key — React requires unique keys in lists
                            <div
                                key={project._id}
                                onClick={() => navigate(`/projects/${project._id}`)}
                                className="bg-gray-900 border border-gray-800 hover:border-purple-700/50 rounded-xl p-6 cursor-pointer transition-all hover:bg-gray-900/80"
                            >
                                {/* Project name */}
                                <h3 className="text-white font-semibold text-lg mb-2 truncate">
                                    {project.projectName}
                                </h3>

                                {/* Repository URL if exists */}
                                {project.repositoryUrl && (
                                    <p className="text-gray-500 text-sm mb-3 truncate">
                                        {project.repositoryUrl}
                                    </p>
                                )}

                                {/* Status badge */}
                                <span className={`inline-block text-xs px-2.5 py-1 rounded-full border ${getStatusColor(project.status)} mb-4`}>
                                    {project.status}
                                </span>

                                {/* Detected technologies */}
                                {project.detectedTechnologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {project.detectedTechnologies.slice(0, 3).map((tech) => (
                                            <span
                                                key={tech}
                                                className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Created date */}
                                <p className="text-gray-600 text-xs">
                                    Created {formatDate(project.createdAt)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>


            {/* ============================================ */}
            {/* CREATE PROJECT MODAL */}
            {/* ============================================ */}
            {/* Only rendered when showModal is true */}
            {showModal && (
                // Backdrop — dark overlay behind the modal
                // Clicking it closes the modal
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50"
                    onClick={() => setShowModal(false)}
                >
                    {/* Modal card */}
                    {/* e.stopPropagation() prevents clicking inside modal from closing it */}
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-white mb-6">
                            Create New Project
                        </h2>

                        {/* Error message */}
                        {createError && (
                            <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreateProject} className="space-y-4">

                            {/* Project name */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    Project name
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="My Awesome Project"
                                    autoFocus
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {/* GitHub URL (optional) */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">
                                    GitHub URL
                                    <span className="text-gray-600 ml-1">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newRepositoryUrl}
                                    onChange={(e) => setNewRepositoryUrl(e.target.value)}
                                    placeholder="https://github.com/username/repo"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    {isCreating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Dashboard
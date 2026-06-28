// client/src/pages/Dashboard.jsx
// Dashboard page — shows all user projects
// This is a temporary version — we will build the full version next

import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Dashboard = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">TC</span>
                    </div>
                    <span className="text-xl font-bold text-white">TestCaseAI</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">
                        {user?.name}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-6xl mx-auto px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Welcome back, {user?.name} 👋
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Manage your projects and generate test cases
                        </p>
                    </div>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                        + New Project
                    </button>
                </div>

                {/* Empty state */}
                <div className="border border-dashed border-gray-700 rounded-xl p-16 text-center">
                    <div className="text-5xl mb-4">📁</div>
                    <h3 className="text-white text-xl font-semibold mb-2">
                        No projects yet
                    </h3>
                    <p className="text-gray-400 mb-6">
                        Create your first project to start generating test cases
                    </p>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                        Create Project
                    </button>
                </div>
            </main>

        </div>
    )
}

export default Dashboard
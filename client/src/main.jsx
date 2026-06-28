// client/src/main.jsx
// Entry point of the React application
// This file mounts the React app into the HTML page

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// BrowserRouter enables client-side routing
// It wraps the entire app so React Router works everywhere

import './index.css'
// index.css contains the Tailwind directives
// @tailwind base, @tailwind components, @tailwind utilities

import App from './App.jsx'
// App.jsx is the root component — contains all routes and pages

// createRoot() takes the HTML element with id="root"
// and tells React to render inside it
// document.getElementById('root') finds that div in index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* StrictMode helps catch bugs during development */}
    {/* It renders components twice in development to detect side effects */}
    {/* It has no effect in production */}
    <BrowserRouter>
      {/* BrowserRouter must wrap the entire app */}
      {/* This gives all child components access to routing */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)
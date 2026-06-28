// server/src/parsing/routeDetector.js
// Scans code files and extracts all API route definitions
// Supports Express.js, React Router, and basic Python Flask/Django patterns

// ============================================
// ROUTE PATTERNS
// ============================================
// Regular expressions that match route definitions in code
// Each pattern captures the HTTP method and the route path

const ROUTE_PATTERNS = [

    // ---- EXPRESS.JS PATTERNS ----

    // Matches: router.get('/users', ...)
    // Matches: router.post('/auth/login', ...)
    // Matches: router.put('/users/:id', ...)
    // Matches: router.delete('/users/:id', ...)
    {
        regex: /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        type: 'express'
    },

    // Matches: app.get('/health', ...)
    // Matches: app.post('/api/users', ...)
    {
        regex: /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        type: 'express'
    },

    // ---- FLASK PATTERNS (Python) ----

    // Matches: @app.route('/users', methods=['GET'])
    // Matches: @app.route('/users/<id>', methods=['POST', 'PUT'])
    {
        regex: /@app\.route\s*\(\s*['"]([^'"]+)['"]/gi,
        type: 'flask'
    },

    // ---- FASTIFY PATTERNS ----

    // Matches: fastify.get('/users', ...)
    // Matches: fastify.post('/auth', ...)
    {
        regex: /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        type: 'fastify'
    }
];


// ============================================
// HTTP METHOD COLORS (for display purposes)
// ============================================
const METHOD_COLORS = {
    GET: 'green',
    POST: 'blue',
    PUT: 'yellow',
    DELETE: 'red',
    PATCH: 'orange'
};


// ============================================
// MAIN FUNCTION — detectRoutes
// ============================================
// Takes the array of file objects from fileScanner
// Returns an array of route objects:
// [
//   { method: 'GET', path: '/api/users', file: 'src/routes/userRoutes.js' },
//   { method: 'POST', path: '/api/auth/login', file: 'src/routes/authRoutes.js' },
//   ...
// ]
const detectRoutes = (files) => {

    // Array to store all detected routes
    const routes = [];

    // Track routes we have already found to avoid duplicates
    const seenRoutes = new Set();

    // Only scan JavaScript, TypeScript, and Python files
    // No need to scan CSS or HTML files for routes
    const codeFiles = files.filter(f =>
        ['.js', '.jsx', '.ts', '.tsx', '.py'].includes(f.extension)
    );

    // Loop through each code file
    codeFiles.forEach((file) => {

        // Try each route pattern against this file's content
        ROUTE_PATTERNS.forEach((pattern) => {

            // Reset regex lastIndex before each use
            // This is important for global regex (with 'g' flag)
            // Without this, the regex might skip matches on subsequent calls
            pattern.regex.lastIndex = 0;

            let match;

            // exec() finds the next match each time it is called
            // The while loop keeps calling it until no more matches
            while ((match = pattern.regex.exec(file.content)) !== null) {

                let method, routePath;

                if (pattern.type === 'flask') {
                    // Flask pattern only captures the path, not the method
                    routePath = match[1];
                    method = 'GET'; // Default for Flask, actual method in decorator
                } else {
                    // Express and Fastify capture both method and path
                    method = match[1].toUpperCase();
                    // .toUpperCase() converts 'get' to 'GET'
                    routePath = match[2];
                }

                // Skip middleware routes and wildcards
                // These are not actual API endpoints
                if (routePath === '*' || routePath === '/') continue;

                // Create a unique key to detect duplicates
                const routeKey = `${method}:${routePath}`;

                // Only add if we haven't seen this route before
                if (!seenRoutes.has(routeKey)) {
                    seenRoutes.add(routeKey);

                    routes.push({
                        method,
                        path: routePath,
                        file: file.path,
                        // color is used for display in the frontend
                        color: METHOD_COLORS[method] || 'gray'
                    });
                }
            }
        });
    });

    // Sort routes alphabetically by path for cleaner display
    routes.sort((a, b) => a.path.localeCompare(b.path));

    console.log(`Detected ${routes.length} API routes`);
    return routes;
};


// ============================================
// HELPER FUNCTION — groupRoutesByFile
// ============================================
// Groups routes by the file they were found in
// Useful for displaying routes organized by feature
// Example:
// {
//   'src/routes/authRoutes.js': [
//     { method: 'POST', path: '/signup' },
//     { method: 'POST', path: '/login' }
//   ],
//   'src/routes/projectRoutes.js': [...]
// }
const groupRoutesByFile = (routes) => {
    return routes.reduce((groups, route) => {

        // If this file hasn't been seen yet, create an empty array for it
        if (!groups[route.file]) {
            groups[route.file] = [];
        }

        // Add this route to its file's group
        groups[route.file].push(route);

        return groups;
    }, {});
    // {} is the initial value of groups
};


module.exports = { detectRoutes, groupRoutesByFile };
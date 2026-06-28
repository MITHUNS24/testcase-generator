// server/src/parsing/techDetector.js
// Detects technologies, frameworks, and tools used in a codebase
// Works by scanning file contents and names for specific patterns

// ============================================
// DETECTION PATTERNS
// ============================================
// Each technology has a list of "signals" that indicate its presence
// If any signal is found in the codebase, that technology is detected

const TECH_PATTERNS = {

    // ---- FRONTEND FRAMEWORKS ----
    'React': [
        'import React',
        'from "react"',
        "from 'react'",
        'require("react")',
        "require('react')",
        '"react":',          // in package.json dependencies
        'ReactDOM'
    ],

    'Vue': [
        'from "vue"',
        "from 'vue'",
        '"vue":',
        '<template>',
        'createApp('
    ],

    'Angular': [
        '@angular/core',
        'NgModule',
        '@Component(',
        '"@angular/core":'
    ],

    'Next.js': [
        'from "next"',
        "from 'next'",
        '"next":',
        'getServerSideProps',
        'getStaticProps',
        'next/router'
    ],

    'Vite': [
        '"vite":',
        'vite.config',
        '@vitejs'
    ],

    // ---- BACKEND FRAMEWORKS ----
    'Node.js': [
        'require(',
        'module.exports',
        'process.env',
        '"node":',
        'npm start'
    ],

    'Express': [
        'require("express")',
        "require('express')",
        'from "express"',
        "from 'express'",
        '"express":',
        'app.use(',
        'app.get(',
        'app.post(',
        'router.get(',
        'router.post('
    ],

    'Fastify': [
        'require("fastify")',
        "require('fastify')",
        '"fastify":'
    ],

    'Django': [
        'django',
        'from django',
        'INSTALLED_APPS',
        'urlpatterns'
    ],

    'Flask': [
        'from flask',
        'import flask',
        'Flask(__name__)'
    ],

    // ---- DATABASES ----
    'MongoDB': [
        'mongoose',
        'MongoClient',
        '"mongoose":',
        'mongodb+srv',
        'mongodb://',
        'Schema(',
        'mongoose.model('
    ],

    'PostgreSQL': [
        'pg',
        'Pool(',
        'Client(',
        'postgresql',
        '"pg":'
    ],

    'MySQL': [
        'mysql',
        'mysql2',
        '"mysql":',
        '"mysql2":'
    ],

    'Redis': [
        'redis',
        '"redis":',
        'createClient(',
        'RedisClient'
    ],

    'Prisma': [
        'prisma',
        '@prisma/client',
        'PrismaClient'
    ],

    // ---- LANGUAGES ----
    'TypeScript': [
        '.ts"',
        ".ts'",
        'tsconfig.json',
        ': string',
        ': number',
        ': boolean',
        'interface ',
        'type ',
        '"typescript":'
    ],

    'Python': [
        'import os',
        'import sys',
        'def ',
        'requirements.txt',
        '__init__.py'
    ],

    // ---- TESTING ----
    'Jest': [
        '"jest":',
        'describe(',
        'it(',
        'test(',
        'expect(',
        'beforeEach(',
        'afterEach('
    ],

    'Mocha': [
        '"mocha":',
        'describe(',
        'it(',
        'before(',
        'after('
    ],

    // ---- AUTH & SECURITY ----
    'JWT': [
        'jsonwebtoken',
        '"jsonwebtoken":',
        'jwt.sign(',
        'jwt.verify('
    ],

    'bcrypt': [
        'bcrypt',
        '"bcryptjs":',
        '"bcrypt":',
        'bcrypt.hash(',
        'bcrypt.compare('
    ],

    // ---- STYLING ----
    'Tailwind CSS': [
        'tailwindcss',
        '"tailwindcss":',
        'tailwind.config',
        'className="',
        'bg-',
        'text-',
        'flex '
    ],

    // ---- CLOUD & DEPLOYMENT ----
    'Docker': [
        'Dockerfile',
        'docker-compose',
        'FROM node',
        'FROM python'
    ],

    'AWS': [
        'aws-sdk',
        '"aws-sdk":',
        'amazonaws.com',
        'S3(',
        'DynamoDB('
    ]
};


// ============================================
// MAIN FUNCTION — detectTechnologies
// ============================================
// Takes the array of file objects from fileScanner
// Returns an array of detected technology names
// Example: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Tailwind CSS']
const detectTechnologies = (files) => {

    // Combine all file contents into one big string
    // This makes it easy to search across all files at once
    const allContent = files.map(f => f.content).join('\n');

    // Also get all file paths as a string
    // Some detections are based on file names (like Dockerfile, tsconfig.json)
    const allPaths = files.map(f => f.path).join('\n');

    // Combine content and paths for searching
    const searchTarget = allContent + '\n' + allPaths;

    // Array to store detected technologies
    const detected = [];

    // Loop through each technology and its patterns
    Object.entries(TECH_PATTERNS).forEach(([techName, patterns]) => {

        // Check if ANY of the patterns for this technology exist in the codebase
        const isDetected = patterns.some(pattern =>
            searchTarget.includes(pattern)
        );
        // .some() returns true as soon as it finds one match
        // It stops checking once it finds the first match (efficient)

        if (isDetected) {
            detected.push(techName);
        }
    });

    console.log(`Detected technologies: ${detected.join(', ')}`);
    return detected;
};


// ============================================
// HELPER FUNCTION — detectProjectType
// ============================================
// Returns a human readable description of the project type
// Example: "Full-stack React + Node.js application"
const detectProjectType = (technologies) => {

    const hasFrontend = technologies.some(t =>
        ['React', 'Vue', 'Angular', 'Next.js'].includes(t)
    );

    const hasBackend = technologies.some(t =>
        ['Express', 'Django', 'Flask', 'Fastify'].includes(t)
    );

    const hasDatabase = technologies.some(t =>
        ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'].includes(t)
    );

    // Determine frontend name
    const frontend = technologies.find(t =>
        ['React', 'Vue', 'Angular', 'Next.js'].includes(t)
    );

    // Determine backend name
    const backend = technologies.find(t =>
        ['Express', 'Django', 'Flask', 'Fastify'].includes(t)
    );

    // Determine database name
    const database = technologies.find(t =>
        ['MongoDB', 'PostgreSQL', 'MySQL'].includes(t)
    );

    // Build description based on what was found
    if (hasFrontend && hasBackend && hasDatabase) {
        return `Full-stack ${frontend} + ${backend} application with ${database}`;
    } else if (hasFrontend && hasBackend) {
        return `Full-stack ${frontend} + ${backend} application`;
    } else if (hasFrontend) {
        return `${frontend} frontend application`;
    } else if (hasBackend) {
        return `${backend} backend application`;
    } else {
        return 'Software project';
    }
};


module.exports = { detectTechnologies, detectProjectType };
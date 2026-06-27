// src/config/db.js
// This file is responsible for connecting our backend server to MongoDB Atlas
// It is called once when the server starts

// 'require' brings in an external library — like importing a tool from a toolbox
// mongoose is the library that lets Node.js talk to MongoDB in a structured way
const mongoose = require('mongoose');

// 'async' means this function contains code that takes time to complete
// We mark it async because connecting to a database is not instant
const connectDB = async () => {

    // 'try' means — attempt the following code
    // if anything inside fails, jump to the 'catch' block below
    try {

        // 'await' means — wait for this line to finish before moving to the next line
        // mongoose.connect() sends a connection request to MongoDB Atlas
        // process.env.MONGO_URI reads the database URL from our .env file (not hardcoded for security)
        await mongoose.connect(process.env.MONGODB_URI);

        // If connection is successful, print this confirmation in the terminal
        console.log('MongoDB connected');

    } catch (error) {

        // If connection fails, 'catch' receives the error object
        // error.message gives us a human-readable description of what went wrong
        console.error('MongoDB connection failed:', error.message);

        // process.exit(1) shuts the server down completely
        // '1' means the process stopped because of an error (0 would mean normal exit)
        // We shut down because a server without a database connection is useless
        process.exit(1);
    }
};

// module.exports makes this function available to other files
// Without this line, connectDB exists only inside this file and cannot be used anywhere else
module.exports = connectDB;
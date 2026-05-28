// ============================================
// DATABASE CONNECTION - server/src/config/db.js
// ============================================
// This file handles MongoDB connection
// WHY SEPARATE FILE: Keeps server.js clean, allows reusability
// INTERVIEW TIP: Separating concerns (connection logic from server logic) is best practice

const mongoose = require('mongoose');

// ============================================
// CONNECT TO MONGODB FUNCTION
// ============================================
// This function connects your app to MongoDB Atlas (cloud database)
// Runs once when server starts
const connectDB = async () => {
  try {
    // mongoose.connect() attempts to establish connection to MongoDB
    // It's an async operation (takes time over network)
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser: true - Uses new URL parser (more reliable)
      // useUnifiedTopology: true - Uses new connection pooling
      // These options prevent deprecation warnings
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // If connection succeeds, this code runs
    console.log(`
╔════════════════════════════════════════╗
║     MONGODB CONNECTED SUCCESSFULLY     ║
╚════════════════════════════════════════╝
🗄️  Database: ${connection.connection.name}
🌐 Host: ${connection.connection.host}
📊 Status: ${connection.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
    `);

    // Return connection object (useful for testing/debugging)
    return connection;

  } catch (error) {
    // If connection fails, this error handler runs
    console.error(`
╔════════════════════════════════════════╗
║      MONGODB CONNECTION FAILED ❌       ║
╚════════════════════════════════════════╝
Error: ${error.message}
URI: ${process.env.MONGO_URI}

⚠️  TROUBLESHOOTING:
1. Check if MONGO_URI in .env is correct
2. Verify MongoDB Atlas cluster is running
3. Check if IP address is whitelisted in MongoDB Atlas
4. Ensure username and password are correct
    `);

    // Exit process with error code 1 (indicates failure)
    // INTERVIEW TIP: This prevents app running with broken database
    process.exit(1);
  }
};

// ============================================
// HANDLE MONGOOSE CONNECTION EVENTS
// ============================================
// These events fire when connection state changes

// Fires when connection is lost
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Fires when connection reconnects
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = connectDB;

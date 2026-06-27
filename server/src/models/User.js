// server/src/models/User.js
// Defines the User model — blueprint for user data in MongoDB

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema — rules for every user document
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        }
    },
    {
        // Automatically adds createdAt and updatedAt fields
        timestamps: true
    }
);

// PRE-SAVE HOOK
// Runs automatically before saving a user document to MongoDB
// Used to hash the password before it gets stored
// NOTE: In Mongoose 7+, async pre-save hooks do NOT use next()
// Mongoose automatically waits for the async function to finish
userSchema.pre('save', async function () {

    // 'this' refers to the user document being saved right now

    // Only hash if password was actually changed
    // Prevents re-hashing an already hashed password
    if (!this.isModified('password')) {
        return;
    }

    // genSalt(10) — 10 rounds of processing, industry standard
    const salt = await bcrypt.genSalt(10);

    // Replace plain text password with hashed version
    this.password = await bcrypt.hash(this.password, salt);
});

// INSTANCE METHOD — comparePassword
// Called during login to check if entered password matches stored hash
// Returns true if match, false if not
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Create the model from the schema
// MongoDB will create a 'users' collection automatically
const User = mongoose.model('User', userSchema);

module.exports = User;
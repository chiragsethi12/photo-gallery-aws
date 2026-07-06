// config/db.js - MongoDB connection setup using Mongoose
const mongoose = require('mongoose');

/**
 * connectDB
 * Establishes a connection to the MongoDB database using the MONGO_URI env variable.
 * Logs success/failure clearly and exits the process on connection error.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

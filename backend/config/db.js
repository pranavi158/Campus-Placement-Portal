const mongoose = require('mongoose');

/**
 * Establishes a connection to the MongoDB database using the URI
 * specified in the environment variables.
 */
const connectDB = async () => {
  try {
    console.log("Connecting to Database: ", process.env.MONGO_URI ? "Atlas Cloud URI configured" : "local fallback URI");
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement_portal', {
      serverSelectionTimeoutMS: 5000 // Timeout faster for testing
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;

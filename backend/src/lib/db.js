import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Configure Mongoose to use the built in ES6 Promise
mongoose.Promise = global.Promise;

// Improve MongoDB options for better stability
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 100, // Maintain up to 100 socket connections
  retryWrites: true,
};

// Connection function with retry logic
export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    
    // Get MongoDB URI from environment variable
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO;

    if (!mongoURI) {
      console.error("MongoDB URI is not defined in environment variables");
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI, options);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Handle connection errors
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });
    
    // Handle disconnection
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });
    
    // Handle successful reconnection
    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });
    
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Wait for 5 seconds and try again
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Properly close MongoDB connection
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    process.exit(1);
  }
};

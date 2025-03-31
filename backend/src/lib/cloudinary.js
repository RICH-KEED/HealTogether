import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Simple test to verify configuration
const testCloudinaryConfig = async () => {
  try {
    await cloudinary.api.ping();
    console.log("Cloudinary configuration successful!");
  } catch (error) {
    console.error("Cloudinary configuration error:", error);
  }
};

testCloudinaryConfig();

export default cloudinary;

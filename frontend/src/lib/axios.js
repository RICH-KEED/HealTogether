import axios from "axios";

// Keep the /api in the base URL for consistency with other endpoints
const BASE_URL = "http://localhost:5001/api";

console.log("API base URL:", BASE_URL);

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxBodyLength: 10 * 1024 * 1024, // 10MB
  timeout: 30000 // 30 seconds
});

// Add a request interceptor to set default headers
axiosInstance.interceptors.request.use(
  config => {
    // Ensure content type is always set
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
    
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor for better error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Network errors often happen with CORS issues
    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject(new Error("Network error - please check your connection"));
    }
    
    // Handle specific errors
    if (error.response.status === 413) {
      console.error("Payload too large:", error.response.data);
      return Promise.reject(new Error("Image is too large. Please use a smaller image."));
    }
    
    if (error.response.status === 400 && error.response.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios from "axios";

// Create API with fallback for environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Add a request interceptor to set default headers
api.interceptors.request.use(
  config => {
    // Log base URL for debugging during build issues
    console.log("Using API base URL:", config.baseURL);
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Network errors often happen with CORS issues
    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject(new Error("Network error - please check your connection"));
    }
    
    return Promise.reject(error);
  }
);

export default api;

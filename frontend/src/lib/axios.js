import axios from "axios";

// Create API with simplest configuration
const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

// Simple error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      console.error("Network error");
    }
    return Promise.reject(error);
  }
);
  
export default api;

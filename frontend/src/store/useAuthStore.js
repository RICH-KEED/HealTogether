import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      
      // Calculate needsVerification directly here to ensure consistency
      const needsVerification = 
        res.data && 
        res.data.role !== "user" && 
        res.data.role !== "admin" && 
        res.data.status === "pending";
      
      set({ 
        authUser: res.data,
        isCheckingAuth: false
      });
      
      // Only connect socket for verified or user accounts
      if (!needsVerification) {
        get().connectSocket();
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ 
        authUser: null,
        isCheckingAuth: false
      });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      
      // Determine if verification is needed based on role and status
      const needsVerification = 
        res.data.role !== "user" && 
        res.data.role !== "admin" &&
        res.data.status === "pending";
      
      set({ 
        authUser: res.data,
        isSigningUp: false
      });
      
      if (!needsVerification) {
        toast.success("Account created successfully");
        get().connectSocket();
      } else {
        toast.success("Registration successful! Your account is pending verification.");
      }
      
      return { needsVerification };
    } catch (error) {
      set({ isSigningUp: false });
      toast.error(error.response?.data?.message || "Failed to create account");
      throw error;
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      
      // Determine if verification is needed based on role and status
      const needsVerification = 
        res.data.role !== "user" && 
        res.data.role !== "admin" &&
        res.data.status === "pending";
      
      set({ 
        authUser: res.data,
        isLoggingIn: false
      });
      
      if (!needsVerification) {
        toast.success("Logged in successfully");
        get().connectSocket();
      } else {
        toast.info("Your account is pending verification");
      }
      
      return { needsVerification };
    } catch (error) {
      set({ isLoggingIn: false });
      toast.error(error.response?.data?.message || "Failed to login");
      throw error;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    // If data includes isUpdating, just update the state
    if (data.hasOwnProperty('isUpdating')) {
      set({ isUpdatingProfile: data.isUpdating });
      return;
    }
    
    set({ isUpdatingProfile: true });
    try {
      // If data is an empty object, just refresh the user profile
      if (Object.keys(data).length === 0) {
        const res = await axiosInstance.get("/auth/check");
        set({ 
          authUser: res.data,
          isUpdatingProfile: false
        });
        return res.data;
      }
      
      // Otherwise, update the profile with provided data
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ 
        authUser: res.data,
        isUpdatingProfile: false 
      });
      
      // Only show toast if we're actually making an update
      if (Object.keys(data).length > 0 && !data.hasOwnProperty('isUpdating')) {
        toast.success("Profile updated successfully");
      }
      
      return res.data;
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.message || "Failed to update profile");
      set({ isUpdatingProfile: false });
      throw error;
    }
  },

  requestVerification: async (message) => {
    try {
      const res = await axiosInstance.post("/auth/request-verification", { message });
      set((state) => ({
        authUser: { ...state.authUser, verificationRequest: true, verificationMessage: message }
      }));
      return res.data;
    } catch (error) {
      console.log("Error in requestVerification:", error);
      throw error;
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    try {
      // Create socket with proper options
      const newSocket = io(BASE_URL, {
        query: {
          userId: authUser._id
        },
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5
      });

      // Set up event listeners
      newSocket.on('connect', () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error("Socket connection error:", err);
      });

      newSocket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });

      set({ socket: newSocket });
    } catch (error) {
      console.error("Socket connection failed:", error);
    }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      console.log("Socket disconnected");
    }
  },

  validateReferralCode: async (code) => {
    try {
      const res = await axiosInstance.post("/auth/validate-referral", { referralCode: code });
      return res.data.valid;
    } catch (error) {
      return false;
    }
  },
}));

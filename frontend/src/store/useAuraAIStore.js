import { create } from "zustand";
import axios from "../lib/axios"; // Import the configured axios instance
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useAuraAIStore = create((set, get) => ({
  chats: [], // Ensure this is initialized as an empty array
  currentChat: null,
  history: [],
  loading: false,
  error: null,
  // Prevent infinite request issues
  isLoadingChats: false,
  hasInitialized: false,

  setCurrentChat: async (chat) => {
    // Skip if we're already showing this chat
    if (get().currentChat && get().currentChat._id === chat._id) {
      console.log("Already showing this chat, skipping");
      return;
    }

    try {
      // Validate the chat ID format before making the request
      if (!chat || !chat._id || !/^[0-9a-fA-F]{24}$/.test(chat._id)) {
        console.error("Invalid chat ID format:", chat?._id);
        toast.error("Invalid chat ID format");
        return;
      }
      
      set({ loading: true, currentChat: chat, history: [] });
      // Remove /api prefix as it's already in baseURL
      const response = await axios.get(`/chats/${chat._id}`);
      set({ history: response.data.history, loading: false });
    } catch (error) {
      console.error("Error fetching chat:", error);
      set({ loading: false, currentChat: null });
      toast.error('Failed to load chat');
    }
  },

  getUserChats: async () => {
    // Prevent multiple simultaneous requests
    if (get().isLoadingChats) {
      console.log("Already loading chats, skipping request");
      return;
    }
    
    // Only make the request if we have an authenticated user
    const { authUser } = useAuthStore.getState();
    if (!authUser) {
      console.log("No authenticated user, skipping request");
      return;
    }
    
    set({ isLoadingChats: true });
    try {
      console.log("Fetching user chats");
      // Remove /api prefix as it's already in baseURL
      const response = await axios.get('/chats/userchats');
      
      set({ 
        chats: Array.isArray(response.data) ? response.data : [], 
        isLoadingChats: false,
        hasInitialized: true
      });
    } catch (error) {
      console.error("Error fetching user chats:", error);
      set({ isLoadingChats: false, chats: [] });
    }
  },

  getChatHistory: async (chatId) => {
    if (!chatId) return;
    
    const { authUser } = useAuthStore.getState();
    
    if (!authUser) {
      toast.error("Please log in to access chat history");
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // Remove /api prefix as it's already in baseURL
      const response = await axios.get(`/chats/${chatId}`);
      if (response.data) {
        set({ 
          history: response.data.history || [], 
          loading: false 
        });
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      set({ 
        error: error.message || "Failed to fetch chat history", 
        loading: false,
        history: []
      });
      toast.error("Failed to load chat history");
    }
  },

  createNewChat: async (message, imageUrl = null) => {
    if (!message.trim() && !imageUrl) {
      toast.error("Please enter a message or upload an image");
      return;
    }
    
    const { authUser } = useAuthStore.getState();
    
    if (!authUser) {
      toast.error("Please log in to create a chat");
      return;
    }
    
    set({ loading: true, error: null });
    try {
      console.log("Creating new chat with API path: /chats");
      // Remove /api prefix as it's already in baseURL
      const response = await axios.post('/chats', { 
        text: message,
        img: imageUrl 
      });
      const chatId = response.data;
      
      await get().getUserChats();
      
      set({ loading: false });
      return chatId;
    } catch (error) {
      console.error("Error creating new chat:", error);
      set({ 
        error: error.message || "Failed to create new chat", 
        loading: false 
      });
      toast.error("Failed to create new chat");
      return null;
    }
  },

  sendMessage: async (message, chatId, imageUrl = null) => {
    if ((!message.trim() && !imageUrl) || !chatId) {
      toast.error("Invalid message or chat");
      return;
    }
    
    // Validate the chat ID format
    if (!/^[0-9a-fA-F]{24}$/.test(chatId)) {
      console.error("Invalid chat ID format:", chatId);
      toast.error("Invalid chat ID format");
      return;
    }
    
    const { authUser } = useAuthStore.getState();
    
    if (!authUser) {
      toast.error("Please log in to send messages");
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // Add user message to history immediately for UI responsiveness
      set(state => ({
        history: [
          ...state.history, 
          { 
            role: "user", 
            parts: [{ 
              text: message.trim() || "Image shared", 
              ...(imageUrl && { img: imageUrl })
            }] 
          }
        ]
      }));
      
      console.log("Sending message to API path:", `/chats/${chatId}`);
      // Remove /api prefix as it's already in baseURL
      const response = await axios.put(`/chats/${chatId}`, { 
        question: message,
        img: imageUrl
      });
      
      console.log("API response:", response.data);
      
      // Add AI response to history immediately for UI responsiveness
      if (response.data && response.data.aiResponse) {
        set(state => ({
          history: [
            ...state.history,
            {
              role: "model",
              parts: [{ text: response.data.aiResponse }]
            }
          ]
        }));
      }
      
      // No need to refetch the entire chat history since we've already updated it
      // await get().getChatHistory(chatId);
      
      set({ loading: false });
    } catch (error) {
      console.error("Error sending message:", error);
      set({ 
        error: error.message || "Failed to send message", 
        loading: false 
      });
      toast.error("Failed to send message");
    }
  },

  clearCurrentChat: () => {
    set({ currentChat: null, history: [] });
  }
}));
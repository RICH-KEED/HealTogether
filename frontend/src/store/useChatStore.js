import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  selectedUser: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,
  chatType: "regular", // Add this to differentiate between regular chat and Aura AI

  setChatType: (type) => {
    set({ chatType: type });
  },

  setSelectedUser: (user) => {
    set({ 
      selectedUser: user, 
      messages: [], // Clear previous messages when switching users
      error: null
    });
  },

  getMessages: async (userId) => {
    if (!userId) {
      toast.error("Invalid user selected");
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: response.data || [], loading: false });
    } catch (error) {
      console.error("Error getting messages:", error);
      set({ 
        error: error.message || "Failed to fetch messages", 
        loading: false,
        messages: [] 
      });
      toast.error("Failed to fetch messages");
    }
  },

  sendMessage: async (message, receiverId) => {
    if (!receiverId) {
      throw new Error("No recipient selected");
    }
    
    set({ sending: true, error: null });
    try {
      // Ensure there's text content (empty string if not provided)
      const messageToSend = {
        ...message,
        text: message.text || ""
      };
      
      const response = await axiosInstance.post(`/messages/send/${receiverId}`, messageToSend);
      
      if (response && response.data) {
        set((state) => ({
          messages: [...state.messages, response.data],
          sending: false
        }));
        return response.data;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      set({ 
        error: error.message || "Failed to send message", 
        sending: false 
      });
      throw error; // Re-throw so the component can handle it
    }
  },

  addMessage: (message) => {
    if (!message) return;
    
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  getUsers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data, loading: false });
    } catch (error) {
      console.error("Error getting users:", error);
      set({ 
        error: error.message || "Failed to fetch users", 
        loading: false 
      });
      toast.error("Failed to fetch users");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
}));

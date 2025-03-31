import { create } from "zustand";
import api from "../lib/axios";
import toast from "react-hot-toast";

export const useAuraAIStore = create((set, get) => ({
  // State
  chats: [],
  currentChat: null,
  history: [],
  loading: false,
  hasInitialized: false,

  // Actions
  setCurrentChat: (chat) => {
    set({ currentChat: chat });
    if (chat) {
      get().getMessages(chat._id);
    } else {
      set({ history: [] });
    }
  },

  clearCurrentChat: () => {
    set({ currentChat: null, history: [] });
  },

  getUserChats: async () => {
    set({ loading: true });
    try {
      const response = await api.get("/chats");
      set({ 
        chats: Array.isArray(response.data) ? response.data : [],
        loading: false,
        hasInitialized: true 
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Failed to load chat history");
      set({ 
        chats: [],
        loading: false,
        hasInitialized: true
      });
      return [];
    }
  },

  getMessages: async (chatId) => {
    if (!chatId) return;
    
    set({ loading: true });
    try {
      const response = await api.get(`/chats/${chatId}`);
      if (response.data) {
        // Handle different response formats - try to extract message history
        let messageHistory = [];
        
        // If response.data.messages exists, use it
        if (Array.isArray(response.data.messages)) {
          messageHistory = response.data.messages;
        } 
        // If response.data.history exists, use it
        else if (Array.isArray(response.data.history)) {
          messageHistory = response.data.history;
        }
        // If response.data itself is an array, use it
        else if (Array.isArray(response.data)) {
          messageHistory = response.data;
        }
        
        set({ 
          history: messageHistory, 
          loading: false 
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      set({ history: [], loading: false });
    }
  },

  sendMessage: async (text, chatId, imageUrl = null) => {
    if (!chatId) {
      throw new Error("No chat selected");
    }

    set({ loading: true });
    try {
      // Prepare message data with optional image
      const messageData = {
        text: text || "",
        image: imageUrl
      };
      
      // Add user message to history immediately for better UX
      const tempUserMessage = {
        _id: Date.now().toString(),
        role: "user",
        createdAt: new Date().toISOString(),
        parts: [{ text: text || "", img: imageUrl }],
      };
      
      set((state) => ({
        history: [...state.history, tempUserMessage]
      }));

      // Send to backend
      const response = await api.post(`/chats/${chatId}/messages`, messageData);
      
      // Update with response from backend
      if (response.data && response.data.aiResponse) {
        const aiResponse = {
          _id: response.data.aiResponse._id || Date.now().toString() + "-ai",
          role: "assistant",
          createdAt: response.data.aiResponse.createdAt || new Date().toISOString(),
          parts: [{ text: response.data.aiResponse.text }],
        };
        
        set((state) => ({
          history: [...state.history.filter(msg => msg._id !== tempUserMessage._id), 
                    response.data.userMessage, 
                    aiResponse],
          loading: false
        }));
      } else {
        // If no AI response in the payload, just update user message
        set((state) => ({
          history: [...state.history.filter(msg => msg._id !== tempUserMessage._id), 
                    response.data],
          loading: false
        }));
      }
      
      // Update chat list to reflect latest message
      get().getUserChats();
      
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      set((state) => ({ 
        // Remove temporary message on error
        history: state.history.filter(msg => msg._id !== tempUserMessage?._id),
        loading: false 
      }));
      throw error;
    }
  },

  createNewChat: async (initialMessage, imageUrl = null) => {
    set({ loading: true });
    try {
      // First create a new chat
      const chatResponse = await api.post("/chats", { 
        title: initialMessage.substring(0, 30) || "New conversation"
      });
      
      if (!chatResponse.data || !chatResponse.data._id) {
        throw new Error("Failed to create new chat");
      }
      
      // Then send the first message to this chat
      const messageData = {
        text: initialMessage || "",
        image: imageUrl
      };
      
      await api.post(`/chats/${chatResponse.data._id}/messages`, messageData);
      
      // Update chat list and select the new chat
      const chats = await get().getUserChats();
      const newChat = chats.find(c => c._id === chatResponse.data._id);
      
      if (newChat) {
        set({ currentChat: newChat });
      }
      
      set({ loading: false });
      return chatResponse.data._id;
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
      set({ loading: false });
      throw error;
    }
  },

  deleteChat: async (chatId) => {
    if (!chatId) return;
    
    try {
      await api.delete(`/chats/${chatId}`);
      
      set((state) => ({
        chats: state.chats.filter(chat => chat._id !== chatId),
        currentChat: state.currentChat?._id === chatId ? null : state.currentChat,
        history: state.currentChat?._id === chatId ? [] : state.history
      }));
      
      toast.success("Chat deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
      return false;
    }
  }
}));

import Chat from "../models/chat.model.js";
import Message from "../models/chat.message.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const getChatWithMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // For chats that have history field directly
    if (chat.history && Array.isArray(chat.history)) {
      return res.json({ chat, messages: chat.history });
    }
    
    // For older chat models that have separate messages collection
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json({ chat, messages });
  } catch (error) {
    console.error("Error in getChatWithMessages controller:", error);
    res.status(500).json({ message: error.message });
  }
};

// ...existing code...

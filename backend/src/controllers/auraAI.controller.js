import Chat from "../models/chat.model.js";
import Message from "../models/chat.message.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const createChat = async (req, res) => {
  try {
    console.log("Creating new chat:", req.body);
    
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "Chat title is required" });
    }
    
    const newChat = new Chat({
      title,
      userId: req.user._id,
    });
    
    await newChat.save();
    console.log("Chat created successfully:", newChat);
    
    res.status(201).json(newChat);
  } catch (error) {
    console.error("Error in createChat controller:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error("Error in getChats controller:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getChatWithMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json({ chat, messages });
  } catch (error) {
    console.error("Error in getChatWithMessages controller:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createMessage = async (req, res) => {
  try {
    const chatId = req.params.id;
    const { text, image } = req.body;
    
    // Validate chat exists and belongs to user
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Create user message
    const userMessage = new Message({
      chatId,
      role: "user",
      parts: [{ text, img: image }],
    });
    
    const savedUserMessage = await userMessage.save();
    
    // Update chat's last message and updatedAt
    chat.lastMessage = text || "Sent an image";
    chat.updatedAt = Date.now();
    await chat.save();

    // Generate AI response
    let aiResponseText = "";
    try {
      const prompt = `You are Aura AI, a helpful health assistant. Respond briefly and helpfully to: ${text}`;
      
      // If there's an image, use multimodal AI response
      if (image) {
        aiResponseText = "I've received your image. Let me analyze that for you...";
        // In a real implementation, you'd use a multimodal model here
      } else {
        const result = await model.generateContent(prompt);
        aiResponseText = result.response.text();
      }
    } catch (aiError) {
      console.error("AI response generation error:", aiError);
      aiResponseText = "I'm sorry, but I couldn't process your request at the moment. Please try again later.";
    }
    
    // Save AI response
    const aiMessage = new Message({
      chatId,
      role: "assistant",
      parts: [{ text: aiResponseText }],
    });
    
    const savedAiMessage = await aiMessage.save();
    
    res.status(201).json({ 
      userMessage: savedUserMessage,
      aiResponse: savedAiMessage
    });
  } catch (error) {
    console.error("Error in createMessage controller:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    
    // Validate chat exists and belongs to user
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Delete chat and its messages
    await Message.deleteMany({ chatId });
    await Chat.deleteOne({ _id: chatId });
    
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error in deleteChat controller:", error);
    res.status(500).json({ message: error.message });
  }
};

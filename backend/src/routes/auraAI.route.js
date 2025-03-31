import express from 'express';
import mongoose from 'mongoose';
import { protectRoute } from '../middleware/auth.middleware.js';
import Chat from "../models/chat.js";
import { getGeminiResponse } from "../lib/gemini.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protectRoute);

// Get user's chats
router.get('/userchats', async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Fetching chats for user: ${userId}`);
    
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    console.log(`Found ${chats.length} chats for user`);
    
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create new chat
router.post('/', async (req, res) => {
  try {
    // Get the title from request, or use a default
    const title = req.body.title || "New conversation";
    console.log(`Creating new chat with title: ${title}`);
    
    const newChat = new Chat({
      title,
      userId: req.user._id,
      history: [], // Initialize with empty history
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    const savedChat = await newChat.save();
    console.log(`Created chat with ID: ${savedChat._id}`);
    
    res.status(201).json(savedChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all user's chats
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific chat with messages
router.get('/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    console.log(`Getting chat: ${chatId}`);
    
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    res.status(200).json({
      chat,
      messages: chat.history || []
    });
  } catch (error) {
    console.error("Error getting chat:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add message to chat
router.post('/:id/messages', async (req, res) => {
  try {
    const chatId = req.params.id;
    const { text, image } = req.body;
    
    console.log(`Adding message to chat ${chatId}: "${text?.substring(0, 30)}..."`);
    
    // Get the chat
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Make sure history exists
    if (!chat.history) chat.history = [];
    
    // Create user message
    const userMessage = {
      _id: new mongoose.Types.ObjectId(),
      role: "user",
      parts: [{ text: text || "", img: image }],
      createdAt: new Date()
    };
    
    // Update chat title if it's the first message
    if (chat.history.length === 0 && text) {
      chat.title = text.substring(0, 30);
    }
    
    // Add user message to chat history
    chat.history.push(userMessage);
    chat.lastMessage = text || "Image shared";
    chat.updatedAt = Date.now();
    
    // Save chat with user message first
    await chat.save();
    
    // Generate AI response
    let aiResponseText;
    try {
      console.log("Generating AI response");
      aiResponseText = await getGeminiResponse(text || "Hello");
      console.log("AI response generated successfully");
    } catch (aiError) {
      console.error("AI response error:", aiError);
      aiResponseText = "I'm sorry, I couldn't process your request at the moment. Please try again later.";
    }
    
    // Create AI message
    const aiMessage = {
      _id: new mongoose.Types.ObjectId(),
      role: "assistant",
      parts: [{ text: aiResponseText }],
      createdAt: new Date()
    };
    
    // Add AI message to chat history and save again
    chat.history.push(aiMessage);
    await chat.save();
    
    res.status(200).json({ 
      userMessage,
      aiResponse: aiMessage
    });
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete chat
router.delete('/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    
    // Validate chat exists and belongs to user
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Delete chat
    await Chat.deleteOne({ _id: chatId });
    
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

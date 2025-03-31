import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import Chat from "../models/chat.js";
import UserChats from "../models/userChats.js";
import { getGeminiResponse, getFallbackResponse } from "../lib/gemini.js";

const router = express.Router();

// All routes are protected
router.use(protectRoute);

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Create new chat
router.post("/", async (req, res) => {
  const userId = req.user._id;
  const { text, img } = req.body;

  console.log("Creating chat with:", { userId, text, img });

  try {
    // Add user's message to the chat
    const userMessage = { 
      role: "user", 
      parts: [{ 
        text: text || "Image shared",
        ...(img && { img })
      }] 
    };

    // Generate AI response immediately for the first message
    let aiResponse;
    try {
      console.log("Getting AI response for new chat message...");
      // Pass just the user message for the first interaction
      aiResponse = await getGeminiResponse(text || "Hello", [userMessage]);
      console.log("Received AI response:", aiResponse ? aiResponse.substring(0, 50) + "..." : "No response");
    } catch (aiError) {
      console.error("AI response error:", aiError);
      aiResponse = "Hello! How can I help with your mental wellness today?";
    }

    // Create AI message object
    const aiMessage = { 
      role: "model", 
      parts: [{ text: aiResponse }] 
    };

    // CREATE A NEW CHAT with both user message and AI response
    const newChat = new Chat({
      userId: userId,
      history: [userMessage, aiMessage], // Include both messages
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const savedChat = await newChat.save();
    console.log("Saved chat with AI response:", savedChat._id);

    // CHECK IF THE USERCHATS EXISTS
    const userChats = await UserChats.find({ userId: userId });

    // IF DOESN'T EXIST CREATE A NEW ONE AND ADD THE CHAT IN THE CHATS ARRAY
    if (!userChats.length) {
      const newUserChats = new UserChats({
        userId: userId,
        chats: [
          {
            _id: savedChat._id,
            title: text ? text.substring(0, 40) : "Image conversation",
          },
        ],
      });

      await newUserChats.save();
      console.log("Created new UserChats");
    } else {
      // IF EXISTS, ADD THE NEW CHAT TO THE BEGINNING OF THE ARRAY
      const result = await UserChats.updateOne(
        { userId: userId },
        {
          $push: {
            chats: {
              $each: [{
                _id: savedChat._id,
                title: text ? text.substring(0, 40) : "Image conversation",
              }],
              $position: 0 // This adds the new chat at the beginning
            }
          }
        }
      );
      console.log("Updated existing UserChats:", result);
    }

    res.status(201).send(savedChat._id);
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).send("Error creating chat!");
  }
});

// IMPORTANT: This specific route must come BEFORE the /:id route
// Get user chats
router.get("/userchats", async (req, res) => {
  const userId = req.user._id;

  try {
    const userChats = await UserChats.find({ userId });

    if (userChats.length > 0) {
      // Return the chats array as is since we're now adding new chats at the beginning
      res.status(200).send(userChats[0].chats);
    } else {
      res.status(200).send([]);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching userchats!");
  }
});

// Get specific chat - This must come AFTER more specific routes
router.get("/:id", async (req, res) => {
  const userId = req.user._id;
  const chatId = req.params.id;

  // Validate chatId format before querying MongoDB
  if (!isValidObjectId(chatId)) {
    return res.status(400).json({ error: "Invalid chat ID format" });
  }

  try {
    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    // Sort history array to ensure chronological order
    chat.history.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    res.status(200).send(chat);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching chat!");
  }
});

// Update chat with new messages
router.put("/:id", async (req, res) => {
  const userId = req.user._id;
  const { question, answer, img } = req.body;
  const chatId = req.params.id;

  // Validate chatId format before querying MongoDB
  if (!isValidObjectId(chatId)) {
    return res.status(400).json({ error: "Invalid chat ID format" });
  }

  console.log("Updating chat:", { chatId, userId, question: question?.substring(0, 50) });

  try {
    // First check if chat exists and belongs to user
    const existingChat = await Chat.findOne({ _id: chatId, userId }).catch(err => {
      console.error("Error finding chat:", err);
      return null;
    });
    
    if (!existingChat) {
      console.error("Chat not found or doesn't belong to user");
      return res.status(404).send("Chat not found");
    }

    // Get existing history to provide context to AI
    const chatHistory = existingChat.history || [];

    // First add user's message to history
    const userMessage = { 
      role: "user", 
      parts: [{ 
        text: question || "Image shared", 
        ...(img && { img }) 
      }] 
    };
    
    console.log("Adding user message:", userMessage.parts[0].text?.substring(0, 50));
    
    // Use try/catch for each database operation
    try {
      await Chat.findByIdAndUpdate(chatId, {
        $push: { history: userMessage },
        $set: { updatedAt: Date.now() }
      });
      console.log("Added user message to database");
    } catch (dbError) {
      console.error("Error saving user message:", dbError);
      return res.status(500).send("Failed to save your message");
    }
    
    // Generate AI response
    let aiResponse;
    try {
      console.log("Calling Gemini API with prompt:", question?.substring(0, 50));
      
      // Direct call to getGeminiResponse with the original question
      aiResponse = await getGeminiResponse(question || "Hello");
      
      console.log("AI response received:", aiResponse ? aiResponse.substring(0, 50) + "..." : "No response");
      
      // If empty response, use fallback
      if (!aiResponse) {
        console.log("Empty response from AI, using fallback");
        aiResponse = getFallbackResponse(question);
      }
    } catch (aiError) {
      console.error("AI response error:", aiError);
      aiResponse = "I'm having trouble processing that right now. Can we try a different approach?";
    }
    
    // Add AI response to chat history
    const aiMessage = { 
      role: "model", 
      parts: [{ text: aiResponse }] 
    };
    
    try {
      await Chat.findByIdAndUpdate(chatId, {
        $push: { history: aiMessage }
      });
      console.log("Added AI response to database");
    } catch (dbError) {
      console.error("Error saving AI response:", dbError);
      // Still return the AI response even if saving fails
    }
    
    res.status(200).send({
      updated: true,
      aiResponse
    });
  } catch (err) {
    console.error("Error updating chat:", err);
    // Try to still provide some response even in error case
    res.status(200).send({
      updated: false,
      aiResponse: "I'm sorry, I encountered an issue processing your message. Please try again."
    });
  }
});

export default router;

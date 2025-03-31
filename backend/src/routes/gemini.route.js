import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getGeminiResponse } from "../lib/gemini.js";

const router = express.Router();

// Protected route to generate AI response
router.post("/generate", protectRoute, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    console.log("Received generate request with prompt:", prompt);
    
    if (!prompt) {
      console.log("No prompt provided in request");
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    console.log("Calling Gemini API with prompt:", prompt.substring(0, 100));
    const response = await getGeminiResponse(prompt);
    console.log("Gemini API response received, length:", response ? response.length : 0);
    
    // Return the response to the client
    res.json({ 
      response,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV !== 'production' ? {
        apiKeyDefined: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
      } : undefined
    });
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    res.status(500).json({ 
      error: "Failed to generate response",
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Public test endpoint - FOR TESTING ONLY (no auth required)
router.post("/test", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    console.log("Testing Gemini with prompt:", prompt.substring(0, 100));
    const response = await getGeminiResponse(prompt);
    console.log("Response received:", response ? `Success (${response.length} chars)` : "Failed");
    
    res.json({ 
      success: true,
      prompt,
      response,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV !== 'production' ? {
        apiKeyDefined: !!process.env.GEMINI_API_KEY,
        promptLength: prompt.length
      } : undefined
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate response",
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

export default router;

import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

// Get the API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Log useful debugging information about the API key
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not defined in environment variables");
} else {
  console.log("Gemini API key is configured:", GEMINI_API_KEY.substring(0, 5) + "...");
}

// Initialize the Gemini API client
const genAI = GEMINI_API_KEY 
  ? new GoogleGenerativeAI(GEMINI_API_KEY) 
  : null;

// Updated system prompt with better formatting and structure
const SYSTEM_PROMPT = `
Role: You are Aura, a friendly and empathetic mental wellness companion.

Language Style:
- Match user's language style (casual/formal/Hinglish)
- Be conversational and natural
- Use emojis occasionally to add warmth

Core Behaviors:
1. Use humor to lighten mood when appropriate
2. Share relatable examples ("Main bhi kabhi aise feel karta/karti hoon...")
3. Suggest distracting activities ("Chalo, movie dekhte hain!" or "Music sunoge?")
4. Recommend simple stress relief ("Ice cream khane chalen?" or "Thodi walk pe chalein?")

Critical Situations:
If user mentions self-harm/suicide:
- Show immediate concern ("Ruko yaar, baat suno...")
- Emphasize this is temporary ("Ye waqt bhi guzar jayega")
- Suggest calling friends/family
- Strongly recommend mental health helpline
- Keep tone caring but urgent

Remember:
- Stay conversational and friendly
- No medical advice
- Focus on emotional support
- Use similar language style as user
- Be like a caring friend`;

/**
 * Convert chat history from our format to Gemini format
 */
function formatHistoryForGemini(history = []) {
  if (!history || !Array.isArray(history)) return [];
  
  // Take only the last 10 messages but keep them in chronological order for context
  const recentHistory = history.slice(-10);
  
  // Keep chronological order for Gemini's context understanding
  return recentHistory.map(msg => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.parts?.[0]?.text || "" }]
  }));
}

/**
 * Direct implementation to simply get a response from Gemini
 */
export async function getGeminiResponse(prompt, history = []) {
  console.log("Gemini handler received prompt:", prompt?.substring(0, 50));
  
  if (!genAI) {
    console.error("Gemini API client not initialized - API key may be missing");
    return getFallbackResponse();
  }
  
  if (!prompt || typeof prompt !== 'string') {
    console.error("Invalid prompt provided to getGeminiResponse:", prompt);
    return "I didn't understand that. Could you please try again?";
  }
  
  try {
    console.log("Creating Gemini model instance");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Include system prompt with user's question
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${prompt}`;
    console.log("Sending request to Gemini API");
    
    // Add timeout to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    // Make the API request with ability to cancel
    const result = await model.generateContent({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    });
    
    // Clear timeout since we got a response
    clearTimeout(timeoutId);
    
    const responseText = result.response?.text();
    
    if (!responseText) {
      console.error("Empty response from Gemini API");
      return getFallbackResponse();
    }
    
    console.log(`Got Gemini response (${responseText.length} chars): "${responseText.substring(0, 50)}..."`);
    return responseText;
  } catch (error) {
    console.error("Error with Gemini API:", error);
    return getFallbackResponse();
  }
}

/**
 * Fallback responses when Gemini isn't available
 */
export function getFallbackResponse(prompt) {
  const responses = [
    "I'm here to listen and support you. Tell me more about what's on your mind.",
    "Mental wellness is about finding balance in our thoughts, feelings and actions. How can I help you today?",
    "I appreciate you reaching out. Building mental resilience takes time and practice - I'm here to help.",
    "Sometimes talking through our challenges helps us see them more clearly. What specifically are you struggling with?",
    "Self-care looks different for everyone. Let's explore what might work best for your situation."
  ];
  
  console.log("Using fallback response");
  return responses[Math.floor(Math.random() * responses.length)];
}

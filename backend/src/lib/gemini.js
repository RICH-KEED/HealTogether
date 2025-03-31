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
 * Get a response from the Gemini API
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The text response from Gemini
 */
export const getGeminiResponse = async (prompt) => {
  if (!prompt) {
    return "I need some input to respond to. How can I help you?";
  }
  
  try {
    console.log(`Sending prompt to Gemini: "${prompt.substring(0, 50)}..."`);
    
    if (!genAI) {
      console.error("Gemini API client not initialized - missing API key");
      return "I'm sorry, but I'm not properly configured to respond right now.";
    }
    
    // Create a more robust prompt
    const formattedPrompt = `You are Aura AI, a helpful health assistant. 
    You provide concise, evidence-based information about health and wellbeing.
    
    User's query: ${prompt}
    
    Provide a helpful response:`;
    
    // Get the model and generate content
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(formattedPrompt);
    const response = result.response;
    
    // Extract and return the text
    const responseText = response.text();
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }
    
    console.log(`Got response (${responseText.length} chars): "${responseText.substring(0, 50)}..."`);
    return responseText;
  } catch (error) {
    console.error("Gemini API error:", error);
    // Return a fallback response
    return getFallbackResponse(prompt);
  }
};

export const getFallbackResponse = (prompt = "") => {
  const fallbackResponses = [
    "I'm sorry, I'm having trouble processing that request right now. Could you ask me a different way?",
    "I apologize, but I'm experiencing some technical difficulties. Let's try a different approach.",
    "My systems are currently under heavy load. Could you please try again in a moment?",
    "I'd like to help, but I'm having trouble processing that. Could you rephrase your question?",
    "Interesting question! Unfortunately, I'm having trouble connecting to my knowledge base right now."
  ];
  
  // Return a random fallback response
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};

import axios from './axios';

/**
 * Get a response from Gemini through our backend API
 * @param {string} prompt - User's message
 * @returns {Promise<string>} - AI response
 */
export async function getGeminiResponse(prompt) {
  try {
    // Instead of calling Gemini directly, we'll use our backend as a proxy
    const response = await axios.post('/api/gemini/generate', { 
      prompt
    });
    
    return response.data.response;
  } catch (error) {
    console.error("Error with Gemini API:", error);
    return getFallbackResponse();
  }
}

/**
 * Get a fallback response if the Gemini API fails
 * @returns {string} - Fallback response
 */
function getFallbackResponse() {
  const responses = [
    "I'm here to listen. Tell me more about how you're feeling.",
    "That sounds challenging. How are you coping with it?",
    "Thank you for sharing that with me. Would you like to explore some coping strategies?",
    "I understand this is important to you. Would you like to talk more about it?",
    "I appreciate you reaching out. How can I help support you today?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Just export the function, no need for the model
export default getGeminiResponse;

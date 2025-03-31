import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
console.log("Testing with API key:", API_KEY ? "Key is present" : "No API key found");

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = "Hello, how are you today?";
    console.log("Sending prompt:", prompt);
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log("Gemini response:", response);
    return response;
  } catch (error) {
    console.error("Error testing Gemini:", error);
    return null;
  }
}

// Run the test
testGemini().then(response => {
  if (response) {
    console.log("Test successful!");
  } else {
    console.log("Test failed!");
  }
});

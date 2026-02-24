// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Replace with your actual Gemini API Key from Google AI Studio
const API_KEY = "AIzaSyDe-V1KAgKjUgBX1GrGdl9DDMEQzreuq-k";
const genAI = new GoogleGenerativeAI(API_KEY);

export const enhanceEventDescription = async (
  title: string, 
  category: string, 
  description: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are a professional event promoter in Nairobi. 
      Rewrite the following event description to be more exciting and "vibey". 
      Keep it concise (under 100 words).
      Event Title: ${title}
      Category: ${category}
      Current Description: ${description}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    return description; // Fallback to original description if AI fails
  }
};
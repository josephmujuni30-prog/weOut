
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceEventDescription = async (title: string, category: string, rawDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Enhance the following event description to make it more professional, engaging, and localized for a Nairobi audience. Keep it under 150 words.
      Event Title: ${title}
      Category: ${category}
      Raw Description: ${rawDescription}`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    // Directly access the .text property from the GenerateContentResponse object
    return response.text?.trim() || rawDescription;
  } catch (error) {
    console.error("Error enhancing description:", error);
    return rawDescription;
  }
};

export const suggestEventsByInterest = async (interest: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given the user interest: "${interest}", suggest 3 hypothetical event ideas that would happen in Nairobi. Return them in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                suggestedLocation: { type: Type.STRING }
              },
              required: ["title", "description", "category", "suggestedLocation"]
            }
          }
        }
      });
      // Directly access the .text property from the GenerateContentResponse object
      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Error suggesting events:", error);
      return [];
    }
}
import { GoogleGenAI } from '@google/genai';

// FIX: use import.meta.env for Vite browser builds; process.env only works server-side
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export async function getEventSuggestions(
  location: string,
  interests: string[]
): Promise<string | null> {
  try {
    const prompt = `Suggest 5 upcoming event ideas in ${location} for someone interested in: ${interests.join(', ')}.
For each event, provide:
- Title
- Short description (2 sentences)
- Category (Music / Tech / Food / Arts / Sports / Networking)
- Suggested venue area in ${location}

Keep it practical and relevant to the local scene.`;

    // FIX: removed invalid googleMaps tool — that tool does not exist in the @google/genai SDK.
    // googleSearch grounding is the correct tool for location-aware suggestions.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text ?? null;
  } catch (error) {
    console.error('Gemini error:', error);
    return null;
  }
}

export async function getPlaceDetails(placeName: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Describe the venue "${placeName}" in Nairobi, Kenya — its general vibe, neighbourhood, and what kind of events it typically hosts.`,
    });

    return response.text ?? null;
  } catch (error) {
    console.error('Gemini error:', error);
    return null;
  }
}

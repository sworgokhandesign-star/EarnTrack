import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function extractIncomeData(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract income information from this text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING, description: "3-letter currency code like USD, EUR, BDT" },
            client: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Thumbnail", "Ads", "Banner", "Other"] },
          },
          required: ["amount", "currency"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI extraction failed:", error);
    return null;
  }
}

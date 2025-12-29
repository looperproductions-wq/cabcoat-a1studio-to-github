import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeKitchenAndSuggestColors = async (base64Image: string): Promise<AnalysisResult> => {
  const envKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: envKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this kitchen's existing elements (flooring, countertops, backsplash, lighting). Suggest 4 specific paint colors for the cabinets that would complement the room perfectly. Return the response in JSON format." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING, description: "Brief design advice on why these colors work." },
            suggestedColors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING, description: "A representative hex code for the paint color" },
                  description: { type: Type.STRING, description: "Why this fits the room" }
                }
              }
            }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const generateCabinetPreview = async (
  base64Image: string, 
  colorName: string | null, 
  colorHex: string | null,
  hardwareName?: string,
  customInstruction?: string,
  sheen?: string
): Promise<string> => {
  const envKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: envKey });
  try {
    let prompt = `Edit this image.`;
    if (colorName) {
      prompt += ` Paint the kitchen cabinets ${colorName}`;
      if (colorHex) prompt += ` (approximate hex: ${colorHex})`;
      prompt += `.`;
    } else {
      prompt += ` Keep the existing cabinet color.`;
    }
    if (sheen && sheen !== 'Default') {
      prompt += ` Apply a ${sheen} finish to the cabinets.`;
    } else if (!colorName) {
      prompt += ` Maintain existing finish details.`;
    }
    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += ` Replace the cabinet hardware (handles/knobs) with ${hardwareName}.`;
    }
    if (customInstruction && customInstruction.trim().length > 0) {
      prompt += ` User Instructions/Tweaks: "${customInstruction}".`;
    }
    prompt += ` Keep the countertops, backsplash, flooring, walls, appliances, and lighting largely as they are unless instructed otherwise. Maintain the wood grain texture or finish details if visible (unless changing sheen). Ensure a photorealistic interior design result. High quality, 4k.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/jpeg' } }, { text: prompt }] },
      config: {},
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    throw new Error("No image generated in response");
  } catch (error) {
    console.error("Error generating preview:", error);
    throw error;
  }
};
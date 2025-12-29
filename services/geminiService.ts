
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

/**
 * Helper to convert File to Base64
 */
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

/**
 * Analyzes the kitchen image to suggest colors using Gemini 3 Flash Preview
 */
export const analyzeKitchenAndSuggestColors = async (base64Image: string): Promise<AnalysisResult> => {
  // Directly using process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this image. 1. Determine if this is a photo of a kitchen with visible cabinets. 2. If it is a kitchen, analyze existing elements (flooring, countertops, backsplash) and suggest 4 specific paint colors for the cabinets. Identify real paint manufacturers (like Sherwin Williams or Benjamin Moore) and provide the color codes. Return the response in JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isKitchen: { type: Type.BOOLEAN, description: "Whether the image clearly shows a kitchen with cabinets." },
            reasoning: { type: Type.STRING, description: "Brief design advice." },
            suggestedColors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  manufacturer: { type: Type.STRING },
                  code: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          },
          required: ["isKitchen", "reasoning", "suggestedColors"]
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

/**
 * Generates a preview of the kitchen with new cabinet colors using Gemini 2.5 Flash Image
 */
export const generateCabinetPreview = async (
  base64Image: string, 
  colorName: string | null, 
  colorHex: string | null,
  hardwareName?: string,
  customInstruction?: string,
  sheen?: string
): Promise<string> => {
  // Creating a new instance right before the call ensures it uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let prompt = `Edit this kitchen image with professional cabinet painting results.`;
    
    if (colorName) {
      prompt += ` Paint the kitchen cabinets ${colorName}`;
      if (colorHex) {
        prompt += ` (approximate hex: ${colorHex})`;
      }
      prompt += `.`;
    } else {
      prompt += ` Keep the existing cabinet color.`;
    }
    
    prompt += ` IMPORTANT TEXTURE HANDLING:
    - If the original cabinets are OAK (heavy grain), preserve a subtle, sophisticated wood grain texture through the new paint.
    - If the original cabinets are MAPLE, CHERRY, or smooth MDF, the new finish must be perfectly smooth with ABSOLUTELY NO wood grain or texture visible.
    - Provide a high-end factory-painted look (like a professional lacquer finish).`;

    if (sheen && sheen !== 'Default') {
      prompt += ` Apply a ${sheen} finish to the cabinets.`;
    }

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += ` Replace the cabinet hardware with ${hardwareName}.`;
    }

    if (customInstruction && customInstruction.trim().length > 0) {
      prompt += ` Additional Design Notes: "${customInstruction}".`;
    }

    prompt += ` Keep the countertops, backsplash, flooring, walls, appliances, and lighting identical to the original image. Ensure a photorealistic, high-resolution interior design result.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Switched from 3 Pro to 2.5 Flash to remove mandatory key selection dialog
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("No image generated in response");
  } catch (error) {
    console.error("Error generating preview:", error);
    throw error;
  }
};

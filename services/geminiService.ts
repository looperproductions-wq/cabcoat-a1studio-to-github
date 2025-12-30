
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

/**
 * Helper to get a fresh AI instance.
 * Using a function ensures we get the most up-to-date API_KEY from the environment.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key missing. If you are on Vercel, please set the API_KEY environment variable. If you are in the design tool, please click 'Connect Design Engine'.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeKitchenAndSuggestColors = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = getAIInstance();
  
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

export const generateCabinetPreview = async (
  base64Image: string, 
  colorName: string | null, 
  colorHex: string | null,
  hardwareName?: string,
  customInstruction?: string,
  sheen?: string
): Promise<string> => {
  const ai = getAIInstance();

  try {
    let prompt = `Edit this kitchen image with professional cabinet painting results.`;
    
    if (colorName) {
      prompt += ` Paint the kitchen cabinets in "${colorName}"`;
      if (colorHex) {
        prompt += ` (reference hex code: ${colorHex})`;
      }
      prompt += `.`;
    } else {
      prompt += ` Keep existing color but refresh the finish.`;
    }
    
    prompt += ` 
    TECHNICAL REQUIREMENTS:
    - High-end factory-smooth sprayed finish.
    - Sheen: ${sheen || 'Satin'}.
    - Lighting must remain consistent with original photo.
    - Perspective and shadows must be realistic.`;

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += ` Replace hardware with ${hardwareName}.`;
    }

    if (customInstruction && customInstruction.trim()) {
      prompt += ` User tweaks: "${customInstruction}".`;
    }

    prompt += ` Constraint: Only change the cabinets. Do not alter floors, walls, or appliances. Photorealistic 4K quality.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "4K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("AI did not return an image. Please check your instructions.");
  } catch (error) {
    console.error("Error generating preview:", error);
    throw error;
  }
};


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
 * Helper to get a fresh AI instance using the global process.env.API_KEY.
 * Follows the strict SDK initialization guideline.
 */
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
            text: "Analyze this kitchen image. 1. Confirm it's a kitchen. 2. Identify the cabinet style and room lighting. 3. Suggest 4 specific cabinet paint colors from major brands (Benjamin Moore, Sherwin Williams) that would complement the existing countertops, flooring, and backsplash. Return the response in strict JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isKitchen: { type: Type.BOOLEAN, description: "Whether the image clearly shows a kitchen." },
            reasoning: { type: Type.STRING, description: "Brief professional design advice." },
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
    let prompt = `REPAINT KITCHEN CABINETS:
    - Apply a professional factory-sprayed finish to all visible cabinets and islands.
    - Style: High-end photorealistic interior photography quality.
    - Maintain existing countertops, backsplash, appliances, and floor.`;
    
    if (colorName) {
      prompt += `\n- NEW COLOR: "${colorName}"${colorHex ? ` (Reference Hex: ${colorHex})` : ''}. Ensure the color matches the provided name perfectly under the room's current lighting.`;
    }
    
    if (sheen && sheen !== 'Default') {
      prompt += `\n- FINISH: ${sheen} sheen.`;
    }

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += `\n- HARDWARE: Replace current handles/knobs with ${hardwareName}.`;
    }

    if (customInstruction && customInstruction.trim()) {
      prompt += `\n- USER REQUEST: "${customInstruction}"`;
    }

    prompt += `\n- LIGHTING: Keep original lighting and shadows for 100% realism. 4K RESOLUTION.`;

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

    throw new Error("Design Engine did not return an image. This usually happens if the AI content filters were triggered or the API key is invalid.");
  } catch (error) {
    console.error("Error generating preview:", error);
    throw error;
  }
};

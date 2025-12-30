
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
  // Always initialize right before use to get latest API key from the execution context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Using gemini-3-pro-preview for complex interior design analysis
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
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
  // Always initialize right before use to ensure up-to-date environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let prompt = `Edit this kitchen image with professional cabinet painting results.`;
    
    if (colorName) {
      prompt += ` Paint the kitchen cabinets exactly in the color "${colorName}"`;
      if (colorHex) {
        prompt += ` (reference hex code: ${colorHex})`;
      }
      prompt += `.`;
    } else {
      prompt += ` Keep the existing cabinet color but refresh the look.`;
    }
    
    prompt += ` 
    TECHNICAL FINISH REQUIREMENTS:
    - Provide a high-end, factory-smooth professional finish.
    - If the cabinets are wood, ensure the paint looks like it was applied by a professional spray system (no brush marks).
    - If the user specifies a sheen like ${sheen || 'Satin'}, adjust reflections accordingly.`;

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += ` Replace the cabinet hardware with ${hardwareName}. Ensure the hardware is scaled correctly and matches the perspective of the doors.`;
    }

    if (customInstruction && customInstruction.trim().length > 0) {
      prompt += ` USER TWEAKS: "${customInstruction}".`;
    }

    prompt += ` 
    CONSTRAINT:
    - Do NOT change the countertops, flooring, backsplash, walls, or ceiling.
    - The lighting of the room should remain consistent with the original photo.
    - Output a photorealistic, 4K quality interior design visualization.`;

    // Using gemini-3-pro-image-preview for requested 4K quality output
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
          imageSize: "4K"
        }
      }
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

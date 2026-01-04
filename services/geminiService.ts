
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
  // Initialize with the environment variable directly. 
  // Assume process.env.API_KEY is pre-configured and valid.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this kitchen. 1. Identify if it is a kitchen. 2. Suggest 4 cabinet paint colors (Benjamin Moore/Sherwin Williams) that match the counters/floors. Return JSON." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isKitchen: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING },
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
    if (!text) throw new Error("AI returned an empty response.");
    return JSON.parse(text) as AnalysisResult;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze kitchen image.");
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let prompt = `REPAINT KITCHEN CABINETS:
    - Apply professional factory-sprayed paint to all visible cabinets and islands.
    - Style: Photorealistic 4K architectural interior photography.
    - Preservation: Do not change countertops, backsplash, appliances, or flooring.`;
    
    if (colorName) {
      prompt += `\n- NEW CABINET COLOR: "${colorName}"${colorHex ? ` (Representative Hex: ${colorHex})` : ''}.`;
    }
    
    if (sheen && sheen !== 'Default') {
      prompt += `\n- PAINT FINISH: ${sheen} sheen.`;
    }

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += `\n- HARDWARE: Replace current handles/knobs with ${hardwareName}.`;
    }

    if (customInstruction && customInstruction.trim()) {
      prompt += `\n- ADDITIONAL INSTRUCTIONS: "${customInstruction}"`;
    }

    prompt += `\n- Output only the modified image with realistic lighting and shadows.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    throw new Error("The image generation model did not return visual data.");
  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error(error.message || "Visualization failed. Check API configuration.");
  }
};

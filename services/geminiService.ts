
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
  try {
    // Create instance right before call to ensure up-to-date key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    if (!text) throw new Error("No response from AI engine.");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    throw new Error(error.message || "Failed to analyze kitchen image. Please check your API key.");
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
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let prompt = `REPAINT KITCHEN CABINETS:
    - Apply a professional factory-sprayed finish to all visible cabinets and islands.
    - Style: High-end photorealistic interior photography quality.
    - Maintain existing countertops, backsplash, appliances, and floor.`;
    
    if (colorName) {
      prompt += `\n- NEW COLOR: "${colorName}"${colorHex ? ` (Reference Hex: ${colorHex})` : ''}.`;
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

    prompt += `\n- Ensure 100% realism and photorealistic shadows.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("The visualizer was unable to process this request.");
  } catch (error: any) {
    console.error("Error generating preview:", error);
    throw new Error(error.message || "Visualization failed. Please check your API key.");
  }
};

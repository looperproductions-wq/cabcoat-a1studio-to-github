
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
  // Use process.env.API_KEY exclusively as per guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment. Please ensure it is set in Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this kitchen's existing elements (flooring, countertops, backsplash, lighting). Suggest 4 specific cabinet paint colors from major brands (Benjamin Moore, Sherwin Williams) that would complement the room perfectly. Identify if it's actually a kitchen. Return the response in JSON format." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isKitchen: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING, description: "Brief design advice on why these colors work." },
            suggestedColors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  manufacturer: { type: Type.STRING },
                  code: { type: Type.STRING },
                  hex: { type: Type.STRING, description: "A representative hex code for the paint color" },
                  description: { type: Type.STRING, description: "Why this fits the room" }
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
    throw new Error(error.message || "Analysis failed.");
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    let prompt = `REPAINT KITCHEN CABINETS:
    - Apply a professional factory-sprayed finish to all visible cabinets and islands.
    - Maintain existing countertops, backsplash, appliances, and floor.`;
    
    if (colorName) {
      prompt += `\n- NEW COLOR: "${colorName}"${colorHex ? ` (Reference Hex: ${colorHex})` : ''}.`;
    }
    
    if (sheen && sheen !== 'Default') {
      prompt += `\n- FINISH: ${sheen} sheen.`;
    }

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += `\n- HARDWARE: Replace handles with ${hardwareName}.`;
    }

    if (customInstruction && customInstruction.trim()) {
      prompt += `\n- USER REQUEST: "${customInstruction}"`;
    }

    prompt += `\n- Ensure photorealistic lighting and shadows. Return the modified image.`;

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
    throw new Error("No image generated in response");
  } catch (error: any) {
    console.error("Error generating preview:", error);
    throw new Error(error.message || "Generation failed.");
  }
};

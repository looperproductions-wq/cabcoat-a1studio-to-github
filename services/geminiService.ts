
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
  // Directly initialize per request as per coding guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
    throw new Error("Unable to connect to AI. Please verify your Vercel API_KEY settings and redeploy.");
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    let prompt = `REPAINT KITCHEN CABINETS:
    - Apply professional factory-sprayed paint to all visible cabinets.
    - Keep countertops, backsplash, and appliances exactly as they are.`;
    
    if (colorName) prompt += `\n- COLOR: "${colorName}"${colorHex ? ` (Hex: ${colorHex})` : ''}.`;
    if (sheen && sheen !== 'Default') prompt += `\n- FINISH: ${sheen} sheen.`;
    if (hardwareName && hardwareName !== 'Keep Existing') prompt += `\n- HARDWARE: Update to ${hardwareName}.`;
    if (customInstruction) prompt += `\n- NOTES: ${customInstruction}`;

    prompt += `\n- Create a photorealistic 4K architectural photography result.`;

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
    throw new Error("Visualization engine did not return an image.");
  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error("Failed to generate preview. Check Vercel logs and API_KEY.");
  }
};

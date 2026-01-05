
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure 'API_KEY' is configured in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "ACT AS A WORLD-CLASS INTERIOR DESIGNER. Analyze this kitchen's lighting, fixed elements (counters, backsplash, floors), and overall layout. Suggest exactly 4 Benjamin Moore cabinet paint colors (name, code, hex). In the 'reasoning' field, write a 2-3 sentence sophisticated design consultation note addressed to the client. Focus on color theory, undertones, and how these choices transform the room's mood. Avoid stating the obvious; instead, provide professional insight. Return JSON." },
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
                  description: { type: Type.STRING, description: "Designer explanation for this specific color pick" }
                }
              }
            }
          },
          required: ["isKitchen", "reasoning", "suggestedColors"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI service.");
    return JSON.parse(text) as AnalysisResult;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(error.message || "Visualization engine connection failed.");
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
    throw new Error("API Key is missing. Check your hosting provider settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    let prompt = `REPAINT KITCHEN CABINETS:
    - Target: All visible cabinets and islands.
    - Style: Photorealistic 4K architectural interior photography.
    - SURFACE FINISH: The paint must be applied as a smooth, professional factory-applied finish. 
    - NO TEXTURE: Absolutely NO wood grain, NO wood texture, and NO natural wood patterns should be visible on the painted surfaces. 
    - Restriction: Do NOT change countertops, backsplash, floor, or walls.`;
    
    if (colorName) {
      prompt += `\n- NEW COLOR: Use Benjamin Moore "${colorName}"${colorHex ? ` (Hex Ref: ${colorHex})` : ''}.`;
    }
    
    const effectiveSheen = (sheen === 'Default' || !sheen) ? 'Satin' : sheen;
    prompt += `\n- FINISH: ${effectiveSheen} sheen.`;

    if (hardwareName && hardwareName !== 'Keep Existing') {
      prompt += `\n- HARDWARE: Replace current handles with ${hardwareName}.`;
    }

    if (customInstruction?.trim()) {
      prompt += `\n- ADDITIONAL: ${customInstruction}`;
    }

    prompt += `\n- Return the edited image with realistic shadows and lighting, ensuring the cabinet surfaces look opaque, smooth, and modern.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return part.inlineData.data;
    }
    throw new Error("The AI model failed to generate a visual response.");
  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error(error.message || "Failed to generate design preview.");
  }
};

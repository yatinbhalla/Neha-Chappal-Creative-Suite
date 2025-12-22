
import { GoogleGenAI, Type } from "@google/genai";
import { AiStudioWindow, VariantType } from "../types";

// Helper to get the AI client. Creates a new instance to ensure fresh API key.
const getAiClient = () => {
  const apiKey = process.env.API_KEY || ''; // Injected by the environment
  return new GoogleGenAI({ apiKey });
};

/**
 * Handles common Gemini API errors, specifically the "Requested entity was not found" 
 * which indicates a project/key mapping issue for advanced models.
 */
const handleGeminiError = async (error: any) => {
  const errorMessage = error?.message || String(error);
  if (errorMessage.includes("Requested entity was not found.")) {
    const win = window as unknown as AiStudioWindow;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
    }
  }
  throw error;
};

export const checkApiKey = async (): Promise<boolean> => {
  const win = window as unknown as AiStudioWindow;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback for dev environments without the specific window object
};

export const openApiKeySelection = async (): Promise<void> => {
  const win = window as unknown as AiStudioWindow;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
};

/**
 * Uses Gemini 3 Flash to analyze the footwear using ALL uploaded angles and generate specific prompts.
 */
export const analyzeAndPlanAssets = async (imagesBase64: string[]): Promise<Record<VariantType, string>> => {
  try {
    const ai = getAiClient();
    
    // Create parts for all uploaded images
    const imageParts = imagesBase64.map(img => ({
      inlineData: { 
        mimeType: 'image/jpeg', 
        data: img.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') 
      }
    }));

    const prompt = `
      You are an expert Creative Director for a high-end footwear brand called "Neha Chappal Store".
      Analyze the provided reference images, which show different angles of the same footwear product.
      Based on its style, color, and material, generate 5 distinct, highly descriptive image generation prompts.
      
      The 5 variants are:
      1. ${VariantType.STUDIO}
      2. ${VariantType.URBAN}
      3. ${VariantType.CINEMATIC}
      4. ${VariantType.ECOMMERCE}
      5. ${VariantType.ABSTRACT}

      Return the response as a JSON object where keys are the variant names and values are the prompts.
      The prompts should describe the background, lighting, and mood.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            [VariantType.STUDIO]: { type: Type.STRING },
            [VariantType.URBAN]: { type: Type.STRING },
            [VariantType.CINEMATIC]: { type: Type.STRING },
            [VariantType.ECOMMERCE]: { type: Type.STRING },
            [VariantType.ABSTRACT]: { type: Type.STRING },
          },
          required: [VariantType.STUDIO, VariantType.URBAN, VariantType.CINEMATIC, VariantType.ECOMMERCE, VariantType.ABSTRACT]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned");
    return JSON.parse(text);
  } catch (error) {
    return handleGeminiError(error);
  }
};

/**
 * Generates an image using Gemini 2.5 Flash Image based on multiple reference angles + scene prompt.
 */
export const generateMarketingImage = async (
  referenceImagesBase64: string[], 
  scenePrompt: string,
  includePerson: boolean
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Create parts for all uploaded images
    const imageParts = referenceImagesBase64.map(img => ({
      inlineData: { 
        mimeType: 'image/jpeg', 
        data: img.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') 
      }
    }));

    // Construct a prompt that leverages the multiple views
    let fullPrompt = `
      The provided images are reference photos of a single footwear product from different angles.
      Generate a photorealistic professional marketing image of this specific product in the following scene: ${scenePrompt}.
      Ensure the product details (color, texture, shape) match the reference photos exactly.
      High resolution, professional photography, cinematic lighting.
    `;

    if (includePerson) {
      fullPrompt += " IMPORTANT: The footwear must be shown being worn by a person (e.g., a fashion model) or held by a person in a natural way that fits the scene. Ensure realistic skin tones and anatomy.";
    } else {
      fullPrompt += " Focus solely on the product as the hero object. Do not include people.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts,
          { text: fullPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated");
  } catch (error) {
    return handleGeminiError(error);
  }
};

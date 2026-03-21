import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

const functions = getFunctions(app);

interface GeminiResponse {
  text: string | null;
  imageData: string | null;
}

const callGemini = async (params: {
  message: string;
  systemInstruction?: string;
  model?: string;
  image?: { data: string; mimeType: string };
  imageGeneration?: boolean;
}): Promise<GeminiResponse> => {
  const proxy = httpsCallable<typeof params, GeminiResponse>(functions, 'geminiProxy');
  const result = await proxy(params);
  return result.data;
};

export const chatWithAssistant = async (userMessage: string): Promise<string> => {
  try {
    const response = await callGemini({
      message: userMessage,
      model: 'gemini-2.0-flash',
      systemInstruction: `You are TechBot, a helpful assistant for "MovilNova", a mobile repair and accessories shop.

        Our services:
        1. Professional Repairs (Screens, Batteries, Logic Boards).
        2. Premium Accessories (Cases, Screen Protectors).
        3. Real-time Status Lookup.

        Tone: Professional, Tech-savvy, slightly witty.
        If a user asks about repair status, guide them to the 'Repair Lookup' page.
        If a user asks about products, recommend our high-quality cases.
        Keep answers concise (under 50 words unless detailed explanation is needed).
        `,
    });
    return response.text || "I didn't catch that. Could you rephrase?";
  } catch (error) {
    if (import.meta.env.DEV) console.error("Gemini API Error:", error);
    return "I'm currently offline. Please try again later.";
  }
};

export const chatWithThinking = async (userMessage: string): Promise<string> => {
  try {
    const response = await callGemini({
      message: userMessage,
      model: 'gemini-2.0-flash-thinking-exp',
      systemInstruction: "You are a senior technical expert. Think step-by-step to solve complex diagnostic problems for mobile devices.",
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    if (import.meta.env.DEV) console.error("Thinking Error:", error);
    return "I couldn't complete the deep analysis.";
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const response = await callGemini({
      message: prompt || "Analyze this image for damage.",
      model: 'gemini-2.0-flash',
      image: { data: base64Image, mimeType: 'image/jpeg' },
    });
    return response.text || "No insights found.";
  } catch (error) {
    if (import.meta.env.DEV) console.error("Vision Error:", error);
    return "I couldn't analyze the image.";
  }
};

export const isAIConfigured = (): boolean => {
  // AI is always available when Cloud Functions are deployed
  return true;
};

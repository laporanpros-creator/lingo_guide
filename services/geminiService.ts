import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChatMessage, Scenario, GeminiResponseSchema, Sender } from "../types";
import { SYSTEM_INSTRUCTION_BASE } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    userTranscript: {
      type: Type.STRING,
      description: "The transcription of what the user said (if audio) or the text they typed.",
    },
    roleplayResponse: {
      type: Type.STRING,
      description: "The character's response in the roleplay.",
    },
    tutorNote: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["correction", "alternative", "praise"],
        },
        englishContent: {
          type: Type.STRING,
          description: "The corrected sentence or advanced alternative phrase.",
        },
        indonesianExplanation: {
          type: Type.STRING,
          description: "Explanation of the correction or alternative in Indonesian.",
        },
        pronunciationTip: {
          type: Type.STRING,
          description: "Specific advice on pronunciation if audio input was provided.",
        },
      },
      required: ["type", "englishContent", "indonesianExplanation"],
    },
    suggestedReplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-3 short suggested replies for the user.",
    },
  },
  required: ["userTranscript", "roleplayResponse", "tutorNote", "suggestedReplies"],
};

export const sendMessageToGemini = async (
  history: ChatMessage[],
  scenario: Scenario,
  userMessage: string | null,
  audioBase64?: string
): Promise<GeminiResponseSchema> => {
  try {
    const conversationHistory = history.map(msg => 
      `${msg.sender === Sender.User ? 'Student' : 'Roleplay Character'}: ${msg.text}`
    ).join('\n');

    const contextPart = {
      text: `
      SCENARIO: ${scenario.title}
      ROLE: ${scenario.systemRole}
      
      CONVERSATION HISTORY:
      ${conversationHistory}
      
      INSTRUCTION:
      ${userMessage ? `Student Typed: "${userMessage}"` : 'Student sent Audio.'}
      Respond as the Roleplay Character following the JSON schema.
      IF AUDIO: Accurately transcribe it to "userTranscript" and check pronunciation.
      IF TEXT: Copy the text to "userTranscript".
      `
    };

    const parts: any[] = [contextPart];

    // If audio is provided, add it to the parts
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: "audio/webm; codecs=opus", // Common web recording format
          data: audioBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025', // Using the model optimized for audio
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(responseText) as GeminiResponseSchema;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
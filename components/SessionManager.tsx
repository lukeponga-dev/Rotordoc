

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';

const systemInstruction = `
**Persona and Expertise:**
You are RotorWise, an expert AI Mechanic specializing *exclusively* in the Mazda RX-8 (Series 1 and Series 2) and its 13B-MSP Renesis rotary engine. You can analyze both text descriptions and uploaded images and videos of parts, error codes, or symptoms. Your goal is to accurately diagnose mechanical and electrical issues, provide step-by-step troubleshooting, and suggest appropriate repair procedures. Your tone must be professional, meticulous, and encouraging.

**Core Directive: The Diagnostic Loop**
Your primary function is to follow a strict, iterative diagnostic process. You MUST NOT provide a final diagnosis until you have gathered sufficient information. Each of your responses, until a final diagnosis is justified, MUST follow this clearer, more readable markdown structure:

1.  **Acknowledge and List Potential Causes:**
    *   Start by acknowledging the user's last input (e.g., "Understood. Based on that, here are the most likely causes:").
    *   Present the 3 most likely *potential* causes in a numbered list. Each item must be bolded.
    *   **Crucially, for each cause, you must include a brief (1-2 sentence) explanation of *why* it is a common issue for the RX-8's Renesis engine.** This explanation should be specific and technical where appropriate.
    *   Example:
        1.  **Failing Ignition Coils:** A very common issue. The original coils are mounted directly to the hot engine block, making them susceptible to premature failure from heat and vibration, which weakens their spark output over time.
        2.  **Clogged Catalytic Converter:** The Renesis engine's design can lead to higher-than-normal oil consumption and occasional fuel-rich conditions, which can overheat and destroy the catalytic converter's internal structure, causing a major exhaust blockage.
        3.  **Weak Fuel Pump:** The fuel pump can weaken over time, struggling to maintain the required pressure (around 58-62 PSI) needed for the high-revving Renesis, leading to fuel starvation under heavy load.

2.  **Ask a Crucial Question OR Guide a Test:**
    *   Immediately after the list, you must guide the user to the next logical step to narrow down the possibilities.
    *   Use a clear heading: \`#### Next Step: Clarifying Question\` or \`#### Next Step: Recommended Test\`.
    *   The question or test should be singular and focused.
    *   Example:
        #### Next Step: Clarifying Question
        When you accelerate hard, does the check engine light flash?

This iterative process continues with each user response, narrowing down the problem until you are confident enough to provide a final diagnosis using the structured format below.

**Specific Diagnostic Procedures (from Manual):**
When a user's issue points towards drivetrain problems (like vibrations, clunking noises, etc.) or they ask for technical specs, you MUST incorporate the following checks and data from the workshop manual.

*   **Flow for Drivetrain Vibrations/Noises:**
    1.  **Propeller Shaft Visuals:** Guide the user to safely inspect the propeller shaft. Ask: "Is there any visible damage, bending, or chipping on the shaft itself? The carbon fiber version is especially sensitive to impacts."
    2.  **Universal Joint Check:** Instruct them to check the universal joints for play. Ask: "With the car safely secured, can you feel any play, looseness, or notchiness when trying to twist the universal joints by hand?"
    3.  **Drive Shaft Boots:** Guide them to inspect the rear drive shafts. Ask: "Look at the rubber boots at each end of the rear axle shafts. Are they intact with no cracks or signs of grease leaking out?"
    4.  **Mention Runout Spec:** If a vibration is speed-dependent, mention the factory tolerance. Say: "The factory specification for propeller shaft runout is a maximum of 0.4 mm. While measuring this requires a dial gauge, it highlights how sensitive the component is to imbalance."

*   **Reference Technical Data:** When asked for specific fluid types or measurements, use this data:
    *   **Rear Differential Oil:** Use API service GL-5 with SAE 90 viscosity. The capacity is approximately 1.2-1.4 Liters.
    *   **Rear Wheel Bearing Play:** The maximum allowable play is 0.05 mm.
    *   **Propeller Shaft Max Runout:** 0.4 mm.

**Output Structure (Final Diagnosis):**
Once you have sufficient information for a final diagnosis, present the result in the following structured markdown format. Do not deviate from this structure:

\`\`\`markdown
### ✅ Final Diagnosis: [Identified Problem]

#### 1. Root Cause Analysis
[A brief explanation (1-2 sentences) of *why* this problem occurs specifically in the RX-8's Renesis engine.]

#### 2. Recommended Action Plan
| Step | Action | Priority | Estimated Difficulty |
| :--- | :--- | :--- | :--- |
| 1 | [Specific repair/replacement/test] | High | [Easy/Medium/Hard] |
| 2 | [Related maintenance or check] | Medium | [Easy/Medium/Hard] |
| 3 | [Optional but recommended action] | Low | [Easy/Medium/Hard] |

#### 3. Important Notes & Precautions
*   🔩 **Parts Required:** [List of necessary parts, e.g., N3Y4-18-100B Spark Plugs, N3H1-18-861B Coils]
*   🔧 **Tool Warning:** [Crucial tool or safety warning, e.g., "Ensure you have a 54mm socket for the main pulley bolt."]
*   ⚠️ **Safety Precaution:** [Crucial safety note, e.g., "Disconnect the battery before working on electrical components."]
\`\`\`

**Safety and Constraints:**
* **Critical Warning:** If the symptom strongly suggests a catastrophic failure (e.g., low compression, potential engine seal failure), you must provide a strong, non-negotiable warning to stop driving the car and seek a qualified human mechanic for a physical compression test.
* **Scope Limit:** Do not answer questions unrelated to the Mazda RX-8. Gently redirect the conversation back to the RX-8.

**Your knowledge is based on the official Mazda RX-8 workshop manual. A relevant excerpt from the manual is provided below for your reference.**

Workshop Manual Data:
${TROUBLESHOOTING_DATA}
`;

const messageToContent = (messages: Message[]) => {
  return messages.map(msg => {
    const parts: any[] = [];
    if (msg.content) {
      parts.push({ text: msg.content });
    }
    if (msg.imageUrl) {
      const [meta, base64Data] = msg.imageUrl.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }
    if (msg.videoUrl) {
      const [meta, base64Data] = msg.videoUrl.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }
    return {
      role: msg.role,
      parts
    };
  }).filter(c => c.parts.length > 0);
};

// Helper function to parse the error and return a user-friendly message.
const getDisplayErrorMessage = (error: unknown): string => {
  // Prioritize checking for offline status
  if (!navigator.onLine) {
    return "You appear to be offline. Please check your internet connection.";
  }

  // Check for specific API/network errors from the error message
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = ((error as Error).message || '').toLowerCase();

    if (errorMessage.includes('api key not valid')) {
      return "The provided API key is invalid. Please check the key in the settings and try again.";
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return "The AI is currently busy due to high traffic. Please wait a moment before trying again.";
    }
    // A 400 error can also indicate a safety block.
    if (errorMessage.includes('400')) {
      return "The request was invalid. This can happen due to a safety policy violation or an unsupported prompt. Please try rephrasing your message.";
    }
    if (errorMessage.includes('500') || errorMessage.includes('internal') || errorMessage.includes('503')) {
      return "The AI service is experiencing a temporary issue. Please try again in a few moments.";
    }
    // Generic network-related errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return "A network error occurred, preventing the request from completing. Please check your internet connection and try again.";
    }
  }

  // Fallback for any other unexpected errors
  return "An unexpected error occurred. Please check the developer console for more details and try again later.";
};

export const useChatManager = (apiKey: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<'idle' | 'processing' | 'streaming'>('idle');
  
  const ai = useMemo(() => {
    if (!apiKey) {
      return null;
    }
    try {
      // Re-initialize the AI client whenever the API key changes.
      return new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      // We can't set state here, but we can return null and handle it elsewhere.
      return null;
    }
  }, [apiKey]);
  
  // Effect to show an error message if the AI client fails to initialize.
  useEffect(() => {
    if (!apiKey) {
        setMessages(prev => {
            // Avoid adding multiple messages if one already exists.
            if (prev.some(m => m.id === 'error-no-key')) return prev;
            return [{
                id: 'error-no-key',
                role: 'model',
                content: '### Configuration Error\n\nPlease enter your Google Gemini API key in the settings to begin.',
                isError: true,
            }];
        });
    } else if (!ai) {
        setMessages([{
            id: `error-init-${Date.now()}`,
            role: 'model',
            content: `### Initialization Error\n\nCould not initialize the AI service. The API key might be malformed.`,
            isError: true,
        }]);
    } else {
        // If key is provided and AI is initialized, clear any previous error messages.
        setMessages(prev => prev.filter(m => !m.isError));
    }
  }, [apiKey, ai]);


  const setHistory = useCallback((history: Message[]) => {
    const historyWithIds = history.map((msg, index) => ({
      ...msg,
      id: msg.id || `${msg.role}-${index}-${Date.now()}` // Ensure old messages get an ID
    }));
    setMessages(historyWithIds);
  }, []);

  const startNewChat = useCallback(() => {
    if (ai) {
        setMessages([]);
    }
  }, [ai]);

  const sendMessage = useCallback(async (text: string, imageUrl?: string | null, videoUrl?: string | null) => {
    if (loadingState !== 'idle' || !ai || (!text.trim() && !imageUrl && !videoUrl)) return;

    setLoadingState('processing');
    const userMessage: Message = { 
      id: `user-${Date.now()}`, 
      role: 'user', 
      content: text, 
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
    };
    
    const modelMessageId = `model-${Date.now()}`;
    const tempModelMessage: Message = { id: modelMessageId, role: 'model', content: '' };
    
    // Atomically add both user message and model placeholder
    setMessages(prev => [...prev, userMessage, tempModelMessage]);

    const contents = messageToContent([...messages, userMessage]);

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents,
        config: { systemInstruction },
      });

      let modelResponse = '';
      let isFirstChunk = true;
      for await (const chunk of responseStream) {
        if (isFirstChunk) {
          setLoadingState('streaming');
          isFirstChunk = false;
        }
        modelResponse += chunk.text;
        setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: modelResponse } : msg
        ));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const displayMessage = getDisplayErrorMessage(error);
      
      const errorMessage: Message = { 
        id: modelMessageId, // Reuse the ID to ensure it replaces the placeholder
        role: 'model', 
        content: `### ⚠️ Error\n\n${displayMessage}`, 
        isError: true 
      };

      setMessages(prev => prev.map(msg => msg.id === modelMessageId ? errorMessage : msg));
    } finally {
      setLoadingState('idle');
    }
  }, [messages, loadingState, ai]);

  return { 
    messages, 
    loadingState, 
    sendMessage, 
    setHistory, 
    startNewChat,
  };
};

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';

const systemInstruction = `
**Persona and Expertise:**
You are RotorWise, an expert AI Mechanic specializing *exclusively* in the Mazda RX-8 (Series 1 and Series 2) and its 13B-MSP Renesis rotary engine. You can analyze both text descriptions and uploaded images of parts, error codes, or symptoms. Your goal is to accurately diagnose mechanical and electrical issues, provide step-by-step troubleshooting, and suggest appropriate repair procedures. Your tone must be professional, meticulous, and encouraging.

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
    return {
      role: msg.role,
      parts
    };
  }).filter(c => c.parts.length > 0);
};

const getApiKey = (): string | null => {
  try {
    return localStorage.getItem('gemini_api_key');
  } catch (e) {
    console.error("Could not access localStorage", e);
    return null;
  }
}

const setApiKeyInStorage = (key: string) => {
  try {
    localStorage.setItem('gemini_api_key', key);
  } catch (e) {
    console.error("Could not access localStorage", e);
  }
}

export const useChatManager = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const reinitializeAiClient = useCallback((key: string | null) => {
    if (key) {
      try {
        aiRef.current = new GoogleGenAI({ apiKey: key });
        return true;
      } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        aiRef.current = null;
        return false;
      }
    } else {
      aiRef.current = null;
      return false;
    }
  }, []);

  useEffect(() => {
    const initialKey = getApiKey();
    setApiKey(initialKey);
    if (!reinitializeAiClient(initialKey)) {
      setMessages([{
        id: `error-init-${Date.now()}`,
        role: 'model',
        content: "### Welcome to RotorWise AI\n\nTo get started, please configure your Google Gemini API key in the settings. You can access settings via the gear icon in the header.",
        isError: true,
      }]);
    }
  }, [reinitializeAiClient]);

  const setApiKeyAndReinitialize = useCallback((newKey: string) => {
    setApiKeyInStorage(newKey);
    setApiKey(newKey);
    reinitializeAiClient(newKey);
    setMessages(prev => prev.filter(m => !m.id.startsWith('error-init')));
  }, [reinitializeAiClient]);

  const setHistory = useCallback((history: Message[]) => {
    const historyWithIds = history.map((msg, index) => ({
      ...msg,
      id: msg.id || `${msg.role}-${index}-${Date.now()}` // Ensure old messages get an ID
    }));
    setMessages(historyWithIds);
  }, []);

  const startNewChat = useCallback(() => {
    if (!apiKey) return;
    setMessages([]);
  }, [apiKey]);

  const sendMessage = useCallback(async (text: string, imageUrl?: string | null) => {
    if (!apiKey || (!text.trim() && !imageUrl)) return;

    setIsLoading(true);
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: text, imageUrl: imageUrl || undefined };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    const modelMessageId = `model-${Date.now()}`;
    const tempModelMessage: Message = { id: modelMessageId, role: 'model', content: '' };
    setMessages(prev => [...prev, tempModelMessage]);

    const contents = messageToContent(currentMessages);

    try {
      if (!aiRef.current) {
        throw new Error("Gemini AI client is not initialized. Please configure your API key in settings.");
      }

      const responseStream = await aiRef.current.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction },
      });

      let modelResponse = '';
      for await (const chunk of responseStream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            newMessages[newMessages.length - 1] = { ...lastMessage, id: modelMessageId, content: modelResponse };
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      let displayMessage = "There was an unexpected error.";
      if (error && typeof error === 'object') {
        const errorMessage = ((error as Error).message || '').toLowerCase();
        if (!navigator.onLine) {
            displayMessage = "You appear to be offline. Please check your internet connection.";
        } else if (errorMessage.includes('api key not valid')) {
            displayMessage = "Your API key appears to be invalid. Please check it in the settings and try again.";
        } else if (errorMessage.includes('rate limit')) {
            displayMessage = "The AI is currently busy due to high traffic. Please wait a moment before trying again.";
        } else if (errorMessage.includes('400')) {
             displayMessage = "The request was invalid. Please try rephrasing your message or check your API key.";
        } else if (errorMessage.includes('500') || errorMessage.includes('internal')) {
             displayMessage = "The AI service is experiencing a temporary issue. Please try again in a few moments.";
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
             displayMessage = "A network error occurred. Please check your internet connection and try again.";
        }
      }
      const errorMessage: Message = { id: `error-${Date.now()}`, role: 'model', content: `### Error\n\n${displayMessage}`, isError: true };
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
          newMessages[newMessages.length - 1] = errorMessage;
        } else {
          newMessages.push(errorMessage);
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, apiKey]);

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    setHistory, 
    startNewChat, 
    apiKey, 
    setApiKey: setApiKeyAndReinitialize 
  };
};
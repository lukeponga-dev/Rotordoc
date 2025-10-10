import { useState, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message } from '../types';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `
**Persona and Expertise:**
You are RotorWise, an expert AI Mechanic specializing *exclusively* in the Mazda RX-8 (Series 1 and Series 2) and its 13B-MSP Renesis rotary engine. Your goal is to accurately diagnose mechanical and electrical issues, provide step-by-step troubleshooting, and suggest appropriate repair procedures. Your tone must be professional, meticulous, and encouraging.

**Interaction Flow (The Diagnostic Loop):**
Follow a systematic, iterative diagnostic process. You must move from symptom to solution by asking clarifying questions.

1.  **Symptom Acknowledgment:** When the user provides an issue, first acknowledge it and list the 3 most likely *potential* causes, ranked by commonality in the RX-8.
2.  **Clarifying Question:** Immediately follow with a single, most crucial **clarifying question** to narrow the possibilities (e.g., "Does the hot start issue happen only on the *first* hot restart, or repeatedly?").
3.  **Iterative Guidance:** Based on the user's answer, eliminate unlikely causes and guide the user to the next logical check or test (e.g., "Please check the specific resistance of your ignition coil packs.").

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

#### 3. Important Notes & Precautions
* **Parts Required:** [List of necessary parts, e.g., N3Y4-18-100B Spark Plugs, N3H1-18-861B Coils]
* **Tool Warning:** [Crucial tool or safety warning, e.g., "Ensure you have a 54mm socket for the main pulley bolt."]
* **Safety Precaution:** [Crucial safety note, e.g., "Disconnect the battery before working on electrical components."]
\`\`\`

**Safety and Constraints:**
* **Critical Warning:** If the symptom strongly suggests a catastrophic failure (e.g., low compression, potential engine seal failure), you must provide a strong, non-negotiable warning to stop driving the car and seek a qualified human mechanic for a physical compression test.
* **Scope Limit:** Do not answer questions unrelated to the Mazda RX-8. Gently redirect the conversation back to the RX-8.

**Your knowledge is based on the official Mazda RX-8 workshop manual. A relevant excerpt from the manual is provided below for your reference.**

Workshop Manual Data:
${TROUBLESHOOTING_DATA}
`;


export const useChatManager = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat>(() => ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction },
  }));

  const setHistory = useCallback((history: Message[]) => {
    const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        // @ts-ignore // The SDK type doesn't perfectly match but this is the correct way to load history
        history: history.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }))
    });
    setChat(newChat);
    setMessages(history);
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setChat(ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
    }));
  }, []);


  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    
    // Add a temporary empty model message for the loading indicator
    const tempModelMessage: Message = { role: 'model', content: '' };
    setMessages(prev => [...prev, tempModelMessage]);

    try {
      const responseStream = await chat.sendMessageStream({ message: text });
      let modelResponse = '';
      for await (const chunk of responseStream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            newMessages[newMessages.length - 1] = { ...lastMessage, content: modelResponse };
          }
          return newMessages;
        });
      }
    } catch (error) {
      // Log the detailed error for debugging purposes
      console.error("Error sending message:", error);

      let displayMessage = "Sorry, I'm having trouble connecting. Please try again later.";

      if (error && typeof error === 'object') {
        const errorMessage = ((error as Error).message || '').toLowerCase();
        
        if (!navigator.onLine) {
            displayMessage = "You appear to be offline. Please check your internet connection.";
        } else if (errorMessage.includes('api key not valid')) {
            displayMessage = "There's an issue with the API configuration. Please ensure the API key is valid.";
        } else if (errorMessage.includes('rate limit')) {
            displayMessage = "The AI is currently busy due to high traffic. Please wait a moment before trying again.";
        } else if (errorMessage.includes('400')) {
             displayMessage = "The request was invalid, which may be a bug. Please try rephrasing your message.";
        } else if (errorMessage.includes('500') || errorMessage.includes('internal')) {
             displayMessage = "The AI service is experiencing a temporary issue. Please try again in a few moments.";
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
             displayMessage = "A network error occurred. Please check your internet connection and try again.";
        }
      }
      
      const errorMessage: Message = { 
        role: 'model', 
        content: displayMessage, 
        isError: true 
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        // Replace the last (temporary loading) message with the error
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
  }, [chat]);

  return { messages, isLoading, sendMessage, setHistory, startNewChat };
};
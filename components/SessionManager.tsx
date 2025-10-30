import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';

const initialMessage: Message = {
  id: 'model-initial-message',
  role: 'model',
  content: "Hello! I'm RotorWise AI, your dedicated Mazda RX-8 specialist. To help me diagnose the issue, please describe the symptoms you're experiencing. You can also upload a photo or video. \n\nAlternatively, select one of the common issues below to get started.",
};

const systemInstruction = `
**Persona and Expertise:**
You are RotorWise, an expert AI Mechanic specializing *exclusively* in the Mazda RX-8 (Series 1 and Series 2) and its 13B-MSP Renesis rotary engine. You can analyze both text descriptions and uploaded images and videos of parts, error codes, or symptoms. Your goal is to accurately diagnose mechanical and electrical issues, provide step-by-step troubleshooting, and suggest appropriate repair procedures. Your tone must be professional, meticulous, and encouraging.

**Core Directive: The Diagnostic Loop & Structured Output**
Your primary function is to follow a strict, iterative diagnostic process. You MUST NOT provide a final diagnosis until you have gathered sufficient information. Each of your responses, until a final diagnosis is justified, MUST follow this dual structure: first, provide parsable data in custom tags, then present the human-readable text.

**1. Parsable Data Block (FOR THE APP'S LIVE STATUS PANEL):**
You MUST start your response with a block containing the current state of the diagnosis, wrapped in tags. This data is for machine parsing and is critical for the UI.

*   **\`<facts>\`:** Summarize the key facts you've gathered from the user so far. List each fact on a new line. (e.g., \`- Car is a Series 1 (2004) MT.\\n- Idle is rough only when the engine is fully warm.\\n- No check engine light.\`)
*   **\`<causes>\`:** List the current top 3-4 *potential* causes you are investigating. List each on a new line. (e.g., \`- Failing Ignition Coils\\n- Vacuum Leak (post-MAF)\\n- Dirty MAF Sensor\\n- Low Fuel Pressure\`)
*   **\`<ruled_out>\`:** If any causes have been eliminated based on user input, list them here. List each on a new line. If nothing is ruled out yet, use \`- None\`.

**Example of a complete Parsable Data Block:**
\`\`\`
<facts>
- User reports loss of power during acceleration.
- Check engine light is NOT flashing.
</facts>
<causes>
- Clogged Catalytic Converter
- Weak Fuel Pump
- Dirty MAF Sensor
- Failing Ignition Coils
</causes>
<ruled_out>
- None
</ruled_out>
\`\`\`

**2. Human-Readable Response (FOR THE USER):**
Immediately following the data block, provide your response to the user in clean markdown. This part follows a specific conversational flow:

*   **Acknowledge and List Potential Causes:**
    *   Present the most likely *potential* causes from your \`<causes>\` list in a numbered list.
    *   For each cause, include a brief (1-2 sentence) explanation of *why* it is a common issue for the RX-8's Renesis engine.
    *   Example:
        1.  **Clogged Catalytic Converter:** The Renesis engine's design can lead to higher-than-normal oil consumption and occasional fuel-rich conditions, which can overheat and destroy the catalytic converter's internal structure, causing a major exhaust blockage.
        2.  **Weak Fuel Pump:** The fuel pump can weaken over time, struggling to maintain the required pressure (around 58-62 PSI) needed for the high-revving Renesis, leading to fuel starvation under heavy load.

*   **Ask a Crucial Question OR Guide a Test:**
    *   Guide the user to the next logical step with a clear heading: \`#### Next Step: Clarifying Question\` or \`#### Next Step: Recommended Test\`.
    *   The question or test should be singular and focused.
    *   Example:
        #### Next Step: Clarifying Question
        Do you notice any unusual smells from the exhaust, like rotten eggs?

**Final Diagnosis Structure:**
Once you have sufficient information, provide ONLY the final diagnosis in the following structured markdown format. DO NOT include the parsable data block (\`<facts>\`, etc.) in the final diagnosis response.

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

**Initial Interaction & Constraints:**
*   For a simple greeting, provide a brief, friendly introduction. Do not start the diagnostic loop.
*   For any message describing a car problem, immediately begin the Diagnostic Loop with the structured data block followed by the human-readable response.
*   If a symptom suggests catastrophic failure (e.g., low compression), provide a strong warning to stop driving and see a human mechanic.
*   Your knowledge is based on the official Mazda RX-8 workshop manual. An excerpt is provided below for reference.

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
  // Prioritize checking for offline status, as it's a common client-side issue.
  if (!navigator.onLine) {
    return "Connection Error: You appear to be offline. Please check your internet connection and try again.";
  }

  // Check for specific API/network errors from the error message
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = ((error as Error).message || '').toLowerCase();

    // Specific Gemini API errors
    if (errorMessage.includes('api key not valid')) {
      return "Authentication Error: The provided API key is invalid. Please go to Settings to verify your key.";
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return "Request Limit Reached: The service is experiencing high traffic. Please wait a few moments before sending another message.";
    }
    if (errorMessage.includes('400')) {
        // A 400 error can indicate a safety block or other malformed request.
        return "Invalid Request: Your message may have been blocked due to safety policies or contained unsupported content. Please try rephrasing your prompt.";
    }
    if (errorMessage.includes('500') || errorMessage.includes('internal') || errorMessage.includes('503')) {
      return "Service Unavailable: The AI service is currently experiencing technical difficulties. Please try again later.";
    }
    
    // Generic network-related errors that might not be caught by navigator.onLine
    if (errorMessage.includes('fetch failed') || errorMessage.includes('networkerror')) {
      return "Network Error: Could not connect to the AI service. Please check your internet connection and firewall settings.";
    }
  }

  // Fallback for any other unexpected errors. This is important for debugging.
  console.error("An unhandled error occurred:", error);
  return "An unexpected error occurred. We've logged the issue. Please try again later or contact support if the problem persists.";
};

export const useChatManager = (apiKey: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<'idle' | 'thinking' | 'streaming'>('idle');
  
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
  
  // Effect to show an error message or the initial welcome message.
  useEffect(() => {
    if (!apiKey) {
        setMessages(prev => {
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
        setMessages(prev => {
            const nonErrorMessages = prev.filter(m => !m.isError);
            if (nonErrorMessages.length === 0) {
                return [initialMessage];
            }
            return prev.filter(m => !m.isError);
        });
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
        setMessages([initialMessage]);
    }
  }, [ai]);

  const sendMessage = useCallback(async (text: string, imageUrl?: string | null, videoUrl?: string | null) => {
    if (loadingState !== 'idle' || !ai || (!text.trim() && !imageUrl && !videoUrl)) return;

    setLoadingState('thinking');
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
        model: 'gemini-flash-latest',
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
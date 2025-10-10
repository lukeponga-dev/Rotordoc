
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { RotorDocIcon, SendIcon, UserIcon, ExportIcon, LoadingIcon } from './components/Icons';
import { ChatMessage } from './components/ChatMessage';
import { SuggestionPills } from './components/SuggestionPills';
import { exportToPDF } from './utils/export';
import { TROUBLESHOOTING_DATA } from './data/troubleshootingData';
import { Message } from './types';

const App: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const initializeChat = useCallback(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const systemPrompt = `You are an expert Mazda RX-8 mechanic with over 20 years of experience specializing in rotary engines. Your name is "RotorDoc". You will be provided with a section of the official Mazda RX-8 service manual. Your task is to diagnose potential issues based on the user's described symptoms.

RULES:
1.  **Analyze the User's Symptoms:** Carefully read the user's description of the problem.
2.  **Consult the Manual:** Cross-reference the symptoms with the provided service manual text. Your answer MUST be based on this text. If the manual doesn't cover the symptom, state that the provided documentation does not contain information on that specific issue and provide general, safe advice.
3.  **Provide a Structured Diagnosis:** Format your response in clear, easy-to-understand Markdown. Your response should include:
    *   **Diagnosis:** A brief summary of the most likely problem.
    *   **Possible Causes:** A bulleted list of potential causes based on the manual.
    *   **Recommended Actions:** A numbered list of steps the user should take, referencing specific procedures from the manual (e.g., "Refer to 'PROPELLER SHAFT INSPECTION' on Page 4").
    *   **Caution:** Include any relevant "CAUTION" or "WARNING" notes from the manual.
4.  **Maintain Persona:** Be helpful, professional, and confident in your advice. Address the user directly.
5.  **Keep it Conversational:** This is a chat. Ask clarifying questions if the user's input is vague.
6.  **Introduction**: For your very first message, introduce yourself as RotorDoc.

Here is the relevant section from the service manual:
---
${TROUBLESHOOTING_DATA}
---
`;
      const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: systemPrompt },
      });
      setChat(chatSession);
    } catch (e) {
      console.error(e);
      setError('Failed to initialize the AI. Please check the API key and configuration.');
    }
  }, []);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText: string) => {
    if (isLoading || !messageText.trim() || !chat) return;

    setIsLoading(true);
    setError(null);
    const newUserMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');

    try {
      const stream = await chat.sendMessageStream({ message: messageText });
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (e) {
      console.error(e);
      const errorMessage = 'Sorry, I ran into a problem. Please try again.';
      setError(errorMessage);
       setMessages(prev => [...prev, { role: 'model', content: errorMessage, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
    handleSendMessage(suggestion);
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200">
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-cyan-500/30 shadow-lg">
        <div className="flex items-center space-x-3">
          <RotorDocIcon className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Mazda RX-8 AI Mechanic</h1>
            <p className="text-sm text-cyan-400">Your personal rotary engine expert</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => exportToPDF(messages)}
            className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors duration-200 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={messages.length === 0}
            title="Export chat to PDF"
          >
            <ExportIcon className="w-5 h-5 mr-2" />
            Export
          </button>
        )}
      </header>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 && !isLoading && (
            <SuggestionPills onSuggestionClick={handleSuggestionClick} />
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <RotorDocIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="bg-gray-800 rounded-lg p-4 mt-2 flex items-center space-x-2">
                <LoadingIcon className="w-5 h-5 animate-spin text-cyan-400" />
                <span>RotorDoc is thinking...</span>
              </div>
          </div>
        )}
        {error && !isLoading && <div className="text-red-400 text-center">{error}</div>}
      </main>
      
      <footer className="p-4 bg-gray-800 border-t border-cyan-500/30">
         <div className="relative">
            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(userInput);
                    }
                }}
                placeholder="Describe your car's symptoms... (e.g., 'I hear a clunking noise from the rear when I accelerate')"
                className="w-full p-4 pr-16 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:outline-none custom-scrollbar"
                rows={2}
                disabled={isLoading}
            />
            <button
                onClick={() => handleSendMessage(userInput)}
                disabled={isLoading || !userInput.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 rounded-full hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
            >
                {isLoading ? <LoadingIcon className="w-6 h-6 text-white animate-spin" /> : <SendIcon className="w-6 h-6 text-white" />}
            </button>
         </div>
         <p className="text-xs text-gray-500 mt-2 text-center">Disclaimer: This tool provides suggestions based on service manual data. Always consult a qualified professional mechanic for vehicle repairs. The developer is not liable for any damages.</p>
      </footer>
    </div>
  );
};

export default App;

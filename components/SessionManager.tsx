import { useState, useMemo, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message } from '../types';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are "RotorWise", an expert AI mechanic specializing in the Mazda RX-8.
Your knowledge is based on the official Mazda RX-8 workshop manual.
A relevant excerpt from the manual is provided below.
When users describe a problem, you must:
1.  Analyze their description of the issue.
2.  Reference the provided workshop manual data to offer diagnostic steps, potential causes, and repair advice.
3.  Always be helpful, concise, and accurate.
4.  Structure your responses for clarity. Use markdown for formatting like lists, bold text, and code blocks for technical specs if needed.
5.  If the user's query is outside the scope of Mazda RX-8 repair, politely state that you can only assist with RX-8 related technical issues.
6.  NEVER mention that you are an AI or a language model. You are RotorWise.

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
      console.error("Error sending message:", error);
      const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later.", isError: true };
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

  return { messages, isLoading, sendMessage, setHistory };
};

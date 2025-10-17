
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RotorWiseIcon, UserIcon, PlayIcon, StopIcon } from './Icons';
import { Feedback } from './Feedback';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onSpeak: (text: string, messageId: string) => void;
  onCancelSpeak: () => void;
  speakingMessageId: string | null;
}

// A typing indicator to show while the model is generating a response.
const ModelResponseLoader: React.FC = () => (
  <div className="flex items-center space-x-2 p-2">
    <div className="w-2 h-2 bg-slate-500 rounded-full animate-typing-dot" style={{ animationDelay: '0s' }}></div>
    <div className="w-2 h-2 bg-slate-500 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 bg-slate-500 rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSpeak, onCancelSpeak, speakingMessageId }) => {
  const isUser = message.role === 'user';
  const isSpeaking = speakingMessageId === message.id;

  const handleSpeakClick = () => {
    if (isSpeaking) {
      onCancelSpeak();
    } else {
      // Strip markdown for cleaner speech
      const plainText = message.content.replace(/#+\s/g, '').replace(/[*_`]/g, '');
      onSpeak(plainText, message.id);
    }
  };

  // Common container class for animation
  const containerClass = 'chat-message-container w-full max-w-3xl mx-auto';

  if (isUser) {
    return (
      <div className={`${containerClass} flex justify-end`}>
        <div className="flex items-start gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%]">
          <div className="order-2 flex flex-col items-end">
            <div className="user-bubble text-sm sm:text-base p-3 rounded-2xl rounded-br-md bg-gradient-to-br from-orange-600 to-orange-800 shadow-md">
              {message.imageUrl && <img src={message.imageUrl} alt="User upload" className="mb-2 rounded-lg max-h-60" />}
              {message.videoUrl && <video src={message.videoUrl} controls className="mb-2 rounded-lg max-h-60" />}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
          <div className="order-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  // AI Model's message
  return (
    <div className={`${containerClass} flex justify-start`}>
      <div className="flex items-start gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%]">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-[var(--surface-border)] flex items-center justify-center shrink-0 shadow-sm mt-1">
          <RotorWiseIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--accent-primary)]" />
        </div>
        <div className="flex flex-col items-start w-full">
          <div className={`prose prose-invert prose-sm sm:prose-base max-w-none text-left p-3 sm:p-4 rounded-2xl rounded-bl-md bg-gradient-to-br from-slate-800 to-slate-900/90 shadow-lg ${message.isError ? 'border border-red-500/50' : ''}`}>
            {message.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            ) : (
              <ModelResponseLoader />
            )}
          </div>
          {message.content && !message.isError && (
             <div className="flex items-center space-x-2 mt-2 pl-1">
              <button onClick={handleSpeakClick} className="p-1.5 bg-slate-700/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-[var(--accent-secondary)] hover:bg-slate-600/80 transition-colors" title={isSpeaking ? 'Stop speaking' : 'Read aloud'}>
                {isSpeaking ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <Feedback />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

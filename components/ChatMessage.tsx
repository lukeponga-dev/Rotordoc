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
  const isModel = message.role === 'model';
  const isThisMessageSpeaking = speakingMessageId === message.id;

  const handleToggleSpeech = () => {
    if (isThisMessageSpeaking) {
      onCancelSpeak();
    } else {
      // Strip markdown for cleaner speech
      const cleanText = message.content
        .replace(/### |#### |✅|\||---|\*|`|🔩|🔧|⚠️/g, '')
        .replace(/(\r\n|\n|\r)/gm, " ");
      onSpeak(cleanText, message.id);
    }
  };

  const renderModelContent = () => {
    // If there's no content and it's not an error message, show the typing indicator.
    if (!message.content && !message.isError) {
      return <ModelResponseLoader />;
    }
    
    // If there is content, render it as Markdown.
    return (
      <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-200 prose-li:text-slate-200">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    );
  };

  const renderUserContent = () => {
    return (
      <div className="space-y-3">
        {message.imageUrl && (
            <img 
                src={message.imageUrl} 
                alt="User upload" 
                className="rounded-lg max-w-xs max-h-64 object-contain border border-indigo-900/50"
            />
        )}
        {message.content && <p className="text-slate-100 text-sm sm:text-base">{message.content}</p>}
      </div>
    );
  };

  return (
    <div className={`flex items-start space-x-3 sm:space-x-4 chat-message-container group ${isModel ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md border ${isModel ? 'bg-slate-800 border-slate-700' : 'bg-indigo-600 border-indigo-500'}`}>
        {isModel ? <RotorWiseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)]" /> : <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
      </div>
      <div className={`relative max-w-2xl w-full rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg border ${isModel ? 'bg-slate-800/70 border-[var(--surface-border)]' : 'bg-gradient-to-br from-indigo-700 to-blue-800 border-indigo-700/50'}`}>
        {isModel ? renderModelContent() : renderUserContent()}
        
        {isModel && message.content && !message.isError && (
            <div className="absolute -top-4 right-0 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                    onClick={handleToggleSpeech} 
                    className="p-1.5 bg-slate-700/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-[var(--accent-secondary)] hover:bg-slate-600/80 transition-colors"
                    title={isThisMessageSpeaking ? "Stop speaking" : "Read aloud"}
                >
                    {isThisMessageSpeaking 
                        ? <StopIcon className="w-4 h-4 text-[var(--accent-secondary)]" />
                        : <PlayIcon className="w-4 h-4" />
                    }
                </button>
                <Feedback />
            </div>
        )}
      </div>
    </div>
  );
};
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

// A skeleton loader to show while the model is generating a response.
const ModelResponseLoader: React.FC = () => (
  <div className="space-y-3 animate-pulse p-1">
    <div className="h-3 bg-slate-600 rounded-full w-5/6"></div>
    <div className="h-3 bg-slate-600 rounded-full w-full"></div>
    <div className="h-3 bg-slate-600 rounded-full w-4/6"></div>
  </div>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSpeak, onCancelSpeak, speakingMessageId }) => {
  const isModel = message.role === 'model';
  const isThisMessageSpeaking = speakingMessageId === message.id;

  const handleToggleSpeech = () => {
    if (isThisMessageSpeaking) {
      onCancelSpeak();
    } else {
      // Strip markdown and special characters for cleaner speech synthesis
      const cleanText = message.content
        .replace(/### |#### |✅|\||---|\*|`|🔩|🔧|⚠️/g, '')
        .replace(/(\r\n|\n|\r)/gm, " ");
      onSpeak(cleanText, message.id);
    }
  };

  const renderModelContent = () => {
    // If there's content, render it as Markdown.
    if (message.content) {
      return (
        <>
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-200 prose-li:text-slate-200 prose-headings:text-cyan-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
           {message.content && !message.isError && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                <Feedback />
                <button 
                    onClick={handleToggleSpeech} 
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                    title={isThisMessageSpeaking ? "Stop speaking" : "Read aloud"}
                >
                    {isThisMessageSpeaking 
                        ? <StopIcon className="w-5 h-5 text-cyan-400" />
                        : <PlayIcon className="w-5 h-5" />
                    }
                </button>
              </div>
            )}
        </>
      );
    }
    // If there's no content and it's not an error message, show the skeleton loader.
    if (!message.isError) {
      return <ModelResponseLoader />;
    }
    // Otherwise, render nothing (for empty error states).
    return null;
  };

  const renderUserContent = () => {
    return (
      <div className="space-y-3">
        {message.imageUrl && (
            <img 
                src={message.imageUrl} 
                alt="User upload" 
                className="rounded-lg max-w-xs max-h-64 object-contain border border-cyan-800/50"
            />
        )}
        {message.content && <p className="text-slate-100 text-sm sm:text-base">{message.content}</p>}
      </div>
    );
  };

  return (
    <div className={`flex items-start space-x-3 sm:space-x-4 chat-message-container ${isModel ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md ${isModel ? 'bg-slate-700 border border-slate-600/50' : 'bg-cyan-600 border border-cyan-500/50'}`}>
        {isModel ? <RotorWiseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" /> : <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
      </div>
      <div className={`max-w-2xl w-full rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg ${isModel ? 'bg-slate-800/70 border border-slate-700/60' : 'bg-gradient-to-br from-cyan-700 to-blue-800 border border-cyan-700/50'}`}>
        {isModel ? renderModelContent() : renderUserContent()}
      </div>
    </div>
  );
};
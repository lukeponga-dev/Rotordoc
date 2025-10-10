import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RotorWiseIcon, UserIcon, RotaryIcon } from './Icons';
import { Feedback } from './Feedback';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  const renderModelContent = () => {
    if (message.content) {
      return (
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-200 prose-li:text-gray-200 prose-headings:text-cyan-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }
    if (!message.isError) {
      return (
        <div className="flex items-center space-x-2">
          <RotaryIcon className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-sm text-gray-400">RotorWise is thinking...</span>
        </div>
      );
    }
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
        {message.content && <p className="text-gray-100 text-sm sm:text-base">{message.content}</p>}
      </div>
    );
  };

  return (
    <div className={`flex items-start space-x-3 sm:space-x-4 chat-message-container ${isModel ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md ${isModel ? 'bg-gray-700 border border-gray-600/50' : 'bg-blue-600 border border-blue-500/50'}`}>
        {isModel ? <RotorWiseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" /> : <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
      </div>
      <div className={`max-w-2xl w-full rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg ${isModel ? 'bg-gray-800/70 border border-gray-700/60' : 'bg-gradient-to-br from-cyan-800 to-blue-900 border border-cyan-700/50'}`}>
        {isModel ? renderModelContent() : renderUserContent()}
         {isModel && message.content && !message.isError && <Feedback />}
      </div>
    </div>
  );
};
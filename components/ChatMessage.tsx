
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RotorDocIcon, UserIcon } from './Icons';
import { Feedback } from './Feedback';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex items-start space-x-4 ${isModel ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isModel ? 'bg-gray-700' : 'bg-cyan-700'}`}>
        {isModel ? <RotorDocIcon className="w-6 h-6 text-cyan-400" /> : <UserIcon className="w-6 h-6 text-white" />}
      </div>
      <div className={`max-w-2xl w-full rounded-lg px-4 py-3 ${isModel ? 'bg-gray-800' : 'bg-cyan-800'}`}>
        {isModel ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-li:text-gray-300 prose-headings:text-cyan-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-white">{message.content}</p>
        )}
         {isModel && message.content && !message.isError && <Feedback />}
      </div>
    </div>
  );
};

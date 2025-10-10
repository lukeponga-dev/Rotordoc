
import React, { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon } from './Icons';

export const Feedback: React.FC = () => {
  const [feedbackSent, setFeedbackSent] = useState<null | 'good' | 'bad'>(null);

  if (feedbackSent) {
    return <p className="text-xs text-cyan-400 mt-3">Thanks for your feedback!</p>;
  }

  return (
    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-700/50">
      <button onClick={() => setFeedbackSent('good')} className="p-1 text-gray-400 hover:text-green-400 transition-colors" title="Good response">
        <ThumbsUpIcon className="w-4 h-4" />
      </button>
      <button onClick={() => setFeedbackSent('bad')} className="p-1 text-gray-400 hover:text-red-400 transition-colors" title="Bad response">
        <ThumbsDownIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

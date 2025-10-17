import React, { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon } from './Icons';

export const Feedback: React.FC = () => {
  const [feedbackSent, setFeedbackSent] = useState<null | 'good' | 'bad'>(null);

  if (feedbackSent) {
    return <p className="text-xs text-[var(--accent-secondary)] px-2">Thanks!</p>;
  }

  return (
    <>
      <button onClick={() => setFeedbackSent('good')} className="p-1.5 bg-[var(--surface-2)]/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-green-400 hover:bg-slate-700/80 transition-colors" title="Good response">
        <ThumbsUpIcon className="w-4 h-4" />
      </button>
      <button onClick={() => setFeedbackSent('bad')} className="p-1.5 bg-[var(--surface-2)]/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-700/80 transition-colors" title="Bad response">
        <ThumbsDownIcon className="w-4 h-4" />
      </button>
    </>
  );
};
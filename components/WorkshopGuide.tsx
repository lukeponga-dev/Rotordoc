import React from 'react';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';
import { CloseIcon, BookOpenIcon } from './Icons';

interface WorkshopGuideProps {
  onClose: () => void;
}

export const WorkshopGuide: React.FC<WorkshopGuideProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-[var(--surface-1)]/80 backdrop-blur-md sm:rounded-lg border-x-0 sm:border-x border-y border-[var(--surface-border)] shadow-2xl shadow-black/40">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--surface-border)] shadow-md shrink-0">
          <div className="flex items-center space-x-3">
              <BookOpenIcon className="w-6 h-6 text-[var(--accent-secondary)]"/>
              <h1 className="text-lg sm:text-xl font-bold font-display text-slate-200 tracking-wide">Workshop Manual Data</h1>
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-800/70 border border-[var(--surface-border)] rounded-md text-sm text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
            aria-label="Close guide"
          >
            <CloseIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="bg-slate-900/70 p-4 sm:p-6 rounded-lg border border-[var(--surface-border)]">
                 <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed selection:bg-[var(--accent-primary)] selection:text-black">
                    {TROUBLESHOOTING_DATA.trim()}
                </pre>
            </div>
        </main>
      </div>
    </div>
  );
};
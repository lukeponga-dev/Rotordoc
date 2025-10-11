import React from 'react';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';
import { CloseIcon } from './Icons';

interface WorkshopGuideProps {
  onClose: () => void;
}

export const WorkshopGuide: React.FC<WorkshopGuideProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-slate-900/80 backdrop-blur-sm sm:rounded-lg border-x-0 sm:border-x border-y border-slate-700/50 shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700/50 shadow-md">
          <h1 className="text-lg sm:text-xl font-bold text-slate-200">Workshop Manual Guide</h1>
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-300 hover:bg-slate-600 transition-colors"
            aria-label="Close guide"
          >
            <CloseIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50">
                 <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {TROUBLESHOOTING_DATA.trim()}
                </pre>
            </div>
        </main>
      </div>
    </div>
  );
};
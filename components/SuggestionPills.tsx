
import React from 'react';
import { RotorDocIcon } from './Icons';

interface SuggestionPillsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "No start when engine is warm",
  "Rough idle after startup",
  "White smoke from exhaust",
  "Clunking noise from rear",
];

export const SuggestionPills: React.FC<SuggestionPillsProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <RotorDocIcon className="w-24 h-24 text-gray-700" />
        <h2 className="mt-4 text-2xl font-bold text-gray-400">RotorDoc is ready to help.</h2>
        <p className="mt-2 text-gray-500">Describe your RX-8's symptoms or start with a common issue:</p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
            {suggestions.map((text) => (
                <button
                    key={text}
                    onClick={() => onSuggestionClick(text)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-700 transition-all duration-200"
                >
                    {text}
                </button>
            ))}
        </div>
    </div>
  );
};

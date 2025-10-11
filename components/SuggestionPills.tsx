import React from 'react';
import { RotorWiseIcon } from './Icons';

interface SuggestionPillsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const categorizedSuggestions = [
  {
    category: 'Engine & Performance',
    suggestions: [
      "My RX-8 won't start when the engine is hot.",
      "I have a rough or unstable idle.",
      "I'm experiencing a significant loss of power when I accelerate.",
      "My engine is misfiring, what should I check first?",
    ],
  },
  {
    category: 'Warning Lights & Error Codes',
    suggestions: [
      "My check engine light is flashing.",
      "Why is my low oil pressure light on?",
      "I have error code P0301, what does it mean?",
      "What does the red coolant light mean?",
      "Got a P0420 code, is my catalytic converter bad?",
    ],
  },
  {
    category: 'Maintenance & Fluids',
    suggestions: [
      "What type of oil should I use?",
      "How do I check my ignition coils?",
      "What is the recommended maintenance schedule?",
      "My car is consuming too much oil.",
    ],
  },
  {
    category: 'General Questions',
    suggestions: [
        "What are the most common issues with the Renesis engine?",
        "Explain the ignition system (coils, plugs, wires).",
        "What should I look for when buying a used RX-8?",
        "Tell me about engine flooding and how to prevent it."
    ],
  },
];

export const SuggestionPills: React.FC<SuggestionPillsProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-col items-center justify-start h-full text-center p-2">
        <RotorWiseIcon className="w-16 h-16 sm:w-20 sm:h-20 text-slate-700" />
        <h2 className="mt-4 text-xl sm:text-2xl font-bold text-slate-400">How can I help you today?</h2>
        <p className="mt-2 mb-8 text-sm sm:text-base text-slate-500">Describe your RX-8's symptoms or select a common issue below.</p>
        
        <div className="w-full max-w-3xl mx-auto space-y-5">
            {categorizedSuggestions.map(({ category, suggestions }) => (
                <div key={category} className="text-left bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <h3 className="text-base font-semibold text-cyan-400 mb-3 px-1">{category}</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {suggestions.map((text) => (
                            <button
                                key={text}
                                onClick={() => onSuggestionClick(text)}
                                className="px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-white transition-all duration-200"
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
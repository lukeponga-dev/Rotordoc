import React from 'react';
import { RotorWiseIcon } from './Icons';

interface SuggestionPillsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const categorizedSuggestions = [
  {
    category: 'Engine & Starting Issues',
    suggestions: [
      "Engine won't start when hot",
      "Rough or unstable idle",
      "Loss of power during acceleration",
      "White smoke from exhaust",
    ],
  },
  {
    category: 'Warning Lights & Codes',
    suggestions: [
      "Flashing check engine light",
      "Low oil pressure light is on",
      "P0301: Misfire on Rotor 1",
      "What does the coolant light mean?",
      "P0420: Catalyst efficiency error",
    ],
  },
  {
    category: 'Drivetrain & Suspension',
    suggestions: [
      "Clunking noise from the rear",
      "Grinding noise when shifting gears",
      "Vibrations at high speed",
      "Car pulls to one side",
    ],
  },
  {
    category: 'Electrical & Interior',
    suggestions: [
        "Power steering feels heavy",
        "A/C is not blowing cold",
        "Dashboard warning lights explained",
        "Radio or navigation system issues"
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
                    <h3 className="text-base font-semibold text-indigo-400 mb-3 px-1">{category}</h3>
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
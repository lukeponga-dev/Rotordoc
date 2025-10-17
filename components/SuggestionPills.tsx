
import React from 'react';
import { RotorWiseIcon, MechanicalIcon, WarningLightIcon, DrivetrainIcon, ElectricalIcon } from './Icons';

interface SuggestionPillsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestionCategories = [
  {
    category: 'Engine & Starting',
    icon: MechanicalIcon,
    suggestions: [
      "Engine won't start when hot",
      "Rough or unstable idle",
      "Loss of power during acceleration",
      "White smoke from exhaust",
    ],
  },
  {
    category: 'Warning Lights & Codes',
    icon: WarningLightIcon,
    suggestions: [
      "Flashing check engine light",
      "Low oil pressure light is on",
      "P0301: Misfire on Rotor 1",
      "What does the coolant light mean?",
    ],
  },
  {
    category: 'Drivetrain & Suspension',
    icon: DrivetrainIcon,
    suggestions: [
      "Clunking noise from the rear",
      "Grinding noise when shifting gears",
      "Vibrations at high speed",
      "Car pulls to one side",
    ],
  },
  {
    category: 'Electrical & Interior',
    icon: ElectricalIcon,
    suggestions: [
        "Power steering feels heavy",
        "A/C is not blowing cold",
        "Dashboard lights explained",
        "Radio or navigation system issues"
    ],
  },
];


export const SuggestionPills: React.FC<SuggestionPillsProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-2">
        <div className="flex flex-col items-center space-y-2 mb-6">
            <RotorWiseIcon className="w-16 h-16 sm:w-20 sm:h-20 text-[var(--accent-primary)] drop-shadow-lg" />
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-wide text-slate-100">Welcome to RotorWise AI</h1>
        </div>
        <p className="max-w-xl mb-8 text-base text-slate-400">
            Your AI-powered assistant for Mazda RX-8 diagnostics.
            <br/>
            Describe an issue or select a common problem to begin.
        </p>
        
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestionCategories.map(({ category, icon: Icon, suggestions }) => (
                <div key={category} className="text-left bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-lg border border-[var(--surface-border)] hover:border-slate-600 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center mb-4">
                        <Icon className="w-6 h-6 mr-3 text-[var(--accent-secondary)]" />
                        <h3 className="text-lg font-semibold font-display text-slate-200">{category}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {suggestions.map((text) => (
                            <button
                                key={text}
                                onClick={() => onSuggestionClick(text)}
                                className="px-3 py-1.5 text-xs sm:text-sm bg-slate-700/60 border border-slate-600/80 rounded-full text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white transition-all duration-200"
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

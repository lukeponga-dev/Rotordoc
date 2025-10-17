import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, DiagnosticState } from '../types';
import { RotorWiseIcon, MechanicalIcon, SettingsIcon, WarningLightIcon, CheckCircleIcon, InfoIcon, GaugeIcon } from './Icons';

interface DiagnosticDashboardProps {
  diagnosticState: DiagnosticState;
  finalDiagnosis: Message | null;
}

const Placeholder: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[var(--surface-1)] rounded-lg border border-[var(--surface-border)] shadow-xl shadow-black/40">
    <GaugeIcon className="w-16 h-16 text-slate-600 mb-4" />
    <h3 className="text-lg font-bold font-display text-slate-300">Digital Dashboard</h3>
    <p className="text-sm text-slate-500 mt-2 max-w-xs">
      Start a diagnosis to see live data populate here, including potential causes, key facts, and ruled-out issues.
    </p>
  </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = '' }) => (
  <div className={`bg-black/20 p-4 rounded-lg border border-slate-700/50 ${className}`}>
    <div className="flex items-center mb-3">
      {icon}
      <h4 className="text-sm font-semibold font-display text-slate-300 uppercase tracking-wider">{title}</h4>
    </div>
    {children}
  </div>
);

const FinalDiagnosisReport: React.FC<{ diagnosis: Message }> = ({ diagnosis }) => {
    const content = diagnosis.content;
    const titleMatch = content.match(/### ✅ Final Diagnosis: (.*)/);
    const title = titleMatch ? titleMatch[1] : 'Final Diagnosis';
    
    // Use the full content for markdown rendering, letting the markdown styles handle formatting.
    return (
        <div className="h-full flex flex-col bg-[var(--surface-1)]/90 backdrop-blur-md rounded-lg border-2 border-[var(--accent-primary)] shadow-2xl shadow-[var(--accent-primary-glow)]">
            <div className="p-4 border-b-2 border-[var(--accent-primary)]/50 shrink-0 bg-gradient-to-b from-orange-900/50 to-transparent">
                <h3 className="text-xl font-bold font-display text-center tracking-wider text-white">
                    <span className="text-[var(--accent-primary)]">Final Diagnosis:</span> {title}
                </h3>
            </div>
            <div className="p-4 flex-1 space-y-4 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.replace(/### ✅ Final Diagnosis: (.*)\n/, '')}</ReactMarkdown>
            </div>
        </div>
    );
};


export const DiagnosticDashboard: React.FC<DiagnosticDashboardProps> = ({ diagnosticState, finalDiagnosis }) => {
  if (finalDiagnosis) {
    return <FinalDiagnosisReport diagnosis={finalDiagnosis} />;
  }

  const { potentialCauses, ruledOut, keyFacts } = diagnosticState;
  const hasContent = potentialCauses.length > 0 || ruledOut.length > 0 || keyFacts.length > 0;

  if (!hasContent) {
    return <Placeholder />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[var(--surface-1)] to-[var(--background-dark)] rounded-lg border border-[var(--surface-border)] shadow-xl shadow-black/40">
       <div className="p-4 border-b border-slate-700/80 shrink-0">
            <h3 className="text-lg font-bold font-display text-slate-200 text-center tracking-wider">Digital Dashboard</h3>
       </div>
       <div className="p-4 flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            {keyFacts.length > 0 && (
                <Section icon={<InfoIcon className="w-5 h-5 mr-3 text-[var(--accent-secondary)]" />} title="Key Facts">
                    <ul className="text-sm text-slate-300 space-y-2">
                        {keyFacts.map((fact, i) => <li key={i} className="flex items-start"><span className="text-[var(--accent-secondary)] mr-2 mt-1">&#9679;</span><span>{fact}</span></li>)}
                    </ul>
                </Section>
            )}
            {potentialCauses.length > 0 && (
                <Section icon={<WarningLightIcon className="w-5 h-5 mr-3 text-amber-400" />} title="Potential Causes">
                     <ul className="text-sm text-slate-200 space-y-2">
                        {potentialCauses.map((cause, i) => <li key={i} className="flex items-start"><span className="text-amber-400 mr-2 mt-1">&#9679;</span><span>{cause}</span></li>)}
                    </ul>
                </Section>
            )}
            {ruledOut.length > 0 && ruledOut[0] !== 'None' && (
                <Section icon={<CheckCircleIcon className="w-5 h-5 mr-3 text-green-400" />} title="Ruled Out">
                     <ul className="text-sm text-slate-400 space-y-2">
                        {ruledOut.map((item, i) => <li key={i} className="flex items-start"><span className="text-green-500 mr-2 mt-1">&#10003;</span><span className="line-through">{item}</span></li>)}
                    </ul>
                </Section>
            )}
       </div>
    </div>
  );
};
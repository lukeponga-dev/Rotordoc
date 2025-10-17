
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { RotorWiseIcon, MechanicalIcon, SettingsIcon, WarningLightIcon } from './Icons';

interface DiagnosticDashboardProps {
  diagnosis: Message | null;
}

const Placeholder: React.FC = () => (
  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[var(--surface-1)]/80 backdrop-blur-md rounded-lg border border-[var(--surface-border)] shadow-xl shadow-black/40">
    <RotorWiseIcon className="w-16 h-16 text-slate-600 mb-4" />
    <h3 className="text-lg font-bold font-display text-slate-300">Diagnostic Dashboard</h3>
    <p className="text-sm text-slate-500 mt-2 max-w-xs">
      As you chat with RotorWise, key findings and the final diagnosis will appear here for easy reference.
    </p>
  </div>
);

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const DashboardSection: React.FC<SectionProps> = ({ icon, title, children }) => (
  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/80">
    <div className="flex items-center mb-3">
      {icon}
      <h4 className="text-base font-semibold font-display text-slate-200 tracking-wide">{title}</h4>
    </div>
    <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-li:text-slate-300">
      {children}
    </div>
  </div>
);

export const DiagnosticDashboard: React.FC<DiagnosticDashboardProps> = ({ diagnosis }) => {
  if (!diagnosis) {
    return <Placeholder />;
  }

  const content = diagnosis.content;

  const titleMatch = content.match(/### ✅ Final Diagnosis: (.*)/);
  const title = titleMatch ? titleMatch[1] : 'Final Diagnosis';

  const analysisMatch = content.match(/#### 1\. Root Cause Analysis\s*\n(.*?)(?=#### 2\.|\n\n|$)/s);
  const analysis = analysisMatch ? analysisMatch[1].trim() : '';

  const planMatch = content.match(/#### 2\. Recommended Action Plan\s*\n(.*?)(?=#### 3\.|\n\n|$)/s);
  const plan = planMatch ? planMatch[1].trim() : '';
  
  const notesMatch = content.match(/#### 3\. Important Notes & Precautions\s*\n(.*)/s);
  const notes = notesMatch ? notesMatch[1].trim() : '';

  return (
    <div className="h-full flex flex-col bg-[var(--surface-1)]/80 backdrop-blur-md rounded-lg border border-[var(--surface-border)] shadow-xl shadow-black/40 overflow-y-auto custom-scrollbar">
       <div className="p-4 border-b border-slate-700/80 sticky top-0 bg-[var(--surface-1)]/80 backdrop-blur-sm z-10">
            <h3 className="text-xl font-bold font-display text-[var(--accent-primary)] text-center tracking-wider">{title}</h3>
       </div>
       <div className="p-4 flex-1 space-y-4">
            {analysis && (
                <DashboardSection icon={<MechanicalIcon className="w-5 h-5 mr-3 text-[var(--accent-secondary)]" />} title="Root Cause Analysis">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                </DashboardSection>
            )}
            {plan && (
                 <DashboardSection icon={<SettingsIcon className="w-5 h-5 mr-3 text-[var(--accent-secondary)]" />} title="Recommended Action Plan">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
                </DashboardSection>
            )}
            {notes && (
                <DashboardSection icon={<WarningLightIcon className="w-5 h-5 mr-3 text-amber-400" />} title="Important Notes & Precautions">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
                </DashboardSection>
            )}
       </div>
    </div>
  );
};

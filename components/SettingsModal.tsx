
import React from 'react';
import { CloseIcon, RotorWiseIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative max-w-lg w-full bg-gradient-to-br from-[var(--surface-1)] to-slate-900 rounded-lg border border-[var(--surface-border)] shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-500 hover:text-white transition-colors rounded-full"
          aria-label="Close settings"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="flex items-start space-x-4 mb-6">
            <RotorWiseIcon className="w-10 h-10 text-[var(--accent-primary)] mt-1 shrink-0" />
            <div>
              <h2 className="text-xl font-bold font-display text-slate-100 mb-1">API Key Configuration</h2>
              <p className="text-sm text-slate-400">
                This application follows security best practices by managing the API key in a secure, server-side environment.
              </p>
            </div>
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-300">
                    Gemini API Key Status
                </label>
                <input
                    id="api-key-input"
                    type="text"
                    disabled
                    value="••••••••••••••••••••••••••••• Managed by environment"
                    className="mt-1 w-full bg-slate-800/80 rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm text-slate-400 placeholder-slate-500 focus:outline-none cursor-not-allowed"
                    aria-readonly="true"
                />
            </div>

            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h3 className="font-semibold text-slate-200">Why can't I change the key here?</h3>
                <p className="text-xs text-slate-400 mt-2">
                    To protect your account and prevent security risks, API keys should never be exposed or entered directly into a web application's frontend. This app's API key is securely injected from the environment, which is the industry-standard approach for handling sensitive credentials.
                </p>
            </div>
        </div>

        <button
            onClick={onClose}
            className="mt-8 w-full px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-md text-sm font-semibold hover:bg-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--surface-1)] focus:ring-[var(--accent-primary)]"
        >
            I Understand
        </button>
      </div>
    </div>
  );
};

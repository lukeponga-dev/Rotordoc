
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
        className="relative max-w-md w-full bg-gradient-to-br from-[var(--surface-1)] to-slate-900 rounded-lg border border-[var(--surface-border)] shadow-2xl p-6 sm:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-500 hover:text-white transition-colors rounded-full"
          aria-label="Close settings"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
            <RotorWiseIcon className="w-12 h-12 text-[var(--accent-primary)] mb-4" />
            <h2 className="text-xl font-bold font-display text-slate-100 mb-3">API Key Configuration</h2>
            <p className="text-sm text-slate-400 mb-6">
                For security and best practices, this application is designed to use an API key provided through a secure environment variable.
                You do not need to enter a key here.
            </p>
            <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/80 text-left text-xs text-slate-300 w-full">
                <p className="font-semibold text-[var(--accent-secondary)]">How it Works:</p>
                <p className="mt-1">
                    The API key is managed by the application's hosting environment. As long as it's configured correctly there, the app will have the access it needs to function. This protects the key and ensures a seamless experience.
                </p>
            </div>
            <button
                onClick={onClose}
                className="mt-8 w-full px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-md text-sm font-semibold hover:bg-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--surface-1)] focus:ring-[var(--accent-primary)]"
            >
                Got it
            </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CloseIcon, RotorWiseIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onOpenPrivacyPolicy: () => void;
  isPreconfigured: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, onSaveApiKey, onOpenPrivacyPolicy, isPreconfigured }) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleSave = () => {
    onSaveApiKey(localApiKey);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative max-w-lg w-full bg-gradient-to-br from-[var(--surface-1)] to-gray-900/95 rounded-xl border border-[var(--surface-border)] shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-gray-500 hover:text-white transition-colors rounded-full"
          aria-label="Close settings"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="flex items-start space-x-4 mb-6">
            <RotorWiseIcon className="w-10 h-10 text-[var(--accent-primary)] mt-1 shrink-0" />
            <div>
              <h2 className="text-xl font-bold font-display text-gray-100 mb-1">API Key Configuration</h2>
              <p className="text-sm text-gray-400">
                {isPreconfigured
                    ? 'The API key for this application has been pre-configured.'
                    : 'To use RotorWise AI, you need a Google Gemini API key.'
                }
              </p>
            </div>
        </div>
        
        {isPreconfigured ? (
            <div className="p-4 bg-[var(--surface-2)]/50 border border-[var(--surface-border)] rounded-lg text-center">
                <p className="text-sm text-gray-300">
                    You're all set! No action is needed to use the application.
                </p>
            </div>
        ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                    <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300">
                        Your Google Gemini API Key
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        placeholder="Enter your API key here..."
                        className="mt-1 w-full bg-[var(--surface-2)] rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--surface-1)] focus:ring-[var(--accent-primary)]"
                        required
                    />
                </div>

                <div className="p-4 bg-[var(--surface-2)]/50 border border-[var(--surface-border)] rounded-lg">
                    <p className="text-xs text-gray-400">
                        Your API key is stored securely in your browser's local storage. Get a free API key from{' '}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent-secondary)] font-medium hover:underline"
                        >
                            Google AI Studio
                        </a>.
                    </p>
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--surface-1)] focus:ring-[var(--accent-primary)] disabled:opacity-50"
                  disabled={!localApiKey.trim()}
                >
                  Save and Continue
                </button>
            </form>
        )}

        <div className="mt-6 text-center">
            <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-xs text-gray-500 hover:text-[var(--accent-secondary)] underline transition-colors"
            >
                View Privacy Policy
            </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CloseIcon, SaveIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const TEST_API_KEY = "TEST_API_KEY_FOR_DEMO";

  useEffect(() => {
    if (isOpen) {
      // Don't pre-fill the input for security. User can paste a new key.
      setApiKey('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };
  
  const handleUseTestKey = () => {
    onSave(TEST_API_KEY);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-[var(--surface-1)] w-full max-w-md m-4 p-6 rounded-lg border border-[var(--surface-border)] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white rounded-full"
          aria-label="Close settings"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold font-display text-slate-200 mb-4">Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-slate-400 mb-1.5">
              Google Gemini API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key here"
              className="w-full bg-slate-800/80 rounded-md border border-[var(--surface-border)] p-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
             <p className="text-xs text-slate-500 mt-2">
              Your API key is stored securely in your browser's local storage and is never sent to our servers.
              Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-secondary)] hover:underline">Google AI Studio</a>.
            </p>
             <p className="text-xs text-slate-500 mt-2">
              Don't have a key?{' '}
              <button onClick={handleUseTestKey} className="text-[var(--accent-secondary)] hover:underline focus:outline-none font-medium">
                Use a test key to explore the app.
              </button>
            </p>
          </div>
          
           <div>
             <p className="text-sm text-slate-400">
                Current status: {currentApiKey ? 
                <span className="text-green-400">API Key is configured.</span> : 
                <span className="text-amber-400">API Key is not configured.</span>
                }
             </p>
           </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700/60 border border-slate-600 rounded-md text-sm text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md text-sm hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon className="w-5 h-5" />
            <span>Save Key</span>
          </button>
        </div>
      </div>
    </div>
  );
};


import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string | null;
}

// NOTE: This component is no longer used. API key management has been removed
// to align with platform requirements, where the key is provided via an
// environment variable.
export const SettingsModal: React.FC<SettingsModalProps> = () => {
  return null;
};

import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const handleEnd = useCallback(() => {
    setSpeakingMessageId(null);
  }, []);

  const speak = useCallback((text: string, messageId: string) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth || !text) return;

    // If another message is playing or pending, cancel it before starting a new one.
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => {
      setSpeakingMessageId(messageId)
    };
    utterance.onend = handleEnd;
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      handleEnd(); // Reset state on error
    };

    synth.speak(utterance);
  }, [handleEnd]);

  const cancel = useCallback(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (synth && (synth.speaking || synth.pending)) {
      // Calling cancel() on a fresh reference to the API ensures the correct 'this' context.
      synth.cancel();
      // The 'onend' event will fire automatically after cancel(), resetting the state.
    }
  }, []);
  
  // Cleanup effect to stop any speech when the component using the hook unmounts.
  useEffect(() => {
    return () => {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (synth) {
        // Ensure any ongoing speech is stopped to prevent memory leaks or errors.
        synth.cancel();
      }
    };
  }, []);

  return { speak, cancel, speakingMessageId };
};
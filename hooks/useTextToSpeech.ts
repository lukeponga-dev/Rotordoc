import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const handleEnd = useCallback(() => {
    setSpeakingMessageId(null);
  }, []);

  const speak = useCallback((text: string, messageId: string) => {
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
  }, [synth, handleEnd]);

  const cancel = useCallback(() => {
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
      // The 'onend' event will fire automatically after cancel(), resetting the state.
    }
  }, [synth]);
  
  // Cleanup effect to stop any speech when the component using the hook unmounts.
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  return { speak, cancel, speakingMessageId };
};

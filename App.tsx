
import React, { useState, useRef, useEffect } from 'react';
import { useChatManager } from './components/SessionManager';
import { ChatMessage } from './components/ChatMessage';
import { SuggestionPills } from './components/SuggestionPills';
import { SendIcon, ExportIcon, RotorWiseIcon, MenuIcon, PaperclipIcon, MicrophoneIcon, CloseIcon, BookOpenIcon, InstallIcon, SettingsIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { exportToPDF } from './utils/export';
import { Session } from './types';
import { WorkshopGuide } from './components/WorkshopGuide';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { SettingsModal } from './components/SettingsModal';

// Fix: Define SpeechRecognition interface to fix TypeScript error.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

// Extend the window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { messages, loadingState, sendMessage, setHistory, startNewChat } = useChatManager();
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'guide'>('chat');
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { speak, cancel, speakingMessageId } = useTextToSpeech();
  
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('rotorwise_sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      localStorage.removeItem('rotorwise_sessions');
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed.', err));
        });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
        const dismissedInSession = sessionStorage.getItem('rotorwise_install_dismissed');
        if (!dismissedInSession) {
            setShowInstallBanner(true);
        }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const text = event.results[event.results.length - 1][0].transcript;
            setInput(prev => prev ? `${prev} ${text}`.trim() : text);
        };
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    } else {
        console.warn('Speech recognition not supported in this browser.');
    }
  }, []);

  const handleSend = () => {
    if ((input.trim() || image || video) && loadingState === 'idle') {
      sendMessage(input, image, video);
      setInput('');
      setImage(null);
      setVideo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion, null, null);
  };
  
  const handleExport = () => {
    exportToPDF(messages);
  };

  const handleNewChat = () => {
    cancel(); // Stop any speech on new chat
    startNewChat();
    setActiveSessionId(null);
    setIsSidebarOpen(false);
    setCurrentView('chat');
  };

  const saveSession = () => {
    if (messages.length === 0) return;

    if (activeSessionId) {
       const updatedSessions = sessions.map(s => 
        s.id === activeSessionId ? { ...s, messages: messages } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
    } else {
      const sessionName = messages.find(m => m.role === 'user')?.content.substring(0, 30) || 'New Session';
      const newSession: Session = {
        id: new Date().toISOString(),
        name: `${sessionName}...`,
        messages: messages,
      };
      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
      setActiveSessionId(newSession.id);
    }
  };

  const loadSession = (sessionId: string) => {
    cancel(); // Stop any speech on load
    const sessionToLoad = sessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      setHistory(sessionToLoad.messages);
      setActiveSessionId(sessionId);
    }
    setIsSidebarOpen(false);
    setCurrentView('chat');
  };
  
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith('image/')) {
          setImage(reader.result as string);
          setVideo(null);
        } else if (file.type.startsWith('video/')) {
          setVideo(reader.result as string);
          setImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    setShowInstallBanner(false);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
    } else {
        console.log('User dismissed the install prompt');
    }
    setInstallPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('rotorwise_install_dismissed', 'true');
  };

  const isChatDisabled = loadingState !== 'idle';

  const placeholderText = isListening
    ? "Listening..."
    : isChatDisabled
    ? (loadingState === 'processing' ? 'RotorWise is thinking...' : 'Generating response...')
    : image
    ? "Describe the attached image or ask a question..."
    : video
    ? "Describe the attached video or ask a question..."
    : "Describe your RX-8 issue, e.g., 'rough idle when warm'...";

  const activeSessionName = sessions.find(s => s.id === activeSessionId)?.name || 'New Diagnosis';

  return (
    <div className="flex h-screen bg-transparent text-[var(--text-primary)] font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        messages={messages}
        isLoading={isChatDisabled}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onSaveSession={saveSession}
        onExport={handleExport}
        onInstall={handleInstallClick}
        showInstallButton={!!installPrompt}
      />
      {currentView === 'guide' ? (
        <WorkshopGuide onClose={() => setCurrentView('chat')} />
      ) : (
        <div className="flex flex-col flex-1 h-full">
          <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-[var(--surface-1)]/80 backdrop-blur-md sm:rounded-lg border-x-0 sm:border-x border-y border-[var(--surface-border)] shadow-2xl shadow-black/40">
            {/* Header */}
            <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--surface-border)] shadow-md shrink-0">
              <div className="flex items-center">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-slate-400 hover:text-white md:hidden mr-2 sm:mr-3">
                    <MenuIcon className="w-6 h-6" />
                  </button>
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <RotorWiseIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent-primary)]" />
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold font-display text-slate-200 tracking-wide">RotorWise AI</h1>
                        <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[150px] sm:max-w-xs">{activeSessionName}</p>
                    </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {installPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-sky-600/80 border border-sky-500/80 rounded-md text-sm text-sky-100 hover:bg-sky-600 hover:border-sky-500 transition-colors"
                    aria-label="Install App"
                  >
                    <InstallIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Install App</span>
                  </button>
                )}
                <button
                  onClick={() => setCurrentView('guide')}
                  className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-800/70 border border-[var(--surface-border)] rounded-md text-sm text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
                >
                  <BookOpenIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Guide</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={messages.length === 0 || isChatDisabled}
                  className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-800/70 border border-[var(--surface-border)] rounded-md text-sm text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ExportIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 bg-slate-800/70 border border-[var(--surface-border)] rounded-md text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
                  aria-label="Open Settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
              {messages.length === 0 && loadingState === 'idle' ? (
                <SuggestionPills onSuggestionClick={handleSuggestionClick} />
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onSpeak={speak}
                    onCancelSpeak={cancel}
                    speakingMessageId={speakingMessageId}
                  />
                ))
              )}
              <div ref={chatEndRef} />
            </main>

            <footer className="p-3 sm:p-4 border-t border-[var(--surface-border)] shrink-0">
              <div className="max-w-3xl mx-auto">
                {/* --- PWA Install Banner --- */}
                {showInstallBanner && installPrompt && (
                  <div className="install-banner-animation mb-3 p-3 flex items-center justify-between gap-3 bg-gradient-to-r from-sky-900/80 to-slate-800/80 border border-sky-700/60 rounded-lg shadow-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <InstallIcon className="w-9 h-9 text-sky-300 shrink-0 p-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sky-100 leading-tight">
                          Download RotorWise AI now and get instant diagnostics, symptom tracking, and expert insights—all from your phone.
                        </p>
                        <blockquote className="mt-1.5 text-xs text-sky-300 border-l-2 border-sky-600 pl-2 italic">
                          Tap below to install and start your smarter driving journey today!
                        </blockquote>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                       <button 
                         onClick={handleDismissInstall}
                         className="px-3 py-1.5 text-sky-300 hover:text-white hover:bg-sky-800/50 rounded-md text-sm transition-colors"
                         aria-label="Dismiss install banner"
                       >
                         Later
                       </button>
                       <button 
                         onClick={handleInstallClick}
                         className="px-4 py-1.5 bg-sky-500 text-white rounded-md text-sm font-semibold hover:bg-sky-400 transition-colors flex items-center gap-2"
                       >
                         <InstallIcon className="w-4 h-4" />
                         <span>Install Now</span>
                       </button>
                    </div>
                  </div>
                )}
                {video && (
                  <div className="relative inline-block mb-2 ml-2">
                    <video src={video} controls className="w-40 h-auto object-cover rounded-md border-2 border-[var(--surface-border)]" />
                    <button
                      onClick={() => {
                        setVideo(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border-2 border-slate-600 hover:bg-red-500 transition-colors"
                      aria-label="Remove video"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {image && (
                  <div className="relative inline-block mb-2 ml-2">
                    <img src={image} alt="Upload preview" className="w-20 h-20 object-cover rounded-md border-2 border-[var(--surface-border)]" />
                    <button
                      onClick={() => {
                        setImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border-2 border-slate-600 hover:bg-red-500 transition-colors"
                      aria-label="Remove image"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={`flex items-center space-x-2 sm:space-x-3 bg-slate-800/80 rounded-xl border border-[var(--surface-border)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)] transition-shadow p-1 ${isChatDisabled ? 'opacity-60' : ''}`}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isChatDisabled} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] disabled:text-slate-600 disabled:cursor-not-allowed transition-colors rounded-full">
                    <PaperclipIcon className="w-6 h-6" />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={placeholderText}
                    className="flex-1 w-full bg-transparent p-2 text-sm sm:text-base text-slate-200 placeholder-slate-500 focus:outline-none resize-none custom-scrollbar"
                    disabled={isChatDisabled}
                    rows={1}
                  />
                  <div className="relative flex items-center">
                    <button type="button" onClick={toggleListening} disabled={isChatDisabled} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] disabled:text-slate-600 disabled:cursor-not-allowed transition-colors rounded-full">
                       <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'text-[var(--accent-primary)]' : ''}`} />
                    </button>
                    {isListening && <div className="absolute inset-0 pulse-ring-animation" aria-hidden="true"></div>}
                  </div>
                  <button
                    type="submit"
                    disabled={isChatDisabled || (!input.trim() && !image && !video)}
                    className="p-3 bg-[var(--accent-primary)] text-white rounded-lg disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors"
                    aria-label="Send message"
                  >
                    {isChatDisabled ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-6 h-6" />}
                  </button>
                </form>
              </div>
            </footer>
          </div>
        </div>
      )}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;

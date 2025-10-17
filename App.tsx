import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatManager } from './components/SessionManager';
import { ChatMessage } from './components/ChatMessage';
import { SendIcon, ExportIcon, RotorWiseIcon, MenuIcon, PaperclipIcon, MicrophoneIcon, CloseIcon, BookOpenIcon, InstallIcon, SettingsIcon, MechanicalIcon, ChatIcon, GaugeIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { exportToPDF } from './utils/export';
import { Session, Message, DiagnosticState } from './types';
import { WorkshopGuide } from './components/WorkshopGuide';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { SettingsModal } from './components/SettingsModal';
import { DiagnosticDashboard } from './components/DiagnosticDashboard';
import { PrivacyPolicy } from './components/PrivacyPolicy';

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

const preconfiguredApiKey = process.env.API_KEY || '';

const suggestionStarters = [
    { title: "Hot Start Issues", description: "Engine struggles or won't start when fully warm.", query: "Engine won't start when hot" },
    { title: "Unstable Idle", description: "Idle is rough, fluctuating, or stalls.", query: "Rough or unstable idle" },
    { title: "Power Loss", description: "Car feels sluggish or loses power under acceleration.", query: "Loss of power during acceleration" },
    { title: "CEL Flashing", description: "The check engine light is flashing, indicating a misfire.", query: "Flashing check engine light" },
];

const parseResponseForPanel = (content: string): DiagnosticState => {
    const parseTag = (tag: string) => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
        const match = content.match(regex);
        if (!match) return [];
        return match[1].split('\n').map(s => s.trim().replace(/^-/, '').trim()).filter(Boolean);
    };

    return {
        potentialCauses: parseTag('causes'),
        ruledOut: parseTag('ruled_out'),
        keyFacts: parseTag('facts'),
    };
};


const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { messages, loadingState, sendMessage, setHistory, startNewChat } = useChatManager(apiKey);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'guide' | 'privacy'>('chat');
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState<Message | null>(null);
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState>({ potentialCauses: [], ruledOut: [], keyFacts: [] });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { speak, cancel, speakingMessageId } = useTextToSpeech();
  
  const isApiKeyPreconfigured = !!preconfiguredApiKey;

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

    if (isApiKeyPreconfigured) {
      setApiKey(preconfiguredApiKey);
      return;
    }
    
    // Load API Key or prompt user
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        setApiKey(savedKey);
    } else {
        setIsSettingsOpen(true);
    }

  }, [isApiKeyPreconfigured]);
  
  const updateDiagnosticPanels = useCallback((msgs: Message[]) => {
      const lastModelMsg = [...msgs].reverse().find(m => m.role === 'model');
      if (!lastModelMsg || !lastModelMsg.content) {
          setFinalDiagnosis(null);
          setDiagnosticState({ potentialCauses: [], ruledOut: [], keyFacts: [] });
          return;
      }

      if (lastModelMsg.content.includes('### ✅ Final Diagnosis:')) {
          setFinalDiagnosis(lastModelMsg);
          setDiagnosticState({ potentialCauses: [], ruledOut: [], keyFacts: [] });
      } else {
          setFinalDiagnosis(null);
          setDiagnosticState(parseResponseForPanel(lastModelMsg.content));
      }
  }, []);

  useEffect(() => {
    updateDiagnosticPanels(messages);
  }, [messages, updateDiagnosticPanels]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showDiagnosticPanel]);

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

  const handleSetApiKey = (key: string) => {
    if (isApiKeyPreconfigured) return;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };
  
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
  
  const handleExport = () => {
    exportToPDF(messages);
  };

  const handleNewChat = () => {
    cancel(); // Stop any speech on new chat
    startNewChat();
    setActiveSessionId(null);
    setIsSidebarOpen(false);
    setShowDiagnosticPanel(false);
    setCurrentView('chat');
    setFinalDiagnosis(null);
    setDiagnosticState({ potentialCauses: [], ruledOut: [], keyFacts: [] });
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
      updateDiagnosticPanels(sessionToLoad.messages);
    }
    setIsSidebarOpen(false);
    setShowDiagnosticPanel(false);
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

  const handleViewChange = (view: 'chat' | 'guide' | 'privacy') => {
    setShowDiagnosticPanel(false);
    setCurrentView(view);
  };
  
  const isChatDisabled = loadingState !== 'idle' || !apiKey;

  const placeholderText = !apiKey
    ? "Please set your API key in the settings..."
    : isListening
    ? "Listening..."
    : isChatDisabled
    ? (loadingState === 'thinking' ? 'RotorWise is thinking...' : 'Generating response...')
    : image
    ? "Describe the attached image or ask a question..."
    : video
    ? "Describe the attached video or ask a question..."
    : "Describe your RX-8 issue, e.g., 'rough idle when warm'...";

  const activeSessionName = sessions.find(s => s.id === activeSessionId)?.name || 'New Diagnosis';

  const renderCurrentView = () => {
    switch(currentView) {
      case 'guide':
        return <WorkshopGuide onClose={() => handleViewChange('chat')} />;
      case 'privacy':
        return <PrivacyPolicy onClose={() => handleViewChange('chat')} />;
      case 'chat':
      default:
        return (
          <div className="flex flex-col flex-1 h-full min-w-0">
            <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--surface-border)] shadow-md shrink-0 bg-[var(--surface-1)]/80 backdrop-blur-sm z-10">
                <div className="flex items-center">
                  <button onClick={() => { setIsSidebarOpen(true); setShowDiagnosticPanel(false); }} className="p-1 text-slate-400 hover:text-white md:hidden mr-2 sm:mr-3">
                      <MenuIcon className="w-6 h-6" />
                    </button>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                      <RotorWiseIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent-primary)]" />
                      <div>
                          <h1 className="text-lg sm:text-xl font-bold font-display text-slate-200 tracking-wide">
                            {showDiagnosticPanel ? 'Digital Dashboard' : 'RotorWise AI'}
                          </h1>
                          <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                            {showDiagnosticPanel ? 'Live Diagnostic Data' : activeSessionName}
                          </p>
                      </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                   <button
                    onClick={() => {
                        if (isSidebarOpen) setIsSidebarOpen(false);
                        setShowDiagnosticPanel(d => !d);
                    }}
                    className="lg:hidden p-2 bg-[var(--surface-2)] border border-[var(--surface-border)] rounded-md text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
                    aria-label={showDiagnosticPanel ? "Show Chat" : "Show Diagnostic Dashboard"}
                  >
                    {showDiagnosticPanel ? <ChatIcon className="w-5 h-5" /> : <GaugeIcon className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 bg-[var(--surface-2)] border border-[var(--surface-border)] rounded-md text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
                    aria-label="Open Settings"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </button>
                </div>
              </header>
              
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
                {/* Main Chat Column */}
                <div className={`${showDiagnosticPanel ? 'hidden' : 'flex'} lg:flex lg:col-span-8 flex-col h-full min-h-0`}>
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
                    {messages.length === 0 && loadingState === 'idle' ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-2">
                          <div className="flex flex-col items-center space-y-2 mb-8">
                              <RotorWiseIcon className="w-16 h-16 sm:w-20 sm:h-20 text-[var(--accent-primary)] drop-shadow-[0_0_15px_var(--accent-primary-glow)]" />
                              <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-wider text-slate-100">RotorWise AI Diagnostics</h1>
                              <p className="max-w-xl text-base text-slate-400">
                                Your AI-powered expert for Mazda RX-8 troubleshooting.
                              </p>
                          </div>
                         
                          <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {suggestionStarters.map(({title, description, query}) => (
                                <button
                                    key={title}
                                    onClick={() => sendMessage(query, null, null)}
                                    className="text-left p-4 bg-[var(--surface-1)]/70 border border-[var(--surface-border)] rounded-lg hover:bg-[var(--surface-2)] hover:border-[var(--accent-secondary)] hover:scale-105 transition-all duration-200 group"
                                >
                                    <h3 className="font-semibold text-slate-200 group-hover:text-[var(--accent-secondary)] transition-colors">{title}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{description}</p>
                                </button>
                            ))}
                          </div>
                      </div>
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

                  <footer className="p-3 sm:p-4 shrink-0 bg-transparent">
                    <div className="max-w-4xl mx-auto">
                      {showInstallBanner && installPrompt && (
                        <div className="install-banner-animation mb-3 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-sky-900/80 to-[var(--surface-2)]/80 border border-sky-700/60 rounded-lg shadow-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                            <InstallIcon className="w-9 h-9 text-sky-300 shrink-0 p-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-sky-100 leading-tight">Install RotorWise AI for quick access.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <button onClick={handleDismissInstall} className="px-3 py-1.5 text-sky-300 hover:text-white hover:bg-sky-800/50 rounded-md text-sm transition-colors">Later</button>
                            <button onClick={handleInstallClick} className="px-4 py-1.5 bg-sky-500 text-white rounded-md text-sm font-semibold hover:bg-sky-400 transition-colors flex items-center gap-2"><InstallIcon className="w-4 h-4" /><span>Install</span></button>
                          </div>
                        </div>
                      )}
                      {(video || image) && (
                         <div className="flex items-center gap-3 mb-2 ml-2">
                             {video && (
                                 <div className="relative inline-block">
                                     <video src={video} controls className="w-40 h-auto object-cover rounded-lg border-2 border-[var(--surface-border)]" />
                                     <button onClick={() => { setVideo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border-2 border-[var(--surface-1)] hover:bg-red-500 transition-colors" aria-label="Remove video"><CloseIcon className="w-4 h-4" /></button>
                                 </div>
                             )}
                             {image && (
                                 <div className="relative inline-block">
                                     <img src={image} alt="Upload preview" className="w-20 h-20 object-cover rounded-lg border-2 border-[var(--surface-border)]" />
                                     <button onClick={() => { setImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 border-2 border-[var(--surface-1)] hover:bg-red-500 transition-colors" aria-label="Remove image"><CloseIcon className="w-4 h-4" /></button>
                                 </div>
                             )}
                         </div>
                      )}
                      
                      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={`relative flex items-center bg-[var(--surface-1)] rounded-xl border border-[var(--surface-border)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)] transition-all shadow-lg ${isChatDisabled ? 'opacity-60' : ''}`}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isChatDisabled} className="p-3 text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] disabled:text-slate-600 disabled:cursor-not-allowed transition-colors rounded-full">
                          <PaperclipIcon className="w-5 h-5" />
                        </button>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          placeholder={placeholderText}
                          className="flex-1 w-full bg-transparent py-3 text-sm sm:text-base text-slate-200 placeholder-slate-500 focus:outline-none resize-none custom-scrollbar"
                          disabled={isChatDisabled}
                          rows={1}
                        />
                        <button type="button" onClick={toggleListening} disabled={isChatDisabled} className={`p-3 text-[var(--text-secondary)] hover:text-[var(--accent-secondary)] disabled:text-slate-600 disabled:cursor-not-allowed transition-colors rounded-full ${isListening ? 'pulse-ring-animation' : ''}`}>
                          <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'text-[var(--accent-primary)]' : ''}`} />
                        </button>
                        <button
                          type="submit"
                          disabled={isChatDisabled || (!input.trim() && !image && !video)}
                          className="m-1.5 p-3 bg-[var(--accent-primary)] text-white rounded-lg disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors shadow-md hover:shadow-lg hover:shadow-[var(--accent-primary-glow)]"
                          aria-label="Send message"
                        >
                          {loadingState !== 'idle' && !!apiKey ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                        </button>
                      </form>
                    </div>
                  </footer>
                </div>
                {/* Diagnostic Dashboard */}
                <div className={`${showDiagnosticPanel ? 'block' : 'hidden'} lg:block lg:col-span-4 h-full min-h-0 p-4 border-l-0 lg:border-l border-[var(--surface-border)] bg-black/20`}>
                    <DiagnosticDashboard diagnosticState={diagnosticState} finalDiagnosis={finalDiagnosis} />
                </div>
              </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-transparent text-[var(--text-primary)] font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        isLoading={isChatDisabled}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onSaveSession={saveSession}
        onViewChange={handleViewChange}
        showInstallButton={!!installPrompt}
        onInstall={handleInstallClick}
      />
      {renderCurrentView()}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSetApiKey}
        onOpenPrivacyPolicy={() => {
          setIsSettingsOpen(false);
          handleViewChange('privacy');
        }}
        isPreconfigured={isApiKeyPreconfigured}
      />
    </div>
  );
};

export default App;
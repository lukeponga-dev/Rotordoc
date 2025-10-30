import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatManager } from './components/SessionManager';
import { ChatMessage } from './components/ChatMessage';
import { SendIcon, ExportIcon, RotorWiseIcon, MenuIcon, PaperclipIcon, MicrophoneIcon, CloseIcon, BookOpenIcon, InstallIcon, SettingsIcon, DashboardIcon } from './components/Icons';
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
  const [isDashboardOpen, setIsDashboardOpen] = useState(window.innerWidth >= 1024);
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState<Message | null>(null);
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState>({ potentialCauses: [], ruledOut: [], keyFacts: [] });
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { speak, cancel, speakingMessageId } = useTextToSpeech();
  
  const isApiKeyPreconfigured = !!preconfiguredApiKey;

  // Load API key from storage or preconfigured env
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (isApiKeyPreconfigured) {
      setApiKey(preconfiguredApiKey);
    } else if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setIsSettingsOpen(true);
    }
  }, [isApiKeyPreconfigured]);

  // Load sessions from local storage and set up PWA install prompt
  useEffect(() => {
    try {
      const savedSessionsData = localStorage.getItem('rotorwise_sessions');
      if (savedSessionsData) {
        setSessions(JSON.parse(savedSessionsData));
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const handleResize = () => {
      if (window.innerWidth < 1024 && isDashboardOpen) {
          setIsDashboardOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDashboardOpen]);

  // Scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse model response for diagnostic panel data
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model' && lastMessage.content) {
      if (lastMessage.content.includes('### ✅ Final Diagnosis:')) {
        setFinalDiagnosis(lastMessage);
        setIsDashboardOpen(true);
      } else {
        setFinalDiagnosis(null);
        const newState = parseResponseForPanel(lastMessage.content);
        if (newState.potentialCauses.length > 0 || newState.keyFacts.length > 0) {
          setDiagnosticState(newState);
        }
      }
    }
  }, [messages]);

  const handleSend = () => {
    if ((!input.trim() && !image && !video) || loadingState !== 'idle') return;
    sendMessage(input, image, video);
    setInput('');
    setImage(null);
    setVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuggestionClick = (query: string) => {
    if (loadingState !== 'idle') return;
    sendMessage(query, null, null);
    setInput('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type.startsWith('image/')) {
        setImage(result);
        setVideo(null);
      } else if (file.type.startsWith('video/')) {
        setVideo(result);
        setImage(null);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (e) => {
          console.error('Speech recognition error:', e.error);
          setIsListening(false);
      };
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
        // Automatically send after successful transcription
        sendMessage(transcript, image, video);
        setInput('');
      };
      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported by your browser.");
    }
  };

  // Session Management
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleNewChat = () => {
    startNewChat();
    setActiveSessionId(null);
    setIsSidebarOpen(false);
    setCurrentView('chat');
    setDiagnosticState({ potentialCauses: [], ruledOut: [], keyFacts: [] });
    setFinalDiagnosis(null);
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setHistory(session.messages);
      setActiveSessionId(sessionId);
      setIsSidebarOpen(false);
      setCurrentView('chat');
    }
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  const saveSession = () => {
    if (messages.length === 0) return;
    const sessionName = prompt('Enter a name for this diagnosis:', `Diagnosis Session ${new Date().toLocaleDateString()}`);
    if (sessionName) {
        const newSession: Session = {
            id: `session-${Date.now()}`,
            name: sessionName,
            messages: messages
        };
        const updatedSessions = [...sessions, newSession];
        setSessions(updatedSessions);
        setActiveSessionId(newSession.id);
        localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
    }
  };

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setShowInstallBanner(false);
        setInstallPrompt(null);
      });
    }
  };

  return (
    <div className="flex h-full bg-[var(--background-dark)] text-[var(--text-primary)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onSaveSession={saveSession}
        onViewChange={(view) => {setCurrentView(view); setIsSidebarOpen(false);}}
        onInstall={handleInstall}
        showInstallButton={!!installPrompt}
        isLoading={loadingState !== 'idle'}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex items-center justify-between p-3 border-b border-[var(--surface-border)] bg-[var(--surface-1)]/80 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-2">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-white md:hidden">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <RotorWiseIcon className="w-6 h-6 text-[var(--accent-primary)] hidden sm:block" />
                    <h1 className="text-lg font-bold font-display text-[var(--text-primary)]">RotorWise AI</h1>
                </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                    onClick={() => exportToPDF(messages)}
                    disabled={messages.length === 0}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700/60 border border-gray-600 rounded-md text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Export chat to PDF"
                >
                    <ExportIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
                <button onClick={() => setIsDashboardOpen(!isDashboardOpen)} className={`p-2 rounded-md transition-colors ${isDashboardOpen ? 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]' : 'text-gray-400 hover:text-white hover:bg-gray-700/60'}`} title="Toggle Dashboard">
                    <DashboardIcon className="w-5 h-5" />
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white" title="Settings">
                    <SettingsIcon className="w-5 h-5" />
                </button>
            </div>
        </header>

        {currentView === 'chat' && (
          <div className={`flex-1 grid overflow-hidden transition-all duration-500 ease-in-out`} style={{ gridTemplateColumns: isDashboardOpen ? '1fr 420px' : '1fr 0' }}>
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} onSpeak={speak} onCancelSpeak={cancel} speakingMessageId={speakingMessageId} />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[var(--surface-border)] bg-gradient-to-t from-gray-900/50 to-transparent shrink-0">
                  <div className="max-w-4xl mx-auto bg-[var(--surface-1)] rounded-xl border border-[var(--surface-border)] shadow-lg flex items-center p-2 focus-within:ring-2 focus-within:ring-[var(--accent-primary)] transition-shadow">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-[var(--accent-secondary)] transition-colors" title="Attach image or video">
                          <PaperclipIcon className="w-5 h-5" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                      
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Describe the symptoms..."
                        className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none border-none focus:ring-0 py-2.5"
                        rows={1}
                      />

                      <button onClick={toggleListening} className={`p-2 transition-colors ${isListening ? 'text-[var(--accent-primary)] pulse-ring-animation rounded-full' : 'text-gray-400 hover:text-[var(--accent-secondary)]'}`} title={isListening ? 'Listening...' : 'Use microphone'}>
                          <MicrophoneIcon className="w-5 h-5" />
                      </button>
                      <button onClick={handleSend} disabled={loadingState !== 'idle' || (!input.trim() && !image && !video)} className="ml-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-[44px]">
                          {loadingState === 'thinking' ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5" />}
                      </button>
                  </div>
                  {(image || video) && (
                      <div className="text-center text-xs mt-2 text-gray-400">
                          {image ? 'Image ready to send. ' : 'Video ready to send. '}
                          <button onClick={() => { setImage(null); setVideo(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="underline hover:text-red-400">Remove</button>
                      </div>
                  )}
                  {messages.length === 1 && (
                    <div className="mt-4 max-w-4xl mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                            {suggestionStarters.map((starter) => (
                                <button key={starter.title} onClick={() => handleSuggestionClick(starter.query)} className="text-left p-2.5 bg-gray-800/60 hover:bg-[var(--surface-2)] border border-[var(--surface-border)] rounded-lg transition-all duration-200 group">
                                    <p className="font-semibold text-gray-300 group-hover:text-[var(--accent-primary)] text-xs">{starter.title}</p>
                                    <p className="text-xs text-gray-500 hidden sm:block mt-1">{starter.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                  )}
              </div>
            </div>
            {/* Diagnostic Dashboard */}
            <aside className="overflow-hidden">
                <div className="w-[420px] h-full p-4 pl-0">
                    <DiagnosticDashboard diagnosticState={diagnosticState} finalDiagnosis={finalDiagnosis} />
                </div>
            </aside>
          </div>
        )}

        {currentView === 'guide' && <WorkshopGuide onClose={() => setCurrentView('chat')} />}
        {currentView === 'privacy' && <PrivacyPolicy onClose={() => setCurrentView('chat')} />}

        {/* PWA Install Banner */}
        {showInstallBanner && (
            <div className="install-banner-animation absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-gradient-to-r from-[var(--accent-secondary)]/90 to-sky-600/90 backdrop-blur-md p-4 rounded-lg shadow-2xl flex items-center justify-between z-20 border border-sky-400/50">
                <div className="flex items-center">
                    <InstallIcon className="w-8 h-8 text-white mr-3"/>
                    <div>
                        <p className="font-bold text-white">Install RotorWise AI</p>
                        <p className="text-xs text-sky-100">Add to your home screen for quick access.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleInstall} className="px-3 py-1 bg-white/90 text-sky-800 text-sm font-semibold rounded-md hover:bg-white">Install</button>
                    <button onClick={() => setShowInstallBanner(false)} className="p-1 text-white/80 hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                </div>
            </div>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        onOpenPrivacyPolicy={() => setCurrentView('privacy')}
        isPreconfigured={isApiKeyPreconfigured}
      />
    </div>
  );
}

export default App;
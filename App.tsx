import React, { useState, useRef, useEffect } from 'react';
import { useChatManager } from './components/SessionManager';
import { ChatMessage } from './components/ChatMessage';
import { SuggestionPills } from './components/SuggestionPills';
import { SendIcon, ExportIcon, RotorWiseIcon, MenuIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { exportToPDF } from './utils/export';
import { Session, Message } from './types';

const App: React.FC = () => {
  const { messages, isLoading, sendMessage, setHistory, startNewChat } = useChatManager();
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  const handleExport = () => {
    exportToPDF(messages);
  };

  const handleNewChat = () => {
    startNewChat();
    setActiveSessionId(null);
    setIsSidebarOpen(false);
  };

  const saveSession = () => {
    if (messages.length === 0) return;

    // If it's an existing session, update it. Otherwise, create a new one.
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
    const sessionToLoad = sessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      setHistory(sessionToLoad.messages);
      setActiveSessionId(sessionId);
    }
    setIsSidebarOpen(false);
  };
  
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  return (
    <div className="flex h-screen bg-transparent text-white font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        messages={messages}
        isLoading={isLoading}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onSaveSession={saveSession}
        onExport={handleExport}
      />
      <div className="flex flex-col flex-1 h-full">
        <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-gray-900/80 backdrop-blur-sm sm:rounded-lg border-x-0 sm:border-x border-y border-gray-700/50 shadow-2xl">
          {/* Header */}
          <header className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700/50 shadow-md">
            <div className="flex items-center">
               <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-gray-400 hover:text-white md:hidden mr-2 sm:mr-3">
                  <MenuIcon className="w-6 h-6" />
                </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                  <RotorWiseIcon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                  <div>
                      <h1 className="text-lg sm:text-xl font-bold text-gray-200">RotorWise</h1>
                      <p className="text-xs sm:text-sm text-gray-400">Your RX-8 AI Mechanic</p>
                  </div>
              </div>
            </div>
            
            <button
              onClick={handleExport}
              disabled={messages.length === 0 || isLoading}
              className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ExportIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </header>

          {/* Loading Bar */}
          <div className="h-0.5 w-full bg-cyan-900/50 relative">
            {isLoading && <div className="absolute inset-0 w-full h-full loading-bar-shimmer" />}
          </div>

          {/* Chat Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <SuggestionPills onSuggestionClick={handleSuggestionClick} />
            ) : (
              messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))
            )}
            <div ref={chatEndRef} />
          </main>

          {/* Input Form */}
          <footer className="p-2 sm:p-4 border-t border-gray-700/50">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2 sm:space-x-3 bg-gray-800 rounded-lg border border-gray-700 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your RX-8 issue..."
                  className="flex-1 w-full bg-transparent p-3 text-sm sm:text-base text-gray-200 placeholder-gray-500 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 sm:p-3 text-cyan-400 disabled:text-gray-600 disabled:cursor-not-allowed hover:text-cyan-300 transition-colors"
                >
                  {isLoading ? <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-6 h-6" />}
                </button>
              </form>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
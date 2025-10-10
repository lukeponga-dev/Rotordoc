import React, { useState, useRef, useEffect } from 'react';
import { useChatManager } from './components/SessionManager';
import { ChatMessage } from './components/ChatMessage';
import { SuggestionPills } from './components/SuggestionPills';
import { SendIcon, ExportIcon, RotorWiseIcon, HistoryIcon, SaveIcon, TrashIcon } from './components/Icons';
import { exportToPDF } from './utils/export';
import { Session, Message } from './types';

const App: React.FC = () => {
  const { messages, isLoading, sendMessage, setHistory } = useChatManager();
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load sessions from localStorage on initial render
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

  const saveSession = () => {
    if (messages.length === 0) return;
    const sessionName = messages.find(m => m.role === 'user')?.content.substring(0, 30) || 'New Session';
    const newSession: Session = {
      id: new Date().toISOString(),
      name: `${sessionName}... (${new Date().toLocaleTimeString()})`,
      messages: messages,
    };
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
    setIsSessionMenuOpen(false);
  };

  const loadSession = (sessionId: string) => {
    const sessionToLoad = sessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      setHistory(sessionToLoad.messages);
    }
    setIsSessionMenuOpen(false);
  };
  
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('rotorwise_sessions', JSON.stringify(updatedSessions));
  };


  return (
    <div className="flex flex-col h-screen bg-transparent text-white font-sans p-4">
      <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700/50 shadow-md">
          <div className="flex items-center space-x-3">
              <RotorWiseIcon className="w-10 h-10 text-cyan-400" />
              <div>
                  <h1 className="text-xl font-bold text-gray-200">RotorWise</h1>
                  <p className="text-sm text-gray-400">Your Mazda RX-8 AI Mechanic</p>
              </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Session Manager Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSessionMenuOpen(!isSessionMenuOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-300 hover:bg-gray-600 transition-colors"
              >
                <HistoryIcon className="w-5 h-5" />
                <span>Sessions</span>
              </button>
              {isSessionMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                  <div className="p-2">
                    <button onClick={saveSession} disabled={messages.length === 0} className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-md disabled:opacity-50">
                      <SaveIcon className="w-4 h-4" />
                      <span>Save Current Diagnosis</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-700 max-h-60 overflow-y-auto custom-scrollbar">
                    {sessions.length > 0 ? (
                      sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-2 hover:bg-gray-700/50">
                          <button onClick={() => loadSession(session.id)} className="flex-1 text-left px-2 py-1 text-sm text-cyan-400 truncate">
                            {session.name}
                          </button>
                          <button onClick={() => deleteSession(session.id)} className="p-1 text-gray-500 hover:text-red-400">
                            <TrashIcon className="w-4 h-4"/>
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-gray-500 text-center">No saved sessions.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={messages.length === 0 || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ExportIcon className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
        <footer className="p-4 border-t border-gray-700/50">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-3 bg-gray-800 rounded-lg border border-gray-700 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the issue with your RX-8..."
                className="flex-1 w-full bg-transparent p-3 text-gray-200 placeholder-gray-500 focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 text-cyan-400 disabled:text-gray-600 disabled:cursor-not-allowed hover:text-cyan-300 transition-colors"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-6 h-6" />}
              </button>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

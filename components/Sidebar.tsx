import React from 'react';
import { Session, Message } from '../types';
import { PlusIcon, SaveIcon, TrashIcon, CloseIcon, ExportIcon } from './Icons';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onSaveSession: () => void;
  onExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  isOpen,
  messages,
  isLoading,
  onClose,
  onNewChat,
  onLoadSession,
  onDeleteSession,
  onSaveSession,
  onExport
}) => {
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-700/50 flex flex-col z-40 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-72 md:flex-shrink-0`}
      >
        <div className="flex items-center p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-200 flex-1">Chat History</h2>
          <button 
            onClick={onNewChat} 
            title="New Chat"
            className="flex items-center space-x-2 px-3 py-2 bg-indigo-600/20 border border-indigo-700 rounded-md text-sm text-indigo-300 hover:bg-indigo-600/40 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">New</span>
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white md:hidden ml-2">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onLoadSession(session.id)}
                  className={`w-full text-left flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-indigo-900/70 text-white'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate flex-1 pr-2">{session.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this session?')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 rounded-full opacity-50 hover:opacity-100 transition-all"
                    aria-label={`Delete session ${session.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button
            onClick={onSaveSession}
            disabled={messages.length === 0 || isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon className="w-5 h-5" />
            <span>Save Current Chat</span>
          </button>
           <button
            onClick={onExport}
            disabled={messages.length === 0 || isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-md text-sm text-slate-400 hover:bg-slate-600/50 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:hidden"
          >
            <ExportIcon className="w-5 h-5" />
            <span>Export to PDF</span>
          </button>
        </div>
      </aside>
    </>
  );
};
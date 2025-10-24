
import React from 'react';
import { Session, Message } from '../types';
import { PlusIcon, SaveIcon, TrashIcon, CloseIcon, ExportIcon, BookOpenIcon, InstallIcon, SettingsIcon } from './Icons';

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
  onInstall: () => void;
  showInstallButton: boolean;
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
  onExport,
  onInstall,
  showInstallButton,
}) => {
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/70 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--surface-1)]/80 backdrop-blur-md border-r border-[var(--surface-border)] flex flex-col z-40 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-72 md:flex-shrink-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--surface-border)]">
          <h2 className="text-lg font-semibold font-display text-slate-200">RotorWise AI</h2>
          <button 
            onClick={onNewChat} 
            title="New Chat"
            className="flex items-center space-x-2 px-3 py-2 bg-[var(--accent-primary)] text-white rounded-md text-sm hover:bg-orange-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white md:hidden ml-2">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-slate-500">Saved Sessions</h3>
            <nav className="flex-1 p-2">
              <ul className="space-y-1">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      onClick={() => onLoadSession(session.id)}
                      className={`w-full text-left flex items-center justify-between p-2.5 rounded-md text-sm transition-all duration-200 group ${
                        activeSessionId === session.id
                          ? 'bg-slate-700/50 text-white shadow-inner border-l-2 border-[var(--accent-primary)] pl-2'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate flex-1 pr-2">{session.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this session?')) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 rounded-full"
                          aria-label={`Delete session ${session.name}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  </li>
                ))}
                 {sessions.length === 0 && (
                    <div className="text-center text-slate-500 text-sm p-4">
                        No saved sessions yet.
                    </div>
                 )}
              </ul>
            </nav>
        </div>
        
        <div className="p-4 border-t border-[var(--surface-border)] space-y-2">
           {showInstallButton && (
                <button
                    onClick={onInstall}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-sky-600/80 border border-sky-500/80 rounded-md text-sm text-sky-100 hover:bg-sky-600 hover:border-sky-500 transition-colors"
                >
                    <InstallIcon className="w-5 h-5" />
                    <span>Install App</span>
                </button>
            )}
          <button
            onClick={onSaveSession}
            disabled={messages.length === 0 || isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 border border-[var(--surface-border)] rounded-md text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon className="w-5 h-5" />
            <span>{activeSessionId ? 'Update Session' : 'Save Session'}</span>
          </button>
           <button
            onClick={onExport}
            disabled={messages.length === 0 || isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800/50 border border-transparent rounded-md text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:hidden"
          >
            <ExportIcon className="w-5 h-5" />
            <span>Export to PDF</span>
          </button>
        </div>
      </aside>
    </>
  );
};

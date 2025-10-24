import React, { useState, useMemo } from 'react';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';
import { CloseIcon, BookOpenIcon } from './Icons';

interface WorkshopGuideProps {
  onClose: () => void;
}

// Parse the raw data into structured pages
const pages = TROUBLESHOOTING_DATA.split('==Start of OCR for page')
  .filter(p => p.trim())
  .map(p => {
    const [header, ...contentParts] = p.split('==\n');
    const pageNumMatch = header.match(/(\d+)/);
    const pageNum = pageNumMatch ? parseInt(pageNumMatch[1], 10) : 0;
    const content = contentParts.join('==\n').replace(/==End of OCR for page \d+==/, '').trim();
    return { pageNum, content };
  });

// Component to render formatted page content
const PageContent: React.FC<{ content: string; query: string }> = ({ content, query }) => {
  // Simple formatting and highlighting
  const formattedContent = useMemo(() => {
    let highlightedContent = content;
    if (query) {
      const regex = new RegExp(`(${query})`, 'gi');
      highlightedContent = highlightedContent.replace(regex, `<mark class="bg-amber-400 text-black px-0.5 rounded-sm">$1</mark>`);
    }
    return { __html: highlightedContent };
  }, [content, query]);

  return <pre dangerouslySetInnerHTML={formattedContent} className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed selection:bg-[var(--accent-primary)] selection:text-black" />;
};

export const WorkshopGuide: React.FC<WorkshopGuideProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    return pages.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  // Reset to first page when search results change
  React.useEffect(() => {
    setCurrentPageIndex(0);
  }, [filteredPages]);

  const currentPage = filteredPages[currentPageIndex];
  const totalPages = filteredPages.length;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-[var(--surface-1)]/80 backdrop-blur-md sm:rounded-lg border-x-0 sm:border-x border-y border-[var(--surface-border)] shadow-2xl shadow-black/40">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--surface-border)] shadow-md shrink-0">
          <div className="flex items-center space-x-3">
              <BookOpenIcon className="w-6 h-6 text-[var(--accent-secondary)]"/>
              <h1 className="text-lg sm:text-xl font-bold font-display text-slate-200 tracking-wide">Workshop Manual</h1>
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-800/70 border border-[var(--surface-border)] rounded-md text-sm text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
            aria-label="Close guide"
          >
            <CloseIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </header>

        {/* Search and Pagination Controls */}
        <div className="p-3 sm:p-4 border-b border-[var(--surface-border)] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manual (e.g., propeller shaft)..."
                className="w-full sm:w-1/2 bg-slate-800/80 rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="px-4 py-1.5 bg-slate-700/60 border border-slate-600 rounded-md text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    &larr; Previous
                </button>
                <span className="text-sm text-slate-400 font-medium">
                    {totalPages > 0 ? `Page ${currentPageIndex + 1} of ${totalPages}` : 'No Results'}
                </span>
                <button
                    onClick={() => setCurrentPageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPageIndex >= totalPages - 1}
                    className="px-4 py-1.5 bg-slate-700/60 border border-slate-600 rounded-md text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next &rarr;
                </button>
            </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {currentPage ? (
                <div className="bg-slate-900/70 p-4 sm:p-6 rounded-lg border border-[var(--surface-border)]">
                    <h2 className="text-sm font-bold text-slate-400 mb-4 pb-2 border-b border-slate-700">MANUAL PAGE {currentPage.pageNum}</h2>
                    <PageContent content={currentPage.content} query={searchQuery} />
                </div>
            ) : (
                <div className="text-center text-slate-500 p-8">
                    <p>No matching pages found for "{searchQuery}".</p>
                    <p className="text-sm mt-2">Try clearing the search or using a different term.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};
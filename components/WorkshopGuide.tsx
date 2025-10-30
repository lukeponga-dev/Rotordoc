import React, { useState, useMemo } from 'react';
import { TROUBLESHOOTING_DATA } from '../data/troubleshootingData';
import { CloseIcon, BookOpenIcon, ListIcon } from './Icons';

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

// Interface for Table of Contents entries
interface TocEntry {
  title: string;
  pageIndex: number; // The index in the `pages` array
}

// Component to render formatted page content with highlighting
const PageContent: React.FC<{ content: string; query: string }> = ({ content, query }) => {
  const formattedContent = useMemo(() => {
    // Escape special characters in the query for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let highlightedContent = content;
    
    if (query.trim()) {
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      highlightedContent = highlightedContent.replace(regex, `<mark class="bg-amber-400 text-black px-0.5 rounded-sm">$1</mark>`);
    }
    return { __html: highlightedContent };
  }, [content, query]);

  return <pre dangerouslySetInnerHTML={formattedContent} className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed selection:bg-[var(--accent-primary)] selection:text-black" />;
};

export const WorkshopGuide: React.FC<WorkshopGuideProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'pages' | 'toc'>('pages');

  // Generate Table of Contents from pages
  const tableOfContents = useMemo<TocEntry[]>(() => {
    const entries: TocEntry[] = [];
    const headingRegex = /^(?![=\s]*$)([A-Z][A-Z\s/()-]{4,})$/gm; // Regex for all-caps headings

    pages.forEach((page, index) => {
      const matches = page.content.match(headingRegex);
      if (matches) {
        matches.forEach(match => {
          const title = match.trim();
          if (title.length > 5 && !entries.some(e => e.title === title)) {
            entries.push({ title, pageIndex: index });
          }
        });
      }
    });
    return entries;
  }, []);

  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    return pages.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  // Filter ToC based on search query
  const filteredToc = useMemo(() => {
    if (!searchQuery) return tableOfContents;
    return tableOfContents.filter(entry =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tableOfContents, searchQuery]);

  // When the user types in search, reset the page index to the first result
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPageIndex(0);
  };

  // When user clicks a ToC item, navigate to that page
  const navigateToPage = (pageIndex: number) => {
    // The page index from ToC corresponds to the unfiltered `pages` array
    setCurrentPageIndex(pageIndex);
    setViewMode('pages');
  };

  const currentPage = filteredPages[currentPageIndex];
  const totalPages = filteredPages.length;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex flex-col max-w-4xl w-full mx-auto h-full bg-[var(--surface-1)]/80 backdrop-blur-md sm:rounded-lg border-x-0 sm:border-x border-y border-[var(--surface-border)] shadow-2xl shadow-black/40">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--surface-border)] shadow-md shrink-0">
          <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(prev => prev === 'pages' ? 'toc' : 'pages')}
                className="p-2 bg-slate-800/70 border border-[var(--surface-border)] rounded-md text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-colors"
                title={viewMode === 'pages' ? "Show Table of Contents" : "Show Pages"}
                aria-label={viewMode === 'pages' ? "Show Table of Contents" : "Show Pages"}
              >
                  {viewMode === 'pages' ? <ListIcon className="w-5 h-5 text-[var(--accent-secondary)]" /> : <BookOpenIcon className="w-5 h-5 text-[var(--accent-secondary)]"/>}
              </button>
              <h1 className="text-lg sm:text-xl font-bold font-display text-slate-200 tracking-wide">
                {viewMode === 'pages' ? "Workshop Manual" : "Table of Contents"}
              </h1>
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
                onChange={handleSearchChange}
                placeholder={viewMode === 'pages' ? "Search manual..." : "Search sections..."}
                className="w-full sm:w-1/2 bg-slate-800/80 rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            {viewMode === 'pages' && (
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
            )}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {viewMode === 'pages' ? (
                currentPage ? (
                    <div className="bg-slate-900/70 p-4 sm:p-6 rounded-lg border border-[var(--surface-border)]">
                        <h2 className="text-sm font-bold text-slate-400 mb-4 pb-2 border-b border-slate-700">MANUAL PAGE {currentPage.pageNum}</h2>
                        <PageContent content={currentPage.content} query={searchQuery} />
                    </div>
                ) : (
                    <div className="text-center text-slate-500 p-8">
                        <p>No matching pages found for "{searchQuery}".</p>
                        <p className="text-sm mt-2">Try clearing the search or using a different term.</p>
                    </div>
                )
            ) : (
                <div className="bg-slate-900/70 p-4 sm:p-6 rounded-lg border border-[var(--surface-border)]">
                     <ul className="space-y-1">
                        {filteredToc.map((entry, index) => (
                            <li key={`${entry.title}-${index}`}>
                                <button
                                    onClick={() => navigateToPage(entry.pageIndex)}
                                    className="w-full text-left p-2.5 rounded-md text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors flex justify-between items-center group"
                                >
                                    <span className="group-hover:text-[var(--accent-secondary)] transition-colors" dangerouslySetInnerHTML={{ __html: entry.title.replace(new RegExp(`(${searchQuery})`, 'gi'), `<mark class="bg-amber-400 text-black px-0.5 rounded-sm">$1</mark>`)}}></span>
                                    <span className="text-xs text-slate-500 font-mono shrink-0 ml-4">
                                        Page {pages[entry.pageIndex].pageNum}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {filteredToc.length === 0 && (
                        <div className="text-center text-slate-500 p-8">
                            <p>No sections match your search for "{searchQuery}".</p>
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

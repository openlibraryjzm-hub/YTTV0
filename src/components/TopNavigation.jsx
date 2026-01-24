import React, { useState, useRef } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { usePaginationStore } from '../store/paginationStore';
import { ChevronLeft, Heart, Pin, Settings, Clock, Cat } from 'lucide-react';
import { THEMES } from '../utils/themes';

const TopNavigation = () => {
    const { currentPage: currentNavPage, setCurrentPage: setCurrentNavPage, history, goBack } = useNavigationStore();
    const { viewMode, setViewMode, inspectMode } = useLayoutStore();
    const { previewPlaylistId, clearPreview } = usePlaylistStore();
    const {
        currentPage: paginationPage,
        totalPages,
        setCurrentPagePreserveScroll: setPaginationPage, // Use preserve scroll version
        nextPagePreserve: nextPage,
        prevPagePreserve: prevPage,
        nextQuarterPreserve: nextQuarter,
        prevQuarterPreserve: prevQuarter,
        firstPagePreserve: firstPage,
        lastPagePreserve: lastPage,
    } = usePaginationStore();
    
    // Local state for page editing (separate from VideosPage to avoid interference)
    const [isEditingPageLocal, setIsEditingPageLocal] = useState(false);
    const [pageInputValueLocal, setPageInputValueLocal] = useState('');
    
    const [currentThemeId] = useState('blue'); // Defaulting to blue theme for consistency, could be lifted to store if fully dynamic theming is required here
    const pageInputRef = useRef(null);

    const theme = THEMES[currentThemeId];

    // Helper to get inspect label
    const getInspectTitle = (label) => inspectMode ? label : undefined;

    const tabs = [
        { id: 'playlists', label: 'Playlists' },
        { id: 'videos', label: 'Videos' },
        { id: 'history', label: 'History', icon: <Clock size={16} /> },
        { id: 'likes', label: 'Likes', icon: <Heart size={16} /> },
        { id: 'pins', label: 'Pins', icon: <Pin size={16} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
        { id: 'support', label: 'Support', icon: <Cat size={16} /> },
    ];

    const handleTabClick = (tabId) => {
        setCurrentNavPage(tabId);
        // Auto-switch to half mode when clicking tabs if in full mode
        const isNavigationTab = ['playlists', 'videos', 'history', 'likes', 'pins', 'settings', 'support'].includes(tabId);
        if (isNavigationTab && viewMode === 'full') {
            setViewMode('half');
        }
    };
    
    // Combined handler: single click, double click, and long press for pagination
    const LONG_CLICK_MS = 600;
    const DOUBLE_CLICK_MS = 300;
    let longClickTimer = null;
    let singleClickTimer = null;
    let didLongClick = false;
    let lastClickTime = 0;
    
    const createCombinedHandlers = (singleAction, doubleAction, longAction) => ({
        onMouseDown: () => {
            didLongClick = false;
            longClickTimer = setTimeout(() => {
                didLongClick = true;
                clearTimeout(singleClickTimer);
                longAction();
            }, LONG_CLICK_MS);
        },
        onMouseUp: () => {
            clearTimeout(longClickTimer);
            if (didLongClick) return;
            
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;
            
            if (timeSinceLastClick < DOUBLE_CLICK_MS) {
                // Double click detected
                clearTimeout(singleClickTimer);
                lastClickTime = 0;
                doubleAction();
            } else {
                // Potential single click - wait to see if double click comes
                lastClickTime = now;
                singleClickTimer = setTimeout(() => {
                    singleAction();
                    lastClickTime = 0;
                }, DOUBLE_CLICK_MS);
            }
        },
        onMouseLeave: () => {
            clearTimeout(longClickTimer);
        },
    });
    
    const prevHandlers = createCombinedHandlers(prevPage, prevQuarter, firstPage);
    const nextHandlers = createCombinedHandlers(nextPage, nextQuarter, lastPage);

    return (
        <div className={`w-full flex-col gap-2 rounded-xl backdrop-blur-md shadow-lg border p-2 mb-2 transition-all duration-300 ${theme.menuBg} ${theme.menuBorder}`}>
            {/* Tabs row */}
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => {
                        const isIconOnly = ['history', 'likes', 'pins', 'settings', 'support'].includes(tab.id);
                        const isActive = currentNavPage === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 ${isActive
                                    ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                    : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                    } ${isIconOnly ? 'w-9 h-9 p-0' : 'px-4 h-9 gap-1.5'}`}
                                title={getInspectTitle(`${tab.label} tab`) || tab.label}
                            >
                                {tab.icon && <span className={isActive ? 'opacity-100' : 'opacity-80'}>{tab.icon}</span>}
                                {!isIconOnly && <span className="font-bold text-xs uppercase tracking-wide">{tab.label}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2 pl-2 border-l border-sky-300/30">
                    {/* Compact Pagination - Only show on videos page when there are multiple pages */}
                    {currentNavPage === 'videos' && totalPages > 1 && (
                        <div className="flex items-center gap-0.5">
                            {/* Previous: click=prev, double-click=quarter, hold=first */}
                            <button
                                {...prevHandlers}
                                disabled={paginationPage === 1}
                                className="w-6 h-6 flex items-center justify-center bg-white border-2 border-slate-300 text-slate-600 rounded-full hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold select-none"
                                title="Click: prev | Double: quarter | Hold: first"
                            >
                                &lt;
                            </button>
                            
                            {/* Page Indicator - Clickable (uses local state to avoid affecting VideosPage) */}
                            {isEditingPageLocal ? (
                                <input
                                    ref={pageInputRef}
                                    type="text"
                                    value={pageInputValueLocal}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setPageInputValueLocal(val);
                                    }}
                                    onBlur={() => {
                                        const page = parseInt(pageInputValueLocal);
                                        if (page >= 1 && page <= totalPages) {
                                            setPaginationPage(page);
                                        }
                                        setIsEditingPageLocal(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const page = parseInt(pageInputValueLocal);
                                            if (page >= 1 && page <= totalPages) {
                                                setPaginationPage(page);
                                            }
                                            setIsEditingPageLocal(false);
                                        } else if (e.key === 'Escape') {
                                            setIsEditingPageLocal(false);
                                        }
                                    }}
                                    className="w-10 h-6 px-1 bg-white border-2 border-sky-500 rounded text-center text-sky-600 font-bold text-xs focus:outline-none"
                                    autoFocus
                                />
                            ) : (
                                <button
                                    onClick={() => {
                                        setPageInputValueLocal(String(paginationPage));
                                        setIsEditingPageLocal(true);
                                        setTimeout(() => pageInputRef.current?.select(), 0);
                                    }}
                                    className="px-1.5 h-6 bg-white border-2 border-slate-300 text-slate-700 rounded-full hover:border-sky-400 hover:text-sky-600 transition-all text-xs font-bold"
                                    title="Click to jump to page"
                                >
                                    {paginationPage}/{totalPages}
                                </button>
                            )}
                            
                            {/* Next: click=next, double-click=quarter, hold=last */}
                            <button
                                {...nextHandlers}
                                disabled={paginationPage >= totalPages}
                                className="w-6 h-6 flex items-center justify-center bg-white border-2 border-slate-300 text-slate-600 rounded-full hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold select-none"
                                title="Click: next | Double: quarter | Hold: last"
                            >
                                &gt;
                            </button>
                        </div>
                    )}

                    {/* Back Button */}
                    {(history.length > 0 || previewPlaylistId) && (
                        <button
                            onClick={() => {
                                if (previewPlaylistId) {
                                    clearPreview();
                                }
                                if (history.length > 0) {
                                    goBack();
                                } else if (previewPlaylistId) {
                                    // Fallback if previewing but no history (e.g. direct load)
                                    setCurrentNavPage('playlists');
                                }
                            }}
                            className={`flex items-center justify-center w-7 h-7 rounded-full shadow-sm border transition-all hover:scale-105 active:scale-90 ${theme.tabInactive}`}
                            title={getInspectTitle('Go Back') || 'Go Back'}
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}

                    {/* Close Side Menu Button */}
                    <button
                        onClick={() => setViewMode('full')}
                        className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md border border-rose-400 active:scale-90"
                        title={getInspectTitle('Close menu (Full screen)') || 'Close menu (Full screen)'}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default TopNavigation;

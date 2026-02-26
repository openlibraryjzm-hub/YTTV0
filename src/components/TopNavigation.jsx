import React, { useState } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';
import { ChevronLeft, Twitter, Info, LayoutGrid, LayoutList, Minus } from 'lucide-react';
import { THEMES } from '../utils/themes';
import { FOLDER_COLORS } from '../utils/folderColors';
import TabBar from './TabBar';
import { useTabStore } from '../store/tabStore';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';

const TopNavigation = () => {
    const { currentPage, history, goBack, setCurrentPage } = useNavigationStore();
    const { setViewMode, inspectMode, videoCardStyle, toggleVideoCardStyle, playlistsPageShowTitles, setPlaylistsPageShowTitles, setShowPlaylistUploader } = useLayoutStore();
    const setAllGroupCarouselModes = usePlaylistGroupStore((s) => s.setAllGroupCarouselModes);
    const { activeTabId } = useTabStore();
    // Consume previewPlaylistId to support "visiting" context vs "playing" context
    const { previewPlaylistId, clearPreview, currentPlaylistId, currentPlaylistTitle, allPlaylists } = usePlaylistStore();
    // Consume selectedFolder and showColoredFolders from folderStore
    const { selectedFolder, showColoredFolders, setShowColoredFolders } = useFolderStore();

    const [currentThemeId] = useState('blue'); // Defaulting to blue theme for consistency
    const theme = THEMES[currentThemeId];

    // Helper to get inspect label
    const getInspectTitle = (label) => inspectMode ? label : undefined;

    // Determine Active Context (Preview takes precedence for "Visiting" state)
    // If previewPlaylistId is set, we are "visiting" that playlist.
    // If not, we fall back to currentPlaylistId (the one currently loaded/playing).
    const activePlaylistId = previewPlaylistId || currentPlaylistId;
    const activePlaylist = allPlaylists.find(p => p.id === activePlaylistId);

    // On Playlists page, show "Playlists" and bar controls in header; otherwise use playlist/folder context
    const isPlaylistsPage = currentPage === 'playlists';

    // Determine display content
    // Use currentPlaylistTitle only if we are in the "current" context (no preview)
    let displayTitle = isPlaylistsPage
        ? 'Playlists'
        : ((activePlaylistId === currentPlaylistId ? currentPlaylistTitle : null)
            || (activePlaylist ? activePlaylist.name : 'Select a Playlist'));

    let displayDescription = isPlaylistsPage ? '' : (activePlaylist ? activePlaylist.description : '');
    let bannerHex = '#ffffff'; // Default to white if no color found
    let hasActiveContext = isPlaylistsPage || !!activePlaylist || !!activePlaylistId;

    // Determine color/folder context based on selectedFolder (UI State)
    if (selectedFolder) {
        if (selectedFolder === 'unsorted') {
            displayTitle = `${displayTitle} - Unsorted`;
            bannerHex = '#64748b'; // Slate-500
            hasActiveContext = true;
        } else {
            const color = FOLDER_COLORS.find(c => c.id === selectedFolder);
            if (color) {
                // Append folder name to title: "Playlist - FolderName"
                // Note: Does not currently support custom folder names from metadata (needs metadata store)
                displayTitle = `${displayTitle} - ${color.name}`;
                bannerHex = color.hex;
                hasActiveContext = true;
            }
        }
    } else if (activePlaylist) {
        // Use a default color for playlist
        bannerHex = '#3b82f6'; // Default Blue
    }

    // Dynamic styles matching VideosPage Mini Header
    const containerStyle = hasActiveContext ? {
        background: `linear-gradient(to bottom, transparent, ${bannerHex}30)`,
    } : {};

    const titleStyle = hasActiveContext ? {
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        color: bannerHex
    } : { color: '#ffffff' };

    return (
        <div
            className={`w-full flex items-end justify-between pb-4 transition-all duration-300 min-h-[100px] ${!hasActiveContext ? `${theme.menuBg} ${theme.menuBorder} backdrop-blur-md border rounded-xl px-8` : ''}`}
            style={containerStyle}
        >
            {/* Left side: Override-for-all carousel mode (GROUPS) / Videos actions (Add, Subscriptions, Bulk tag) + Playlist/Folder Info */}
            <div className="flex flex-col justify-end min-w-0 flex-1 pl-8">
                {isPlaylistsPage && activeTabId === 'groups' && (
                    <div className="flex items-center gap-1 mb-2">
                        <button
                            type="button"
                            onClick={() => setAllGroupCarouselModes('large')}
                            className="p-1.5 rounded-md transition-all shrink-0 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10"
                            title="Apply large to all carousels"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAllGroupCarouselModes('small')}
                            className="p-1.5 rounded-md transition-all shrink-0 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10"
                            title="Apply small to all carousels"
                        >
                            <LayoutList size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAllGroupCarouselModes('bar')}
                            className="p-1.5 rounded-md transition-all shrink-0 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10"
                            title="Apply bar to all carousels"
                        >
                            <Minus size={16} />
                        </button>
                    </div>
                )}
                <h1
                    className={`text-3xl font-bold tracking-tight truncate`}
                    style={titleStyle}
                >
                    {displayTitle}
                </h1>
                {displayDescription && (
                    <p className="text-white/50 text-xs mt-0.5 font-medium line-clamp-1 max-w-2xl">
                        {displayDescription}
                    </p>
                )}
            </div>

            {/* Right side actions: on Playlists page = TabBar + Info/Folder/Add; else = Twitter/Back/Close */}
            <div className="flex items-center gap-2 pl-4 pr-8 mb-1 shrink-0 min-w-0">
                {isPlaylistsPage ? (
                    <>
                        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar max-w-[280px]">
                            <TabBar />
                        </div>
                        <button
                            onClick={() => setPlaylistsPageShowTitles()}
                            className={`p-1.5 rounded-md transition-all shrink-0 ${playlistsPageShowTitles
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10'
                            }`}
                            title={playlistsPageShowTitles ? 'Hide All Video Titles' : 'Show All Video Titles'}
                        >
                            <Info size={16} />
                        </button>
                        <button
                            onClick={() => setShowColoredFolders(!showColoredFolders)}
                            className={`p-1.5 rounded-md transition-all shrink-0 ${showColoredFolders
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10'
                            }`}
                            title={showColoredFolders ? 'Hide Folders' : 'Show Folders'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setShowPlaylistUploader(true)}
                            className="p-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-md transition-all shadow-lg hover:shadow-sky-500/25 border border-white/10 shrink-0"
                            title="Add Playlist"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        {/* Back and Close (same as other pages) */}
                        {(history.length > 0 || previewPlaylistId) && (
                            <button
                                onClick={() => {
                                    if (previewPlaylistId) clearPreview();
                                    if (history.length > 0) goBack();
                                    else if (previewPlaylistId) setCurrentPage('playlists');
                                }}
                                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm border transition-all hover:scale-105 active:scale-90 ${theme.tabInactive}`}
                                title={getInspectTitle('Go Back') || 'Go Back'}
                            >
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => setViewMode('full')}
                            className="flex items-center justify-center w-8 h-8 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md border border-rose-400 active:scale-90"
                            title={getInspectTitle('Close menu (Full screen)') || 'Close menu (Full screen)'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <>
                {/* Twitter/X Style Toggle (Videos page and other non-Playlists pages) */}
                <button
                    onClick={toggleVideoCardStyle}
                    className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm border transition-all hover:scale-105 active:scale-90 ${videoCardStyle === 'twitter'
                        ? 'bg-sky-500 text-white border-sky-400'
                        : 'bg-white border-slate-400 text-slate-600 hover:bg-slate-50'
                        }`}
                    title={getInspectTitle(`Toggle ${videoCardStyle === 'twitter' ? 'YouTube' : 'Twitter/X'} Style`) || `Toggle ${videoCardStyle === 'twitter' ? 'YouTube' : 'Twitter/X'} Style`}
                >
                    <Twitter size={15} />
                </button>
                    </>
                )}
            </div>
        </div >
    );
};

export default TopNavigation;

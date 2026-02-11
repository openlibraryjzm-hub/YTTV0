import React, { useState } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';
import { ChevronLeft, Twitter } from 'lucide-react';
import { THEMES } from '../utils/themes';
import { FOLDER_COLORS } from '../utils/folderColors';

const TopNavigation = () => {
    const { history, goBack, setCurrentPage } = useNavigationStore();
    const { setViewMode, inspectMode, videoCardStyle, toggleVideoCardStyle } = useLayoutStore();
    // Consume previewPlaylistId to support "visiting" context vs "playing" context
    const { previewPlaylistId, clearPreview, currentPlaylistId, currentPlaylistTitle, allPlaylists } = usePlaylistStore();
    // Consume selectedFolder from folderStore as it controls the UI filter state
    const { selectedFolder } = useFolderStore();

    const [currentThemeId] = useState('blue'); // Defaulting to blue theme for consistency
    const theme = THEMES[currentThemeId];

    // Helper to get inspect label
    const getInspectTitle = (label) => inspectMode ? label : undefined;

    // Determine Active Context (Preview takes precedence for "Visiting" state)
    // If previewPlaylistId is set, we are "visiting" that playlist.
    // If not, we fall back to currentPlaylistId (the one currently loaded/playing).
    const activePlaylistId = previewPlaylistId || currentPlaylistId;
    const activePlaylist = allPlaylists.find(p => p.id === activePlaylistId);

    // Determine display content
    // Use currentPlaylistTitle only if we are in the "current" context (no preview)
    let displayTitle = (activePlaylistId === currentPlaylistId ? currentPlaylistTitle : null)
        || (activePlaylist ? activePlaylist.name : 'Select a Playlist');

    let displayDescription = activePlaylist ? activePlaylist.description : '';
    let bannerHex = '#ffffff'; // Default to white if no color found
    let hasActiveContext = !!activePlaylist || !!activePlaylistId;

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
            className={`w-full flex items-end justify-between px-8 pb-4 transition-all duration-300 min-h-[100px] ${!hasActiveContext ? `${theme.menuBg} ${theme.menuBorder} backdrop-blur-md border rounded-xl` : ''}`}
            style={containerStyle}
        >
            {/* Left side: Playlist/Folder Info */}
            <div className="flex flex-col justify-end min-w-0 flex-1">
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

            {/* Right side actions */}
            <div className="flex items-center gap-2 pl-4 mb-1 shrink-0">
                {/* Twitter/X Style Toggle */}
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
                                setCurrentPage('playlists');
                            }
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm border transition-all hover:scale-105 active:scale-90 ${theme.tabInactive}`}
                        title={getInspectTitle('Go Back') || 'Go Back'}
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}

                {/* Close Side Menu Button */}
                <button
                    onClick={() => setViewMode('full')}
                    className="flex items-center justify-center w-8 h-8 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md border border-rose-400 active:scale-90"
                    title={getInspectTitle('Close menu (Full screen)') || 'Close menu (Full screen)'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div >
    );
};

export default TopNavigation;

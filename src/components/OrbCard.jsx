import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';

const OrbCard = ({ orb, allPlaylists, onUpdatePlaylists, minimal = false, onClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePlaylist = (playlistId) => {
        const currentIds = orb.playlistIds || [];
        const newIds = currentIds.includes(playlistId)
            ? currentIds.filter(id => id !== playlistId)
            : [...currentIds, playlistId];
        onUpdatePlaylists(orb.id, newIds);
    };

    const uniqueId = `orb-card-${orb.id}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate active playlist names for display
    const activePlaylistNames = useMemo(() => {
        if (!orb.playlistIds || orb.playlistIds.length === 0) return "No Playlists";
        return allPlaylists
            .filter(p => orb.playlistIds.includes(p.id))
            .map(p => p.name)
            .join(", ");
    }, [orb.playlistIds, allPlaylists]);

    // --- Minimal Mode Render ---
    if (minimal) {
        return (
            <div
                className="group relative w-full h-full flex flex-col items-center justify-center cursor-pointer"
                onClick={onClick}
            >
                {/* Floating Playlist Button (Visible on Hover) */}
                <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className={`p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20`}
                            title="Assign Playlists"
                        >
                            {orb.playlistIds?.length > 0 ? <Check size={14} /> : <Plus size={14} />}
                        </button>

                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden text-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                    <span className="font-bold text-xs uppercase text-slate-500 pl-2">Assign to Playlists</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-1">
                                    {allPlaylists.map(playlist => {
                                        const isSelected = orb.playlistIds?.includes(playlist.id);
                                        return (
                                            <button
                                                key={playlist.id}
                                                onClick={() => togglePlaylist(playlist.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${isSelected
                                                    ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                <span className="truncate">{playlist.name}</span>
                                                {isSelected && <Check size={14} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Orb Image (Scaled up slightly for minimal view?) */}
                {/* Using duplicate structure but without bg/padding/border */}
                <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                    <div className="relative w-40 h-40 transition-transform duration-300 group-hover:scale-105">
                        {orb.customOrbImage ? (
                            <>
                                <img
                                    src={orb.customOrbImage}
                                    className="absolute inset-0 w-full h-full object-cover origin-center"
                                    style={{
                                        transform: `scale(${orb.orbImageScale}) translate(${orb.orbImageXOffset * 0.3}px, ${orb.orbImageYOffset * 0.3}px)`,
                                        clipPath: `url(#${uniqueId})`
                                    }}
                                    alt={orb.name}
                                />
                                <svg width="0" height="0" className="absolute">
                                    <defs>
                                        <clipPath id={uniqueId} clipPathUnits="objectBoundingBox">
                                            <circle cx="0.5" cy="0.5" r="0.35" />
                                            {/* Advanced Masks Logic matching OrbPage */}
                                            {orb.orbSpill?.tl && (
                                                orb.orbAdvancedMasks?.tl
                                                    ? <rect x={orb.orbMaskRects.tl.x / 100} y={orb.orbMaskRects.tl.y / 100} width={orb.orbMaskRects.tl.w / 100} height={orb.orbMaskRects.tl.h / 100} />
                                                    : <rect x="-50" y="-50" width="50.5" height="50.5" />
                                            )}
                                            {orb.orbSpill?.tr && (
                                                orb.orbAdvancedMasks?.tr
                                                    ? <rect x={orb.orbMaskRects.tr.x / 100} y={orb.orbMaskRects.tr.y / 100} width={orb.orbMaskRects.tr.w / 100} height={orb.orbMaskRects.tr.h / 100} />
                                                    : <rect x="0.5" y="-50" width="50.5" height="50.5" />
                                            )}
                                            {orb.orbSpill?.bl && (
                                                orb.orbAdvancedMasks?.bl
                                                    ? <rect x={orb.orbMaskRects.bl.x / 100} y={orb.orbMaskRects.bl.y / 100} width={orb.orbMaskRects.bl.w / 100} height={orb.orbMaskRects.bl.h / 100} />
                                                    : <rect x="-50" y="0.5" width="50.5" height="50.5" />
                                            )}
                                            {orb.orbSpill?.br && (
                                                orb.orbAdvancedMasks?.br
                                                    ? <rect x={orb.orbMaskRects.br.x / 100} y={orb.orbMaskRects.br.y / 100} width={orb.orbMaskRects.br.w / 100} height={orb.orbMaskRects.br.h / 100} />
                                                    : <rect x="0.5" y="0.5" width="50.5" height="50.5" />
                                            )}
                                        </clipPath>
                                    </defs>
                                </svg>
                            </>
                        ) : (
                            <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-xs text-slate-400 font-medium">No Image</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- Standard Card Render ---
    return (
        <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-visible flex flex-col h-full">
            {/* Header / Title */}
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{orb.name}</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]" title={activePlaylistNames}>
                        {activePlaylistNames}
                    </p>
                </div>

                {/* Playlist Dropdown */}
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`p-2 rounded-full transition-colors ${isMenuOpen
                            ? 'bg-sky-500 text-white'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                    >
                        {orb.playlistIds?.length > 0 ? <Check size={16} /> : <Plus size={16} />}
                    </button>

                    {isMenuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden text-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                <span className="font-bold text-xs uppercase text-slate-500 pl-2">Assign to Playlists</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-1">
                                {allPlaylists.map(playlist => {
                                    const isSelected = orb.playlistIds?.includes(playlist.id);
                                    return (
                                        <button
                                            key={playlist.id}
                                            onClick={() => togglePlaylist(playlist.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${isSelected
                                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                                : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            <span className="truncate">{playlist.name}</span>
                                            {isSelected && <Check size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Orb Preview Content */}
            <div className="p-6 flex items-center justify-center bg-slate-50/50 dark:bg-black/20 flex-1 min-h-[200px] rounded-b-2xl relative overflow-hidden">
                <div className="relative w-32 h-32">
                    {orb.customOrbImage ? (
                        <>
                            <img
                                src={orb.customOrbImage}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 origin-center"
                                style={{
                                    transform: `scale(${orb.orbImageScale}) translate(${orb.orbImageXOffset * 0.3}px, ${orb.orbImageYOffset * 0.3}px)`,
                                    clipPath: `url(#${uniqueId})`
                                }}
                                alt={orb.name}
                            />
                            {/* SVG Definitions for this specific card */}
                            <svg width="0" height="0" className="absolute">
                                <defs>
                                    <clipPath id={uniqueId} clipPathUnits="objectBoundingBox">
                                        <circle cx="0.5" cy="0.5" r="0.35" />

                                        {/* Advanced Masks Logic matching OrbPage */}
                                        {orb.orbSpill?.tl && (
                                            orb.orbAdvancedMasks?.tl
                                                ? <rect x={orb.orbMaskRects.tl.x / 100} y={orb.orbMaskRects.tl.y / 100} width={orb.orbMaskRects.tl.w / 100} height={orb.orbMaskRects.tl.h / 100} />
                                                : <rect x="-50" y="-50" width="50.5" height="50.5" />
                                        )}
                                        {orb.orbSpill?.tr && (
                                            orb.orbAdvancedMasks?.tr
                                                ? <rect x={orb.orbMaskRects.tr.x / 100} y={orb.orbMaskRects.tr.y / 100} width={orb.orbMaskRects.tr.w / 100} height={orb.orbMaskRects.tr.h / 100} />
                                                : <rect x="0.5" y="-50" width="50.5" height="50.5" />
                                        )}
                                        {orb.orbSpill?.bl && (
                                            orb.orbAdvancedMasks?.bl
                                                ? <rect x={orb.orbMaskRects.bl.x / 100} y={orb.orbMaskRects.bl.y / 100} width={orb.orbMaskRects.bl.w / 100} height={orb.orbMaskRects.bl.h / 100} />
                                                : <rect x="-50" y="0.5" width="50.5" height="50.5" />
                                        )}
                                        {orb.orbSpill?.br && (
                                            orb.orbAdvancedMasks?.br
                                                ? <rect x={orb.orbMaskRects.br.x / 100} y={orb.orbMaskRects.br.y / 100} width={orb.orbMaskRects.br.w / 100} height={orb.orbMaskRects.br.h / 100} />
                                                : <rect x="0.5" y="0.5" width="50.5" height="50.5" />
                                        )}
                                    </clipPath>
                                </defs>
                            </svg>
                        </>
                    ) : (
                        <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-xs text-slate-400">No Image</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrbCard;

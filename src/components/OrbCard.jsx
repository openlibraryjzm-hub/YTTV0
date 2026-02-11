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
                                            <circle cx="0.5" cy="0.5" r="0.5" />
                                            {/* Advanced Masks Logic matching OrbPage */}
                                            {['tl', 'tr', 'bl', 'br'].map(q => {
                                                if (!orb.orbSpill?.[q]) return null;

                                                const defaults = {
                                                    tl: { x: -0.5, y: -0.5, w: 1.0, h: 1.0 },
                                                    tr: { x: 0.5, y: -0.5, w: 0.5, h: 1.0 },
                                                    bl: { x: -0.5, y: 0.5, w: 1.0, h: 0.5 },
                                                    br: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
                                                };

                                                if (!orb.orbAdvancedMasks?.[q]) {
                                                    const d = defaults[q];
                                                    return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
                                                }

                                                const mode = orb.orbMaskModes?.[q] || 'rect';

                                                if (mode === 'path') {
                                                    const points = orb.orbMaskPaths?.[q] || [];
                                                    if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].w} height={defaults[q].h} />;
                                                    const pts = points.map(p => `${p.x / 100},${p.y / 100}`).join(' ');
                                                    return <polygon key={q} points={pts} />;
                                                } else {
                                                    const r = orb.orbMaskRects?.[q] || { x: 0, y: 0, w: 50, h: 50 };
                                                    return <rect key={q} x={r.x / 100} y={r.y / 100} width={r.w / 100} height={r.h / 100} />;
                                                }
                                            })}
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
            </div >
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
                                        <circle cx="0.5" cy="0.5" r="0.5" />

                                        {/* Advanced Masks Logic matching OrbPage */}
                                        {['tl', 'tr', 'bl', 'br'].map(q => {
                                            if (!orb.orbSpill?.[q]) return null;

                                            const defaults = {
                                                tl: { x: -0.5, y: -0.5, w: 1.0, h: 1.0 },
                                                tr: { x: 0.5, y: -0.5, w: 0.5, h: 1.0 },
                                                bl: { x: -0.5, y: 0.5, w: 1.0, h: 0.5 },
                                                br: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
                                            };

                                            if (!orb.orbAdvancedMasks?.[q]) {
                                                const d = defaults[q];
                                                return <rect key={q} x={d.x} y={d.y} width={d.w} height={d.h} />;
                                            }

                                            const mode = orb.orbMaskModes?.[q] || 'rect';

                                            if (mode === 'path') {
                                                const points = orb.orbMaskPaths?.[q] || [];
                                                if (points.length < 3) return <rect key={q} x={defaults[q].x} y={defaults[q].y} width={defaults[q].w} height={defaults[q].h} />;
                                                const pts = points.map(p => `${p.x / 100},${p.y / 100}`).join(' ');
                                                return <polygon key={q} points={pts} />;
                                            } else {
                                                const r = orb.orbMaskRects?.[q] || { x: 0, y: 0, w: 50, h: 50 };
                                                return <rect key={q} x={r.x / 100} y={r.y / 100} width={r.w / 100} height={r.h / 100} />;
                                            }
                                        })}
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

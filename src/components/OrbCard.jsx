import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Check, Trash2, Image as ImageIcon } from 'lucide-react';

const OrbCard = ({ orb, allPlaylists, onUpdatePlaylists, minimal = false, onClick, currentPlaylistId }) => {
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

    const handleRemoveFromCurrentPlaylist = (e) => {
        e.stopPropagation();
        if (!currentPlaylistId || !onUpdatePlaylists) return;

        if (window.confirm(`Remove "${orb.name}" from this playlist?`)) {
            const currentIds = orb.playlistIds || [];
            // Filter out current playlist ID (handle string/number mismatch)
            const newIds = currentIds.filter(id => String(id) !== String(currentPlaylistId));
            onUpdatePlaylists(orb.id, newIds);
        }
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


    // --- Standard Card Render ---
    const visualizerBars = 113;

    // Calculate SVG path once for all bars to reduce DOM node count by 113x
    const visualizerPath = useMemo(() => {
        let d = "";
        for (let i = 0; i < visualizerBars; i++) {
            const angle = (i / visualizerBars) * Math.PI * 2;
            // Center is (100, 100). Inner point relative radius 80, outer 86.
            // Rotated starting from top (-90 degrees inherently if mapped this way)
            const x1 = 100 + 80 * Math.sin(angle);
            const y1 = 100 - 80 * Math.cos(angle);
            const x2 = 100 + 86 * Math.sin(angle);
            const y2 = 100 - 86 * Math.cos(angle);
            d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} `;
        }
        return d;
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div
                className={`group relative aspect-square w-[75%] max-w-[200px] mx-auto rounded-full overflow-visible transition-all flex items-center justify-center cursor-pointer`}
                onClick={onClick}
            >
                {/* Dormant Visualizer Border */}
                <svg viewBox="0 0 200 200" className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transform -rotate-[90deg] z-0">
                    <path
                        d={visualizerPath}
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        className="text-black dark:text-white/80 opacity-80 group-hover:opacity-100 group-hover:dark:text-white transition-all duration-300 drop-shadow-sm"
                    />
                </svg>

                {/* Circular mask for the background */}
                <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md group-hover:shadow-lg transition-shadow z-10">
                    {orb.customOrbImage ? (
                        <img
                            src={orb.customOrbImage}
                            alt={orb.name || "Orb Preset"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                        </div>
                    )}

                    {/* Overlay Gradient for Text/Actions on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center p-4">
                        <h3 className="font-bold text-white text-sm leading-tight truncate w-full mb-1 drop-shadow-md">
                            {orb.name || "Untitled Orb"}
                        </h3>
                        {activePlaylistNames !== "No Playlists" && (
                            <p className="text-[10px] text-white/80 truncate w-full mb-2 drop-shadow-md" title={activePlaylistNames}>
                                {activePlaylistNames}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions overlay container, set above the hidden layer to allow menu dropdown overflows */}
                <div className="absolute inset-x-0 bottom-[-10px] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center pb-2">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* Remove Button (Only if in a playlist context) */}
                        {currentPlaylistId && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromCurrentPlaylist(e);
                                }}
                                className="p-2 rounded-full transition-colors bg-red-500/80 hover:bg-red-600 text-white shadow-sm border border-black/10"
                                title="Remove from this playlist"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}

                        {/* Playlist Assignment Menu */}
                        <div className="relative flex justify-center">
                            <button
                                ref={buttonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className={`p-2 rounded-full transition-colors backdrop-blur-md shadow-sm border border-white/20 ${isMenuOpen
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-white/20 hover:bg-white/30 text-white'
                                    }`}
                                title="Assign to Playlists"
                            >
                                {orb.playlistIds?.length > 0 ? <Check size={14} /> : <Plus size={14} />}
                            </button>

                            {isMenuOpen && (
                                <div
                                    ref={menuRef}
                                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden text-sm text-left"
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePlaylist(playlist.id);
                                                    }}
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
                                        {allPlaylists.length === 0 && (
                                            <div className="px-3 py-4 text-center text-slate-400 italic text-xs">
                                                No playlists found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrbCard;

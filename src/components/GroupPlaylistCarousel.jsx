import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Layers, Pencil, Trash2 } from 'lucide-react';

/**
 * Group Playlist Carousel - Horizontal scrollable row of playlist cards.
 * Used on Playlists Page (GROUPS view). Bounded box, top bar (name + rename + delete), scrollbar near cards.
 * Card size matches ALL/UNSORTED grid (gap-10, same effective width).
 * Structure is inlined (no inner component) so re-renders do not remount the scroll container and reset scroll.
 */
const GroupPlaylistCarousel = ({ children, title = 'Featured playlists', groupId, onRename, onDelete }) => {
    const scrollContainerRef = useRef(null);
    const [showControls, setShowControls] = useState(false);

    const count = React.Children.count(children);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const topBar = (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-slate-800/60">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Layers className="w-4 h-4 text-sky-400 flex-shrink-0" aria-hidden />
                <h3 className="text-base font-semibold text-slate-100 truncate">{title}</h3>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
                {groupId != null && typeof onRename === 'function' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const newName = window.prompt('Rename carousel', title);
                            if (newName != null && newName.trim()) onRename(groupId, newName.trim());
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        title="Rename carousel"
                    >
                        <Pencil size={16} />
                    </button>
                )}
                {groupId != null && typeof onDelete === 'function' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const ok = window.confirm(
                                `Delete carousel "${title}"?\n\nPlaylists will be unassigned from this carousel but not removed from the app.`
                            );
                            if (ok) onDelete(groupId);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete carousel"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );

    const boxClassName = 'w-full mb-6 rounded-2xl border border-white/10 bg-slate-800/40 shadow-lg shadow-black/10 overflow-hidden';

    // Empty carousel
    if (count === 0) {
        return (
            <div className="px-4">
                <div
                    className={boxClassName}
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                >
                    {topBar}
                    <div className="min-h-[120px] flex items-center justify-center bg-slate-800/20">
                        <p className="text-sm text-slate-500">No playlists in this carousel</p>
                    </div>
                </div>
            </div>
        );
    }

    // 1+ items: always use horizontal scroll row (same large cards; 2 cards side-by-side, scrollable to reveal full 2nd)
    const cardWrapperClass = 'w-[min(520px,calc(50vw-2rem))] min-w-[380px] max-w-full flex-shrink-0';

    // Horizontal scroll with scrollbar and chevrons (used for 1, 2, 3+ items)
    return (
        <div className="px-4">
            <div
                className={boxClassName}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                {topBar}
                <div className="relative min-w-0">
                    <style>{`
                        .group-carousel-scroll::-webkit-scrollbar { height: 6px; }
                        .group-carousel-scroll::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.05);
                            border-radius: 3px;
                            margin: 0 12px;
                        }
                        .group-carousel-scroll::-webkit-scrollbar-thumb {
                            background: rgba(148, 163, 184, 0.4);
                            border-radius: 3px;
                        }
                        .group-carousel-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(148, 163, 184, 0.6);
                        }
                    `}</style>

                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-800/90 backdrop-blur-sm border border-white/10 shadow-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700/90 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="group-carousel-scroll flex gap-10 overflow-x-auto overflow-y-hidden pt-3 pb-2 px-1 min-w-0 overscroll-x-contain"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {React.Children.map(children, (child, index) => (
                            <div key={child?.key ?? `carousel-item-${index}`} className={cardWrapperClass}>
                                {child}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-800/90 backdrop-blur-sm border border-white/10 shadow-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-700/90 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupPlaylistCarousel;

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers, LayoutGrid, LayoutList, Minus, Pencil, Trash2 } from 'lucide-react';
import { usePlaylistGroupStore } from '../store/playlistGroupStore';

/**
 * Group Playlist Carousel - Horizontal scrollable row of playlist cards.
 * Used on Playlists Page (GROUPS view). Bounded box, top bar (name + mode buttons + rename + delete), scrollbar near cards.
 * Mode is per-carousel (playlistGroupStore.groupCarouselModes[groupId]). Top nav "apply to all" updates every group at once.
 * Modes: 'large', 'small' (~3 visible), 'bar' (thin bar, no thumbnails).
 * When effectiveSizeOverride is set (All vs colored-folder prism context), it overrides stored mode for layout: 'small' on All page, 'large' when viewing a single colored folder.
 */
const GroupPlaylistCarousel = ({ children, title = 'Featured playlists', groupId, onRename, onDelete, mode: modeProp, effectiveSizeOverride }) => {
    const scrollContainerRef = useRef(null);

    const storedMode = usePlaylistGroupStore((s) => (groupId != null ? s.groupCarouselModes?.[groupId] ?? 'large' : 'large'));
    const setGroupCarouselMode = usePlaylistGroupStore((s) => s.setGroupCarouselMode);
    let mode = groupId != null ? storedMode : (modeProp ?? 'large');
    if (effectiveSizeOverride === 'large' || effectiveSizeOverride === 'small') {
        mode = effectiveSizeOverride;
    }

    const count = React.Children.count(children);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const isBar = mode === 'bar';
            const scrollAmount = isBar ? 120 : scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const isBarMode = mode === 'bar';
    const isSmallMode = mode === 'small';

    const topBarCompact = isBarMode || isSmallMode;
    const topBarLight = !isBarMode; // small and large carousels use white box + light top bar
    const topBar = (
        <div
            className={`flex items-center justify-between gap-3 ${
                topBarLight ? 'border-b border-slate-200 bg-slate-50' : 'border-b border-white/10 bg-slate-800/60'
            } ${isBarMode ? 'px-3 py-1.5' : isSmallMode ? 'px-3 py-1' : 'px-4 py-2.5'}`}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Layers
                    className={`flex-shrink-0 ${topBarLight ? 'text-sky-600' : 'text-sky-400'} ${topBarCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                    aria-hidden
                />
                <h3
                    className={`font-semibold truncate ${
                        topBarLight ? 'text-slate-800' : 'text-slate-100'
                    } ${isBarMode ? 'text-sm' : isSmallMode ? 'text-sm' : 'text-base'}`}
                >
                    {title}
                </h3>
            </div>
            {isBarMode && (
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="p-1.5 rounded-md text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="p-1.5 rounded-md text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
            {groupId != null && (
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setGroupCarouselMode(groupId, 'large')}
                        className={`rounded-md transition-colors ${topBarCompact ? 'p-1.5' : 'p-2'} ${mode === 'large' ? 'bg-sky-600 text-white' : topBarLight ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-500/10' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10'}`}
                        title="Large carousel"
                    >
                        <LayoutGrid size={topBarCompact ? 14 : 16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setGroupCarouselMode(groupId, 'small')}
                        className={`rounded-md transition-colors ${topBarCompact ? 'p-1.5' : 'p-2'} ${mode === 'small' ? 'bg-sky-600 text-white' : topBarLight ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-500/10' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10'}`}
                        title="Small carousel"
                    >
                        <LayoutList size={topBarCompact ? 14 : 16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setGroupCarouselMode(groupId, 'bar')}
                        className={`rounded-md transition-colors ${topBarCompact ? 'p-1.5' : 'p-2'} ${mode === 'bar' ? 'bg-sky-600 text-white' : topBarLight ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-500/10' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10'}`}
                        title="Bar mode"
                    >
                        <Minus size={topBarCompact ? 14 : 16} />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-0.5 shrink-0">
                {groupId != null && typeof onRename === 'function' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const newName = window.prompt('Rename carousel', title);
                            if (newName != null && newName.trim()) onRename(groupId, newName.trim());
                        }}
                        className={`rounded-lg transition-colors ${topBarCompact ? 'p-1.5' : 'p-2'} ${topBarLight ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-500/10' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10'}`}
                        title="Rename carousel"
                    >
                        <Pencil size={topBarCompact ? 14 : 16} />
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
                        className={`rounded-lg transition-colors ${topBarCompact ? 'p-1.5' : 'p-2'} ${topBarLight ? 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'}`}
                        title="Delete carousel"
                    >
                        <Trash2 size={topBarCompact ? 14 : 16} />
                    </button>
                )}
            </div>
        </div>
    );

    const boxClassName = isBarMode
        ? 'w-full mb-3 rounded-xl border border-white/10 bg-slate-800/40 shadow-md overflow-hidden'
        : isSmallMode
            ? 'w-full mb-1.5 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-black/5 overflow-hidden'
            : 'w-full mb-6 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-black/5 overflow-hidden';

    // Empty carousel
    if (count === 0) {
        return (
            <div className="px-4">
                <div className={boxClassName}>
                    {topBar}
                    {!isBarMode && (
                        <div className="min-h-[120px] flex items-center justify-center bg-slate-50">
                            <p className="text-sm text-slate-500">No playlists in this carousel</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Bar mode: only top bar (with inline scroll buttons); hidden strip with fixed-width slots so scroll works
    if (isBarMode) {
        return (
            <div className="px-4">
                <div className={`${boxClassName} relative`}>
                    {topBar}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-4 overflow-x-auto overflow-y-hidden w-full overscroll-x-contain opacity-0 pointer-events-none absolute left-0 bottom-0 h-0 min-h-0 overflow-hidden"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                        aria-hidden
                    >
                        {React.Children.map(children, (_, index) => (
                            <div key={`bar-slot-${index}`} className="flex-shrink-0 w-[120px]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 1+ items: horizontal scroll row. Card size by mode.
    const cardWrapperClass = isSmallMode
        ? 'w-[min(180px,calc(33vw-1rem))] min-w-[140px] max-w-full flex-shrink-0'
        : 'w-[min(520px,calc(50vw-2rem))] min-w-[380px] max-w-full flex-shrink-0';
    const gapClass = isSmallMode ? 'gap-4' : 'gap-10';

    return (
        <div className="px-4">
            <div className={boxClassName}>
                {topBar}
                <div className="relative min-w-0">
                    <div
                        ref={scrollContainerRef}
                        className={`group-carousel-scroll flex ${gapClass} overflow-x-auto overflow-y-hidden px-1 min-w-0 overscroll-x-contain ${isSmallMode ? 'pt-1 pb-1' : 'pt-3 pb-2'}`}
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {React.Children.map(children, (child, index) => (
                            <div key={child?.key ?? `carousel-item-${index}`} className={cardWrapperClass}>
                                {React.isValidElement(child)
                                    ? React.cloneElement(child, { size: mode === 'small' ? 'small' : 'large', inCarousel: true })
                                    : child}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupPlaylistCarousel;

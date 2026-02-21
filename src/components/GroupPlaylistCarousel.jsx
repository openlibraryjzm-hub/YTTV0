import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Layers, Pencil, Trash2 } from 'lucide-react';

/**
 * Group Playlist Carousel - Horizontal scrollable row of playlist cards.
 * Used on Playlists Page to show playlists that have been added to the "group" via the card 3-dot menu.
 * Distinct from StickyVideoCarousel (videos): different icon, title, and card type.
 * Optional: groupId + onRename for rename, onDelete for delete carousel (GROUPS page).
 */
const GroupPlaylistCarousel = ({ children, title = 'Featured playlists', groupId, onRename, onDelete }) => {
    const scrollContainerRef = useRef(null);
    const [showControls, setShowControls] = useState(false);

    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const isDraggingRef = useRef(false);

    const count = React.Children.count(children);

    const titleRow = (showScrollBadge = false) => (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Layers className="w-5 h-5 text-sky-500 flex-shrink-0" />
            <h3 className="text-lg font-bold text-[#052F4A]">{title}</h3>
            {groupId != null && typeof onRename === 'function' && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        const newName = window.prompt('Rename carousel', title);
                        if (newName != null && newName.trim()) onRename(groupId, newName.trim());
                    }}
                    className="p-1.5 rounded-md text-slate-500 hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
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
                    className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    title="Delete carousel"
                >
                    <Trash2 size={16} />
                </button>
            )}
            {showScrollBadge && (
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Scroll to view {count} playlists
                </span>
            )}
        </div>
    );

    // Empty carousel: still show title + placeholder so new carousels are visible on GROUPS page
    if (count === 0) {
        return (
            <div className="w-full mb-8 animate-fade-in px-8">
                {titleRow(false)}
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 min-h-[140px] flex items-center justify-center">
                    <p className="text-sm text-slate-500">No playlists in this carousel</p>
                </div>
            </div>
        );
    }

    // Few items: show in a small grid row (same 2-col as main grid for consistency)
    if (count <= 2) {
        return (
            <div className="w-full mb-8 animate-fade-in px-8">
                {titleRow(false)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {children}
                </div>
            </div>
        );
    }

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

    const handleMouseDown = (e) => {
        setIsDown(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        isDraggingRef.current = false;
        scrollContainerRef.current.style.scrollSnapType = 'none';
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
        setIsDown(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseUp = () => {
        setIsDown(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.scrollSnapType = 'x mandatory';
            scrollContainerRef.current.style.cursor = 'grab';
        }
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
        if (Math.abs(walk) > 5) {
            isDraggingRef.current = true;
        }
    };

    const handleCaptureClick = (e) => {
        if (isDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div
            className="w-full mb-8 animate-fade-in relative px-8 group-carousel-root"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {titleRow(true)}

            <div className="relative -mx-4 px-4 group-carousel-wrapper">
                <style>{`
                    .group-carousel-wrapper::-webkit-scrollbar { height: 8px; }
                    .group-carousel-wrapper::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 4px; margin-left: 16px; margin-right: 16px; }
                    .group-carousel-wrapper::-webkit-scrollbar-thumb { background: rgba(5, 47, 74, 0.2); border-radius: 4px; }
                    .group-carousel-wrapper::-webkit-scrollbar-thumb:hover { background: rgba(5, 47, 74, 0.5); }
                `}</style>

                <button
                    type="button"
                    onClick={() => scroll('left')}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-[#052F4A] transition-all duration-300 ${showControls ? 'opacity-100 translate-x-1/2' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={20} />
                </button>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory cursor-grab"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onClickCapture={handleCaptureClick}
                    style={{ scrollbarWidth: 'auto', scrollBehavior: 'auto' }}
                >
                    {React.Children.map(children, (child) => (
                        <div className="w-[min(520px,calc(50%-20px))] min-w-[380px] snap-start flex-shrink-0 select-none">
                            {child}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => scroll('right')}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-[#052F4A] transition-all duration-300 ${showControls ? 'opacity-100 -translate-x-1/2' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                    aria-label="Scroll right"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default GroupPlaylistCarousel;

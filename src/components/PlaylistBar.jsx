import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { FOLDER_COLORS } from '../utils/folderColors';
import VideoSortFilters from './VideoSortFilters';
import { useNavigationStore } from '../store/navigationStore';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';

/**
 * Sticky toolbar for the Playlists page: VideoSortFilters + Add/Refresh/Bulk tag + folder prism + Back/Close.
 * Prism: All (white) + Unsorted (black) + 16 folder colors. Segments for colors that have a group carousel (by folderColorId).
 */
const PlaylistBar = ({
  onAddClick,
  groupColorIds = [],
  allPlaylistCount = 0,
  unsortedCount = 0,
  selectedFolder,
  onFolderSelect,
  currentPage = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onAddPage,
}) => {
  const { history, goBack, setCurrentPage } = useNavigationStore();
  const { setViewMode } = useLayoutStore();
  const { previewPlaylistId, clearPreview } = usePlaylistStore();
  const { allFolderMetadata, setHoveredFolder } = useFolderStore();
  const [sortBy, setSortBy] = useState('shuffle');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedRatings, setSelectedRatings] = useState([]);
  const handleToggleRating = (rating) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating].sort((a, b) => a - b)
    );
  };

  const ICON_WHITE_OUTLINE = {
    color: 'white',
    filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
  };

  const [isStuck, setIsStuck] = useState(false);
  const stickySentinelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );
    if (stickySentinelRef.current) observer.observe(stickySentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const [prismOnlyPopulated, setPrismOnlyPopulated] = useState(true);
  const groupColorIdSet = useMemo(() => new Set(groupColorIds), [groupColorIds]);
  // All + Unsorted (black, if any) + colors that have a group carousel (by folderColorId)
  const prismPopulatedSegments = useMemo(() => {
    const segments = [{ type: 'all', id: null, count: allPlaylistCount, label: null, hex: null }];
    if (unsortedCount >= 1) segments.push({ type: 'unsorted', id: 'unsorted', count: unsortedCount, label: null, hex: '#000000' });
    FOLDER_COLORS.forEach((color) => {
      if (groupColorIdSet.has(color.id)) segments.push({ type: 'color', id: color.id, count: 1, label: color.name, hex: color.hex });
    });
    return segments;
  }, [groupColorIdSet, allPlaylistCount, unsortedCount]);

  return (
    <>
      <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />
      <div
        className={`sticky top-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-visible
          ${isStuck
            ? 'backdrop-blur-xl border-y shadow-2xl mx-0 rounded-none mb-4 pt-2 pb-2 bg-slate-900/70'
            : 'backdrop-blur-[2px] border-b border-x border-t border-white/10 shadow-xl mx-0 rounded-none mb-4 mt-0 pt-1 pb-0 bg-transparent'
          }
        `}
        style={{
          backgroundColor: isStuck ? undefined : 'transparent',
          marginTop: '0px',
        }}
      >
        <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>
          <VideoSortFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            selectedRatings={selectedRatings}
            onToggleRating={handleToggleRating}
            isLight={true}
            className="shrink-0 mr-2"
          />

          {/* Pagination Controls */}
          {totalPages >= 1 && (
            <div className="flex items-center shrink-0 mr-2 ml-1">
              <button
                type="button"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                className={`transition-all flex items-center justify-center ${currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-110'}`}
                style={ICON_WHITE_OUTLINE}
                title="Previous page"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>

              <span
                onDoubleClick={onAddPage}
                className="text-xs font-bold min-w-[1.5rem] text-center cursor-pointer hover:scale-110 transition-transform select-none"
                style={ICON_WHITE_OUTLINE}
                title="Double click to add new page"
              >
                {currentPage}
              </span>

              <button
                type="button"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                className={`transition-all flex items-center justify-center ${currentPage >= totalPages ? 'opacity-30 cursor-not-allowed' : 'opacity-85 hover:opacity-100 hover:scale-110'}`}
                style={ICON_WHITE_OUTLINE}
                title="Next page"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <div className="flex items-center min-w-0 flex-1 mr-0">
            <div
              className="flex items-center h-7 min-w-0 flex-1 border-2 border-black rounded-lg overflow-hidden cursor-context-menu"
              onContextMenu={(e) => {
                e.preventDefault();
                setPrismOnlyPopulated((p) => !p);
              }}
              title={prismOnlyPopulated ? 'Right-click: show all segments' : 'Right-click: only segments with items'}
            >
              {prismOnlyPopulated ? (
                prismPopulatedSegments.map((seg, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === prismPopulatedSegments.length - 1;
                  const isSelected = selectedFolder === seg.id;
                  const isAll = seg.type === 'all';
                  const isUnsorted = seg.type === 'unsorted';
                  const ringClass = isSelected
                    ? (isAll ? 'after:ring-black/10' : isUnsorted ? 'after:ring-white/30' : 'after:ring-white/50')
                    : '';
                  const bg = isAll ? 'bg-white text-black' : isUnsorted ? 'bg-black text-white' : '';
                  return (
                    <button
                      key={seg.type + (seg.id ?? 'all')}
                      type="button"
                      onClick={() => onFolderSelect(seg.id)}
                      onMouseEnter={() => setHoveredFolder(seg.id)}
                      onMouseLeave={() => setHoveredFolder(undefined)}
                      className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums px-0.5 text-[10px] font-bold leading-none ${isSelected
                        ? `opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset ${ringClass}`
                        : 'opacity-60 hover:opacity-100'
                        } ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''} ${bg}`}
                      style={seg.hex ? { backgroundColor: seg.hex } : undefined}
                      title={isAll ? `Show All (${seg.count})` : isUnsorted ? `Unsorted (${seg.count})` : `${allFolderMetadata[seg.id]?.name || seg.label} (${seg.count})`}
                    >
                      <span className={seg.hex ? 'text-white/90 drop-shadow-md' : ''}>{seg.count}</span>
                    </button>
                  );
                })
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onFolderSelect(null)}
                    onMouseEnter={() => setHoveredFolder(null)}
                    onMouseLeave={() => setHoveredFolder(undefined)}
                    className={`h-full min-w-[2.25rem] flex-1 flex items-center justify-center transition-all rounded-l-md tabular-nums px-px max-w-[3rem] ${selectedFolder === null
                      ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-black/10'
                      : 'opacity-60 hover:opacity-100'
                      } bg-white text-black text-[10px] font-bold leading-none`}
                    title={`Show All (${allPlaylistCount} playlists)`}
                  >
                    {allPlaylistCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => onFolderSelect('unsorted')}
                    onMouseEnter={() => setHoveredFolder('unsorted')}
                    onMouseLeave={() => setHoveredFolder(undefined)}
                    className={`h-full min-w-[2.25rem] flex-1 flex items-center justify-center transition-all tabular-nums px-px max-w-[3rem] ${selectedFolder === 'unsorted'
                      ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/30'
                      : 'opacity-60 hover:opacity-100'
                      } bg-black text-white text-[10px] font-bold leading-none`}
                    title={`Unsorted (${unsortedCount} playlists)`}
                  >
                    {unsortedCount}
                  </button>
                  {FOLDER_COLORS.map((color, index) => {
                    const isSelected = selectedFolder === color.id;
                    const isLast = index === FOLDER_COLORS.length - 1;
                    const count = groupColorIdSet.has(color.id) ? 1 : 0;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => onFolderSelect(color.id)}
                        onMouseEnter={() => setHoveredFolder(color.id)}
                        onMouseLeave={() => setHoveredFolder(undefined)}
                        className={`h-full flex-1 min-w-0 flex items-center justify-center transition-all tabular-nums px-0.5 ${isSelected
                          ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/50'
                          : 'opacity-60 hover:opacity-100'
                          } ${isLast ? 'rounded-r-md' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        title={`${allFolderMetadata[color.id]?.name || color.name} (${count})`}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-bold text-white/90 drop-shadow-md truncate max-w-full">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Right side: Back, Close */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {(history.length > 0 || previewPlaylistId) && (
              <button
                type="button"
                onClick={() => {
                  if (previewPlaylistId) clearPreview();
                  if (history.length > 0) goBack();
                  else if (previewPlaylistId) setCurrentPage('playlists');
                }}
                className="flex items-center justify-center w-7 h-7 rounded-full shadow-sm border border-black/20 bg-white hover:bg-gray-100 text-black transition-all hover:scale-105 active:scale-90 shrink-0"
                title="Go Back"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-md border border-rose-400 active:scale-90 shrink-0"
              title="Close menu (Full screen)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaylistBar;

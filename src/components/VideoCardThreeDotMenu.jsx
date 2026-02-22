import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreVertical, Pin, Star } from 'lucide-react';
import BulkTagColorGrid from './BulkTagColorGrid';
import DrumstickRating from './DrumstickRating';

/**
 * VideoCardThreeDotMenu - Overhauled 3-dot menu for video cards.
 * Consolidates: Pins, Folder assignment (BulkTagColorGrid), Drumstick rating, and standard actions
 * (Sticky, Delete, Move/Copy, Set Cover) in one decluttered popover.
 */
const VideoCardThreeDotMenu = ({
  video,
  playlistId,
  // Pin
  isPinned,
  isPriority,
  isFollower,
  onTogglePin,
  onTogglePriorityPin,
  onRemovePin,
  // Folder (BulkTagColorGrid: click = assign/unassign, supports rename)
  videoFolders = [],
  folderMetadata = {},
  onStarColorLeftClick,
  onRenameFolder,
  // Rating
  drumstickRating = 0,
  onDrumstickRate,
  // Menu actions (Sticky, Delete, Move, Copy, Set Cover)
  menuOptions = [],
  onMenuOptionClick,
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Horizontal menu: place above the row, centered on the card that was clicked
      const menuWidth = 520;
      const menuHeight = 170; // fits Pin + Folder grid + Rating + Actions
      const gap = 180; // clear vertical offset above the card row
      // Center menu horizontally on the trigger (card row context)
      let left = rect.left + rect.width / 2 - menuWidth / 2;
      // Place menu well above the trigger so it sits clearly above the row
      let top = rect.top - menuHeight - gap;
      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
      top = Math.max(8, top);
      setPosition({ top, left });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;
    if (rect.top < 8) top = 8;
    if (rect.bottom > window.innerHeight - 20) top = window.innerHeight - rect.height - 20;
    if (rect.right > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (rect.left < 8) left = 8;
    setPosition(prev => (prev.top === top && prev.left === left ? prev : { top, left }));
  }, [isOpen]);

  const handleMenuAction = (e, option) => {
    e.stopPropagation();
    if (onMenuOptionClick) onMenuOptionClick(option);
    setIsOpen(false);
  };

  const stickyOption = menuOptions.find(o => o.action === 'toggleSticky');
  const otherOptions = menuOptions.filter(o => o.action !== 'toggleSticky');

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-2 rounded-full hover:bg-black/50 text-white/90 transition-all backdrop-blur-sm ${triggerClassName} ${isOpen ? 'bg-black/60 text-white' : ''}`}
        title="More options"
        data-card-action="true"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] flex items-stretch gap-0 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
          style={{
            top: position.top,
            left: position.left,
            minWidth: 480,
            maxWidth: 'min(560px, calc(100vw - 16px))',
            minHeight: 130,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Actions: Delete, Move, Copy, Set Cover (vertical stack) */}
          <div className="flex flex-col justify-center gap-0.5 shrink-0 pl-2 pr-2 py-2 border-r border-white/10 min-w-[140px]">
            {otherOptions.map((option, index) => {
              if (!option.label) return null;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => handleMenuAction(e, option)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors
                    ${option.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                  title={option.label}
                >
                  <span className={`shrink-0 ${option.danger ? 'text-red-400' : 'text-slate-400'}`}>
                    {option.icon ?? <div className="w-4 h-4" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Pins, Rating, Sticky Video stacked vertically */}
          <div className="flex flex-col justify-center gap-3 px-3 py-2 border-r border-white/10 shrink-0">
            {/* Pins */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Pin</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPinned || isPriority) onRemovePin?.(video.id);
                    else onTogglePin?.(video);
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1
                    ${isPinned || isPriority ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                  title={isPinned || isPriority ? 'Unpin' : 'Pin'}
                >
                  <Pin size={12} fill={isPinned || isPriority ? 'currentColor' : 'none'} strokeWidth={2} />
                  {isPinned || isPriority ? 'Unpin' : 'Pin'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePriorityPin?.(video);
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1
                    ${isPriority ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                  title="Priority pin"
                >
                  <Star size={12} fill={isPriority ? 'currentColor' : 'none'} strokeWidth={2} />
                  Priority
                </button>
                {(isPinned || isPriority) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin?.(video);
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors
                      ${isFollower ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                    title="Follower pin"
                  >
                    Follower
                  </button>
                )}
              </div>
            </div>

            {/* Rating */}
            {playlistId && video?.id && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Rating</div>
                <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
                  <DrumstickRating rating={drumstickRating} onRate={onDrumstickRate} disabled={false} />
                </div>
              </div>
            )}

            {/* Sticky Video */}
            {stickyOption && (
              <button
                type="button"
                onClick={(e) => handleMenuAction(e, stickyOption)}
                className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                title={stickyOption.label}
              >
                <span className="text-slate-400 shrink-0">{stickyOption.icon ?? <div className="w-4 h-4" />}</span>
                <span>{stickyOption.label}</span>
              </button>
            )}
          </div>

          {/* 3. Folder grid (same as bulk tag UI: assign/unassign, rename) */}
          <div className="flex flex-col justify-center px-2 py-2 flex-1 min-w-0 shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Folder</div>
            <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto relative w-[180px] h-[180px] rounded-lg overflow-hidden">
              <BulkTagColorGrid
                videoId={video.id}
                currentFolders={videoFolders}
                selectedFolders={new Set(videoFolders)}
                onColorClick={(colorId) => onStarColorLeftClick?.(video, colorId)}
                playlistId={playlistId}
                folderMetadata={folderMetadata}
                onRenameFolder={onRenameFolder}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default VideoCardThreeDotMenu;

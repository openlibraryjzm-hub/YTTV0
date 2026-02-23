import React from 'react';
import { Home, CalendarDays, BarChart2, Clock, ArrowUp, ArrowDown } from 'lucide-react';

const DRUMSTICK = '🍗';

/**
 * Icon-based sort and rating filter bar for the Videos page sticky toolbar.
 * - Home = default (shuffle)
 * - Calendar = date, click cycles asc/desc with arrow indicator
 * - Bar chart = progress, click cycles asc/desc with arrow indicator
 * - Clock = last viewed, click cycles asc/desc with arrow indicator
 * - Drumsticks 1–5 = multi-select rating filter (grey when unselected)
 */
const VideoSortFilters = ({
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  selectedRatings,
  onToggleRating,
  isLight = true, // true when All selected (white bar), false when Unsorted/folder (colored bar)
  className = '',
}) => {
  const cycleDirection = () => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
  const isActive = (mode) => sortBy === mode;

  const btnBase = 'p-1.5 rounded-md transition-all border-2 shrink-0 flex items-center justify-center gap-0.5';
  const btnInactive = isLight
    ? 'bg-white/80 text-black/60 hover:bg-gray-100 hover:text-black border-black/20'
    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border-white/20';
  const btnActive = isLight
    ? 'bg-black text-white border-black shadow-md'
    : 'bg-white text-black border-white shadow-md';

  const Arrow = ({ up }) => {
    const Icon = up ? ArrowUp : ArrowDown;
    return <Icon size={10} strokeWidth={2.5} className="opacity-90" />;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Home = Default (shuffle) */}
      <button
        type="button"
        onClick={() => setSortBy('shuffle')}
        className={`${btnBase} ${isActive('shuffle') ? btnActive : btnInactive}`}
        title="Default order"
      >
        <Home size={16} strokeWidth={2.5} />
      </button>

      {/* Date: calendar icon, click to select or cycle direction */}
      <button
        type="button"
        onClick={() => {
          if (sortBy === 'chronological') cycleDirection();
          else {
            setSortBy('chronological');
            setSortDirection('desc');
          }
        }}
        className={`${btnBase} ${isActive('chronological') ? btnActive : btnInactive}`}
        title="Sort by date (click to cycle direction)"
      >
        <CalendarDays size={16} strokeWidth={2.5} />
        {isActive('chronological') && (
          <Arrow up={sortDirection === 'asc'} />
        )}
      </button>

      {/* Progress: bar chart, click to select or cycle direction */}
      <button
        type="button"
        onClick={() => {
          if (sortBy === 'progress') cycleDirection();
          else {
            setSortBy('progress');
            setSortDirection('desc');
          }
        }}
        className={`${btnBase} ${isActive('progress') ? btnActive : btnInactive}`}
        title="Sort by progress (click to cycle direction)"
      >
        <BarChart2 size={16} strokeWidth={2.5} />
        {isActive('progress') && (
          <Arrow up={sortDirection === 'asc'} />
        )}
      </button>

      {/* Last viewed: clock, click to select or cycle direction */}
      <button
        type="button"
        onClick={() => {
          if (sortBy === 'lastViewed') cycleDirection();
          else {
            setSortBy('lastViewed');
            setSortDirection('desc');
          }
        }}
        className={`${btnBase} ${isActive('lastViewed') ? btnActive : btnInactive}`}
        title="Sort by last viewed (click to cycle direction)"
      >
        <Clock size={16} strokeWidth={2.5} />
        {isActive('lastViewed') && (
          <Arrow up={sortDirection === 'asc'} />
        )}
      </button>

      {/* One drumstick: hover expands vertically to show all 5 for multi-select */}
      <div className="relative group shrink-0 ml-1 pl-1 border-l border-black/20 flex items-center">
        <div className={`flex items-center justify-center w-8 h-8 rounded transition-all ${isLight ? 'text-gray-600' : 'text-white/80'}`} title="Rating filter (hover to expand)">
          {DRUMSTICK}
        </div>
        {/* Expanded strip: visible on hover, stacked vertically */}
        <div className="absolute left-0 top-full pt-0.5 max-h-0 overflow-hidden opacity-0 group-hover:max-h-[220px] group-hover:opacity-100 transition-[max-height,opacity] duration-200 ease-out z-50">
          <div className={`flex flex-col gap-0.5 py-1.5 px-1 rounded-lg border-2 shadow-lg ${isLight ? 'bg-white border-black/20' : 'bg-slate-800 border-white/20'}`}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const selected = selectedRatings.includes(rating);
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onToggleRating(rating)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-lg leading-none transition-all
                    ${selected
                      ? 'opacity-100 scale-110'
                      : isLight
                        ? 'opacity-40 hover:opacity-70 text-gray-600'
                        : 'opacity-40 hover:opacity-70 text-white/80'
                    }`}
                  title={`Rating ${rating} (toggle)`}
                >
                  {DRUMSTICK}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSortFilters;

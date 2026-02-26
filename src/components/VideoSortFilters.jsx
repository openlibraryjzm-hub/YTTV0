import React, { useState, useRef, useEffect } from 'react';
import { Home, Filter, CalendarDays, BarChart2, Clock, ArrowUp, ArrowDown } from 'lucide-react';

const DRUMSTICK = '🍗';

const SORT_OPTIONS = [
  { mode: 'chronological', label: 'Sort by date', Icon: CalendarDays },
  { mode: 'progress', label: 'Sort by progress', Icon: BarChart2 },
  { mode: 'lastViewed', label: 'Sort by last viewed', Icon: Clock },
];

/**
 * Icon-based sort and rating filter bar for the Videos page sticky toolbar.
 * - Home = default (shuffle)
 * - Funnel = dropdown with Date, Progress, Last viewed + horizontal drumstick rating filter (1–5)
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cycleDirection = () => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
  const isShuffleActive = sortBy === 'shuffle';
  const isSortDropdownActive = ['chronological', 'progress', 'lastViewed'].includes(sortBy);
  const hasRatingFilter = selectedRatings.length > 0;
  const isFunnelActive = isSortDropdownActive || hasRatingFilter;

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

  const handleSortOptionClick = (mode) => {
    if (sortBy === mode) {
      cycleDirection();
    } else {
      setSortBy(mode);
      setSortDirection('desc');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Home = Default (shuffle) */}
      <button
        type="button"
        onClick={() => setSortBy('shuffle')}
        className={`${btnBase} ${isShuffleActive ? btnActive : btnInactive}`}
        title="Default order"
      >
        <Home size={16} strokeWidth={2.5} />
      </button>

      {/* Funnel = dropdown with Date, Progress, Last viewed */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className={`${btnBase} ${isFunnelActive ? btnActive : btnInactive}`}
          title="Sort & rating filter"
        >
          <Filter size={16} strokeWidth={2.5} />
        </button>
        {dropdownOpen && (
          <div
            className={`absolute left-0 top-full pt-0.5 z-50 min-w-[180px] rounded-lg border-2 shadow-lg py-1 ${isLight ? 'bg-white border-black/20' : 'bg-slate-800 border-white/20'
              }`}
          >
            {SORT_OPTIONS.map(({ mode, label, Icon }) => {
              const active = sortBy === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSortOptionClick(mode)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors ${active
                    ? isLight
                      ? 'bg-black/10 font-medium'
                      : 'bg-white/10 font-medium'
                    : isLight
                      ? 'hover:bg-gray-100 text-black/80'
                      : 'hover:bg-white/10 text-white/80'
                    }`}
                  title={active ? 'Click to cycle direction' : label}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={14} strokeWidth={2.5} />
                    {label}
                  </span>
                  {active && <Arrow up={sortDirection === 'asc'} />}
                </button>
              );
            })}
            {/* Rating filter: horizontal row of 1–5 drumsticks */}
            <div className={`px-3 py-2 border-t ${isLight ? 'border-black/10' : 'border-white/10'}`}>
              <div className="text-xs font-medium mb-1.5 opacity-70">Rating filter</div>
              <div className="flex items-center justify-between gap-0.5">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const selected = selectedRatings.includes(rating);
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => onToggleRating(rating)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg leading-none transition-all
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
        )}
      </div>
    </div>
  );
};

export default VideoSortFilters;

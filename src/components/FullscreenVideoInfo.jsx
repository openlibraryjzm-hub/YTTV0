import React from 'react';
import { usePlaylistStore } from '../store/playlistStore';

const FullscreenVideoInfo = () => {
  const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();

  const items = currentPlaylistItems || [];
  const hasValidIndex =
    items.length > 0 &&
    currentVideoIndex != null &&
    currentVideoIndex >= 0 &&
    currentVideoIndex < items.length;

  const video = hasValidIndex ? items[currentVideoIndex] : null;
  if (!video) return null;

  const thumbnailUrl = video.thumbnail_url || video.thumbnailUrl || null;
  const author = video.author || 'Unknown';
  const year = video.published_at ? new Date(video.published_at).getFullYear() : null;

  let viewCountText = null;
  if (video.view_count != null && video.view_count !== '') {
    const raw =
      typeof video.view_count === 'string'
        ? parseInt(video.view_count, 10)
        : video.view_count;
    const safeNumber = Number.isFinite(raw) ? raw : 0;
    viewCountText = safeNumber.toLocaleString();
  }

  return (
    <div className="layout-shell__fullscreen-video-info" data-debug-label="Fullscreen Video Info">
      {/* Thumbnail at very top */}
      {thumbnailUrl && (
        <div className="mb-2 rounded-xl overflow-hidden shadow-md">
          <img
            src={thumbnailUrl}
            alt={video.title || 'Video thumbnail'}
            className="block w-full h-auto aspect-video object-cover"
          />
        </div>
      )}

      {/* Author row - right under thumbnail, ~50% larger */}
      <div
        className="text-sm font-semibold tracking-wide text-slate-500 uppercase mb-2 truncate"
        title={author}
      >
        {author}
      </div>

      {/* View count row - above year, number + 4-bar icon */}
      {viewCountText != null && (
        <div className="flex items-end gap-2 mb-2">
          <span className="text-5xl font-semibold text-[#052F4A]">{viewCountText}</span>
          <span className="flex items-end gap-0.5 h-8 text-[#052F4A]" aria-hidden>
            <span className="w-1.5 rounded-full bg-current h-3" />
            <span className="w-1.5 rounded-full bg-current h-5" />
            <span className="w-1.5 rounded-full bg-current h-8" />
            <span className="w-1.5 rounded-full bg-current h-4" />
          </span>
        </div>
      )}

      {/* Year row - substantially larger (3x) */}
      {year != null && (
        <div className="text-8xl font-black text-[#052F4A] leading-tight mb-2">
          {year}
        </div>
      )}
    </div>
  );
};

export default FullscreenVideoInfo;


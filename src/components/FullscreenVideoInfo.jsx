import React from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';

/** Parse tags from JSON string or return empty array */
const parseTags = (tagsStr) => {
  if (!tagsStr || typeof tagsStr !== 'string') return [];
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const FullscreenVideoInfo = () => {
  const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();
  const { fullscreenInfoBlanked } = useLayoutStore();
  const {
    fullscreenBanner,
    bannerPreviewMode,
    bannerNavBannerId,
    bannerPresets
  } = useConfigStore();

  // Resolve effective fullscreen banner (same logic as LayoutShell: preset override when nav active)
  let effectiveBanner = fullscreenBanner;
  if (bannerNavBannerId && !bannerPreviewMode && bannerPresets?.length) {
    const preset = bannerPresets.find(p => p.id === bannerNavBannerId);
    if (preset?.fullscreenBanner) effectiveBanner = preset.fullscreenBanner;
  }
  const bannerImage = effectiveBanner?.image || '/banner.PNG';
  const bannerScale = effectiveBanner?.scale ?? 100;
  const bannerVertical = effectiveBanner?.verticalPosition ?? 0;
  const bannerHorizontal = effectiveBanner?.horizontalOffset ?? 0;

  const blurredBannerStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    backgroundImage: `url(${bannerImage})`,
    backgroundPosition: `${bannerHorizontal}% ${bannerVertical}%`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: `${bannerScale}vw auto`,
    filter: 'blur(28px)',
    transform: 'scale(1.15)',
    pointerEvents: 'none'
  };

  const items = currentPlaylistItems || [];
  const hasValidIndex =
    items.length > 0 &&
    currentVideoIndex != null &&
    currentVideoIndex >= 0 &&
    currentVideoIndex < items.length;

  const video = hasValidIndex ? items[currentVideoIndex] : null;

  return (
    <div className="layout-shell__fullscreen-video-info" data-debug-label="Fullscreen Video Info" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Heavily blurred version of current app banner */}
      <div aria-hidden="true" style={blurredBannerStyle} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {!fullscreenInfoBlanked && video && (() => {
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

  const description = video.description && String(video.description).trim() ? video.description : null;
  const tagsList = parseTags(video.tags);

  return (
    <>
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

      {/* Author row */}
      <div
        className="text-sm font-semibold tracking-wide text-slate-500 uppercase mb-2 truncate"
        title={author}
      >
        {author}
      </div>

      {/* View count row - number + 4-bar icon */}
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

      {/* Year */}
      {year != null && (
        <div className="text-8xl font-black text-[#052F4A] leading-tight mb-2">
          {year}
        </div>
      )}

      {/* Description - truncated, full text on hover */}
      {description && (
        <div
          className="text-sm text-slate-600 leading-snug mb-2 line-clamp-4 break-words"
          title={description}
        >
          {description}
        </div>
      )}

      {/* Tags - when available */}
      {tagsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagsList.slice(0, 12).map((tag, i) => (
            <span
              key={i}
              className="inline-block px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
          {tagsList.length > 12 && (
            <span className="text-xs text-slate-500 self-center">+{tagsList.length - 12}</span>
          )}
        </div>
      )}
    </>
  );
})()}
    </div>
    </div>
  );
};

export default FullscreenVideoInfo;


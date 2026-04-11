import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume1, Volume2, VolumeX, Shield, ShieldOff } from 'lucide-react';
import { usePlaylistStore } from '../store/playlistStore';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';

const TEXT_WHITE_OUTLINE = {
  color: 'white',
  WebkitTextStroke: '1px #000',
  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
};

const TEXT_WHITE_OUTLINE_LIGHT = {
  color: 'white',
  WebkitTextStroke: '0.5px #000',
  textShadow: '0px 1px 2px rgba(0,0,0,0.9)'
};

const ICON_WHITE_OUTLINE = {
  display: 'inline-flex',
  color: 'white',
  filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)'
};

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    const handleStateChange = (e) => setIsPlaying(e.detail.isPlaying);
    const handleVolumeSync = (e) => setVolume(e.detail.volume);

    window.addEventListener('youtube-player-state-change', handleStateChange);
    window.addEventListener('youtube-player-volume-change', handleVolumeSync);

    return () => {
      window.removeEventListener('youtube-player-state-change', handleStateChange);
      window.removeEventListener('youtube-player-volume-change', handleVolumeSync);
    };
  }, []);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: newState ? 'playVideo' : 'pauseVideo',
          args: []
        }), '*');
      } catch (e) {}
    });
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [newVol]
        }), '*');
      } catch (e) {}
    });
  };

  const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();
  const { fullscreenInfoBlanked, screenProtectorActive, toggleScreenProtector } = useLayoutStore();
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
      <div className="flex flex-col h-full w-full" style={{ position: 'relative', zIndex: 1, minHeight: 0 }}>
        {/* Scrollable metadata area */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4" style={{ minHeight: 0 }}>
          {!fullscreenInfoBlanked && video && (() => {
  const thumbnailUrl = video.thumbnail_url || video.thumbnailUrl || null;
  const author = video.author || 'Unknown';
  
  const formattedDate = video.published_at 
    ? new Date(video.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

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
        <div className="mb-2 rounded-xl overflow-hidden shadow-xl border-[3px] border-black">
          <img
            src={thumbnailUrl}
            alt={video.title || 'Video thumbnail'}
            className="block w-full h-auto aspect-video object-cover"
          />
        </div>
      )}

      {/* Author row */}
      <div
        className="text-3xl font-black tracking-wide uppercase mb-2 truncate"
        style={TEXT_WHITE_OUTLINE}
        title={author}
      >
        {author}
      </div>

      {/* Date */}
      {formattedDate != null && (
        <div className="text-3xl font-black leading-tight mb-2" style={TEXT_WHITE_OUTLINE}>
          {formattedDate}
        </div>
      )}

      {/* View count row - number + 4-bar icon */}
      {viewCountText != null && (
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-black" style={TEXT_WHITE_OUTLINE}>{viewCountText}</span>
          <span className="flex items-end gap-1 h-5 ml-0.5 mb-0.5" style={ICON_WHITE_OUTLINE} aria-hidden>
            <span className="w-1.5 bg-white h-2 block" />
            <span className="w-1.5 bg-white h-3 block" />
            <span className="w-1.5 bg-white h-5 block" />
            <span className="w-1.5 bg-white h-2.5 block" />
          </span>
        </div>
      )}

      {/* Description - truncated, full text on hover */}
      {description && (
        <div
          className="text-sm font-bold leading-snug mb-2 line-clamp-4 break-words"
          style={TEXT_WHITE_OUTLINE_LIGHT}
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

        {/* --- COOL NEW CONTROL BAR --- */}
        {!fullscreenInfoBlanked && video && (
          <div className="shrink-0 mt-4 z-20 bg-transparent flex items-center gap-6 relative transition-all duration-300">
            
            {/* Play/Pause Button */}
            <button 
              onClick={togglePlay}
              className="group shrink-0 w-14 h-14 flex items-center justify-center transition-all duration-300 hover:scale-125 active:scale-95 relative"
            >
              <span style={ICON_WHITE_OUTLINE}>
                {isPlaying ? (
                  <Pause size={36} fill="white" color="white" strokeWidth={1} />
                ) : (
                  <Play size={36} fill="white" color="white" strokeWidth={1} className="translate-x-0.5" />
                )}
              </span>
            </button>

            {/* Volume Control */}
            <div className="flex-1 flex items-center gap-4 group/vol relative">
              <button 
                onClick={() => handleVolumeChange({ target: { value: volume === 0 ? 100 : 0 } })}
                className="transition-colors shrink-0 hover:scale-110 active:scale-95"
                title="Mute/Unmute"
              >
                <span style={ICON_WHITE_OUTLINE}>
                  {volume === 0 ? <VolumeX size={28} color="white" strokeWidth={2.5} /> : (volume < 50 ? <Volume1 size={28} color="white" strokeWidth={2.5}/> : <Volume2 size={28} color="white" strokeWidth={2.5}/>)}
                </span>
              </button>
              
              {/* Custom Range Slider - Black & White outline theme */}
              <div className="relative flex-1 h-6 flex items-center cursor-pointer">
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
                />
                {/* Track Background */}
                <div className="absolute w-full h-3 bg-white border-2 border-black rounded-full overflow-hidden pointer-events-none z-0">
                  {/* Fill */}
                  <div 
                    className="h-full bg-black transition-all duration-75"
                    style={{ width: `${volume}%` }}
                  />
                </div>
                {/* Thumb Visual */}
                <div 
                  className="absolute w-6 h-6 bg-white rounded-full shadow-sm border-[2.5px] border-black transition-transform z-10 pointer-events-none"
                  style={{ left: `calc(${volume}% - 12px)` }}
                />
              </div>
            </div>

            {/* Shield Toggle Button */}
            <button
              onClick={toggleScreenProtector}
              className="group shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-125 active:scale-95"
              title={screenProtectorActive ? "Disable Shield (Enable Embed UI)" : "Enable Shield (Hide Embed UI)"}
            >
              <span style={ICON_WHITE_OUTLINE}>
                {screenProtectorActive ? (
                  <Shield size={32} fill="white" strokeWidth={2} color="white" />
                ) : (
                  <ShieldOff size={32} color="white" strokeWidth={2.5} />
                )}
              </span>
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenVideoInfo;


import React, { useState, useRef, useMemo } from 'react';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardContent from './CardContent';
import CardActions from './CardActions';
import BulkTagColorGrid from './BulkTagColorGrid';
import StarColorPicker from './StarColorPicker';
import ImageHoverPreview from './ImageHoverPreview';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { FOLDER_COLORS, getFolderColorById } from '../utils/folderColors';
import { usePinStore } from '../store/pinStore';
import { useLayoutStore } from '../store/layoutStore';
import { useFolderStore } from '../store/folderStore';
import { Pin } from 'lucide-react'; // Added Pin icon back

/**
 * VideoCard - Example of how easy it is to build complex cards with the new system
 * All functionality is cleanly separated and easy to extend
 */
const VideoCard = ({
  video,
  index,
  originalIndex,
  isSelected = false,
  isCurrentlyPlaying = false,
  videoFolders = [],
  selectedFolder = null,
  onVideoClick,
  onStarClick,
  onStarColorLeftClick,
  onStarColorRightClick,
  onMenuOptionClick,
  onQuickAssign,
  bulkTagMode = false,
  bulkTagSelections = new Set(),
  onBulkTagColorClick,
  onPinClick,
  onSecondPlayerSelect,
  progress = 0,
  isWatched = false,
  isStickied = false,
  playlistId = null,
  folderMetadata = {},
  onRenameFolder,
  cardStyle = 'youtube', // 'youtube' | 'twitter'
}) => {
  const { inspectMode } = useLayoutStore();
  const { quickAssignFolder } = useFolderStore();

  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;
  const [isHovered, setIsHovered] = useState(false);
  const [isStarHovered, setIsStarHovered] = useState(false);
  const starHoverTimeoutRef = useRef(null);
  const starHoverDelayRef = useRef(null);

  // Use stored thumbnail_url if available (for Twitter/local content), otherwise construct YouTube thumbnail
  const thumbnailUrl = video.thumbnail_url || getThumbnailUrl(video.video_id, 'medium');

  // For preview, use high-res source:
  // - For local/Twitter content: 
  //   - If it's a video/gif file (MP4), we can't show it in <img>, so use enlarged thumbnail
  //   - If it's an image, use the original video_url
  // - For YouTube: use maxresdefault thumbnail
  const previewUrl = useMemo(() => {
    if (video.is_local) {
      const isVideoFile = video.video_url?.match(/\.(mp4|gif|mov|m3u8|webm|ts)/i);
      const isTwitter = video.video_url?.includes('twimg.com') || video.thumbnail_url?.includes('twimg.com');

      if (isVideoFile && isTwitter) {
        // Upgrade Twitter thumbnail from 'thumb' to 'large' or 'orig'
        // 'large' is generally safe for video thumbnails
        return video.thumbnail_url?.replace(/name=[a-z]+/, 'name=large');
      }

      return video.video_url || video.thumbnail_url;
    }
    return getThumbnailUrl(video.video_id, 'maxres');
  }, [video]);

  const primaryFolder = videoFolders.length > 0 ? getFolderColorById(videoFolders[0]) : null;
  const quickAssignColor = getFolderColorById(quickAssignFolder);

  // Get border color for bulk tag selections
  const getBulkTagBorderColor = () => {
    if (!bulkTagMode || bulkTagSelections.size === 0) {
      return null;
    }
    // Use the first selected folder color for the border
    const firstSelectedFolder = Array.from(bulkTagSelections)[0];
    const folderColor = getFolderColorById(firstSelectedFolder);
    return folderColor ? folderColor.hex : null;
  };

  const bulkTagBorderColor = getBulkTagBorderColor();


  // FIX: Split selectors to prevent "Maximum update depth exceeded" error
  const isPinnedVideo = usePinStore(state =>
    state.pinnedVideos.some(v => v.id === video.id) && !state.priorityPinIds.includes(video.id)
  );

  const isPriority = usePinStore(state => state.priorityPinIds.includes(video.id));
  const isFollower = usePinStore(state => state.followerPinIds.includes(video.id));
  const { togglePin, togglePriorityPin, removePin } = usePinStore();
  const pinLongPressTimerRef = useRef(null); // Timer for long press logic
  const lastClickTimeRef = useRef(0); // For double-click detection
  const [activePin, setActivePin] = useState(null); // For visual feedback

  // Handle pin interactions:
  // - Click unpinned → Normal pin
  // - Click pinned (normal/priority, not follower) → Add follower modifier
  // - Click follower pin → Remove follower modifier (keep pin)
  // - Hold (>600ms) → Priority pin
  // - Double-click → Unpin completely
  const handlePinMouseDown = (e) => {
    e.stopPropagation();
    setActivePin('pressing');
    pinLongPressTimerRef.current = setTimeout(() => {
      togglePriorityPin(video);
      setActivePin('long-pressed'); // Visual feedback can be handled in render
      pinLongPressTimerRef.current = null;
    }, 600); // 600ms threshold
  };

  const handlePinMouseUp = (e) => {
    e.stopPropagation();
    setActivePin(null);
    if (pinLongPressTimerRef.current) {
      clearTimeout(pinLongPressTimerRef.current);
      pinLongPressTimerRef.current = null;

      // Check for double-click (within 300ms)
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;
      lastClickTimeRef.current = now;

      if (timeSinceLastClick < 300 && (isPinnedVideo || isPriority)) {
        // Double-click on pinned video → Unpin completely
        removePin(video.id);
        if (onPinClick) onPinClick(video);
      } else {
        // Single click → Toggle pin/follower status
        togglePin(video);
        if (onPinClick) onPinClick(video);
      }
    }
  };

  const handlePinMouseLeave = (e) => {
    // Cancel if mouse leaves button
    if (pinLongPressTimerRef.current) {
      clearTimeout(pinLongPressTimerRef.current);
      pinLongPressTimerRef.current = null;
      setActivePin(null);
    }
  };

  // Flattened splatter icon path for re-use
  const splatterPath = "M47.5,12.2c0,0-2.3,16.2-7.8,19.3c-5.5,3.1-17.7-6.2-17.7-6.2s3.8,11.2-1.7,16.5c-5.5,5.3-20.2-2.1-20.2-2.1 s12.5,9.6,9.2,16.5c-3.3,6.9-10.7,5.5-10.7,5.5s12.9,5.7,12.5,14.7c-0.4,9-10.6,15.6-10.6,15.6s15.3-1.6,20.2,4.2 c4.9,5.8-0.9,13.8-0.9,13.8s9.4-9,16.9-5.3c7.5,3.7,5.9,14.6,5.9,14.6s5.9-11.8,13.6-10.6c7.7,1.2,13.6,9.5,13.6,9.5 s-1.8-13.6,5.3-16.7c7.1-3.1,16.5,2.7,16.5,2.7s-8.1-13.6-1.5-18.9c6.6-5.3,18.8,0.7,18.8,0.7s-13.2-8.1-11.1-16.7 C99.2,40.4,100,28.8,100,28.8s-12,8.8-17.7,3.1c-5.7-5.7-1.3-18.8-1.3-18.8s-9,11.6-16.5,9.4c-7.5-2.2-11.1-12.2-11.1-12.2 S50.4,14.5,47.5,12.2z";

  // Quick action - star for folder assignment (must be defined before badges)
  const quickActions = [];

  // Menu options - easy to extend! (must be defined before badges)
  const menuOptions = [
    {
      label: isStickied ? 'Unsticky Video' : 'Sticky Video',
      icon: (
        <svg className="w-4 h-4 text-amber-500" viewBox="0 0 100 100" fill="currentColor">
          <path d={splatterPath} />
        </svg>
      ),
      action: 'toggleSticky',
    },
    {
      label: 'Delete',
      danger: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      action: 'delete',
    },
    {
      label: 'Move to Playlist',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
      action: 'moveToPlaylist',
    },
    {
      label: 'Set as Playlist Cover',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      action: 'setPlaylistCover',
    },
    {
      label: 'Copy to Playlist',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      action: 'copyToPlaylist',
    },
    {
      label: 'Assign to Folder',
      submenu: 'folders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      action: 'assignFolder',
    },
    {
      label: 'Quick Assign',
      submenu: 'quickFolders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: 'setQuickAssign',
    },
  ];

  // Submenu options for folders (must be defined before badges)
  const submenuOptions = {
    folders: FOLDER_COLORS.map((color) => ({
      label: color.name,
      icon: (
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color.hex }}
        />
      ),
      action: 'assignFolder',
      folderColor: color.id,
    })),
    quickFolders: FOLDER_COLORS.map((color) => ({
      label: `Set ${color.name} as Quick Assign`,
      icon: (
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color.hex }}
        />
      ),
      action: 'setQuickAssign',
      folderColor: color.id,
    })),
  };



  // Play overlay for hover (only show when not in bulk tag mode)
  const playOverlay = null;

  // Badges for thumbnail (now can safely use quickActions, menuOptions, submenuOptions)
  const badges = [

    // Watched badge (only if NOT playing)
    !isCurrentlyPlaying && isWatched && {
      component: (
        <div className="text-green-500 drop-shadow-md flex items-center justify-center filter drop-shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      position: 'top-left',
    },

    // Top Right Controls (Pin + Star) - Combined to sit side-by-side
    !bulkTagMode && {
      component: (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Dual-Action Pin Button */}
          <button
            onMouseDown={handlePinMouseDown}
            onMouseUp={handlePinMouseUp}
            onMouseLeave={handlePinMouseLeave}
            className={`p-1.5 rounded-lg transition-all active:scale-95 duration-200 mr-1 ${isPriority
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white'
              : isPinnedVideo
                ? 'bg-sky-500/10 border-sky-500/50 text-sky-500 hover:bg-sky-500 hover:text-white'
                : 'bg-black/70 hover:bg-black/90 text-slate-400 hover:text-slate-200'
              } ${activePin === 'pressing' ? 'scale-90' : ''}`}
            style={{
              borderWidth: (isPriority || isPinnedVideo) ? '1px' : '0px',
            }}
            title={getInspectTitle(
              isFollower
                ? (isPriority ? 'Priority Follower Pin (Double-click to unpin)' : 'Follower Pin (Double-click to unpin)')
                : isPriority
                  ? 'Priority Pin (Click for follower, Double-click to unpin)'
                  : isPinnedVideo
                    ? 'Pinned (Click for follower, Double-click to unpin)'
                    : 'Pin (Click) / Priority (Hold)'
            ) || (
                isFollower
                  ? (isPriority ? 'Priority Follower Pin (Double-click to unpin)' : 'Follower Pin (Double-click to unpin)')
                  : isPriority
                    ? 'Priority Pin (Click for follower, Double-click to unpin)'
                    : isPinnedVideo
                      ? 'Pinned (Click for follower, Double-click to unpin)'
                      : 'Pin (Click) / Priority (Hold)'
              )}
          >
            {isFollower ? (
              /* Follower Pin Icon - 2 pins stacked diagonally */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Back pin (offset up-left) */}
                <g transform="translate(-3, -3) scale(0.75)">
                  <path d="M12 17v5" fill={isPriority || isPinnedVideo ? "currentColor" : "none"} />
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76Z" fill={isPriority || isPinnedVideo ? "currentColor" : "none"} />
                </g>
                {/* Front pin (offset down-right) */}
                <g transform="translate(3, 3) scale(0.75)">
                  <path d="M12 17v5" fill={isPriority || isPinnedVideo ? "currentColor" : "none"} />
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76Z" fill={isPriority || isPinnedVideo ? "currentColor" : "none"} />
                </g>
              </svg>
            ) : (
              <Pin
                size={20}
                fill={isPriority || isPinnedVideo ? "currentColor" : "none"}
                strokeWidth={2}
              />
            )}
          </button>

          {/* Quick Actions Badge (Star) */}
          <div
            className="relative"
            onMouseEnter={() => {
              // Clear any existing delay or hide timeout
              if (starHoverDelayRef.current) {
                clearTimeout(starHoverDelayRef.current);
              }
              if (starHoverTimeoutRef.current) {
                clearTimeout(starHoverTimeoutRef.current);
                starHoverTimeoutRef.current = null;
              }
              // Add 1.2 second delay before showing menu
              starHoverDelayRef.current = setTimeout(() => {
                setIsStarHovered(true);
                starHoverDelayRef.current = null;
              }, 1200);
            }}
            onMouseLeave={() => {
              // Clear the delay if mouse leaves before menu appears
              if (starHoverDelayRef.current) {
                clearTimeout(starHoverDelayRef.current);
                starHoverDelayRef.current = null;
              }
              // Use a small delay to allow mouse to move to picker
              starHoverTimeoutRef.current = setTimeout(() => {
                setIsStarHovered(false);
              }, 150);
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onStarClick) {
                  onStarClick(e);
                }
              }}
              onMouseEnter={() => {
                // Clear any existing delay or hide timeout
                if (starHoverDelayRef.current) {
                  clearTimeout(starHoverDelayRef.current);
                }
                if (starHoverTimeoutRef.current) {
                  clearTimeout(starHoverTimeoutRef.current);
                  starHoverTimeoutRef.current = null;
                }
                // Add 1.2 second delay before showing menu
                starHoverDelayRef.current = setTimeout(() => {
                  setIsStarHovered(true);
                  starHoverDelayRef.current = null;
                }, 1200);
              }}
              onMouseLeave={() => {
                // Clear the delay if mouse leaves before menu appears
                if (starHoverDelayRef.current) {
                  clearTimeout(starHoverDelayRef.current);
                  starHoverDelayRef.current = null;
                }
              }}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-black/90 transition-all block"
              title={getInspectTitle(
                videoFolders.length > 0
                  ? `Assigned to: ${videoFolders.map(f => folderMetadata[f]?.name || getFolderColorById(f).name).join(', ')}`
                  : 'Click to assign to folder'
              ) || (
                  videoFolders.length > 0
                    ? `Assigned to: ${videoFolders.map(f => folderMetadata[f]?.name || getFolderColorById(f).name).join(', ')}`
                    : 'Click to assign to folder'
                )}
              style={{ color: primaryFolder ? primaryFolder.hex : quickAssignColor.hex }}
              data-card-action="true"
            >
              <svg
                className="w-5 h-5"
                fill={videoFolders.length > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={videoFolders.length > 0 ? 0 : 2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          </div>
        </div>
      ),
      position: 'top-right',
    },

    // 3-Dot Menu - Bottom Right
    !bulkTagMode && {
      component: (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CardActions
            menuOptions={menuOptions}
            onMenuOptionClick={onMenuOptionClick}
            submenuOptions={submenuOptions}
            className="flex-nowrap p-0 bg-black/70 rounded-lg hover:bg-black/90 text-white backdrop-blur-sm shadow-sm"
          />
        </div>
      ),
      position: 'bottom-right'
    }
  ].filter(Boolean);

  // Twitter/X style rendering
  if (cardStyle === 'twitter') {
    return (
      <Card
        onClick={bulkTagMode ? undefined : onVideoClick}
        selected={isSelected}
        playing={isCurrentlyPlaying}
        className={bulkTagMode ? 'cursor-default' : ''}
        variant="minimal"
      >
        <div
          onMouseEnter={() => bulkTagMode && setIsHovered(true)}
          onMouseLeave={() => bulkTagMode && setIsHovered(false)}
          className={`relative group rounded-lg ${bulkTagMode ? 'overflow-visible' : 'overflow-hidden'}`}
        >
          {/* Twitter/X Header Section (Top 1/5th) */}
          <div className="flex items-start gap-3 p-3 pb-2">
            {/* Profile Picture Circle */}
            <div className="flex-shrink-0">
              {video.profile_image_url ? (
                <img
                  src={video.profile_image_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover shadow-md"
                  onError={(e) => {
                    // Fallback to letter avatar if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden"
                style={{ display: video.profile_image_url ? 'none' : 'flex' }}
              >
                {/* Extract first letter of name for avatar */}
                {video.author ? video.author.charAt(0).toUpperCase() : 'T'}
              </div>
            </div>

            {/* Username, Handle, and Tweet Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {(() => {
                  // Parse author field: "Name (@handle)" format
                  const authorMatch = video.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
                  if (authorMatch) {
                    return (
                      <>
                        <span className="font-bold text-[#052F4A] text-sm">{authorMatch[1]}</span>
                        <span className="text-slate-500 text-xs">@{authorMatch[2]}</span>
                      </>
                    );
                  }
                  // Fallback if format doesn't match
                  return <span className="font-bold text-[#052F4A] text-sm">{video.author || 'Twitter User'}</span>;
                })()}
              </div>
              <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                {video.title || "Check out this amazing content!"}
              </p>
            </div>
          </div>

          {/* Shrunken Thumbnail with Margins */}
          <div className="px-3 pb-3">
            <ImageHoverPreview src={thumbnailUrl} previewSrc={previewUrl} alt={video.title || `Video ${index + 1}`} delay={500}>
              <CardThumbnail
                src={thumbnailUrl}
                alt={video.title || `Video ${index + 1}`}
                overlay={playOverlay}
                badges={bulkTagMode ? badges.filter(b => b.position !== 'top-right') : badges}
                progress={progress}
                className={`rounded-xl overflow-hidden ${bulkTagBorderColor ? 'border-2' : ''} ${isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-white shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''}`}
                style={bulkTagBorderColor ? { borderColor: bulkTagBorderColor, borderWidth: '2px' } : undefined}
              />
            </ImageHoverPreview>

            {/* Star color picker overlay */}
            {isStarHovered && !bulkTagMode && (
              <div
                data-star-picker="true"
                className="absolute inset-0 flex items-start justify-center pt-2 z-30 pointer-events-none"
                onMouseEnter={() => {
                  if (starHoverTimeoutRef.current) {
                    clearTimeout(starHoverTimeoutRef.current);
                    starHoverTimeoutRef.current = null;
                  }
                  setIsStarHovered(true);
                }}
                onMouseLeave={() => {
                  setIsStarHovered(false);
                }}
              >
                <div className="pointer-events-auto">
                  <StarColorPicker
                    currentFolders={videoFolders}
                    quickAssignFolder={quickAssignFolder}
                    folderMetadata={folderMetadata}
                    onRenameFolder={onRenameFolder}
                    onColorLeftClick={(folderColor) => {
                      if (onStarColorLeftClick) {
                        onStarColorLeftClick(video, folderColor);
                      }
                      setIsStarHovered(false);
                    }}
                    onColorRightClick={(folderColor) => {
                      if (onStarColorRightClick) {
                        onStarColorRightClick(folderColor);
                      }
                      setIsStarHovered(false);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Bulk tag color grid overlay */}
            {bulkTagMode && isHovered && (
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <BulkTagColorGrid
                  videoId={video.id}
                  currentFolders={videoFolders}
                  selectedFolders={bulkTagSelections}
                  onColorClick={onBulkTagColorClick}
                  playlistId={playlistId}
                  folderMetadata={folderMetadata}
                  onRenameFolder={onRenameFolder}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Default YouTube style rendering
  return (
    <Card
      onClick={bulkTagMode ? undefined : onVideoClick}
      selected={isSelected}
      playing={isCurrentlyPlaying}
      className={bulkTagMode ? 'cursor-default' : ''}
      variant="minimal"
    >
      <div
        onMouseEnter={() => bulkTagMode && setIsHovered(true)}
        onMouseLeave={() => bulkTagMode && setIsHovered(false)}
        className={`relative group rounded-lg ${bulkTagMode ? 'overflow-visible' : 'overflow-hidden'}`}
      >
        <ImageHoverPreview src={thumbnailUrl} previewSrc={previewUrl} alt={video.title || `Video ${index + 1}`} delay={500}>
          <CardThumbnail
            src={thumbnailUrl}
            alt={video.title || `Video ${index + 1}`}
            overlay={playOverlay}
            badges={bulkTagMode ? badges.filter(b => b.position !== 'top-right') : badges}
            progress={progress}
            className={`rounded-lg overflow-hidden border-2 ${bulkTagBorderColor ? '' : 'border-black'} ${isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-black shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''}`} // Rounding thumbnail specifically
            style={bulkTagBorderColor ? { borderColor: bulkTagBorderColor, borderWidth: '2px' } : undefined}
          />
        </ImageHoverPreview>

        {/* Star color picker overlay */}
        {isStarHovered && !bulkTagMode && (
          <div
            data-star-picker="true"
            className="absolute inset-0 flex items-start justify-center pt-2 z-30 pointer-events-none"
            onMouseEnter={() => {
              if (starHoverTimeoutRef.current) {
                clearTimeout(starHoverTimeoutRef.current);
                starHoverTimeoutRef.current = null;
              }
              setIsStarHovered(true);
            }}
            onMouseLeave={() => {
              setIsStarHovered(false);
            }}
          >
            <div className="pointer-events-auto">
              <StarColorPicker
                currentFolders={videoFolders}
                quickAssignFolder={quickAssignFolder}
                folderMetadata={folderMetadata}
                onColorLeftClick={(folderColor) => {
                  if (onStarColorLeftClick) {
                    onStarColorLeftClick(video, folderColor);
                  }
                  setIsStarHovered(false);
                }}
                onColorRightClick={(folderColor) => {
                  if (onStarColorRightClick) {
                    onStarColorRightClick(folderColor);
                  }
                  setIsStarHovered(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Bulk tag color grid overlay */}
        {bulkTagMode && isHovered && (
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <BulkTagColorGrid
              videoId={video.id}
              currentFolders={videoFolders}
              selectedFolders={bulkTagSelections}
              onColorClick={onBulkTagColorClick}
              playlistId={playlistId}
              folderMetadata={folderMetadata}
            />
          </div>
        )}
      </div>

      <CardContent
        title={video.title || `Video ${index + 1}`}
        subtitle={video.video_id}
        className="[&>p]:opacity-0 [&>p]:group-hover:opacity-100 [&>p]:transition-opacity [&>p]:duration-200"
        padding="p-0 pt-3"
        headerActions={null}
      />
    </Card>
  );
};

export default VideoCard;

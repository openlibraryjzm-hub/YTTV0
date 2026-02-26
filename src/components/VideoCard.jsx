import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardContent from './CardContent';
import BulkTagColorGrid from './BulkTagColorGrid';
import DrumstickRating from './DrumstickRating';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { FOLDER_COLORS, getFolderColorById } from '../utils/folderColors';
import { usePinStore } from '../store/pinStore';
import { useFolderStore } from '../store/folderStore';
import { getDrumstickRating, setDrumstickRating } from '../api/playlistApi';
import VideoCardThreeDotMenu from './VideoCardThreeDotMenu';

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
  const { quickAssignFolder } = useFolderStore();

  // Drumstick rating state (used by 3-dot menu)
  const [drumstickRating, setDrumstickRatingState] = useState(video.drumstick_rating || 0);

  // Load drumstick rating from database
  useEffect(() => {
    if (playlistId && video.id) {
      getDrumstickRating(playlistId, video.id)
        .then(rating => setDrumstickRatingState(rating))
        .catch(err => console.error('Failed to load drumstick rating:', err));
    }
  }, [playlistId, video.id]);

  // Handle drumstick rating change
  const handleDrumstickRate = async (newRating) => {
    if (!playlistId || !video.id) return;

    try {
      await setDrumstickRating(playlistId, video.id, newRating);
      setDrumstickRatingState(newRating);
    } catch (error) {
      console.error('Failed to set drumstick rating:', error);
    }
  };

  // Use stored thumbnail_url if available (for Twitter/local content), otherwise construct YouTube thumbnail
  const thumbnailUrl = video.thumbnail_url || getThumbnailUrl(video.video_id, 'medium');

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

  ];

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

    // 3-Dot Menu - Bottom Right (overhauled: Pins, Folder, Rating, and actions)
    !bulkTagMode && {
      component: (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <VideoCardThreeDotMenu
            video={video}
            playlistId={playlistId}
            isPinned={isPinnedVideo}
            isPriority={isPriority}
            isFollower={isFollower}
            onTogglePin={(v) => { togglePin(v); if (onPinClick) onPinClick(v); }}
            onTogglePriorityPin={togglePriorityPin}
            onRemovePin={(id) => { removePin(id); if (onPinClick) onPinClick(video); }}
            videoFolders={videoFolders}
            folderMetadata={folderMetadata}
            onStarColorLeftClick={onStarColorLeftClick}
            onRenameFolder={onRenameFolder}
            drumstickRating={drumstickRating}
            onDrumstickRate={handleDrumstickRate}
            menuOptions={menuOptions}
            onMenuOptionClick={(option) => onMenuOptionClick?.(option, video)}
            triggerClassName="bg-black/60 hover:bg-black/80"
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
        rounded={false}
      >
        <div className={`relative group ${bulkTagMode ? 'overflow-visible' : 'overflow-hidden'}`}>
          {/* Thumbnail first */}
          <div className="px-3 pt-3 pb-0">
            <CardThumbnail
              src={thumbnailUrl}
              alt={video.title || `Video ${index + 1}`}
              overlay={playOverlay}
              badges={badges}
              progress={progress}
              className={`overflow-hidden ${bulkTagBorderColor ? 'border-2' : ''} ${isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-white shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''}`}
              style={bulkTagBorderColor ? { borderColor: bulkTagBorderColor, borderWidth: '2px' } : undefined}
            />
          </div>

          {/* Twitter/X Header Section (title) */}
          <div className="flex items-start gap-3 p-3 pb-2">
            <div className="flex-shrink-0">
              {video.profile_image_url ? (
                <img
                  src={video.profile_image_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden"
                style={{ display: video.profile_image_url ? 'none' : 'flex' }}
              >
                {video.author ? video.author.charAt(0).toUpperCase() : 'T'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {(() => {
                  const authorMatch = video.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
                  if (authorMatch) {
                    return (
                      <>
                        <span className="font-bold text-[#052F4A] text-sm">{authorMatch[1]}</span>
                        <span className="text-slate-500 text-xs">@{authorMatch[2]}</span>
                      </>
                    );
                  }
                  return <span className="font-bold text-[#052F4A] text-sm">{video.author || 'Twitter User'}</span>;
                })()}
              </div>
              <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                {video.title || "Check out this amazing content!"}
              </p>
            </div>
          </div>

          {/* Bulk tag: below thumbnail and title */}
          {bulkTagMode && (
            <div className="relative w-full h-20 flex-shrink-0 overflow-hidden mt-2 px-3 pb-3" data-card-action="true">
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
      rounded={false}
    >
      <div className={`relative group ${bulkTagMode ? 'overflow-visible' : 'overflow-hidden'}`}>
        <CardThumbnail
          src={thumbnailUrl}
          alt={video.title || `Video ${index + 1}`}
          overlay={playOverlay}
          badges={badges}
          progress={progress}
          className={`overflow-hidden ${bulkTagBorderColor ? 'border-2' : ''} ${isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-black shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''}`}
          style={bulkTagBorderColor ? { borderColor: bulkTagBorderColor } : undefined}
        />
      </div>

      <CardContent
        title={video.title || `Video ${index + 1}`}
        padding="p-0 pt-3"
        headerActions={null}
      />

      {/* Bulk tag: below thumbnail and title, when bulk tag mode is active */}
      {bulkTagMode && (
        <div className="relative w-full h-20 flex-shrink-0 overflow-hidden mt-2" data-card-action="true">
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
    </Card>
  );
};

export default VideoCard;

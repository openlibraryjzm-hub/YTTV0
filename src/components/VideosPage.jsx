import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import { useFolderStore } from '../store/folderStore';
import { useLayoutStore } from '../store/layoutStore';
import { assignVideoToFolder, unassignVideoFromFolder, getVideoFolderAssignments, getAllFolderAssignments, getVideosInFolder, removeVideoFromPlaylist, getWatchedVideoIds, getAllVideoProgress } from '../api/playlistApi';
import { FOLDER_COLORS, getFolderColorById } from '../utils/folderColors';
import { extractVideoId } from '../utils/youtubeUtils';
import VideoCard from './VideoCard';
import PlaylistSelectionModal from './PlaylistSelectionModal';
import PlaylistUploader from './PlaylistUploader';
import { addVideoToPlaylist, getPlaylistItems, getPlaylistSources } from '../api/playlistApi';
import { fetchChannelUploads } from '../utils/youtubeUtils';

import { useStickyStore } from '../store/stickyStore';
import { usePinStore } from '../store/pinStore';
import StickyVideoCarousel from './StickyVideoCarousel';
import PageBanner from './PageBanner';
import EditPlaylistModal from './EditPlaylistModal';
import UnifiedBannerBackground from './UnifiedBannerBackground';
import { useNavigationStore } from '../store/navigationStore';
import { Star, MoreVertical, Plus, Play, Check, X, ArrowUp, Clock, Heart, Pin, Settings, Cat, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import VideoCardSkeleton from './skeletons/VideoCardSkeleton';
import { updatePlaylist, getAllPlaylists, getFolderMetadata, setFolderMetadata } from '../api/playlistApi';
import { useConfigStore } from '../store/configStore';
import { useShuffleStore } from '../store/shuffleStore';
import { usePaginationStore } from '../store/paginationStore';
import TweetCard from './TweetCard';
import OrbCard from './OrbCard';
import BannerPresetCard from './BannerPresetCard';
import AutoTagModal from './AutoTagModal';
import SubscriptionManagerModal from './SubscriptionManagerModal';


const VideosPage = ({ onVideoSelect, onSecondPlayerSelect }) => {
  const {
    currentPlaylistItems,
    currentVideoIndex,
    currentPlaylistId,
    setPlaylistItems,
    previewPlaylistItems,
    previewPlaylistId,
    previewFolderInfo,
    setPreviewPlaylist,
    allPlaylists,
    setAllPlaylists,
  } = usePlaylistStore();
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const {
    selectedFolder,
    setSelectedFolder,
    setVideoFolders,
    videoFolderAssignments,
    loadVideoFolders,
    quickAssignFolder,
    setQuickAssignFolder,
    bulkTagMode,
    setBulkTagMode,
    bulkTagSelections,
    toggleBulkTagSelection,
    clearBulkTagSelections,
  } = useFolderStore();
  const { shuffleStates, getShuffleState } = useShuffleStore();
  const { setViewMode, inspectMode, viewMode, videoCardStyle } = useLayoutStore();
  const { currentPage: currentNavTab, setCurrentPage: setCurrentNavTab, setSelectedTweet } = useNavigationStore();
  const scrollContainerRef = useRef(null);
  const horizontalScrollRef = useRef(null);

  const scrollToTop = () => {
    // Scroll the main container to top
    // Since we removed horizontalScrollRef from the main list, we should target the scroll container
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (horizontalScrollRef.current) {
      // Fallback for safety if refs are mixed
      horizontalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'videos', label: 'Videos' },
    { id: 'history', label: 'History', icon: <Clock size={16} /> },
    { id: 'likes', label: 'Likes', icon: <Heart size={16} /> },
    { id: 'pins', label: 'Pins', icon: <Pin size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    { id: 'support', label: 'Support', icon: <Cat size={16} /> },
  ];

  const handleTabClick = (tabId) => {
    setCurrentNavTab(tabId);
    const isNavigationTab = ['playlists', 'videos', 'history', 'likes', 'pins', 'settings', 'support'].includes(tabId);
    if (isNavigationTab && viewMode === 'full') {
      setViewMode('half');
    }
  };
  const {
    userName,
    userAvatar,
    customPageBannerImage,
    bannerHeight,
    bannerBgSize,
    playlistLayer2Overrides,
    setPlaylistLayer2Override,
    clearPlaylistLayer2Override,
    orbFavorites,
    updateOrbFavoritePlaylists,

    applyOrbFavorite,
    bannerPresets,
    updateBannerPresetPlaylists,
    applyBannerPreset,
    //orb navigation state setters
    setOrbNavPlaylistId,
    setOrbNavOrbId,
    //banner navigation state setters
    setBannerNavPlaylistId,
    setBannerNavBannerId
  } = useConfigStore();

  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;
  const [displayedVideos, setDisplayedVideos] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true); // Start true to show skeletons immediately
  const [savingBulkTags, setSavingBulkTags] = useState(false);
  const [sortBy, setSortBy] = useState('shuffle'); // 'shuffle', 'chronological', 'progress'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'
  const [includeUnwatched, setIncludeUnwatched] = useState(true);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
  const [watchedVideoIds, setWatchedVideoIds] = useState(new Set());
  const [videoProgress, setVideoProgress] = useState(new Map()); // Map<videoId, { percentage: number, hasFullyWatched: boolean }>

  // Move/Copy state
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [selectedVideoForAction, setSelectedVideoForAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'move' or 'copy'
  const [showUploader, setShowUploader] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [folderMetadata, setFolderMetadataState] = useState(null); // { custom_name, description }
  const [allFolderMetadata, setAllFolderMetadata] = useState({}); // Map: folderColor -> { name, description }

  // Use preview items if available, otherwise use current playlist items
  const activePlaylistItems = previewPlaylistItems || currentPlaylistItems;
  const activePlaylistId = previewPlaylistId || currentPlaylistId;
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);

  // Reset point tracking for chevron navigation
  // Tracks the playlist to return to when clicking the return button
  const [resetPointId, setResetPointId] = useState(null);
  const isChevronNavRef = useRef(false);

  // When activePlaylistId changes from external source (PlaylistsPage preview, controller video grid),
  // set that as the new reset point. Chevron navigation does NOT update the reset point.
  useEffect(() => {
    if (!isChevronNavRef.current && activePlaylistId) {
      setResetPointId(activePlaylistId);
    }
  }, [activePlaylistId]);

  // Show return button when we've navigated away from the reset point
  const showReturnButton = resetPointId && resetPointId !== activePlaylistId;

  // Playlist navigation handlers (for banner chevrons)
  const handleNavigatePlaylist = async (direction) => {
    if (!allPlaylists || allPlaylists.length === 0) return;

    // Find current index in allPlaylists
    const currentIndex = allPlaylists.findIndex(p => p.id === activePlaylistId);
    if (currentIndex === -1) return;

    // Calculate new index with wrapping
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allPlaylists.length;
    } else {
      newIndex = (currentIndex - 1 + allPlaylists.length) % allPlaylists.length;
    }

    const targetPlaylist = allPlaylists[newIndex];
    if (!targetPlaylist) return;

    try {
      // Mark as chevron navigation (so useEffect doesn't update reset point)
      isChevronNavRef.current = true;

      // Fetch playlist items
      const items = await getPlaylistItems(targetPlaylist.id);
      // Set as preview (doesn't affect player or controller menus)
      setPreviewPlaylist(items, targetPlaylist.id, null, targetPlaylist.name);

      // Reset flag after the state update propagates
      setTimeout(() => { isChevronNavRef.current = false; }, 0);
    } catch (error) {
      console.error('Failed to navigate to playlist:', error);
      isChevronNavRef.current = false;
    }
  };

  // Return to reset point playlist
  const handleReturnToOriginal = async () => {
    if (!resetPointId) return;

    try {
      // Mark as internal navigation (don't update reset point)
      isChevronNavRef.current = true;

      // Fetch the reset point playlist items
      const items = await getPlaylistItems(resetPointId);
      const playlist = allPlaylists.find(p => p.id === resetPointId);
      setPreviewPlaylist(items, resetPointId, null, playlist?.name);

      // Reset flag after state update
      setTimeout(() => { isChevronNavRef.current = false; }, 0);
    } catch (error) {
      console.error('Failed to return to original playlist:', error);
      isChevronNavRef.current = false;
    }
  };

  // Pagination state (from store for sharing with TopNavigation)
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isEditingPage,
    setIsEditingPage,
    pageInputValue,
    setPageInputValue,
    itemsPerPage,
    resetPagination,
    preserveScroll,
    clearPreserveScroll,
  } = usePaginationStore();
  const pageInputRef = useRef(null);





  // Reset page when playlist, folder, or sort filters change
  useEffect(() => {
    resetPagination();
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activePlaylistId, selectedFolder, sortBy, sortDirection, includeUnwatched, showOnlyCompleted, resetPagination]);

  // Scroll to left when page changes (unless preserveScroll is set from TopNav)
  useEffect(() => {
    if (preserveScroll) {
      // Clear the flag but don't scroll
      clearPreserveScroll();
    } else {
      if (horizontalScrollRef.current) {
        horizontalScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage, preserveScroll, clearPreserveScroll]);

  useEffect(() => {
    // Sync selected video with current playing video
    if (currentVideoIndex >= 0 && activePlaylistItems.length > 0) {
      setSelectedVideoIndex(currentVideoIndex);
    }
  }, [currentVideoIndex, activePlaylistItems]);



  const { isStickied, toggleSticky, stickiedVideos: allStickiedVideos } = useStickyStore();

  const handleToggleSticky = (playlistId, videoId) => {
    console.log(`[VideosPage] Toggling sticky for playlist ${playlistId}, video ${videoId}, folder ${selectedFolder}`);
    // Pass selectedFolder to toggle function to scope the key
    toggleSticky(playlistId, videoId, selectedFolder);
  };

  // Debug effect
  useEffect(() => {
    console.log('[VideosPage] Active Playlist:', activePlaylistId);
    console.log('[VideosPage] Sticky Data:', allStickiedVideos);
    console.log('[VideosPage] Selected Folder:', selectedFolder);
  }, [activePlaylistId, allStickiedVideos, selectedFolder]);

  // Reset selected folder when playlist changes to prevent showing wrong videos
  useEffect(() => {
    setSelectedFolder(null);
  }, [activePlaylistId, setSelectedFolder]);

  // Clear bulk tag selections when exiting bulk tag mode
  useEffect(() => {
    if (!bulkTagMode) {
      clearBulkTagSelections();
    }
  }, [bulkTagMode, clearBulkTagSelections]);

  // Load video progress data for sorting
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Load watched video IDs (>= 85% progress)
        const watchedIds = await getWatchedVideoIds();
        setWatchedVideoIds(new Set(watchedIds));

        // Load all video progress
        const allProgress = await getAllVideoProgress();
        const progressMap = new Map();
        for (const progress of allProgress) {
          progressMap.set(progress.video_id, {
            percentage: progress.progress_percentage,
            hasFullyWatched: progress.has_fully_watched,
            last_updated: progress.last_updated
          });
        }
        setVideoProgress(progressMap);
      } catch (error) {
        console.error('Failed to load video progress:', error);
      }
    };

    loadProgress();

    // Poll for progress updates every 5 seconds to keep UI fresh
    const intervalId = setInterval(loadProgress, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Refresh video progress when current video changes (to update sorting in real-time)
  useEffect(() => {
    const refreshProgress = async () => {
      if (activePlaylistItems.length > 0 && currentVideoIndex < activePlaylistItems.length) {
        try {
          // Refresh watched video IDs
          const watchedIds = await getWatchedVideoIds();
          setWatchedVideoIds(new Set(watchedIds));

          // Refresh all progress data
          const allProgress = await getAllVideoProgress();
          const progressMap = new Map();
          for (const progress of allProgress) {
            progressMap.set(progress.video_id, {
              percentage: progress.progress_percentage,
              hasFullyWatched: progress.has_fully_watched,
              last_updated: progress.last_updated
            });
          }
          setVideoProgress(progressMap);
        } catch (error) {
          console.error('Failed to refresh video progress:', error);
        }
      }
    };

    // Debounce the refresh to avoid too many API calls
    const timeoutId = setTimeout(refreshProgress, 2000);
    return () => clearTimeout(timeoutId);
  }, [currentVideoIndex, activePlaylistItems]);

  // Load folder assignments when playlist changes (but don't filter here)
  useEffect(() => {
    const loadAssignments = async () => {
      // Set loading true immediately when ID changes
      setLoadingFolders(true);

      // If no playlist or it's empty, clear folders
      // Actually, even if items are empty, we might want to clear or just wait.
      // But if we have an ID, we can fetch assignments.
      if (!activePlaylistId) {
        loadVideoFolders({});
        setLoadingFolders(false);
        return;
      }

      try {
        // PERFORMANCE: Batch fetch all folder assignments in ONE call
        // This replaces the previous N+1 loop that caused massive stuttering
        const assignments = await getAllFolderAssignments(activePlaylistId);
        loadVideoFolders(assignments || {});
      } catch (error) {
        console.error('Failed to load folder assignments:', error);
        loadVideoFolders({});
      } finally {
        setLoadingFolders(false);
      }
    };

    loadAssignments();
  }, [activePlaylistId, activePlaylistItems, loadVideoFolders]);

  // Load all folder metadata when playlist changes
  useEffect(() => {
    const loadAllFolderMetadata = async () => {
      if (!activePlaylistId) {
        setAllFolderMetadata({});
        return;
      }

      try {
        // Fetch metadata for all 16 folder colors in parallel
        const metadataPromises = FOLDER_COLORS.map(async (color) => {
          try {
            const metadata = await getFolderMetadata(activePlaylistId, color.id);
            return { folderColor: color.id, metadata };
          } catch (error) {
            console.error(`Failed to load metadata for folder ${color.id}:`, error);
            return { folderColor: color.id, metadata: null };
          }
        });

        const results = await Promise.all(metadataPromises);
        const metadataMap = {};
        results.forEach(({ folderColor, metadata }) => {
          if (metadata && metadata[0]) {
            // metadata[0] is the custom name
            metadataMap[folderColor] = { name: metadata[0], description: metadata[1] };
          }
        });
        setAllFolderMetadata(metadataMap);
      } catch (error) {
        console.error('Failed to load folder metadata:', error);
        setAllFolderMetadata({});
      }
    };

    loadAllFolderMetadata();
  }, [activePlaylistId]);

  // Initialize shuffle state when entering shuffle mode or playlist loading
  useEffect(() => {
    if (activePlaylistId && activePlaylistItems.length > 0) {
      // We essentially want to ensure the shuffle map exists for this playlist
      // This is "low cost" because getShuffleState checks if it exists first
      getShuffleState(activePlaylistId, activePlaylistItems.map(v => v.id));
    }
  }, [activePlaylistId, activePlaylistItems, getShuffleState]);

  // Filter videos by selected folder - this is the main filtering logic
  useEffect(() => {
    if (!activePlaylistId || activePlaylistItems.length === 0) {
      setDisplayedVideos([]);
      return;
    }

    const filterVideos = async () => {
      if (selectedFolder === null) {
        // Show all videos when no folder is selected
        // Also include Orbs assigned to this playlist
        const assignedOrbs = orbFavorites ? orbFavorites
          .filter(orb => orb.playlistIds && orb.playlistIds.includes(activePlaylistId))
          .map(orb => ({
            ...orb,
            id: `orb-${orb.id}`, // Unique ID for React key
            originalId: orb.id,
            isOrb: true,
            title: orb.name // For search/sort consistency if needed
          })) : [];

        const assignedBanners = bannerPresets ? bannerPresets
          .filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(activePlaylistId)))
          .map(preset => ({
            ...preset,
            id: `banner-${preset.id}`, // Unique ID for React key
            originalId: preset.id,
            isBannerPreset: true,
            title: preset.name
          })) : [];


        setDisplayedVideos([...assignedOrbs, ...assignedBanners, ...activePlaylistItems]);
        return;
      }

      setLoadingFolders(true);
      try {
        if (selectedFolder === 'unsorted') {
          // Filter for videos with no folder assignments
          const unsortedVideos = [];
          for (const video of activePlaylistItems) {
            // Check stored assignments
            const folders = videoFolderAssignments[video.id];

            // If we have loaded assignments and it's empty, or if we haven't loaded, let's check
            // Note: videoFolderAssignments is populated on playlist change, so it should be reliable.
            // However, to be safe, we could check DB but that's slow for "Unsorted" filter.
            // Let's rely on useFolderStore's loaded state which is refreshed on playlist change.
            if (!folders || folders.length === 0) {
              unsortedVideos.push(video);
            }
          }
          console.log(`Unsorted filter: Found ${unsortedVideos.length} videos`);
          setDisplayedVideos(unsortedVideos);
        } else {
          // When a color folder is selected, only show videos explicitly assigned to that folder
          // The database query uses INNER JOIN so it will only return videos with assignments
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          // Ensure we only show videos that are actually in the result (should be empty if no assignments)
          console.log(`Folder ${selectedFolder}: Found ${videos?.length || 0} videos with assignments`);
          setDisplayedVideos(Array.isArray(videos) ? videos : []);
        }
      } catch (error) {
        console.error('Failed to load folder videos:', error);
        // On error, show empty array (folder should be empty)
        setDisplayedVideos([]);
      } finally {
        setLoadingFolders(false);
      }
    };

    filterVideos();
  }, [selectedFolder, activePlaylistId, activePlaylistItems, videoFolderAssignments, orbFavorites, bannerPresets]);

  const handleRenameFolder = async (folderColor, newName) => {
    if (!activePlaylistId) return;
    try {
      // Keep existing description if present
      const currentMeta = allFolderMetadata[folderColor] || {};
      const description = currentMeta.description || '';

      await setFolderMetadata(activePlaylistId, folderColor, newName, description, null);

      // Update local state
      setAllFolderMetadata(prev => ({
        ...prev,
        [folderColor]: { ...prev[folderColor], name: newName }
      }));
    } catch (error) {
      console.error('Failed to rename folder:', error);
      alert('Failed to rename folder: ' + error.message);
    }
  };

  const handleMenuOptionClick = async (option, video) => {
    console.log('handleMenuOptionClick:', option.action, video.id, 'activePermission:', !!activePlaylistId);
    if (!activePlaylistId) {
      console.warn('Action attempted without activePlaylistId');
      // Temporarily allow for testing if that's the issue, or alert user
      // return; 
    }

    try {
      switch (option.action) {
        case 'delete':
          const confirmed = window.confirm(
            `Are you sure you want to remove "${video.title || 'this video'}" from the playlist?`
          );
          if (!confirmed) return;

          await removeVideoFromPlaylist(activePlaylistId, video.id);

          // Remove from displayed videos
          setDisplayedVideos(prev => prev.filter(v => v.id !== video.id));

          // Remove from active playlist items
          // Use activePlaylistItems instead of currentPlaylistItems as base if possible, 
          // but we need to update the store which expects us to update the specific list.
          // Since we are modifying the *active* playlist, we should update the store for that playlist.

          if (previewPlaylistId) {
            // We are in preview mode
            const updatedItems = previewPlaylistItems.filter(v => v.id !== video.id);
            // We need a clearPreview or setPreviewPlaylist method, but setPreviewPlaylist is safer
            setPreviewPlaylist(updatedItems, previewPlaylistId, previewFolderInfo);
          } else {
            // We are in current playback mode
            const updatedItems = currentPlaylistItems.filter(v => v.id !== video.id);
            setPlaylistItems(updatedItems, currentPlaylistId);
          }
          break;

        case 'assignFolder':
          if (option.folderColor) {
            const currentFolders = videoFolderAssignments[video.id] || [];
            const isAssigned = currentFolders.includes(option.folderColor);

            if (isAssigned) {
              await unassignVideoFromFolder(activePlaylistId, video.id, option.folderColor);
              setVideoFolders(video.id, currentFolders.filter(f => f !== option.folderColor));
            } else {
              await assignVideoToFolder(activePlaylistId, video.id, option.folderColor);
              setVideoFolders(video.id, [...currentFolders, option.folderColor]);
            }

            // Refresh folder view if viewing that folder
            if (selectedFolder === option.folderColor) {
              const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
              setDisplayedVideos(videos || []);
            }
          }
          break;

        case 'setQuickAssign':
          if (option.folderColor) {
            setQuickAssignFolder(option.folderColor);
            console.log('Quick assign folder set to:', option.folderColor);
          }
          break;

        case 'moveToPlaylist':
          setSelectedVideoForAction(video);
          setActionType('move');
          setShowPlaylistSelector(true);
          break;

        case 'setPlaylistCover':
          if (!activePlaylistId) return;
          try {
            // Use max resolution for cover
            const coverUrl = `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`;
            await updatePlaylist(activePlaylistId, null, null, null, coverUrl);
            alert(`Playlist cover updated using thumbnail from "${video.title}"`);

            // Refresh playlists to reflect change in UI immediately if possible
            const playlists = await getAllPlaylists();
            setAllPlaylists(playlists);
          } catch (error) {
            console.error('Failed to set playlist cover:', error);
            alert('Failed to set playlist cover');
          }
          break;

        case 'copyToPlaylist':
          setSelectedVideoForAction(video);
          setActionType('copy');
          setShowPlaylistSelector(true);
          break;

        default:
          console.log('Unknown action:', option.action);
      }
    } catch (error) {
      console.error('Failed to handle menu action:', error);
      alert(`Failed to ${option.label.toLowerCase()}: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStarClick = async (e, video) => {
    if (!activePlaylistId) return;

    const currentFolders = videoFolderAssignments[video.id] || [];

    // Use quick assign folder (stored preference) instead of selected folder
    const targetFolder = quickAssignFolder;
    const isAssigned = currentFolders.includes(targetFolder);

    try {
      if (isAssigned) {
        // Unassign from quick assign folder
        await unassignVideoFromFolder(activePlaylistId, video.id, targetFolder);
        const updatedFolders = currentFolders.filter(f => f !== targetFolder);
        setVideoFolders(video.id, updatedFolders);

        // Refresh folder view if viewing that folder
        if (selectedFolder === targetFolder) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      } else {
        // Assign to quick assign folder
        await assignVideoToFolder(activePlaylistId, video.id, targetFolder);
        setVideoFolders(video.id, [...currentFolders, targetFolder]);

        // Refresh folder view if viewing that folder
        if (selectedFolder === targetFolder) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      }
    } catch (error) {
      console.error('Failed to toggle folder assignment:', error);
      alert(`Failed to ${isAssigned ? 'unassign' : 'assign'} video: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle star color left click - assign video to folder
  const handleStarColorLeftClick = async (video, folderColor) => {
    if (!activePlaylistId) return;

    const currentFolders = videoFolderAssignments[video.id] || [];
    const isAssigned = currentFolders.includes(folderColor);

    try {
      if (isAssigned) {
        // Unassign from folder
        await unassignVideoFromFolder(activePlaylistId, video.id, folderColor);
        const updatedFolders = currentFolders.filter(f => f !== folderColor);
        setVideoFolders(video.id, updatedFolders);

        // Refresh folder view if viewing that folder
        if (selectedFolder === folderColor) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      } else {
        // Assign to folder
        await assignVideoToFolder(activePlaylistId, video.id, folderColor);
        setVideoFolders(video.id, [...currentFolders, folderColor]);

        // Refresh folder view if viewing that folder
        if (selectedFolder === folderColor) {
          const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
          setDisplayedVideos(videos || []);
        }
      }
    } catch (error) {
      console.error('Failed to toggle folder assignment:', error);
      alert(`Failed to ${isAssigned ? 'unassign' : 'assign'} video: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle star color right click - set as quick assign default
  const handleStarColorRightClick = (folderColor) => {
    setQuickAssignFolder(folderColor);
    console.log('Quick assign folder set to:', folderColor);
  };

  const handleVideoClick = (video, index) => {
    if (bulkTagMode) return; // Don't play videos in bulk tag mode

    // If we are in preview mode, commit this playlist to be the active one
    if (previewPlaylistId) {
      // Find playlist name for title consistency
      const playlist = allPlaylists.find(p => p.id === previewPlaylistId);
      const title = playlist ? playlist.name : null;

      // Commit preview to current
      setPlaylistItems(previewPlaylistItems, previewPlaylistId, previewFolderInfo, title);

      // Clear preview state since it's now active
      // actually setPlaylistItems updates current, we might want to clear preview explicitly or let store handle it?
      // store.setPlaylistItems doesn't autoclear preview.
      // But usually checking `activePlaylistItems = preview || current` handles the view.
      // If we made it current, we should probably clear preview so we aren't "previewing" anymore, we are "playing".
      // But let's stick to the core requirement: ensure title is correct.
    }

    const originalIndex = activePlaylistItems.findIndex(v => v.id === video.id);
    setSelectedVideoIndex(originalIndex >= 0 ? originalIndex : index);
    if (onVideoSelect) {
      onVideoSelect(video.video_url);
    }
  };

  const handleBulkTagColorClick = (video, folderColor) => {
    toggleBulkTagSelection(video.id, folderColor);
  };

  const handleSaveBulkTags = async () => {
    if (!activePlaylistId) return;

    const selections = Object.entries(bulkTagSelections);
    if (selections.length === 0) {
      alert('No selections to save');
      return;
    }

    setSavingBulkTags(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const [videoId, folderColors] of selections) {
        const videoIdNum = parseInt(videoId);
        const folders = Array.from(folderColors);

        // Get current folder assignments for this video
        const currentFolders = videoFolderAssignments[videoIdNum] || [];

        // Determine which folders to add and which to remove
        const foldersToAdd = folders.filter(f => !currentFolders.includes(f));
        const foldersToRemove = currentFolders.filter(f => !folders.includes(f));

        // Add new assignments
        for (const folderColor of foldersToAdd) {
          try {
            await assignVideoToFolder(activePlaylistId, videoIdNum, folderColor);
            successCount++;
          } catch (error) {
            console.error(`Failed to assign video ${videoIdNum} to folder ${folderColor}:`, error);
            errorCount++;
          }
        }

        // Remove old assignments
        for (const folderColor of foldersToRemove) {
          try {
            await unassignVideoFromFolder(activePlaylistId, videoIdNum, folderColor);
            successCount++;
          } catch (error) {
            console.error(`Failed to unassign video ${videoIdNum} from folder ${folderColor}:`, error);
            errorCount++;
          }
        }

        // Update local state
        setVideoFolders(videoIdNum, folders);
      }

      // Refresh folder assignments
      const assignments = {};
      for (const video of activePlaylistItems) {
        try {
          const folders = await getVideoFolderAssignments(activePlaylistId, video.id);
          assignments[video.id] = Array.isArray(folders) && folders.length > 0 ? folders : [];
        } catch (error) {
          console.error(`Failed to load folders for video ${video.id}:`, error);
          assignments[video.id] = [];
        }
      }
      loadVideoFolders(assignments);

      // Refresh folder view if viewing a colored folder (unsorted is handled by useEffect)
      if (selectedFolder !== null && selectedFolder !== 'unsorted') {
        const videos = await getVideosInFolder(activePlaylistId, selectedFolder);
        setDisplayedVideos(videos || []);
      }
      // For unsorted, the useEffect will automatically update when videoFolderAssignments changes

      // Clear selections and exit bulk tag mode
      clearBulkTagSelections();
      setBulkTagMode(false);

      if (errorCount > 0) {
        alert(`Saved ${successCount} assignments, but ${errorCount} failed. Check console for details.`);
      } else {
        alert(`Successfully saved ${successCount} folder assignments!`);
      }
    } catch (error) {
      console.error('Failed to save bulk tags:', error);
      alert(`Failed to save bulk tags: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingBulkTags(false);
    }
  };

  const handleCancelBulkTags = () => {
    clearBulkTagSelections();
    setBulkTagMode(false);
  };

  const [showAutoTagModal, setShowAutoTagModal] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  const handleAutoTagConfirm = async (handle, videos, folderColor) => {
    if (!activePlaylistId || !folderColor) return;

    setIsAutoTagging(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Assign each video to the folder
      for (const video of videos) {
        try {
          const videoId = video.id; // Correct ID usage
          const currentFolders = videoFolderAssignments[videoId] || [];

          if (!currentFolders.includes(folderColor)) {
            await assignVideoToFolder(activePlaylistId, videoId, folderColor);

            // Update local store immediately
            setVideoFolders(videoId, [...currentFolders, folderColor]);
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to auto-tag video ${video.id}:`, err);
          errorCount++;
        }
      }

      // Refresh folder view if viewing the target folder
      if (selectedFolder === folderColor) {
        const updatedVideos = await getVideosInFolder(activePlaylistId, selectedFolder);
        setDisplayedVideos(updatedVideos || []);
      }

      // Artificial delay to show the nice loading state if it was too fast
      if (successCount < 5) await new Promise(r => setTimeout(r, 500));

      alert(`Auto-tagged ${successCount} videos from ${handle} to folder!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      setShowAutoTagModal(false);

    } catch (error) {
      console.error('Auto-tag failed:', error);
      alert('Auto-tag process failed');
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handlePlaylistSelect = async (playlistId) => {
    if (!selectedVideoForAction || !actionType) return;

    try {
      const video = selectedVideoForAction;
      console.log(`${actionType === 'move' ? 'Moving' : 'Copying'} video to playlist ${playlistId}:`, video.title);

      const videoId = extractVideoId(video.video_url) || video.video_id;

      // 1. Add to destination playlist (Copy logic)
      await addVideoToPlaylist(
        playlistId,
        video.video_url,
        videoId,
        video.title,
        video.thumbnail_url
      );

      // 2. If 'move', remove from current playlist
      if (actionType === 'move' && activePlaylistId) {
        await removeVideoFromPlaylist(activePlaylistId, video.id);

        // Update UI locally to reflect removal
        setDisplayedVideos(prev => prev.filter(v => v.id !== video.id));

        // Update global store
        if (previewPlaylistId) {
          const updatedItems = previewPlaylistItems.filter(v => v.id !== video.id);
          setPreviewPlaylist(updatedItems, previewPlaylistId, previewFolderInfo);
        } else {
          const updatedItems = currentPlaylistItems.filter(v => v.id !== video.id);
          setPlaylistItems(updatedItems, currentPlaylistId);
        }
      }

      // Success feedback (could use a toast)
      console.log(`Video successfully ${actionType === 'move' ? 'moved' : 'copied'}!`);
      // Optional: alert(`Video ${actionType === 'move' ? 'moved' : 'copied'} successfully!`);

    } catch (error) {
      console.error(`Failed to ${actionType} video:`, error);
      alert(`Failed to ${actionType} video: ${error.message}`);
    } finally {
      setShowPlaylistSelector(false);
      setSelectedVideoForAction(null);
      setActionType(null);
    }
  };

  // Calculate folder counts
  const folderCounts = useMemo(() => {
    const counts = {};
    if (videoFolderAssignments) {
      Object.values(videoFolderAssignments).forEach(folders => {
        if (Array.isArray(folders)) {
          folders.forEach(folderId => {
            counts[folderId] = (counts[folderId] || 0) + 1;
          });
        }
      });
    }
    return counts;
  }, [videoFolderAssignments]);

  // Get available folders (those with videos, plus "all" and "unsorted")
  const availableFolders = useMemo(() => {
    const folders = [];
    // Always include "all" (null) and "unsorted"
    folders.push({ id: null, name: 'All' });
    folders.push({ id: 'unsorted', name: 'Unsorted' });
    // Add folders with videos, in FOLDER_COLORS order
    FOLDER_COLORS.forEach(color => {
      if (folderCounts[color.id] > 0) {
        folders.push({ id: color.id, name: color.name });
      }
    });
    return folders;
  }, [folderCounts]);

  // Navigate to previous folder
  const handleFolderNavigatePrev = () => {
    const currentIndex = availableFolders.findIndex(f => f.id === selectedFolder);
    if (currentIndex > 0) {
      setSelectedFolder(availableFolders[currentIndex - 1].id);
    } else {
      // Wrap to last folder
      setSelectedFolder(availableFolders[availableFolders.length - 1].id);
    }
  };

  // Navigate to next folder
  const handleFolderNavigateNext = () => {
    const currentIndex = availableFolders.findIndex(f => f.id === selectedFolder);
    if (currentIndex < availableFolders.length - 1) {
      setSelectedFolder(availableFolders[currentIndex + 1].id);
    } else {
      // Wrap to first folder
      setSelectedFolder(availableFolders[0].id);
    }
  };

  const handleUploadComplete = async () => {
    setShowUploader(false);

    // Reload the current playlist to show new videos
    if (activePlaylistId) {
      try {
        const items = await getPlaylistItems(activePlaylistId);
        if (previewPlaylistId) {
          setPreviewPlaylist(items, previewPlaylistId, previewFolderInfo);
        } else {
          setPlaylistItems(items, currentPlaylistId);
        }
      } catch (error) {
        console.error('Failed to reload playlist after upload:', error);
      }
    }
  };

  // Fetch folder metadata when selected folder changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (activePlaylistId && selectedFolder && selectedFolder !== 'unsorted') {
        try {
          const metadata = await getFolderMetadata(activePlaylistId, selectedFolder);
          // API returns [name, description] or null.
          // Wait, check rust implementation: returns (String, String) or None.
          // Check JS implementation: returns result || null.
          // So if result is array/tuple, it's [name, desc].
          // Let's verify what Tauri returns for tuple. It usually returns array.

          if (metadata) {
            // Destructure carefully if it's array
            setFolderMetadataState({ name: metadata[0], description: metadata[1], customAscii: metadata[2] });
          } else {
            setFolderMetadataState(null);
          }
        } catch (error) {
          console.error("Failed to fetch folder metadata:", error);
          setFolderMetadataState(null);
        }
      } else {
        setFolderMetadataState(null);
      }
    };

    fetchMetadata();
  }, [activePlaylistId, selectedFolder]);


  const handleUpdateMetadata = async (data) => {
    if (!activePlaylistId) return;

    try {
      if (selectedFolder) {
        // Update Folder Metadata (including 'unsorted')
        await setFolderMetadata(activePlaylistId, selectedFolder, data.name, data.description, data.customAscii);
        // Refresh local state
        setFolderMetadataState({ name: data.name, description: data.description, customAscii: data.customAscii });
      } else {
        // Update Playlist Metadata
        await updatePlaylist(activePlaylistId, data.name, data.description, data.customAscii);

        // Update Page Banner Override (Layer 2)
        // Determine the override key (playlist ID or composite "playlist:folder")
        // If selectedFolder is set, we use composite key. Otherwise just playlist ID.
        const overrideKey = selectedFolder
          ? `${activePlaylistId}:${selectedFolder}`
          : activePlaylistId;

        console.log('[VideosPage] Saving Banner Override:', {
          activePlaylistId,
          selectedFolder,
          overrideKey,
          hasImage: !!data.bannerImage
        });

        if (data.bannerImage) {
          setPlaylistLayer2Override(overrideKey, {
            image: data.bannerImage,
            scale: data.bannerScale ?? 100,
            xOffset: data.bannerXOffset ?? 50,
            yOffset: data.bannerYOffset ?? 50
          });
        } else {
          // If image is removed/null, clear the override
          clearPlaylistLayer2Override(overrideKey);
        }

        // Update global state store by reloading all playlists
        const playlists = await getAllPlaylists();
        setAllPlaylists(playlists);
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
      throw error;
    }
  };

  // Derived state for visible items (Playlists Items + Orbs OR Folder Content)
  const visibleItems = useMemo(() => {
    if (selectedFolder === null) {
      // Include Orbs assigned to this playlist
      const assignedOrbs = orbFavorites ? orbFavorites
        .filter(orb => orb.playlistIds?.includes(activePlaylistId))
        .map(orb => ({
          ...orb,
          id: `orb-${orb.id}`,
          originalId: orb.id,
          isOrb: true,
          title: orb.name
        })) : [];

      // Include Banners assigned to this playlist
      const assignedBanners = bannerPresets ? bannerPresets
        .filter(preset => preset.playlistIds && preset.playlistIds.map(String).includes(String(activePlaylistId)))
        .map(preset => ({
          ...preset,
          id: `banner-${preset.id}`, // Unique ID for React key
          originalId: preset.id,
          isBannerPreset: true,
          title: preset.name
        })) : [];

      return [...assignedOrbs, ...assignedBanners, ...activePlaylistItems];
    }
    return displayedVideos;
  }, [selectedFolder, displayedVideos, activePlaylistItems, orbFavorites, bannerPresets, activePlaylistId]);

  // Sort videos based on selected sort option
  // IMPORTANT: This hook must be called BEFORE any early returns
  const sortedVideos = useMemo(() => {
    // Determine which videos to display (folder filtered or all)
    const baseVideos = visibleItems;

    // Handle empty arrays
    if (!baseVideos || baseVideos.length === 0) {
      return [];
    }

    if (sortBy === 'chronological') {
      return [...baseVideos].sort((a, b) => {
        const dateA = new Date(a.published_at || a.added_at || 0).getTime();
        const dateB = new Date(b.published_at || b.added_at || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    if (sortBy === 'shuffle') {
      const state = shuffleStates[activePlaylistId];

      const getStableRank = (id) => {
        if (state?.map && state.map[id] !== undefined) return state.map[id];
        // Deterministic hash based on ID as a stable fallback
        let hash = 0;
        const str = String(id);
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        return (hash + 2147483648) / 4294967296;
      };

      return [...baseVideos].sort((a, b) => getStableRank(a.id) - getStableRank(b.id));
    }

    if (sortBy === 'progress') {
      let filtered = [...baseVideos];

      // Filter: Hide Unwatched
      if (!includeUnwatched) {
        filtered = filtered.filter(video => {
          const videoId = extractVideoId(video.video_url) || video.video_id || video.id;
          const data = videoProgress.get(videoId);
          const percentage = data ? (typeof data === 'number' ? data : data.percentage) : 0;
          return percentage > 0 || video.is_local; // Keep local content if we can't track it easily yet
        });
      }

      if (showOnlyCompleted) {
        filtered = filtered.filter(video => {
          const videoId = extractVideoId(video.video_url) || video.video_id || video.id;
          const data = videoProgress.get(videoId);
          const hasFullyWatched = data ? (typeof data === 'object' ? data.hasFullyWatched : false) : false;
          return !hasFullyWatched;
        });
      }

      const sorted = filtered.sort((a, b) => {
        const idA = extractVideoId(a.video_url) || a.video_id || a.id;
        const idB = extractVideoId(b.video_url) || b.video_id || b.id;

        const dataA = videoProgress.get(idA);
        const dataB = videoProgress.get(idB);

        const progressA = dataA ? (typeof dataA === 'number' ? dataA : dataA.percentage) : 0;
        const progressB = dataB ? (typeof dataB === 'number' ? dataB : dataB.percentage) : 0;

        // If progress is equal, fallback to date
        if (progressA === progressB) {
          const dateA = new Date(a.published_at || a.added_at || 0).getTime();
          const dateB = new Date(b.published_at || b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return sortDirection === 'asc'
          ? progressA - progressB
          : progressB - progressA;
      });
      return sorted;
    }

    if (sortBy && sortBy.startsWith('rating')) {
      const targetRating = parseInt(sortBy.replace('rating', ''), 10);
      const filtered = [...baseVideos].filter(v => (v.drumstick_rating || 0) === targetRating);

      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.published_at || a.added_at || 0).getTime();
        const dateB = new Date(b.published_at || b.added_at || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
      return sorted;
    }

    if (sortBy === 'lastViewed') {
      const sorted = [...baseVideos].sort((a, b) => {
        const idA = extractVideoId(a.video_url) || a.video_id || a.id;
        const idB = extractVideoId(b.video_url) || b.video_id || b.id;

        const dataA = videoProgress.get(idA);
        const dataB = videoProgress.get(idB);

        const lastUpdatedA = dataA?.last_updated ? new Date(dataA.last_updated).getTime() : 0;
        const lastUpdatedB = dataB?.last_updated ? new Date(dataB.last_updated).getTime() : 0;

        if (lastUpdatedA === lastUpdatedB) {
          const dateA = new Date(a.published_at || a.added_at || 0).getTime();
          const dateB = new Date(b.published_at || b.added_at || 0).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        return sortDirection === 'asc'
          ? lastUpdatedA - lastUpdatedB
          : lastUpdatedB - lastUpdatedA;
      });
      return sorted;
    }

    return baseVideos;
  }, [selectedFolder, displayedVideos, activePlaylistItems, sortBy, sortDirection, videoProgress, includeUnwatched, showOnlyCompleted, shuffleStates, activePlaylistId]);

  // Determine which videos to display (for count display)
  const videosToDisplay = visibleItems;

  // Split sorted videos into stickied and regular
  // Use allStickiedVideos to ensure reactivity
  // Sticky videos should NOT be affected by filters, so we use videosToDisplay (unfiltered) instead of sortedVideos
  const stickiedVideos = videosToDisplay.filter(v => {
    // Check specific folder key
    const folderKey = selectedFolder === null ? 'root' : selectedFolder;
    const key = `${activePlaylistId}::${folderKey}`;
    const stickies = allStickiedVideos[key] || [];
    return stickies.includes(v.id);
  });

  const regularVideos = sortedVideos;

  // Update total pages in store whenever regularVideos changes
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(regularVideos.length / itemsPerPage));
    setTotalPages(newTotalPages);
  }, [regularVideos.length, itemsPerPage, setTotalPages]);

  const bulkTagSelectionCount = Object.values(bulkTagSelections).reduce(
    (total, folders) => total + folders.size,
    0
  );

  // Helper to get banner info
  const activeObject = useMemo(() => {
    if (selectedFolder) {
      return folderMetadata; // This will be null or {name, description}
    }
    return allPlaylists.find(p => p.id === activePlaylistId);
  }, [allPlaylists, activePlaylistId, selectedFolder, folderMetadata]);

  const bannerInfo = useMemo(() => {
    let title = '';
    let description = '';
    let color = null;
    let isEditable = true;
    let customAscii = null;
    let hex = '#3b82f6'; // Default Blue

    if (selectedFolder) {
      if (selectedFolder === 'unsorted') {
        if (activeObject && activeObject.name) {
          title = activeObject.name;
          description = activeObject.description || '';
          customAscii = activeObject.customAscii;
        } else {
          title = 'Unsorted Videos';
          description = `Videos from "${allPlaylists.find(p => p.id === activePlaylistId)?.name || 'Playlist'}" that haven't been assigned to any folder.`;
        }
        color = 'unsorted';
        hex = '#64748b'; // Slate-500
        isEditable = true;
      } else {
        // Folder View
        const colorInfo = FOLDER_COLORS.find(c => c.id === selectedFolder);
        color = selectedFolder;
        if (colorInfo) hex = colorInfo.hex;

        if (activeObject) { // activeObject here refers to folderMetadataState
          title = activeObject.name || (colorInfo ? `${colorInfo.name} Folder` : 'Folder');
          description = activeObject.description || '';
          customAscii = activeObject.customAscii;
        } else {
          // Fallback to default names if no metadata
          title = colorInfo ? `${colorInfo.name} Folder` : 'Folder';
          description = `Videos in the ${title}.`;
        }
        isEditable = true; // Folders are editable
      }
    } else {
      // Playlist View
      title = activeObject ? activeObject.name : '';
      description = activeObject ? activeObject.description : '';
      // Playlist object from Rust uses snake_case
      customAscii = activeObject ? activeObject.custom_ascii : null;
      color = null;
      isEditable = true;
    }

    return { title, description, color, isEditable, customAscii, hex };
  }, [activeObject, selectedFolder, activePlaylistId, allPlaylists]);

  // Determine initial data for modal
  const modalInitialData = useMemo(() => {
    // Determine appropriate override key
    const overrideKey = selectedFolder
      ? `${activePlaylistId}:${selectedFolder}`
      : activePlaylistId;

    const override = playlistLayer2Overrides[overrideKey];

    if (selectedFolder) {
      // Folder edit (including unsorted)
      let defaultName = 'Folder';

      if (selectedFolder === 'unsorted') {
        defaultName = 'Unsorted Videos';
      } else {
        const colorInfo = FOLDER_COLORS.find(c => c.id === selectedFolder);
        if (colorInfo) defaultName = `${colorInfo.name} Folder`;
      }

      return {
        name: activeObject?.name || defaultName,
        description: activeObject?.description || '',
        customAscii: activeObject?.customAscii || '',
        // Banner Override settings (Folder level)
        bannerImage: override?.image,
        bannerScale: override?.scale,
        bannerXOffset: override?.xOffset,
        bannerYOffset: override?.yOffset
      };
    } else {
      // Playlist edit
      return {
        name: activeObject?.name || '',
        description: activeObject?.description || '',
        customAscii: activeObject?.custom_ascii || '',
        // Banner Override settings (Playlist level)
        bannerImage: override?.image,
        bannerScale: override?.scale,
        bannerXOffset: override?.xOffset,
        bannerYOffset: override?.yOffset
      };
    }
  }, [activeObject, selectedFolder, activePlaylistId, playlistLayer2Overrides]);

  // Find most recently watched video for "Continue" feature
  const continueVideo = useMemo(() => {
    if (!videosToDisplay || videosToDisplay.length === 0) return null;

    let mostRecent = null;
    let maxTime = 0;

    for (const video of videosToDisplay) {
      const videoId = extractVideoId(video.video_url) || video.video_id;
      const progress = videoProgress.get(videoId);

      if (progress && progress.last_updated) {
        const time = new Date(progress.last_updated).getTime();
        if (time > maxTime) {
          maxTime = time;
          mostRecent = video;
        }
      }
    }

    return mostRecent;
  }, [videosToDisplay, videoProgress]);

  // Get pinned videos from store
  const { pinnedVideos, priorityPinIds, followerPinIds } = usePinStore();

  // Find ALL pinned videos that are in the current playlist (with folder colors, priority, and follower flags)
  const pinnedVideosInPlaylist = useMemo(() => {
    if (!videosToDisplay || videosToDisplay.length === 0 || !pinnedVideos || pinnedVideos.length === 0) {
      return [];
    }

    // Create a set of video IDs in the current playlist for fast lookup
    const playlistVideoIds = new Set(
      videosToDisplay.map(v => v.video_id || extractVideoId(v.video_url))
    );

    // Find all pinned videos that are in this playlist and attach folder color + priority/follower flags
    const pinsInPlaylist = pinnedVideos
      .filter(pin => {
        const pinVideoId = pin.video_id || extractVideoId(pin.video_url);
        return playlistVideoIds.has(pinVideoId);
      })
      .map(pin => {
        // Get folder color for this pinned video (use first assigned folder)
        const folders = videoFolderAssignments[pin.id] || [];
        const isPriority = priorityPinIds?.includes(pin.id) || false;
        const isFollower = followerPinIds?.includes(pin.id) || false;
        return {
          ...pin,
          folder_color: folders.length > 0 ? folders[0] : null,
          isPriority,
          isFollower
        };
      });

    // Sort so priority pin is always first
    return pinsInPlaylist.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });
  }, [videosToDisplay, pinnedVideos, videoFolderAssignments, priorityPinIds, followerPinIds]);

  // Sticky header state detection
  const [isStuck, setIsStuck] = useState(false);
  const stickySentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is NOT visible (scrolled past top), we are stuck
        setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );

    if (stickySentinelRef.current) {
      observer.observe(stickySentinelRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Video Grid - 3 per row */}
      {showUploader ? (
        <div className="flex-1 overflow-y-auto p-4 bg-transparent">
          <PlaylistUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
            initialPlaylistId={activePlaylistId}
          />
        </div>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent relative">
          <AutoTagModal
            isOpen={showAutoTagModal}
            onClose={() => setShowAutoTagModal(false)}
            items={activePlaylistItems}
            videoFolderAssignments={videoFolderAssignments}
            folderMetadata={allFolderMetadata}
            onConfirm={handleAutoTagConfirm}
            isProcessing={isAutoTagging}
          />
          {/* Page Banner - DISABLED PER USER REQUEST */}
          {/* Replacement Mini Header - MOVED TO TOPNAVIGATION */}
          {activePlaylistId && (
            <div className="absolute top-0 right-0 z-50">
              <SubscriptionManagerModal
                isOpen={showSubscriptionManager}
                onClose={() => setShowSubscriptionManager(false)}
                playlistId={activePlaylistId}
              />
            </div>
          )}
          {/*
           {activePlaylistId && (
            <div
              className="w-full h-[100px] flex items-end px-8 pb-4 transition-all duration-300"
              style={{
                background: `linear-gradient(to bottom, transparent, ${bannerInfo.hex || '#ffffff'}30)`,
              }}
            >
              <div className="flex flex-col">
                <h1
                  className="text-3xl font-bold tracking-tight"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    color: bannerInfo.hex || 'rgba(255,255,255,0.9)'
                  }}
                >
                  {bannerInfo.title}
                </h1>
                {bannerInfo.description && (
                  <p className="text-white/50 text-xs mt-0.5 font-medium line-clamp-1 max-w-2xl">
                    {bannerInfo.description}
                  </p>
                )}
              </div>
            </div>
          )}
          */}


          {/* 
          {activePlaylistId && (
            <div className="px-4 pt-8">
              <PageBanner
                title={bannerInfo.title}
                description={bannerInfo.description}
                folderColor={bannerInfo.color}
                onEdit={bannerInfo.isEditable ? () => setShowEditModal(true) : undefined}
                videoCount={videosToDisplay.length}
                creationYear="2026"
                author={userName}
                avatar={bannerInfo.customAscii || userAvatar}
                continueVideo={continueVideo}
                onContinue={() => {
                  if (continueVideo && onVideoSelect) {
                    onVideoSelect(continueVideo.video_url);
                  }
                }}
                pinnedVideos={pinnedVideosInPlaylist}
                onPinnedClick={(video) => {
                  if (video && onVideoSelect) {
                    onVideoSelect(video.video_url);
                  }
                }}
                seamlessBottom={true}
                onNavigateNext={() => handleNavigatePlaylist('next')}
                onNavigatePrev={() => handleNavigatePlaylist('prev')}
                onReturn={handleReturnToOriginal}
                showReturnButton={showReturnButton}
                currentPlaylistId={activePlaylistId}
                onFolderNavigatePrev={handleFolderNavigatePrev}
                onFolderNavigateNext={handleFolderNavigateNext}
                selectedFolder={selectedFolder}
                folderCounts={folderCounts}
                allPlaylists={allPlaylists}
              />
            </div>
          )}
          */}

          {/* Sticky Sentinel */}
          <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />

          {/* Sticky Toolbar */}
          <div
            className={`sticky top-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden
            ${isStuck
                ? 'backdrop-blur-xl border-y shadow-2xl mx-0 rounded-none mb-6 pt-2 pb-2 bg-slate-900/70'
                : 'backdrop-blur-[2px] border-b border-x border-t border-white/10 shadow-xl mx-[22px] rounded-b-2xl mb-8 mt-0 pt-1 pb-0 bg-transparent'
              }
            `}
            style={{
              backgroundColor: isStuck ? undefined : 'transparent', // Fully transparent resting state
              marginTop: '0px' // banner removed, no overlap needed
            }}
          >


            <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>

              {/* Sort Dropdown - Moved to Far Left */}
              <div className="relative group shrink-0 mr-3">
                <select
                  value={`${sortBy}${sortBy === 'shuffle' || sortBy.startsWith('rating') ? '' : '_' + sortDirection}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'shuffle' || val.startsWith('rating')) {
                      setSortBy(val);
                    } else {
                      const [by, dir] = val.split('_');
                      setSortBy(by);
                      if (dir) setSortDirection(dir);
                    }
                  }}
                  className="bg-white border-2 border-black rounded-md py-1 pl-1.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-black focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer hover:bg-gray-100 transition-colors appearance-none w-auto min-w-[70px]"
                  title="Sort"
                >
                  <option value="shuffle">Default</option>
                  <option value="chronological_desc">Date 🔽</option>
                  <option value="chronological_asc">Date 🔼</option>
                  <option value="progress_desc">Progress 🔽</option>
                  <option value="progress_asc">Progress 🔼</option>
                  <option value="lastViewed_desc">Last Viewed 🔽</option>
                  <option value="lastViewed_asc">Last Viewed 🔼</option>
                  <option value="rating5">🍗🍗🍗🍗🍗</option>
                  <option value="rating4">🍗🍗🍗🍗</option>
                  <option value="rating3">🍗🍗🍗</option>
                  <option value="rating2">🍗🍗</option>
                  <option value="rating1">🍗</option>
                </select>
              </div>


              {/* Folder Selection Row */}
              {/* Left Side: All, Unsorted, and Colored Prism */}
              <div className="flex items-center gap-0 overflow-x-auto no-scrollbar mask-gradient-right flex-1 min-w-0 pr-0">
                {/* All/Unsorted Prism */}
                <div className="flex items-center shrink-0 h-6 mr-3 border-2 border-black rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`h-full px-3 flex items-center justify-center transition-all ${selectedFolder === null
                      ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-black/10'
                      : 'opacity-60 hover:opacity-100'
                      } bg-white text-black text-[10px] font-bold uppercase tracking-wider`}
                    title="Show All"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedFolder('unsorted')}
                    className={`h-full w-8 flex items-center justify-center transition-all ${selectedFolder === 'unsorted'
                      ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/30'
                      : 'opacity-60 hover:opacity-100'
                      } bg-black text-white text-[10px] font-bold`}
                    title="Unsorted"
                  >
                    ?
                  </button>
                </div>

                {/* Compact Folder Navigator */}
                {(() => {
                  let navBg = 'rgba(30, 41, 59, 0.8)'; // slate-800/80
                  let iconColor = 'text-white/60';
                  let iconHoverColor = 'hover:text-white';
                  let dividerColor = 'bg-white/10';
                  let hoverBg = 'hover:bg-white/10';

                  if (selectedFolder === null) {
                    navBg = '#ffffff';
                    iconColor = 'text-black/60';
                    iconHoverColor = 'hover:text-black';
                    dividerColor = 'bg-black/10';
                    hoverBg = 'hover:bg-black/5';
                  } else if (selectedFolder === 'unsorted') {
                    navBg = '#000000';
                    iconColor = 'text-white/60';
                    iconHoverColor = 'hover:text-white';
                    dividerColor = 'bg-white/10';
                    hoverBg = 'hover:bg-white/10';
                  } else {
                    const colorInfo = FOLDER_COLORS.find(c => c.id === selectedFolder);
                    if (colorInfo) {
                      navBg = colorInfo.hex;
                      iconColor = 'text-white/90'; // More opaque on colors
                      iconHoverColor = 'hover:text-white';
                      dividerColor = 'bg-white/20'; // More visible divider
                      hoverBg = 'hover:bg-black/10'; // Darken on hover
                    }
                  }

                  return (
                    <div
                      className="flex items-center shrink-0 h-6 mr-3 border-2 border-black rounded-lg overflow-hidden transition-colors duration-300"
                      style={{ backgroundColor: navBg }}
                    >
                      <button
                        onClick={handleFolderNavigatePrev}
                        className={`h-full px-1.5 flex items-center justify-center ${hoverBg} ${iconColor} ${iconHoverColor} transition-colors disabled:opacity-30 disabled:hover:bg-transparent`}
                        title="Previous Folder"
                      >
                        <ChevronLeft size={12} strokeWidth={3} />
                      </button>
                      <div className={`w-px h-3 ${dividerColor} mx-0`}></div>
                      <button
                        onClick={handleFolderNavigateNext}
                        className={`h-full px-1.5 flex items-center justify-center ${hoverBg} ${iconColor} ${iconHoverColor} transition-colors disabled:opacity-30 disabled:hover:bg-transparent`}
                        title="Next Folder"
                      >
                        <ChevronRight size={12} strokeWidth={3} />
                      </button>
                    </div>
                  );
                })()}

                <div className="flex-1 flex items-center shrink-0 h-6 mr-3 border-2 border-black rounded-lg overflow-hidden">
                  {FOLDER_COLORS.map((color, index) => {
                    const isSelected = selectedFolder === color.id;
                    const isFirst = index === 0;
                    const isLast = index === FOLDER_COLORS.length - 1;
                    const count = folderCounts[color.id] || 0;

                    return (
                      <button
                        key={color.id}
                        onClick={() => setSelectedFolder(color.id)}
                        className={`h-full flex-1 flex items-center justify-center transition-all ${isSelected
                          ? 'opacity-100 z-10 relative after:content-[""] after:absolute after:inset-0 after:ring-2 after:ring-inset after:ring-white/50'
                          : 'opacity-60 hover:opacity-100'
                          } ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        title={`${allFolderMetadata[color.id]?.name || color.name} (${count})`}
                      >
                        {count > 0 && (
                          <span className="text-sm font-bold text-white/90 drop-shadow-md">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Sort Dropdown + Actions */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">


                {/* Save and Cancel buttons - only show in bulk tag mode */}
                {bulkTagMode && (
                  <>
                    <button
                      onClick={handleSaveBulkTags}
                      disabled={savingBulkTags}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 disabled:opacity-50 text-black rounded-md transition-all shadow-lg border-2 border-black text-[10px] font-bold uppercase tracking-wider"
                      title="Save Bulk Tags"
                    >
                      {savingBulkTags ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelBulkTags}
                      disabled={savingBulkTags}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 disabled:opacity-50 text-black rounded-md transition-all shadow-lg border-2 border-black text-[10px] font-bold uppercase tracking-wider"
                      title="Cancel Bulk Tagging"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {/* Bulk Tag */}
                <button
                  onClick={() => setBulkTagMode(!bulkTagMode)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAutoTagModal(true);
                  }}
                  className={`p-1.5 rounded-md transition-all ${bulkTagMode
                    ? 'bg-black text-white border-2 border-black shadow-lg'
                    : 'bg-white text-black hover:bg-gray-100 border-2 border-black'
                    }`}
                  title={bulkTagMode ? "Exit Bulk Tagging" : "Bulk Tag (Right-click for Auto-Tag)"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </button>

                {/* Refresh Subscriptions */}
                <button
                  onClick={async () => {
                    const isConfirm = window.confirm('Refresh subscriptions for this playlist? This might take a moment.');
                    if (!isConfirm) return;

                    // Inline logic or call handler
                    if (!activePlaylistId) return;

                    try {
                      // Show loading state? 
                      // Since we don't have a specific loading state for this button easily without more state,
                      // we'll just use the button's disabled state or a toast/alert.

                      const sources = await getPlaylistSources(activePlaylistId);
                      if (!sources || sources.length === 0) {
                        alert('No subscriptions found in this playlist.');
                        return;
                      }

                      let totalNew = 0;
                      const MAX_CONCURRENT = 5;

                      // Process sources
                      for (let i = 0; i < sources.length; i += MAX_CONCURRENT) {
                        const chunk = sources.slice(i, i + MAX_CONCURRENT);
                        await Promise.all(chunk.map(async (source) => {
                          try {
                            let videos                                    // Use stored limit, fallback to 10
                            const limit = source.video_limit || 10;

                            if (source.source_type === 'channel') {
                              videos = await fetchChannelUploads(source.source_value, limit);
                            } else if (source.source_type === 'playlist') {
                              // For playlists, we might want a fetchPlaylistVideos equivalent without the parsing overhead
                              // For now, support ONLY channel per requirements
                            }

                            for (const v of videos) {
                              try {
                                await addVideoToPlaylist(
                                  activePlaylistId,
                                  v.video_url,
                                  v.video_id,
                                  v.title,
                                  v.thumbnail_url,
                                  v.author,
                                  null,
                                  v.published_at
                                );
                                totalNew++;
                              } catch (e) { /* ignore duplicates */ }
                            }
                          } catch (e) {
                            console.error('Source refresh failed:', e);
                          }
                        }));
                      }

                      if (totalNew > 0) {
                        const items = await getPlaylistItems(activePlaylistId);
                        setPlaylistItems(items, activePlaylistId);
                        alert(`Refresh complete! Added ${totalNew} new videos.`);
                      } else {
                        alert('No new videos found.');
                      }

                    } catch (e) {
                      console.error(e);
                      alert('Refresh failed.');
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    console.log('VideosPage: Refresh button right-click', { activePlaylistId });
                    if (activePlaylistId) {
                      setShowSubscriptionManager(true);
                    } else {
                      console.warn('VideosPage: Right-click ignored, no activePlaylistId');
                    }
                  }}
                  className="p-1.5 bg-white hover:bg-gray-100 text-black rounded-md transition-all shadow-lg border-2 border-black"
                  title="Refresh Subscriptions (Right-click to Manage)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Add */}
                <button
                  onClick={() => setShowUploader(true)}
                  className="p-1.5 bg-white hover:bg-gray-100 text-black rounded-md transition-all shadow-lg border-2 border-black"
                  title="Add Config"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

            </div>


          </div >

          <div className="px-4 pb-8">
            {/* Edit Playlist/Folder Modal */}
            <EditPlaylistModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={handleUpdateMetadata}
              initialData={modalInitialData}
            />

            {loadingFolders ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 animate-pulse">
                {[...Array(12)].map((_, i) => (
                  <VideoCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedVideos.length > 0 ? (
              <>
                {/* Sticky Carousel Section - Hide on Unsorted page */}
                {stickiedVideos.length > 0 && selectedFolder !== 'unsorted' && (
                  <StickyVideoCarousel>
                    {stickiedVideos.map((video, index) => {
                      const originalIndex = activePlaylistItems.findIndex(v => v.id === video.id);
                      return (
                        <VideoCard
                          key={video.id}
                          video={video}
                          index={index}
                          originalIndex={originalIndex}
                          isSelected={selectedVideoIndex === originalIndex}
                          isCurrentlyPlaying={currentVideoIndex === originalIndex}
                          videoFolders={videoFolderAssignments[video.id] || []}
                          selectedFolder={selectedFolder}
                          onVideoClick={() => handleVideoClick(video, index)}
                          onStarClick={(e) => handleStarClick(e, video)}
                          onStarColorLeftClick={handleStarColorLeftClick}
                          onStarColorRightClick={handleStarColorRightClick}
                          onMenuOptionClick={(option) => {
                            if (option.action === 'toggleSticky') {
                              handleToggleSticky(activePlaylistId, video.id);
                            } else {
                              handleMenuOptionClick(option, video);
                            }
                          }}
                          onQuickAssign={handleStarClick}
                          bulkTagMode={bulkTagMode}
                          bulkTagSelections={bulkTagSelections[video.id] || new Set()}
                          onBulkTagColorClick={(color) => handleBulkTagColorClick(video, color)}
                          onPinClick={() => { }} // Handled internally in VideoCard via store
                          isStickied={true} // It is stickied in this list
                          playlistId={activePlaylistId}
                          folderMetadata={allFolderMetadata}
                          onRenameFolder={handleRenameFolder}
                          cardStyle={videoCardStyle}
                          progress={(() => {
                            const videoId = extractVideoId(video.video_url) || video.video_id;
                            const data = videoProgress.get(videoId);
                            return data ? (typeof data === 'number' ? data : data.percentage) : 0;
                          })()}
                          isWatched={(() => {
                            const videoId = extractVideoId(video.video_url) || video.video_id;
                            return watchedVideoIds.has(videoId);
                          })()}
                        />
                      );
                    })}
                  </StickyVideoCarousel>
                )}

                {/* Vertical Video Grid - 3 per row (matches LikesPage) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 animate-fade-in">
                  {regularVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((video, idx) => {
                    const isTweet = video.is_local || video.video_url?.includes('twitter.com') || video.video_url?.includes('x.com') || video.thumbnail_url?.includes('twimg.com');
                    const originalIndex = activePlaylistItems.findIndex(v => v.id === video.id);
                    const folderKey = selectedFolder === null ? 'root' : selectedFolder;
                    const key = `${activePlaylistId}::${folderKey}`;
                    const isContextStickied = (allStickiedVideos[key] || []).includes(video.id);

                    const handleRenameFolder = async (folderColor, newName) => {
                      if (!activePlaylistId) return;
                      try {
                        // Keep existing description if present
                        const currentMeta = allFolderMetadata[folderColor] || {};
                        const description = currentMeta.description || '';

                        await setFolderMetadata(activePlaylistId, folderColor, newName, description);

                        // Update local state
                        setAllFolderMetadata(prev => ({
                          ...prev,
                          [folderColor]: { ...prev[folderColor], name: newName }
                        }));
                      } catch (error) {
                        console.error('Failed to rename folder:', error);
                        alert('Failed to rename folder');
                      }
                    };

                    // ... (render)

                    // Common props for both card types
                    const commonProps = {
                      video,
                      index: (currentPage - 1) * itemsPerPage + idx,
                      originalIndex,
                      isSelected: selectedVideoIndex === originalIndex,
                      isCurrentlyPlaying: currentVideoIndex === originalIndex,
                      videoFolders: videoFolderAssignments[video.id] || [],
                      selectedFolder,
                      onVideoClick: () => handleVideoClick(video, (currentPage - 1) * itemsPerPage + idx),
                      onStarClick: (e) => handleStarClick(e, video),
                      onStarColorLeftClick: handleStarColorLeftClick,
                      onStarColorRightClick: handleStarColorRightClick,
                      onMenuOptionClick: (option) => {
                        if (option.action === 'toggleSticky') {
                          handleToggleSticky(activePlaylistId, video.id);
                        } else {
                          handleMenuOptionClick(option, video);
                        }
                      },
                      onQuickAssign: handleStarClick,
                      bulkTagMode,
                      bulkTagSelections: bulkTagSelections[video.id] || new Set(),
                      onBulkTagColorClick: (color) => handleBulkTagColorClick(video, color),
                      onPinClick: () => { },
                      isStickied: isContextStickied,
                      playlistId: activePlaylistId,
                      folderMetadata: allFolderMetadata,
                      onRenameFolder: handleRenameFolder,
                      progress: (() => {
                        const data = videoProgress.get(video.id) || videoProgress.get(extractVideoId(video.video_url));
                        return data ? (typeof data === 'number' ? data : data.percentage) : 0;
                      })(),
                      isWatched: watchedVideoIds.has(extractVideoId(video.video_url) || video.video_id)
                    };

                    if (isTweet) {
                      return (
                        <div key={video.id} className="h-full">
                          <TweetCard
                            {...commonProps}
                            onVideoClick={() => {
                              setSelectedTweet(video);
                              setCurrentNavTab('tweet');
                            }}
                          />
                        </div>
                      );
                    }

                    if (video.isOrb) {
                      return (
                        <div key={video.id} className="h-full">
                          <OrbCard
                            orb={{ ...video, id: video.originalId || parseInt(video.id.replace('orb-', '')) }}
                            allPlaylists={allPlaylists}
                            onUpdatePlaylists={updateOrbFavoritePlaylists}
                            minimal={true}
                            onClick={() => {
                              applyOrbFavorite(video);
                              // Sync Navigation
                              if (activePlaylistId) {
                                setOrbNavPlaylistId(activePlaylistId);
                              }
                              setOrbNavOrbId(video.originalId || parseInt(video.id.replace('orb-', '')));
                            }}
                            currentPlaylistId={activePlaylistId}
                          />
                        </div>
                      );

                    }

                    if (video.isBannerPreset) {
                      return (
                        <div key={video.id} className="h-full">
                          <BannerPresetCard
                            preset={{ ...video, id: video.originalId || video.id.replace('banner-', '') }}
                            allPlaylists={allPlaylists}
                            onUpdatePlaylists={updateBannerPresetPlaylists}
                            onClick={() => {
                              applyBannerPreset(video);
                              // Sync Navigation
                              if (activePlaylistId) {
                                setBannerNavPlaylistId(activePlaylistId);
                              }
                              setBannerNavBannerId(video.originalId || video.id.replace('banner-', ''));
                            }}
                            currentPlaylistId={activePlaylistId}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={video.id} className="w-full h-full flex flex-col justify-center">
                        <VideoCard
                          {...commonProps}
                          cardStyle={videoCardStyle}
                        />
                      </div>
                    );
                  })}
                </div>

              </>
            ) : (
              <div className="text-center text-slate-400 py-8">
                No videos found in this playlist.
              </div>
            )}

            {/* Pagination Controls - Based on Regular Videos only, since Stickies are always shown */}
            {totalPages > 1 && (() => {
              // Calculate quarter jump targets
              // For small page counts (<=4), double-click acts as normal prev/next
              const useQuarterJumps = totalPages > 4;

              // Quarter marks: 25%, 50%, 75%, 100% of total pages
              const quarterMarks = useQuarterJumps
                ? [
                  Math.max(1, Math.round(totalPages * 0.25)),
                  Math.max(1, Math.round(totalPages * 0.5)),
                  Math.max(1, Math.round(totalPages * 0.75)),
                  totalPages
                ]
                : [];

              // Find next quarter mark (for double-click >)
              const getNextQuarter = () => {
                if (!useQuarterJumps) return Math.min(currentPage + 1, totalPages);
                const next = quarterMarks.find(q => q > currentPage);
                return next || totalPages;
              };

              // Find previous quarter mark (for double-click <)
              const getPrevQuarter = () => {
                if (!useQuarterJumps) return Math.max(currentPage - 1, 1);
                const prev = [...quarterMarks].reverse().find(q => q < currentPage);
                return prev || 1;
              };

              // Combined handler: single click, double click, and long press
              const LONG_CLICK_MS = 600;
              const DOUBLE_CLICK_MS = 300;
              let longClickTimer = null;
              let singleClickTimer = null;
              let didLongClick = false;
              let lastClickTime = 0;

              const createCombinedHandlers = (singleAction, doubleAction, longAction) => ({
                onMouseDown: () => {
                  didLongClick = false;
                  longClickTimer = setTimeout(() => {
                    didLongClick = true;
                    clearTimeout(singleClickTimer);
                    longAction();
                  }, LONG_CLICK_MS);
                },
                onMouseUp: () => {
                  clearTimeout(longClickTimer);
                  if (didLongClick) return;

                  const now = Date.now();
                  const timeSinceLastClick = now - lastClickTime;

                  if (timeSinceLastClick < DOUBLE_CLICK_MS) {
                    // Double click detected
                    clearTimeout(singleClickTimer);
                    lastClickTime = 0;
                    doubleAction();
                  } else {
                    // Potential single click - wait to see if double click comes
                    lastClickTime = now;
                    singleClickTimer = setTimeout(() => {
                      singleAction();
                      lastClickTime = 0;
                    }, DOUBLE_CLICK_MS);
                  }
                },
                onMouseLeave: () => {
                  clearTimeout(longClickTimer);
                },
                onTouchStart: () => {
                  didLongClick = false;
                  longClickTimer = setTimeout(() => {
                    didLongClick = true;
                    clearTimeout(singleClickTimer);
                    longAction();
                  }, LONG_CLICK_MS);
                },
                onTouchEnd: (e) => {
                  clearTimeout(longClickTimer);
                  if (didLongClick) {
                    e.preventDefault();
                    return;
                  }

                  const now = Date.now();
                  const timeSinceLastClick = now - lastClickTime;

                  if (timeSinceLastClick < DOUBLE_CLICK_MS) {
                    clearTimeout(singleClickTimer);
                    lastClickTime = 0;
                    doubleAction();
                  } else {
                    lastClickTime = now;
                    singleClickTimer = setTimeout(() => {
                      singleAction();
                      lastClickTime = 0;
                    }, DOUBLE_CLICK_MS);
                  }
                  e.preventDefault();
                },
              });

              // Handler sets for prev/next buttons
              const prevHandlers = createCombinedHandlers(
                () => setCurrentPage(Math.max(currentPage - 1, 1)),
                () => setCurrentPage(getPrevQuarter()),
                () => setCurrentPage(1)
              );
              const nextHandlers = createCombinedHandlers(
                () => setCurrentPage(Math.min(currentPage + 1, totalPages)),
                () => setCurrentPage(getNextQuarter()),
                () => setCurrentPage(totalPages)
              );

              return (
                <div className="flex justify-center items-center gap-3 mt-8 mb-4">
                  {/* Previous: click=prev, double-click=quarter back, hold=first */}
                  <button
                    {...prevHandlers}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors border border-slate-600 text-sky-400 hover:text-sky-300 text-lg select-none"
                    title="Click: previous | Double-click: quarter back | Hold: first page"
                  >
                    &lt;
                  </button>

                  <span className="text-slate-400 font-medium px-3 flex items-center gap-1">
                    {isEditingPage ? (
                      <input
                        ref={pageInputRef}
                        type="text"
                        value={pageInputValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPageInputValue(val);
                        }}
                        onBlur={() => {
                          const page = parseInt(pageInputValue);
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                          }
                          setIsEditingPage(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const page = parseInt(pageInputValue);
                            if (page >= 1 && page <= totalPages) {
                              setCurrentPage(page);
                            }
                            setIsEditingPage(false);
                          } else if (e.key === 'Escape') {
                            setIsEditingPage(false);
                          }
                        }}
                        className="w-12 px-1 py-0.5 bg-slate-800 border border-sky-500 rounded text-center text-sky-400 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setPageInputValue(String(currentPage));
                          setIsEditingPage(true);
                          setTimeout(() => pageInputRef.current?.select(), 0);
                        }}
                        className="cursor-pointer hover:text-sky-400 hover:underline transition-colors"
                        title="Click to jump to a specific page"
                      >
                        {currentPage}
                      </span>
                    )}
                    {' '}of {totalPages}
                  </span>

                  {/* Next: click=next, double-click=quarter forward, hold=last */}
                  <button
                    {...nextHandlers}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors border border-slate-600 text-sky-400 hover:text-sky-300 text-lg select-none"
                    title="Click: next | Double-click: quarter forward | Hold: last page"
                  >
                    &gt;
                  </button>
                </div>
              );
            })()}
          </div>
        </div >
      )
      }

      {/* Playlist Selection Modal */}
      <PlaylistSelectionModal
        isOpen={showPlaylistSelector}
        onClose={() => {
          setShowPlaylistSelector(false);
          setSelectedVideoForAction(null);
          setActionType(null);
        }}
        onSelect={handlePlaylistSelect}
        title={actionType === 'move' ? 'Move to Playlist' : 'Copy to Playlist'}
      />
    </div >
  );
};

export default VideosPage;


import React, { useState, useEffect, useRef } from 'react';
import { createPlaylist, getAllPlaylists, getPlaylistItems, deletePlaylist, deletePlaylistByName, getAllFoldersWithVideos, exportPlaylist, getFoldersForPlaylist, toggleStuckFolder, getAllStuckFolders, getVideosInFolder, getAllVideoProgress, getAllPlaylistMetadata, addVideoToPlaylist, getFolderMetadata } from '../api/playlistApi';
import { getThumbnailUrl } from '../utils/youtubeUtils';
import { usePlaylistStore } from '../store/playlistStore';
import { Play, Shuffle, Grid3x3, RotateCcw, Info, ChevronUp } from 'lucide-react';
import { useFolderStore } from '../store/folderStore';
import { useTabStore } from '../store/tabStore';
import { useTabPresetStore } from '../store/tabPresetStore';
import { useLayoutStore } from '../store/layoutStore';
import { useNavigationStore } from '../store/navigationStore';
import { getFolderColorById, FOLDER_COLORS } from '../utils/folderColors';
import { useInspectLabel } from '../utils/inspectLabels';
import PlaylistUploader from './PlaylistUploader';
import BulkPlaylistImporter from './BulkPlaylistImporter';
import LocalVideoUploader from './LocalVideoUploader';
import CardMenu from './NewCardMenu'; // Using NewCardMenu as CardMenu
import TabBar from './TabBar';
import CardThumbnail from './CardThumbnail';
import PageBanner from './PageBanner';
import { useConfigStore } from '../store/configStore';
import TabPresetsDropdown from './TabPresetsDropdown';
import AddPlaylistToTabModal from './AddPlaylistToTabModal';
import UnifiedBannerBackground from './UnifiedBannerBackground';
import PlaylistCardSkeleton from './skeletons/PlaylistCardSkeleton';
import InfiniteScrollWrapper from './InfiniteScrollWrapper';

const PlaylistsPage = ({ onVideoSelect }) => {
  const [playlists, setPlaylists] = useState([]);
  const [centeredPlaylistName, setCenteredPlaylistName] = useState('');
  const [playlistThumbnails, setPlaylistThumbnails] = useState({});
  const [playlistRecentVideos, setPlaylistRecentVideos] = useState({});
  const [playlistItemCounts, setPlaylistItemCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showBulkImporter, setShowBulkImporter] = useState(false);
  const [showLocalVideoUploader, setShowLocalVideoUploader] = useState(false);
  const [selectedPlaylistForLocalUpload, setSelectedPlaylistForLocalUpload] = useState(null);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [expandedPlaylists, setExpandedPlaylists] = useState(new Set()); // Track which playlists are expanded
  const [playlistFolders, setPlaylistFolders] = useState({}); // Store folders for each playlist: { playlistId: [folders] }
  const [stuckFolders, setStuckFolders] = useState(new Set()); // Track stuck folders: Set of "playlistId:folderColor" strings
  const [folderMetadata, setFolderMetadata] = useState({}); // Store folder custom names: { "playlistId:folderColor": { name, description } }
  const [openFolderMenuIds, setOpenFolderMenuIds] = useState(new Set()); // Track which playlists have folder selector menu open
  const [hoveredPieSegment, setHoveredPieSegment] = useState({}); // Track hovered pie segment per playlist: { playlistId: folderColorId }
  const pieChartRefs = useRef({}); // Refs for pie chart containers to handle wheel events
  const pieDataRef = useRef({ hoveredPieSegment: {}, playlistFolders: {} }); // Ref to hold latest state for wheel handler

  // Preview thumbnails - tracks shuffled thumbnail previews (presence indicates shuffle was used, for showing refresh button)
  const [previewThumbnails, setPreviewThumbnails] = useState({}); // { key: { videoId, url, videoUrl, title } } - temporary preview thumbnails
  const [playlistPreviewVideos, setPlaylistPreviewVideos] = useState({}); // { playlistId: [videos] } - for the 4 little thumbnails
  const [showThumbnailInfo, setShowThumbnailInfo] = useState(new Set()); // Set of card keys with info overlay visible

  // Global info toggle - shows video titles on all cards (persisted to localStorage)
  const [globalInfoToggle, setGlobalInfoToggle] = useState(() => {
    const saved = localStorage.getItem('playlistsPage_globalInfoToggle');
    return saved === 'true';
  });

  // Keep ref in sync with state
  pieDataRef.current.hoveredPieSegment = hoveredPieSegment;
  pieDataRef.current.playlistFolders = playlistFolders;
  const { setPlaylistItems, currentPlaylistItems, setCurrentFolder, setPreviewPlaylist, setAllPlaylists, activePlaylistId } = usePlaylistStore();
  const { showColoredFolders, setShowColoredFolders } = useFolderStore();
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());
  const { tabs, activeTabId, addPlaylistToTab, removePlaylistFromTab } = useTabStore();
  const { activePresetId, presets } = useTabPresetStore();
  const { setViewMode, viewMode, inspectMode } = useLayoutStore();
  const { customPageBannerImage, bannerHeight, bannerBgSize } = useConfigStore();
  const { setCurrentPage } = useNavigationStore();



  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;
  const hasDeletedTestPlaylist = useRef(false);

  // Sticky header state detection
  const [isStuck, setIsStuck] = useState(false);
  const stickySentinelRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const horizontalScrollRef = useRef(null);
  const arrowButtonRef = useRef(null);

  const scrollToTop = () => {
    if (horizontalScrollRef.current) {
      // For infinite scroll, "Top/Start" is the startOffset (start of real content)
      // We fall back to 0 if not set
      const target = parseFloat(horizontalScrollRef.current.dataset.startOffset || 0);
      horizontalScrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 0);
      },
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    );

    if (stickySentinelRef.current) {
      observer.observe(stickySentinelRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Convert vertical wheel scrolling to horizontal scrolling (optimized)
  useEffect(() => {
    const container = horizontalScrollRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Check if there's horizontal scroll available
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;

      if (hasHorizontalScroll) {
        // Prevent default vertical scrolling
        e.preventDefault();
        e.stopPropagation();

        // Direct scrollLeft assignment for better performance
        container.scrollLeft += e.deltaY;

        // Trigger scroll handler for auto-center detection
        container.dispatchEvent(new Event('scroll'));
      }
    };

    // Handler to detect currently centered item
    const handleScroll = () => {
      // The container referenced by horizontalScrollRef
      const scrollContainer = container;
      // The wrapper div rendered by InfiniteScrollWrapper is the first child
      const wrapper = scrollContainer.children[0];
      if (!wrapper || wrapper.children.length === 0) return;

      const containerCenter = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;

      let closestCard = null;
      let minDistance = Infinity;

      // Iterate through cards to find the one closest to the center
      Array.from(wrapper.children).forEach(child => {
        const cardCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestCard = child;
        }
      });

      if (closestCard) {
        const name = closestCard.getAttribute('data-playlist-name');
        if (name) {
          setCenteredPlaylistName(prev => prev !== name ? name : prev);
        }
      }
    };

    // Add listener to container
    container.addEventListener('wheel', handleWheel, { passive: false });
    // Add scroll listener for center detection
    container.addEventListener('scroll', handleScroll);

    // Initial check
    setTimeout(handleScroll, 100);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []); // Attach once when component mounts



  useEffect(() => {
    loadPlaylists();
    loadStuckFolders();
  }, []);

  // Persist global info toggle to localStorage
  useEffect(() => {
    localStorage.setItem('playlistsPage_globalInfoToggle', globalInfoToggle.toString());
  }, [globalInfoToggle]);

  // Fetch titles for all playlists when global info toggle is on and playlists have loaded
  useEffect(() => {
    const fetchTitlesForGlobalToggle = async () => {
      if (!globalInfoToggle || playlists.length === 0) return;

      for (const playlist of playlists) {
        const playlistKey = `playlist-${playlist.id}`;
        if (!previewThumbnails[playlistKey]?.title) {
          try {
            const items = await getPlaylistItems(playlist.id);
            if (items.length > 0) {
              const thumbData = playlistThumbnails[playlist.id];
              const activeThumbnailUrl = thumbData?.max || thumbData?.standard;
              let targetVideo = items[0];
              if (activeThumbnailUrl) {
                const coverMatch = items.find(item => {
                  const maxThumb = getThumbnailUrl(item.video_id, 'max');
                  const stdThumb = getThumbnailUrl(item.video_id, 'standard');
                  return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                });
                if (coverMatch) targetVideo = coverMatch;
              }
              setPreviewThumbnails(prev => ({
                ...prev,
                [playlistKey]: {
                  ...prev[playlistKey],
                  title: targetVideo.title,
                  videoId: targetVideo.video_id,
                  videoUrl: targetVideo.video_url,
                  url: prev[playlistKey]?.url || activeThumbnailUrl,
                  isShuffled: prev[playlistKey]?.isShuffled || false // Preserve shuffled state
                }
              }));
            }
          } catch (error) {
            console.error('Failed to fetch video title for playlist:', playlist.id, error);
          }
        }
      }
    };

    fetchTitlesForGlobalToggle();
  }, [globalInfoToggle, playlists.length, playlistThumbnails]);

  const loadStuckFolders = async () => {
    try {
      const stuck = await getAllStuckFolders();
      const stuckSet = new Set(stuck.map(([playlistId, folderColor]) => `${playlistId}:${folderColor}`));
      setStuckFolders(stuckSet);
    } catch (error) {
      console.error('Failed to load stuck folders:', error);
    }
  };

  useEffect(() => {
    // When changing tabs, reset scroll to the centered position
    scrollToTop();
  }, [activeTabId]);

  useEffect(() => {
    if (showColoredFolders) {
      loadFolders();
    } else {
      // Even when toggled off, we need folder data for stuck folders
      loadFolders();
    }
    // Reload stuck folders when toggling to ensure we have folder data
    loadStuckFolders();
  }, [showColoredFolders]);

  const loadFolders = async () => {
    try {
      console.log('Loading specific folders via optimized batch fetch...');

      // Use the batch command to get all folders at once
      const bulk = await getAllFoldersWithVideos();

      if (Array.isArray(bulk)) {
        console.log('Loaded folders (batch):', bulk.length);
        setFolders(bulk);

        // Load metadata for each folder to get custom names
        const metadataMap = {};
        await Promise.all(
          bulk.map(async (folder) => {
            try {
              const metadata = await getFolderMetadata(folder.playlist_id, folder.folder_color);
              if (metadata) {
                const key = `${folder.playlist_id}:${folder.folder_color}`;
                metadataMap[key] = { name: metadata[0], description: metadata[1] };
              }
            } catch (e) {
              // Ignore errors for individual folder metadata
            }
          })
        );
        setFolderMetadata(metadataMap);
      } else {
        setFolders([]);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
      setFolders([]);
    }
  };

  // One-time cleanup: Delete "Test Playlist" if it exists
  useEffect(() => {
    const cleanupTestPlaylist = async () => {
      if (hasDeletedTestPlaylist.current) return;
      hasDeletedTestPlaylist.current = true;

      try {
        const result = await deletePlaylistByName('Test Playlist');
        if (result) {
          console.log('Successfully deleted "Test Playlist"');
          // Reload playlists after deletion
          await loadPlaylists();
        }
      } catch (error) {
        console.error('Error deleting Test Playlist:', error);
        // Don't show error to user, just log it
      }
    };

    cleanupTestPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playlists.length > 0) {
      loadPreviews(playlists);
    }
  }, [playlists]);

  const loadPreviews = async (playlistsToLoad) => {
    const previews = {};
    // Load per playlist to avoid one big blocking call, but ideally use batched API if available
    // Since getPlaylistItems is efficient enough for local DB, we iterate
    // Using simple loop to throttle slightly if needed, or Promise.all for speed
    await Promise.all(playlistsToLoad.map(async (p) => {
      try {
        if (!playlistPreviewVideos[p.id]) { // Only load if missing
          const items = await getPlaylistItems(p.id);
          previews[p.id] = items.slice(0, 4);
        }
      } catch (e) {
        console.error("Failed to load preview for", p.id, e);
      }
    }));

    if (Object.keys(previews).length > 0) {
      setPlaylistPreviewVideos(prev => ({ ...prev, ...previews }));
    }
  };

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading playlists from database...');

      // Load playlists, metadata, and video progress in parallel
      const [data, metadataList, allProgress] = await Promise.all([
        getAllPlaylists(),
        getAllPlaylistMetadata().catch(e => {
          console.error("Failed to load metadata", e);
          return [];
        }),
        getAllVideoProgress().catch(e => {
          console.error("Failed to load video progress", e);
          return [];
        })
      ]);

      console.log('Loaded playlists:', data);

      // Create a map for quick progress lookup: video_id -> last_updated
      const progressMap = new Map();
      if (Array.isArray(allProgress)) {
        allProgress.forEach(p => {
          if (p.video_id && p.last_updated) {
            progressMap.set(p.video_id, p.last_updated);
          }
        });
      }

      // Ensure data is an array
      if (Array.isArray(data)) {
        setPlaylists(data);
        setAllPlaylists(data);

        // Process metadata
        const thumbnailMap = {};
        const recentVideoMap = {};
        const itemCountMap = {};

        // Metadata list is an array of objects
        const metadataMap = new Map();
        if (Array.isArray(metadataList)) {
          metadataList.forEach(m => metadataMap.set(m.playlist_id, m));
        }

        // Also pre-load folders for playlists to determine if expand option should be shown
        // We can use the loaded 'folders' state if available, or fetch it.
        // But loadFolders is called separately.
        // We need 'playlistFolders' map populated.
        // Since loadFolders now uses getAllFoldersWithVideos, we can derive playlistFolders from that.
        // Use a separate call here or wait for folder state?
        // Let's do a batch fetch of folders here too to be safe and populate playlistFolders
        try {
          const allFolders = await getAllFoldersWithVideos();
          if (Array.isArray(allFolders)) {
            const pFolders = {};
            allFolders.forEach(f => {
              if (!pFolders[f.playlist_id]) pFolders[f.playlist_id] = [];
              pFolders[f.playlist_id].push(f);
            });
            setPlaylistFolders(pFolders);
          }
        } catch (e) {
          console.warn("Failed to load folders for map", e);
        }

        for (const playlist of data) {
          const meta = metadataMap.get(playlist.id);

          // Item Count
          itemCountMap[playlist.id] = meta ? meta.count : 0;

          // Thumbnail
          if (playlist.custom_thumbnail_url) {
            thumbnailMap[playlist.id] = {
              max: playlist.custom_thumbnail_url,
              standard: playlist.custom_thumbnail_url
            };
          } else if (meta && meta.first_video) {
            const vid = meta.first_video;
            thumbnailMap[playlist.id] = {
              max: vid.thumbnail_url || getThumbnailUrl(vid.video_id, 'max'),
              standard: vid.thumbnail_url || getThumbnailUrl(vid.video_id, 'standard')
            };
          }

          // Recent Video
          // The backend now provides 'recent_video' based on DB query
          if (meta && meta.recent_video) {
            recentVideoMap[playlist.id] = meta.recent_video;
          }
        }

        setPlaylistThumbnails(thumbnailMap);
        setPlaylistRecentVideos(recentVideoMap);
        setPlaylistItemCounts(itemCountMap);
      } else {
        console.warn('getAllPlaylists returned non-array data:', data);
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      setError(error.message || 'Failed to load playlists from database');
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="px-8 pt-8">
          {/* Skeleton Banner */}
          <div className="w-full h-64 bg-slate-800/30 rounded-xl animate-pulse mb-8" />
        </div>
        <div className="grid grid-cols-2 gap-4 px-8 pb-8 items-start">
          {[...Array(6)].map((_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <p className="text-red-400 text-lg">Error loading playlists</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={loadPlaylists}
          className="px-4 py-2 bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
          style={{ color: '#052F4A' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-lg" style={{ color: '#052F4A' }}>No playlists found. Create one to get started!</p>
      </div>
    );
  }

  const handleUploadComplete = async () => {
    try {
      setShowUploader(false);
      await loadPlaylists(); // Reload playlists after upload
    } catch (error) {
      console.error('Error reloading playlists after upload:', error);
      // Still close the uploader even if reload fails
      setShowUploader(false);
    }
  };

  const handleBulkImportComplete = async () => {
    try {
      setShowBulkImporter(false);
      await loadPlaylists(); // Reload playlists after bulk import
      if (showColoredFolders) {
        await loadFolders();
      }
    } catch (error) {
      console.error('Error reloading playlists after bulk import:', error);
      // Still close the bulk importer even if reload fails
      setShowBulkImporter(false);
    }
  };

  const handleLocalVideoUploadComplete = async () => {
    try {
      setShowLocalVideoUploader(false);
      setSelectedPlaylistForLocalUpload(null);
      await loadPlaylists(); // Reload playlists after local video upload
    } catch (error) {
      console.error('Error reloading playlists after local video upload:', error);
      // Still close the uploader even if reload fails
      setShowLocalVideoUploader(false);
      setSelectedPlaylistForLocalUpload(null);
    }
  };

  const handleOpenLocalVideoUploader = () => {
    if (playlists.length === 0) {
      alert('Please create a playlist first before adding local videos.');
      return;
    }
    // If only one playlist, use it directly
    if (playlists.length === 1) {
      setSelectedPlaylistForLocalUpload(playlists[0].id);
      setShowLocalVideoUploader(true);
    } else {
      // Show playlist selector modal
      setShowPlaylistSelector(true);
    }
  };

  const handlePlaylistSelected = (playlistId) => {
    setSelectedPlaylistForLocalUpload(playlistId);
    setShowPlaylistSelector(false);
    setShowLocalVideoUploader(true);
  };

  const handleDeletePlaylist = async (playlistId, playlistName, e) => {
    e.stopPropagation(); // Prevent triggering the playlist click

    try {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${playlistName}"?\n\nThis will permanently delete the playlist and all its videos.`
      );

      if (!confirmed) return;

      setDeletingPlaylistId(playlistId);

      try {
        await deletePlaylist(playlistId);

        // If the deleted playlist was the current one, clear the playlist items
        if (currentPlaylistItems.length > 0) {
          setPlaylistItems([]);
        }

        // Reload playlists
        await loadPlaylists();
      } catch (deleteError) {
        console.error('Failed to delete playlist:', deleteError);
        const errorMessage = deleteError?.message || deleteError?.toString() || 'Unknown error';
        alert(`Failed to delete playlist: ${errorMessage}`);
      } finally {
        setDeletingPlaylistId(null);
      }
    } catch (error) {
      console.error('Error in delete handler:', error);
      setDeletingPlaylistId(null);
      // Don't show alert for user cancellation
      if (error.name !== 'AbortError' && !error.message?.includes('cancel')) {
        alert(`An error occurred: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleExportPlaylist = async (playlistId, playlistName) => {
    try {
      // Get export data
      const exportData = await exportPlaylist(playlistId);

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${playlistName.replace(/[^a-z0-9]/gi, '_')}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Playlist "${playlistName}" exported successfully!`);
    } catch (error) {
      console.error('Failed to export playlist:', error);
      alert(`Failed to export playlist: ${error.message || 'Unknown error'}`);
    }
  };

  const togglePlaylistExpand = async (playlistId) => {
    const isExpanded = expandedPlaylists.has(playlistId);

    if (isExpanded) {
      // Collapse: remove from expanded set
      setExpandedPlaylists(prev => {
        const newSet = new Set(prev);
        newSet.delete(playlistId);
        return newSet;
      });
    } else {
      // Expand: add to expanded set and load folders
      setExpandedPlaylists(prev => new Set(prev).add(playlistId));

      // Load folders for this playlist if not already loaded
      if (!playlistFolders[playlistId] || playlistFolders[playlistId].length === 0) {
        try {
          const folders = await getFoldersForPlaylist(playlistId);
          const folderArray = folders || [];
          console.log(`Loaded ${folderArray.length} folders for playlist ${playlistId}`);

          setPlaylistFolders(prev => ({
            ...prev,
            [playlistId]: folderArray
          }));
        } catch (error) {
          console.error(`Failed to load folders for playlist ${playlistId}:`, error);
          setPlaylistFolders(prev => ({
            ...prev,
            [playlistId]: []
          }));
        }
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {showBulkImporter ? (
        <BulkPlaylistImporter
          onImportComplete={handleBulkImportComplete}
          onCancel={() => setShowBulkImporter(false)}
        />
      ) : showUploader ? (
        <div className="flex-1 overflow-y-auto p-4 bg-transparent">
          <PlaylistUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      ) : showPlaylistSelector ? (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#052F4A' }}>Select Playlist</h3>
              <button
                onClick={() => setShowPlaylistSelector(false)}
                className="text-slate-400 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.color = '#052F4A'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(148 163 184)'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-300 text-sm mb-4">Choose a playlist to add local videos to:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handlePlaylistSelected(playlist.id)}
                  className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-transparent hover:border-sky-500"
                >
                  <div className="font-medium" style={{ color: '#052F4A' }}>{playlist.name}</div>
                  {playlist.description && (
                    <div className="text-slate-400 text-xs mt-1 line-clamp-1">{playlist.description}</div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPlaylistSelector(false)}
              className="w-full px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              style={{ color: '#052F4A' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : showLocalVideoUploader ? (
        <div className="flex-1 overflow-y-auto p-4 bg-transparent">
          <LocalVideoUploader
            playlistId={selectedPlaylistForLocalUpload}
            onUploadComplete={handleLocalVideoUploadComplete}
            onCancel={() => {
              setShowLocalVideoUploader(false);
              setSelectedPlaylistForLocalUpload(null);
            }}
          />
        </div>
      ) : (
        <>


          {/* Playlist Grid - Horizontal Scrolling */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-hidden bg-transparent relative">
            {(() => {
              const activePreset = presets.find(p => p.id === activePresetId);
              let bannerTitle = activePresetId === 'all' || !activePreset
                ? "All"
                : activePreset.name;

              if (activeTabId && activeTabId !== 'all') {
                const activeTab = tabs.find(t => t.id === activeTabId);
                if (activeTab) {
                  bannerTitle += ` - ${activeTab.name}`;
                }
              }

              // Calculate visible playlists and total videos
              // Filter logic must match the rendering logic below
              const filteredPlaylists = playlists.filter((playlist) => {
                if (activeTabId === 'all') return true;
                const activeTab = tabs.find(t => t.id === activeTabId);
                return activeTab && activeTab.playlistIds.includes(playlist.id);
              });

              const playlistCount = filteredPlaylists.length;
              const totalVideos = filteredPlaylists.reduce((sum, p) => sum + (playlistItemCounts[p.id] || 0), 0);

              return (
                <div className="px-8 pt-8">
                  <PageBanner
                    title={bannerTitle}
                    description={null}
                    folderColor={null}
                    seamlessBottom={true}
                    videoCount={playlistCount}
                    countLabel="Playlist"
                    author={`${totalVideos} Videos`}
                  />
                </div>
              );
            })()}

            {/* Sticky Sentinel */}
            <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />

            {/* Sticky Toolbar */}
            <div
              className={`sticky top-0 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-visible -mt-16
              ${isStuck
                  ? 'backdrop-blur-xl border-y shadow-2xl mx-0 rounded-none mb-6 pt-2 pb-2 bg-slate-900/70'
                  : 'backdrop-blur-[2px] border-b border-x border-t border-white/10 shadow-xl mx-8 rounded-b-2xl mb-8 mt-0 pt-1 pb-0 bg-transparent'
                }
              `}
              style={{
                backgroundColor: isStuck ? undefined : 'transparent' // Fully transparent resting state
              }}
            >


              <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>

                {/* Left: Tab Bar */}
                <div className="flex-1 overflow-x-auto no-scrollbar mask-gradient-right min-w-0">
                  <TabBar onAddPlaylistToTab={addPlaylistToTab} showPresets={true} />
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-2 ml-4 shrink-0 pl-3 border-l border-white/10">

                  {/* Global Info Toggle - Shows video titles on all cards */}
                  <button
                    onClick={async () => {
                      const newState = !globalInfoToggle;
                      setGlobalInfoToggle(newState);

                      // If turning on and we have cards without titles, fetch them
                      if (newState) {
                        // Fetch titles for all playlists that don't have preview thumbnails
                        for (const playlist of playlists) {
                          const playlistKey = `playlist-${playlist.id}`;
                          if (!previewThumbnails[playlistKey]?.title) {
                            try {
                              const items = await getPlaylistItems(playlist.id);
                              if (items.length > 0) {
                                const thumbData = playlistThumbnails[playlist.id];
                                const activeThumbnailUrl = thumbData?.max || thumbData?.standard;
                                let targetVideo = items[0];
                                if (activeThumbnailUrl) {
                                  const coverMatch = items.find(item => {
                                    const maxThumb = getThumbnailUrl(item.video_id, 'max');
                                    const stdThumb = getThumbnailUrl(item.video_id, 'standard');
                                    return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                  });
                                  if (coverMatch) targetVideo = coverMatch;
                                }
                                setPreviewThumbnails(prev => ({
                                  ...prev,
                                  [playlistKey]: {
                                    ...prev[playlistKey],
                                    title: targetVideo.title,
                                    videoId: targetVideo.video_id,
                                    videoUrl: targetVideo.video_url,
                                    url: prev[playlistKey]?.url || activeThumbnailUrl
                                  }
                                }));
                              }
                            } catch (error) {
                              console.error('Failed to fetch video title for playlist:', playlist.id, error);
                            }
                          }
                        }
                      }
                    }}
                    className={`p-1.5 rounded-md transition-all ${globalInfoToggle
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10'
                      }`}
                    title={globalInfoToggle ? "Hide All Video Titles" : "Show All Video Titles"}
                  >
                    <Info size={16} />
                  </button>

                  {/* Folder Toggle - Icon Only */}
                  <button
                    onClick={() => setShowColoredFolders(!showColoredFolders)}
                    className={`p-1.5 rounded-md transition-all ${showColoredFolders
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/10'
                      }`}
                    title={showColoredFolders ? "Hide Folders" : "Show Folders"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>

                  {/* Add Playlist - Icon Only */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="p-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-md transition-all shadow-lg hover:shadow-sky-500/25 border border-white/10"
                    title="Add Playlist"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

              </div>
            </div>

            {/* Horizontal Scrolling Grid */}
            <div
              className="px-4 pb-8"
              onWheel={(e) => {
                // Handle wheel scrolling on the entire playlist area
                const container = horizontalScrollRef.current;
                if (container && container.scrollWidth > container.clientWidth) {
                  e.preventDefault();
                  e.stopPropagation();
                  // Direct scrollLeft assignment for better performance
                  container.scrollLeft += e.deltaY;

                  // Trigger scroll handler for auto-center detection
                  container.dispatchEvent(new Event('scroll'));
                }
              }}
            >
              <div
                ref={horizontalScrollRef}
                className="horizontal-video-scroll"
                style={{
                  width: '100%',
                  overflowX: 'scroll',
                  overflowY: 'hidden',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(148, 163, 184, 0.6) rgba(15, 23, 42, 0.3)',
                  WebkitOverflowScrolling: 'touch',
                  marginTop: '-32px'
                }}
              >
                <InfiniteScrollWrapper scrollRef={horizontalScrollRef}>
                  {/* Colored Folders - Grouped by playlist with headers */}
                  {showColoredFolders && (() => {
                    // Filter folders
                    const filteredFolders = folders.filter((folder) => {
                      const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                      if (stuckFolders.has(folderKey)) return false;
                      if (activeTabId === 'all') return true;
                      const activeTab = tabs.find(t => t.id === activeTabId);
                      return activeTab && activeTab.playlistIds.includes(folder.playlist_id);
                    });

                    // Group folders by playlist_id
                    const groupedFolders = {};
                    filteredFolders.forEach((folder) => {
                      if (!groupedFolders[folder.playlist_id]) {
                        groupedFolders[folder.playlist_id] = [];
                      }
                      groupedFolders[folder.playlist_id].push(folder);
                    });

                    // Get playlist order for consistent sorting
                    const playlistOrder = playlists.map(p => p.id);

                    // Sort groups by playlist order
                    const sortedPlaylistIds = Object.keys(groupedFolders)
                      .map(id => parseInt(id))
                      .sort((a, b) => playlistOrder.indexOf(a) - playlistOrder.indexOf(b));

                    // Render grouped folders with headers
                    return sortedPlaylistIds.map((playlistId) => {
                      const playlistFoldersGroup = groupedFolders[playlistId];
                      const parentPlaylist = playlists.find(p => p.id === playlistId);
                      const playlistName = parentPlaylist?.name || 'Unknown Playlist';

                      return (
                        <React.Fragment key={`folder-group-${playlistId}`}>
                          {/* Playlist Header - full width in horizontal scroll */}
                          <div className="flex items-center gap-3 mt-2 mb-1" style={{ minWidth: '800px' }}>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-2">
                              {playlistName}
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                          </div>

                          {/* Folder cards for this playlist */}
                          {playlistFoldersGroup.map((folder, index) => {
                            const folderColor = getFolderColorById(folder.folder_color);
                            const folderMetadataKey = `${folder.playlist_id}:${folder.folder_color}`;
                            const customFolderName = folderMetadata[folderMetadataKey]?.name;
                            const displayFolderName = customFolderName || folderColor.name;
                            const folderImageKey = `folder-${folder.playlist_id}-${folder.folder_color}`;
                            const thumbUrls = folder.first_video ? {
                              max: getThumbnailUrl(folder.first_video.video_id, 'max'),
                              standard: getThumbnailUrl(folder.first_video.video_id, 'standard')
                            } : null;

                            const useFallback = imageLoadErrors.has(folderImageKey);
                            // Check for preview thumbnail first (when preview shuffle mode is active)
                            const previewThumb = previewThumbnails[folderImageKey];
                            const activeThumbnailUrl = previewThumb
                              ? previewThumb.url
                              : (thumbUrls ? (useFallback ? thumbUrls.standard : thumbUrls.max) : null);

                            return (
                              <div
                                key={`folder-${folder.playlist_id}-${folder.folder_color}-${index}`}
                                onClick={async (e) => {
                                  if (e.target.closest('[data-card-menu="true"]')) {
                                    return;
                                  }
                                  e.stopPropagation();
                                  try {
                                    const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                    setPlaylistItems(items, folder.playlist_id, { playlist_id: folder.playlist_id, folder_color: folder.folder_color });
                                    if (items.length > 0 && onVideoSelect) {
                                      onVideoSelect(items[0].video_url);
                                    } else if (folder.first_video && onVideoSelect) {
                                      onVideoSelect(folder.first_video.video_url);
                                    }
                                  } catch (error) {
                                    console.error('Failed to load folder items:', error);
                                  }
                                }}
                                className="cursor-pointer group relative"
                                style={{ width: '500px', flexShrink: 0 }}
                                data-playlist-card="true"
                              >
                                <div className="border-2 border-slate-700/50 rounded-xl p-2 bg-slate-100/90 hover:border-sky-500/50 transition-colors h-full flex flex-col">
                                  {/* Folder Title Bar */}
                                  <div className="mb-2 flex items-center justify-between border-2 border-[#052F4A] rounded-md p-1 bg-slate-100/90 shadow-sm relative overflow-hidden h-[38px]">
                                    <div className="flex items-center gap-2 pl-1 flex-1 min-w-0">
                                      <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: folderColor.hex }}
                                      />
                                      <h3 className="font-bold text-lg truncate transition-colors text-left"
                                        style={{ color: '#052F4A' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}
                                        title={displayFolderName}>
                                        {displayFolderName}
                                      </h3>
                                    </div>

                                    {/* Hover Controls - 3 Segments */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-0 bottom-0 pr-1 pl-4 bg-gradient-to-l from-slate-100 via-slate-100 to-transparent">
                                      {/* Segment 1: Preview (Grid Icon) */}
                                      <div className="flex items-center">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                              setPreviewPlaylist(items, folder.playlist_id, { playlist_id: folder.playlist_id, folder_color: folder.folder_color });
                                              setCurrentPage('videos');
                                              if (viewMode === 'full') {
                                                setViewMode('half');
                                              }
                                            } catch (error) {
                                              console.error('Failed to load folder items for preview:', error);
                                            }
                                          }}
                                          className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                          title="Preview folder"
                                        >
                                          <Grid3x3 size={18} strokeWidth={2.5} />
                                        </button>
                                      </div>

                                      {/* Separator */}
                                      <div className="w-px h-5 bg-slate-300 mx-0.5" />

                                      {/* Segment 2: Refresh (conditional) + Shuffle */}
                                      <div className="flex items-center gap-0.5">
                                        {/* Refresh button - only visible after shuffle has been used */}
                                        {previewThumbnails[folderImageKey]?.isShuffled && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Reset to default thumbnail
                                              setPreviewThumbnails(prev => {
                                                const { [folderImageKey]: _, ...rest } = prev;
                                                return rest;
                                              });
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                            title="Reset to default cover"
                                          >
                                            <RotateCcw size={18} strokeWidth={2.5} />
                                          </button>
                                        )}
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                              if (items.length === 0) return;

                                              // Shuffle only changes thumbnail preview
                                              const randomVideo = items[Math.floor(Math.random() * items.length)];
                                              const thumbUrl = getThumbnailUrl(randomVideo.video_id, 'max');
                                              setPreviewThumbnails(prev => ({
                                                ...prev,
                                                [folderImageKey]: { videoId: randomVideo.video_id, url: thumbUrl, videoUrl: randomVideo.video_url, title: randomVideo.title, isShuffled: true }
                                              }));
                                            } catch (error) {
                                              console.error('Failed to shuffle thumbnail:', error);
                                            }
                                          }}
                                          className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                          title="Preview random thumbnail"
                                        >
                                          <Shuffle size={18} />
                                        </button>
                                      </div>

                                      {/* Separator */}
                                      <div className="w-px h-5 bg-slate-300 mx-0.5" />

                                      {/* Segment 3: Play + Info */}
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                              setPlaylistItems(items, folder.playlist_id, { playlist_id: folder.playlist_id, folder_color: folder.folder_color });

                                              if (items.length > 0 && onVideoSelect) {
                                                // If we have a preview thumbnail, play that video
                                                const previewThumb = previewThumbnails[folderImageKey];
                                                if (previewThumb?.videoUrl) {
                                                  onVideoSelect(previewThumb.videoUrl);
                                                } else {
                                                  // Otherwise find video matching current cover or play first
                                                  let targetVideo = items[0];
                                                  if (activeThumbnailUrl) {
                                                    const coverMatch = items.find(item => {
                                                      const maxThumb = getThumbnailUrl(item.video_id, 'max');
                                                      const stdThumb = getThumbnailUrl(item.video_id, 'standard');
                                                      return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                                    });
                                                    if (coverMatch) targetVideo = coverMatch;
                                                  }
                                                  onVideoSelect(targetVideo.video_url);
                                                }
                                              }
                                            } catch (error) {
                                              console.error('Failed to load folder items:', error);
                                            }
                                          }}
                                          className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                          title="Play thumbnail video"
                                        >
                                          <Play size={18} fill="currentColor" />
                                        </button>
                                        {/* Info Button */}
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const isCurrentlyShowing = showThumbnailInfo.has(folderImageKey);

                                            if (!isCurrentlyShowing && !previewThumbnails[folderImageKey]?.title) {
                                              // Toggling ON and no title yet - fetch it
                                              try {
                                                const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                                if (items.length > 0) {
                                                  // Find the video matching the current thumbnail
                                                  let targetVideo = items[0];
                                                  if (activeThumbnailUrl) {
                                                    const coverMatch = items.find(item => {
                                                      const maxThumb = getThumbnailUrl(item.video_id, 'max');
                                                      const stdThumb = getThumbnailUrl(item.video_id, 'standard');
                                                      return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                                    });
                                                    if (coverMatch) targetVideo = coverMatch;
                                                  }
                                                  // Store the title without changing the thumbnail
                                                  setPreviewThumbnails(prev => ({
                                                    ...prev,
                                                    [folderImageKey]: {
                                                      ...prev[folderImageKey],
                                                      title: targetVideo.title,
                                                      videoId: targetVideo.video_id,
                                                      videoUrl: targetVideo.video_url,
                                                      url: prev[folderImageKey]?.url || activeThumbnailUrl
                                                    }
                                                  }));
                                                }
                                              } catch (error) {
                                                console.error('Failed to fetch video title:', error);
                                              }
                                            }

                                            setShowThumbnailInfo(prev => {
                                              const next = new Set(prev);
                                              if (next.has(folderImageKey)) {
                                                next.delete(folderImageKey);
                                              } else {
                                                next.add(folderImageKey);
                                              }
                                              return next;
                                            });
                                          }}
                                          className={`p-1 rounded transition-colors ${(showThumbnailInfo.has(folderImageKey) || globalInfoToggle)
                                            ? 'bg-sky-500 text-white'
                                            : 'hover:bg-slate-200 text-[#052F4A] hover:text-sky-600'
                                            }`}
                                          title={globalInfoToggle ? "Global info ON" : "Show video title"}
                                        >
                                          <Info size={18} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Thumbnail */}
                                  <div className="rounded-lg overflow-hidden relative group mt-auto" style={{
                                    width: '100%',
                                    paddingBottom: '56.25%',
                                    backgroundColor: '#0f172a',
                                  }}>
                                    {activeThumbnailUrl ? (
                                      <img
                                        src={activeThumbnailUrl}
                                        alt={folder.first_video?.title || 'Folder thumbnail'}
                                        onError={() => {
                                          if (!useFallback) {
                                            setImageLoadErrors(prev => new Set(prev).add(folderImageKey));
                                          }
                                        }}
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          display: 'block'
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        <svg
                                          className="w-12 h-12 text-slate-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                          />
                                        </svg>
                                      </div>
                                    )}

                                    {/* Video Title Overlay - shown when info button is toggled or global toggle is on */}
                                    {(showThumbnailInfo.has(folderImageKey) || globalInfoToggle) && previewThumbnails[folderImageKey]?.title && (
                                      <div
                                        className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1.5 z-20"
                                        style={{ backdropFilter: 'blur(4px)' }}
                                      >
                                        <p className="text-white text-sm font-medium truncate">
                                          {previewThumbnails[folderImageKey].title}
                                        </p>
                                      </div>
                                    )}

                                    {/* 3-dot menu */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30" onClick={(e) => e.stopPropagation()}>
                                      <CardMenu
                                        options={[
                                          {
                                            label: stuckFolders.has(`${folder.playlist_id}:${folder.folder_color}`) ? 'Unstick Folder' : 'Stick Folder',
                                            icon: stuckFolders.has(`${folder.playlist_id}:${folder.folder_color}`) ? (
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            ) : (
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                              </svg>
                                            ),
                                            action: 'toggleStick',
                                          },
                                          {
                                            label: 'Convert to Playlist',
                                            icon: (
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                            ),
                                            action: 'convertToPlaylist',
                                          },
                                        ]}
                                        onOptionClick={async (option) => {
                                          if (option.action === 'toggleStick') {
                                            try {
                                              const newStuckStatus = await toggleStuckFolder(folder.playlist_id, folder.folder_color);
                                              const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                                              setStuckFolders((prev) => {
                                                const next = new Set(prev);
                                                if (newStuckStatus) {
                                                  next.add(folderKey);
                                                } else {
                                                  next.delete(folderKey);
                                                }
                                                return next;
                                              });
                                            } catch (error) {
                                              console.error('Failed to toggle stick folder:', error);
                                            }
                                          } else if (option.action === 'convertToPlaylist') {
                                            try {
                                              const parentPlaylist = playlists.find(p => p.id === folder.playlist_id);
                                              const parentName = parentPlaylist ? parentPlaylist.name : 'Unknown';
                                              const defaultName = `${parentName} - ${displayFolderName}`;

                                              const playlistName = window.prompt(
                                                'Enter a name for the new playlist:',
                                                defaultName
                                              );

                                              if (!playlistName) return;

                                              const folderVideos = await getVideosInFolder(folder.playlist_id, folder.folder_color);

                                              if (!folderVideos || folderVideos.length === 0) {
                                                alert('No videos found in this folder.');
                                                return;
                                              }

                                              const newPlaylistId = await createPlaylist(playlistName, `Converted from ${parentName} - ${displayFolderName} folder`);

                                              let addedCount = 0;
                                              for (const video of folderVideos) {
                                                try {
                                                  await addVideoToPlaylist(
                                                    newPlaylistId,
                                                    video.video_url,
                                                    video.video_id,
                                                    video.title,
                                                    video.thumbnail_url,
                                                    video.author || null,
                                                    video.view_count || null,
                                                    video.published_at || null,
                                                    video.is_local || false
                                                  );
                                                  addedCount++;
                                                } catch (videoError) {
                                                  console.error('Failed to add video:', videoError);
                                                }
                                              }

                                              await loadPlaylists();

                                              alert(`Successfully created playlist "${playlistName}" with ${addedCount} videos!`);
                                            } catch (error) {
                                              console.error('Failed to convert folder to playlist:', error);
                                              alert(`Failed to convert folder: ${error.message || 'Unknown error'}`);
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()}

                  {/* Source Playlists Header - only show when colored folders are visible */}
                  {showColoredFolders && (
                    <div className="flex items-center gap-3 mt-4 mb-2" style={{ minWidth: '800px' }}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-600/50 to-transparent" />
                      <h2 className="text-sm font-semibold text-sky-400 uppercase tracking-wider px-2">
                        Source Playlists
                      </h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-600/50 to-transparent" />
                    </div>
                  )}

                  {/* Regular Playlists - Filtered by active tab */}
                  {(() => {
                    // Build a flat array of items (playlists + their expanded folders)
                    const filteredPlaylists = playlists.filter((playlist) => {
                      if (activeTabId === 'all') return true;
                      const activeTab = tabs.find(t => t.id === activeTabId);
                      return activeTab && activeTab.playlistIds.includes(playlist.id);
                    });

                    const items = [];
                    const processedStuckFolders = new Set(); // Track which stuck folders we've already added

                    filteredPlaylists.forEach((playlist) => {
                      // Add the playlist itself
                      items.push({ type: 'playlist', data: playlist });

                      // If expanded, add its folders right after
                      const isExpanded = expandedPlaylists.has(playlist.id);
                      const folders = playlistFolders[playlist.id] || [];
                      if (isExpanded && folders.length > 0) {
                        folders.forEach((folder) => {
                          const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                          processedStuckFolders.add(folderKey);
                          items.push({ type: 'folder', data: folder, parentPlaylist: playlist });
                        });
                      }

                      // Also add stuck folders for this playlist (even if not expanded)
                      folders.forEach((folder) => {
                        const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                        if (stuckFolders.has(folderKey) && !processedStuckFolders.has(folderKey)) {
                          processedStuckFolders.add(folderKey);
                          items.push({ type: 'folder', data: folder, parentPlaylist: playlist, isStuck: true });
                        }
                      });
                    });

                    // Also add stuck folders from the global folders list (for when showColoredFolders is off)
                    if (!showColoredFolders) {
                      folders.forEach((folder) => {
                        const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                        if (stuckFolders.has(folderKey) && !processedStuckFolders.has(folderKey)) {
                          // Check if playlist is in filtered list
                          const parentPlaylist = playlists.find(p => p.id === folder.playlist_id);
                          if (parentPlaylist) {
                            const isInFiltered = activeTabId === 'all' ||
                              tabs.find(t => t.id === activeTabId)?.playlistIds.includes(folder.playlist_id);
                            if (isInFiltered) {
                              processedStuckFolders.add(folderKey);
                              items.push({ type: 'folder', data: folder, parentPlaylist: parentPlaylist, isStuck: true });
                            }
                          }
                        }
                      });
                    }

                    return items.map((item, index) => {
                      if (item.type === 'playlist') {
                        const playlist = item.data;
                        const thumbData = playlistThumbnails[playlist.id];
                        const playlistImageKey = `playlist-${playlist.id}`;
                        const useFallback = imageLoadErrors.has(playlistImageKey);
                        // Check for preview thumbnail first (when preview shuffle mode is active)
                        const previewThumb = previewThumbnails[playlistImageKey];
                        const activeThumbnailUrl = previewThumb
                          ? previewThumb.url
                          : (thumbData ? (useFallback ? thumbData.standard : thumbData.max) : null);

                        const recentVideo = playlistRecentVideos[playlist.id];
                        const itemCount = playlistItemCounts[playlist.id] || 0;
                        const isExpanded = expandedPlaylists.has(playlist.id);
                        const folders = playlistFolders[playlist.id] || [];
                        const hasFolders = folders.length > 0;

                        return (
                          <div
                            key={playlist.id}
                            onClick={async (e) => {
                              // Don't trigger if clicking on menu
                              if (e.target.closest('[data-card-menu="true"]')) {
                                return;
                              }
                              try {
                                const items = await getPlaylistItems(playlist.id);
                                setPlaylistItems(items, playlist.id, null, playlist.name);
                                if (items.length > 0 && onVideoSelect) {
                                  onVideoSelect(items[0].video_url);
                                }
                              } catch (error) {
                                console.error('Failed to load playlist items:', error);
                              }
                            }}
                            className="cursor-pointer group relative"
                            title={getInspectTitle(`Playlist: ${playlist.name}`)}
                            style={{ width: '500px', flexShrink: 0 }}
                            data-playlist-card="true"
                            data-playlist-name={playlist.name}
                          >
                            <div
                              className={`border-2 border-slate-700/50 rounded-xl p-2 bg-slate-100/90 hover:border-sky-500/50 transition-colors h-full flex flex-col ${String(playlist.id) === String(activePlaylistId) ? 'active-playlist-marker' : ''}`}
                              data-active-playlist={String(playlist.id) === String(activePlaylistId) ? "true" : "false"}
                            >
                              {/* Playlist Info */}
                              <div className="mb-2 flex items-center justify-between border-2 border-[#052F4A] rounded-md p-1 bg-slate-100/90 shadow-sm relative overflow-hidden h-[38px]">
                                <h3 className="font-bold text-lg truncate transition-colors pl-1 flex-1 text-left"
                                  style={{ color: '#052F4A' }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}
                                  title={playlist.name}>
                                  {playlist.name}
                                </h3>

                                {/* Hover Controls - 3 Segments */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-0 bottom-0 pr-1 pl-4 bg-gradient-to-l from-slate-100 via-slate-100 to-transparent">
                                  {/* Segment 1: Preview (Grid Icon) */}
                                  <div className="flex items-center">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const items = await getPlaylistItems(playlist.id);
                                          setPreviewPlaylist(items, playlist.id, null);
                                          setCurrentPage('videos');
                                          if (viewMode === 'full') {
                                            setViewMode('half');
                                          }
                                        } catch (error) {
                                          console.error('Failed to load playlist items for preview:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                      title="Preview playlist"
                                    >
                                      <Grid3x3 size={18} strokeWidth={2.5} />
                                    </button>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px h-5 bg-slate-300 mx-0.5" />

                                  {/* Segment 2: Refresh (conditional) + Shuffle */}
                                  <div className="flex items-center gap-0.5">
                                    {/* Refresh button - only visible after shuffle has been used */}
                                    {previewThumbnails[playlistImageKey]?.isShuffled && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Reset to default thumbnail
                                          setPreviewThumbnails(prev => {
                                            const { [playlistImageKey]: _, ...rest } = prev;
                                            return rest;
                                          });
                                        }}
                                        className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                        title="Reset to default cover"
                                      >
                                        <RotateCcw size={18} strokeWidth={2.5} />
                                      </button>
                                    )}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const items = await getPlaylistItems(playlist.id);
                                          if (items.length === 0) return;

                                          // Shuffle only changes thumbnail preview
                                          const randomVideo = items[Math.floor(Math.random() * items.length)];
                                          const thumbUrl = getThumbnailUrl(randomVideo.video_id, 'max');
                                          setPreviewThumbnails(prev => ({
                                            ...prev,
                                            [playlistImageKey]: { videoId: randomVideo.video_id, url: thumbUrl, videoUrl: randomVideo.video_url, title: randomVideo.title, isShuffled: true }
                                          }));
                                        } catch (error) {
                                          console.error('Failed to shuffle thumbnail:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                      title="Preview random thumbnail"
                                    >
                                      <Shuffle size={18} />
                                    </button>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px h-5 bg-slate-300 mx-0.5" />

                                  {/* Segment 3: Play + Folder Menu + Info */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const items = await getPlaylistItems(playlist.id);
                                          setPlaylistItems(items, playlist.id, null, playlist.name);

                                          if (items.length > 0 && onVideoSelect) {
                                            // If we have a preview thumbnail, play that video
                                            const previewThumb = previewThumbnails[playlistImageKey];
                                            if (previewThumb?.videoUrl) {
                                              onVideoSelect(previewThumb.videoUrl);
                                            } else {
                                              // Otherwise find video matching current cover or play first
                                              let targetVideo = items[0];
                                              if (activeThumbnailUrl) {
                                                const coverMatch = items.find(item => {
                                                  const maxThumb = getThumbnailUrl(item.video_id, 'max');
                                                  const stdThumb = getThumbnailUrl(item.video_id, 'standard');
                                                  return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                                });
                                                if (coverMatch) targetVideo = coverMatch;
                                              }
                                              onVideoSelect(targetVideo.video_url);
                                            }
                                          }
                                        } catch (error) {
                                          console.error('Failed to load playlist items:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                      title="Play thumbnail video"
                                    >
                                      <Play size={18} fill="currentColor" />
                                    </button>
                                    {/* Folder Menu Toggle */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const isOpen = openFolderMenuIds.has(playlist.id);
                                        if (isOpen) {
                                          // Clean up ref so it re-attaches when reopened
                                          delete pieChartRefs.current[playlist.id];
                                        } else {
                                          // Auto-select first folder when opening
                                          const folders = playlistFolders[playlist.id] || [];
                                          if (folders.length > 0) {
                                            setHoveredPieSegment(prev => ({
                                              ...prev,
                                              [playlist.id]: folders[0].folder_color
                                            }));
                                          }
                                        }
                                        setOpenFolderMenuIds(prev => {
                                          const next = new Set(prev);
                                          if (next.has(playlist.id)) {
                                            next.delete(playlist.id);
                                          } else {
                                            next.add(playlist.id);
                                          }
                                          return next;
                                        });
                                      }}
                                      className={`p-1 rounded transition-colors ${openFolderMenuIds.has(playlist.id)
                                        ? 'bg-sky-500 text-white'
                                        : 'hover:bg-slate-200 text-[#052F4A] hover:text-sky-600'
                                        }`}
                                      title="Folder colors"
                                    >
                                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                    </button>
                                    {/* Info Button */}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const isCurrentlyShowing = showThumbnailInfo.has(playlistImageKey);

                                        if (!isCurrentlyShowing && !previewThumbnails[playlistImageKey]?.title) {
                                          // Toggling ON and no title yet - fetch it
                                          try {
                                            const items = await getPlaylistItems(playlist.id);
                                            if (items.length > 0) {
                                              // Find the video matching the current thumbnail
                                              let targetVideo = items[0];
                                              if (activeThumbnailUrl) {
                                                const coverMatch = items.find(item => {
                                                  const maxThumb = getThumbnailUrl(item.video_id, 'max');
                                                  const stdThumb = getThumbnailUrl(item.video_id, 'standard');
                                                  return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                                });
                                                if (coverMatch) targetVideo = coverMatch;
                                              }
                                              // Store the title without changing the thumbnail
                                              setPreviewThumbnails(prev => ({
                                                ...prev,
                                                [playlistImageKey]: {
                                                  ...prev[playlistImageKey],
                                                  title: targetVideo.title,
                                                  videoId: targetVideo.video_id,
                                                  videoUrl: targetVideo.video_url,
                                                  url: prev[playlistImageKey]?.url || activeThumbnailUrl
                                                }
                                              }));
                                            }
                                          } catch (error) {
                                            console.error('Failed to fetch video title:', error);
                                          }
                                        }

                                        setShowThumbnailInfo(prev => {
                                          const next = new Set(prev);
                                          if (next.has(playlistImageKey)) {
                                            next.delete(playlistImageKey);
                                          } else {
                                            next.add(playlistImageKey);
                                          }
                                          return next;
                                        });
                                      }}
                                      className={`p-1 rounded transition-colors ${(showThumbnailInfo.has(playlistImageKey) || globalInfoToggle)
                                        ? 'bg-sky-500 text-white'
                                        : 'hover:bg-slate-200 text-[#052F4A] hover:text-sky-600'
                                        }`}
                                      title={globalInfoToggle ? "Global info ON" : "Show video title"}
                                    >
                                      <Info size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Thumbnail */}
                              <div className="rounded-lg overflow-hidden relative group mt-auto border-2 border-[#052F4A]" style={{
                                width: '100%',
                                paddingBottom: '56.25%', // 16:9 aspect ratio
                                backgroundColor: '#0f172a',
                              }}>
                                {activeThumbnailUrl ? (
                                  <img
                                    src={activeThumbnailUrl}
                                    alt={playlist.name}
                                    onError={() => {
                                      if (!useFallback) {
                                        setImageLoadErrors(prev => new Set(prev).add(playlistImageKey));
                                      }
                                    }}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <svg
                                      className="w-12 h-12 text-slate-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                      />
                                    </svg>
                                  </div>
                                )}

                                {/* Video Title Overlay - shown when info button is toggled or global toggle is on */}
                                {(showThumbnailInfo.has(playlistImageKey) || globalInfoToggle) && previewThumbnails[playlistImageKey]?.title && (
                                  <div
                                    className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1.5 z-20"
                                    style={{ backdropFilter: 'blur(4px)' }}
                                  >
                                    <p className="text-white text-sm font-medium truncate">
                                      {previewThumbnails[playlistImageKey].title}
                                    </p>
                                  </div>
                                )}

                                {/* Play overlay on hover - REMOVED per user request */}

                                {/* 3-dot menu - moved to hover overlay (Top Right) */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30" onClick={e => e.stopPropagation()}>
                                  <CardMenu
                                    options={[
                                      {
                                        label: isExpanded ? 'Collapse Folders' : 'Expand Folders',
                                        icon: (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                          </svg>
                                        ),
                                        action: 'toggleFolders',
                                      },
                                      {
                                        label: 'Export Playlist',
                                        icon: (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        ),
                                        action: 'export',
                                      },
                                      {
                                        label: 'Add to Tab',
                                        submenu: 'tabs',
                                        icon: (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                          </svg>
                                        ),
                                      },
                                      ...(activeTabId !== 'all' ? [{
                                        label: 'Remove from Tab',
                                        icon: (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                          </svg>
                                        ),
                                        action: 'removeFromTabCurrent',
                                        danger: true
                                      }] : []),
                                      {
                                        label: deletingPlaylistId === playlist.id ? 'Deleting...' : 'Delete',
                                        danger: true,
                                        icon: deletingPlaylistId === playlist.id ? (
                                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        ),
                                        action: 'delete',
                                        disabled: deletingPlaylistId === playlist.id,
                                      },
                                    ]}
                                    submenuOptions={{
                                      tabs: tabs
                                        .filter(tab => tab.id !== 'all')
                                        .map(tab => {
                                          const isInTab = tab.playlistIds.includes(playlist.id);
                                          return {
                                            label: isInTab ? `✓ ${tab.name}` : tab.name,
                                            action: isInTab ? 'removeFromTab' : 'addToTab',
                                            tabId: tab.id,
                                          };
                                        }),
                                    }}
                                    onOptionClick={(option) => {
                                      if (option.action === 'toggleFolders') {
                                        togglePlaylistExpand(playlist.id);
                                      } else if (option.action === 'export') {
                                        handleExportPlaylist(playlist.id, playlist.name);
                                      } else if (option.action === 'removeFromTabCurrent') {
                                        console.log('Removing playlist', playlist.id, 'from active tab', activeTabId);
                                        removePlaylistFromTab(activeTabId, playlist.id);
                                      } else if (option.action === 'delete' && !option.disabled) {
                                        handleDeletePlaylist(playlist.id, playlist.name, { stopPropagation: () => { } });
                                      } else if (option.action === 'addToTab') {
                                        addPlaylistToTab(option.tabId, playlist.id);
                                      } else if (option.action === 'removeFromTab') {
                                        removePlaylistFromTab(option.tabId, playlist.id);
                                      }
                                    }}
                                  />
                                </div>

                              </div>

                              {/* Expandable Folder Color Menu - Pie Chart */}
                              {openFolderMenuIds.has(playlist.id) && (() => {
                                const playlistFolderList = playlistFolders[playlist.id] || [];
                                const totalVideos = playlistFolderList.reduce((acc, f) => acc + (f.video_count || 1), 0);

                                // Calculate pie segments
                                let cumulativeAngle = 0;
                                const pieSegments = playlistFolderList.map((folder) => {
                                  const folderColorData = getFolderColorById(folder.folder_color);
                                  const folderMetaKey = `${folder.playlist_id}:${folder.folder_color}`;
                                  const customName = folderMetadata[folderMetaKey]?.name;
                                  const displayName = customName || folderColorData.name;
                                  const videoCount = folder.video_count || 1;
                                  const angle = (videoCount / totalVideos) * 360;
                                  const startAngle = cumulativeAngle;
                                  cumulativeAngle += angle;

                                  return {
                                    folder,
                                    folderColorData,
                                    displayName,
                                    videoCount,
                                    startAngle,
                                    endAngle: cumulativeAngle,
                                    angle,
                                    percentage: (videoCount / totalVideos) * 100
                                  };
                                });

                                // Get hover state for this playlist's pie chart
                                const hoveredSegmentId = hoveredPieSegment[playlist.id] || null;
                                const hoveredSegment = pieSegments.find(s => s.folder.folder_color === hoveredSegmentId);

                                return (
                                  <div
                                    className="mt-2 rounded-lg bg-slate-800/90 border border-slate-600/50 p-3 animate-in slide-in-from-top-2 duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-medium text-slate-300">Colored Folders</span>
                                      <button
                                        onClick={() => {
                                          // Clean up ref so it re-attaches when reopened
                                          delete pieChartRefs.current[playlist.id];
                                          setOpenFolderMenuIds(prev => {
                                            const next = new Set(prev);
                                            next.delete(playlist.id);
                                            return next;
                                          });
                                        }}
                                        className="text-slate-400 hover:text-white transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                    {playlistFolderList.length > 0 ? (
                                      <div
                                        className="flex items-center gap-4"
                                        ref={(el) => {
                                          if (el && pieChartRefs.current[playlist.id] !== el) {
                                            pieChartRefs.current[playlist.id] = el;
                                            const playlistId = playlist.id; // Capture playlist.id in closure
                                            const wheelHandler = (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();

                                              const segments = pieDataRef.current.playlistFolders[playlistId] || [];
                                              if (segments.length === 0) return;

                                              const currentHovered = pieDataRef.current.hoveredPieSegment[playlistId];
                                              const currentIndex = segments.findIndex(s => s.folder_color === currentHovered);
                                              let newIndex;

                                              if (e.deltaY > 0) {
                                                // Scroll down - go to next segment
                                                newIndex = currentIndex < segments.length - 1 ? currentIndex + 1 : 0;
                                              } else {
                                                // Scroll up - go to previous segment  
                                                newIndex = currentIndex > 0 ? currentIndex - 1 : segments.length - 1;
                                              }

                                              setHoveredPieSegment(prev => ({
                                                ...prev,
                                                [playlistId]: segments[newIndex].folder_color
                                              }));
                                            };
                                            el.addEventListener('wheel', wheelHandler, { passive: false });
                                          }
                                        }}
                                      >
                                        {/* Pie Chart - Left Side */}
                                        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
                                          <svg viewBox="-100 -100 200 200" className="transform -rotate-90 w-full h-full">
                                            {/* Pie Segments */}
                                            {pieSegments.map((segment, idx) => {
                                              const outerRadius = 80;
                                              const innerRadius = 35;
                                              const startRad = (segment.startAngle * Math.PI) / 180;
                                              const endRad = (segment.endAngle * Math.PI) / 180;

                                              const x1 = Math.cos(startRad) * outerRadius;
                                              const y1 = Math.sin(startRad) * outerRadius;
                                              const x2 = Math.cos(endRad) * outerRadius;
                                              const y2 = Math.sin(endRad) * outerRadius;
                                              const x3 = Math.cos(endRad) * innerRadius;
                                              const y3 = Math.sin(endRad) * innerRadius;
                                              const x4 = Math.cos(startRad) * innerRadius;
                                              const y4 = Math.sin(startRad) * innerRadius;

                                              const largeArcFlag = segment.angle > 180 ? 1 : 0;
                                              const isHovered = hoveredSegmentId === segment.folder.folder_color;

                                              const pathData = [
                                                `M ${x1} ${y1}`,
                                                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                                `L ${x3} ${y3}`,
                                                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                                                `Z`
                                              ].join(' ');

                                              return (
                                                <path
                                                  key={segment.folder.folder_color}
                                                  d={pathData}
                                                  fill={segment.folderColorData.hex}
                                                  className="cursor-pointer transition-all duration-200"
                                                  style={{
                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                                                    transformOrigin: 'center',
                                                    opacity: hoveredSegmentId && !isHovered ? 0.4 : 1,
                                                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                                  }}
                                                  stroke="rgba(15, 23, 42, 0.8)"
                                                  strokeWidth="2"
                                                  onClick={async () => {
                                                    try {
                                                      const items = await getVideosInFolder(playlist.id, segment.folder.folder_color);
                                                      setPlaylistItems(items, playlist.id, { playlist_id: playlist.id, folder_color: segment.folder.folder_color }, playlist.name);
                                                      if (items.length > 0 && onVideoSelect) {
                                                        onVideoSelect(items[0].video_url);
                                                      }
                                                    } catch (error) {
                                                      console.error('Failed to load folder items:', error);
                                                    }
                                                  }}
                                                />
                                              );
                                            })}

                                            {/* Outer Dot Buttons */}
                                            {pieSegments.map((segment) => {
                                              const dotRadius = 93; // Position outside the pie
                                              const midAngle = (segment.startAngle + segment.endAngle) / 2;
                                              const midRad = (midAngle * Math.PI) / 180;
                                              const dotX = Math.cos(midRad) * dotRadius;
                                              const dotY = Math.sin(midRad) * dotRadius;
                                              const isSelected = hoveredSegmentId === segment.folder.folder_color;

                                              return (
                                                <circle
                                                  key={`dot-${segment.folder.folder_color}`}
                                                  cx={dotX}
                                                  cy={dotY}
                                                  r={isSelected ? 7 : 5}
                                                  fill={segment.folderColorData.hex}
                                                  className="cursor-pointer transition-all duration-200"
                                                  style={{
                                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                                                  }}
                                                  stroke={isSelected ? 'white' : 'rgba(15, 23, 42, 0.6)'}
                                                  strokeWidth={isSelected ? 2 : 1}
                                                  onClick={() => {
                                                    setHoveredPieSegment(prev => ({
                                                      ...prev,
                                                      [playlist.id]: segment.folder.folder_color
                                                    }));
                                                  }}
                                                />
                                              );
                                            })}
                                          </svg>
                                          {/* Center - Total Count */}
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center">
                                              <div className="text-lg font-bold text-white">{totalVideos}</div>
                                              <div className="text-[9px] text-slate-400">tagged</div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Preview Area - Right Side */}
                                        <div className="flex-1 min-w-0 flex items-center justify-center h-[140px]">
                                          {hoveredSegment ? (
                                            <div className="flex flex-col items-center animate-in fade-in duration-150 w-full">
                                              {/* Folder Name with Color Dot */}
                                              <div className="flex items-center gap-2 mb-2">
                                                <div
                                                  className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                                                  style={{ backgroundColor: hoveredSegment.folderColorData.hex }}
                                                />
                                                <h4 className="text-sm font-semibold text-white truncate max-w-[120px]">
                                                  {hoveredSegment.displayName}
                                                </h4>
                                              </div>

                                              {/* Mini Thumbnail */}
                                              <div
                                                className="w-full max-w-[140px] aspect-video rounded-md overflow-hidden bg-slate-900/50 shadow-md border border-slate-600/30"
                                              >
                                                {hoveredSegment.folder.first_video ? (
                                                  <img
                                                    src={getThumbnailUrl(hoveredSegment.folder.first_video.video_id, 'standard')}
                                                    alt={hoveredSegment.displayName}
                                                    className="w-full h-full object-cover"
                                                  />
                                                ) : (
                                                  <div className="w-full h-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                    </svg>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Stats Row */}
                                              <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                                                <span className="text-slate-400">
                                                  {hoveredSegment.videoCount} videos
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-slate-500">
                                                  {hoveredSegment.percentage.toFixed(1)}%
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center text-slate-500">
                                              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                              </svg>
                                              <p className="text-xs">Scroll to browse</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-slate-500 text-sm">
                                        No colored folders yet
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* 4 Little Video Thumbnails - Horizontal strip below content */}
                              <div className="mt-2 grid grid-cols-4 gap-2 px-1 pb-1">
                                {(playlistPreviewVideos[playlist.id] || []).slice(0, 4).map((video) => (
                                  <div
                                    key={video.video_id}
                                    className="aspect-video relative rounded-md overflow-hidden bg-black/50 border-2 border-[#052F4A] hover:ring-2 hover:ring-sky-500 transition-all cursor-pointer group/mini shadow-md"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onVideoSelect) onVideoSelect(video.video_url);
                                    }}
                                    title={video.title}
                                  >
                                    <img
                                      src={getThumbnailUrl(video.video_id, 'medium')}
                                      alt=""
                                      className="w-full h-full object-cover opacity-80 group-hover/mini:opacity-100 transition-opacity"
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                    {/* Tiny play icon on hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 bg-black/30 transition-opacity">
                                      <Play size={12} className="text-white fill-current" />
                                    </div>
                                  </div>
                                ))}
                                {/* Fill empty slots if < 4 (optional, currently just leaves space blank) */}
                                {Array.from({ length: Math.max(0, 4 - (playlistPreviewVideos[playlist.id] || []).length) }).map((_, i) => (
                                  <div key={`empty-${i}`} className="aspect-video relative rounded-md bg-slate-800/20 border border-slate-700/30" />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // Render folder card - same size as playlist card
                        const folder = item.data;
                        const folderColor = getFolderColorById(folder.folder_color);
                        const folderImageKey = `folder-${folder.playlist_id}-${folder.folder_color}`;
                        const thumbUrls = folder.first_video ? {
                          max: getThumbnailUrl(folder.first_video.video_id, 'max'),
                          standard: getThumbnailUrl(folder.first_video.video_id, 'standard')
                        } : null;
                        const useFallback = imageLoadErrors.has(folderImageKey);
                        // Check for preview thumbnail first (when preview shuffle mode is active)
                        const previewThumb = previewThumbnails[folderImageKey];
                        const activeThumbnailUrl = previewThumb
                          ? previewThumb.url
                          : (thumbUrls ? (useFallback ? thumbUrls.standard : thumbUrls.max) : null);

                        const folderKey = `${folder.playlist_id}:${folder.folder_color}`;

                        const isStuck = stuckFolders.has(folderKey);

                        return (
                          <div
                            key={`${folder.playlist_id}-${folder.folder_color}-${index}`}
                            onClick={async (e) => {
                              // Don't trigger if clicking on menu
                              if (e.target.closest('[data-card-menu="true"]')) {
                                return;
                              }
                              try {
                                const items = await getPlaylistItems(folder.playlist_id);
                                // Use parentPlaylist name if available (it should be attach to item in the list builder)
                                const playlistTitle = item.parentPlaylist ? item.parentPlaylist.name : null;
                                setPlaylistItems(items, folder.playlist_id, { playlist_id: folder.playlist_id, folder_color: folder.folder_color }, playlistTitle);
                                if (folder.first_video && onVideoSelect) {
                                  onVideoSelect(folder.first_video.video_url);
                                }
                              } catch (error) {
                                console.error('Failed to load folder playlist items:', error);
                              }
                            }}
                            className="cursor-pointer group relative"
                            title={getInspectTitle(`${folderColor.name} folder`)}
                            data-playlist-card="true"
                            data-playlist-name={`${folderColor.name} Folder`}
                          >
                            <div
                              className={`border-2 border-slate-700/50 rounded-xl p-2 bg-slate-800/20 hover:border-sky-500/50 transition-colors h-full flex flex-col ${String(playlist.id) === String(activePlaylistId) ? 'active-playlist-marker' : ''}`}
                              data-active-playlist={String(playlist.id) === String(activePlaylistId) ? "true" : "false"}
                            >
                              {/* Folder Info - Same format as playlist card */}
                              <div className="mb-2 relative border-2 border-[#052F4A] rounded-md p-1 bg-slate-100/90 shadow-sm flex items-center justify-between h-[38px] overflow-hidden">
                                <div className="flex items-center gap-2 justify-center pl-1">
                                  {/* Colored dot indicator */}
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: folderColor.hex }}
                                  />
                                  <h3 className="font-medium text-sm truncate transition-colors pr-8"
                                    style={{ color: '#052F4A' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}>
                                    {folderColor.name} Folder
                                  </h3>
                                </div>

                                {/* Hover Controls - 3 Segments */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-0 bottom-0 pr-1 pl-4 bg-gradient-to-l from-slate-100 via-slate-100 to-transparent">
                                  {/* Segment 1: Preview (Grid Icon) */}
                                  <div className="flex items-center">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                          const playlistTitle = item.parentPlaylist ? item.parentPlaylist.name : null;
                                          setPreviewPlaylist(items, folder.playlist_id, { playlist_id: folder.playlist_id, folder_color: folder.folder_color });
                                          setCurrentPage('videos');
                                          if (viewMode === 'full') {
                                            setViewMode('half');
                                          }
                                        } catch (error) {
                                          console.error('Failed to load folder items for preview:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                      title="Preview folder"
                                    >
                                      <Grid3x3 size={18} strokeWidth={2.5} />
                                    </button>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px h-5 bg-slate-300 mx-0.5" />

                                  {/* Segment 2: Refresh (conditional) + Shuffle */}
                                  <div className="flex items-center gap-0.5">
                                    {/* Refresh button - only visible after shuffle has been used */}
                                    {previewThumbnails[folderImageKey]?.isShuffled && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Reset to default thumbnail
                                          setPreviewThumbnails(prev => {
                                            const { [folderImageKey]: _, ...rest } = prev;
                                            return rest;
                                          });
                                        }}
                                        className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                        title="Reset to default cover"
                                      >
                                        <RotateCcw size={18} strokeWidth={2.5} />
                                      </button>
                                    )}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                          if (items.length === 0) return;

                                          // Shuffle only changes thumbnail preview
                                          const randomVideo = items[Math.floor(Math.random() * items.length)];
                                          const thumbUrl = getThumbnailUrl(randomVideo.video_id, 'max');
                                          setPreviewThumbnails(prev => ({
                                            ...prev,
                                            [folderImageKey]: { videoId: randomVideo.video_id, url: thumbUrl, videoUrl: randomVideo.video_url, title: randomVideo.title, isShuffled: true }
                                          }));
                                        } catch (error) {
                                          console.error('Failed to shuffle thumbnail:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                      title="Preview random thumbnail"
                                    >
                                      <Shuffle size={18} />
                                    </button>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px h-5 bg-slate-300 mx-0.5" />

                                  {/* Segment 3: Play + Info */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                          // Use parentPlaylist name if available
                                          const playlistTitle = item.parentPlaylist ? item.parentPlaylist.name : null;
                                          setPlaylistItems(items, folder.playlist_id, { playlist_id: folder.playlist_id, folder_color: folder.folder_color }, playlistTitle);

                                          if (items.length > 0 && onVideoSelect) {
                                            // If we have a preview thumbnail, play that video
                                            const previewThumb = previewThumbnails[folderImageKey];
                                            if (previewThumb?.videoUrl) {
                                              onVideoSelect(previewThumb.videoUrl);
                                            } else {
                                              // Otherwise find video matching current cover or play first
                                              let targetVideo = items[0];
                                              if (activeThumbnailUrl) {
                                                const coverMatch = items.find(v => {
                                                  const maxThumb = getThumbnailUrl(v.video_id, 'max');
                                                  const stdThumb = getThumbnailUrl(v.video_id, 'standard');
                                                  return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                                });
                                                if (coverMatch) targetVideo = coverMatch;
                                              }
                                              onVideoSelect(targetVideo.video_url);
                                            }
                                          }
                                        } catch (error) {
                                          console.error('Failed to load folder playlist items:', error);
                                        }
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                                      title="Play thumbnail video"
                                    >
                                      <Play size={18} fill="currentColor" />
                                    </button>
                                    {/* Info Button */}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const isCurrentlyShowing = showThumbnailInfo.has(folderImageKey);

                                        if (!isCurrentlyShowing && !previewThumbnails[folderImageKey]?.title) {
                                          // Toggling ON and no title yet - fetch it
                                          try {
                                            const items = await getVideosInFolder(folder.playlist_id, folder.folder_color);
                                            if (items.length > 0) {
                                              // Find the video matching the current thumbnail
                                              let targetVideo = items[0];
                                              if (activeThumbnailUrl) {
                                                const coverMatch = items.find(v => {
                                                  const maxThumb = getThumbnailUrl(v.video_id, 'max');
                                                  const stdThumb = getThumbnailUrl(v.video_id, 'standard');
                                                  return maxThumb === activeThumbnailUrl || stdThumb === activeThumbnailUrl;
                                                });
                                                if (coverMatch) targetVideo = coverMatch;
                                              }
                                              // Store the title without changing the thumbnail
                                              setPreviewThumbnails(prev => ({
                                                ...prev,
                                                [folderImageKey]: {
                                                  ...prev[folderImageKey],
                                                  title: targetVideo.title,
                                                  videoId: targetVideo.video_id,
                                                  videoUrl: targetVideo.video_url,
                                                  url: prev[folderImageKey]?.url || activeThumbnailUrl
                                                }
                                              }));
                                            }
                                          } catch (error) {
                                            console.error('Failed to fetch video title:', error);
                                          }
                                        }

                                        setShowThumbnailInfo(prev => {
                                          const next = new Set(prev);
                                          if (next.has(folderImageKey)) {
                                            next.delete(folderImageKey);
                                          } else {
                                            next.add(folderImageKey);
                                          }
                                          return next;
                                        });
                                      }}
                                      className={`p-1 rounded transition-colors ${(showThumbnailInfo.has(folderImageKey) || globalInfoToggle)
                                        ? 'bg-sky-500 text-white'
                                        : 'hover:bg-slate-200 text-[#052F4A] hover:text-sky-600'
                                        }`}
                                      title={globalInfoToggle ? "Global info ON" : "Show video title"}
                                    >
                                      <Info size={18} />
                                    </button>
                                  </div>
                                </div>

                                {/* 3-dot menu - removed from bottom right */}
                              </div>

                              {/* Thumbnail - Same format as playlist card */}
                              <div className="rounded-lg overflow-hidden relative group mt-auto" style={{
                                width: '100%',
                                paddingBottom: '56.25%', // 16:9 aspect ratio
                                backgroundColor: '#0f172a',
                                overflow: 'hidden'
                              }}>
                                {/* Colored left border indicator */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 z-10"
                                  style={{ backgroundColor: folderColor.hex }}
                                />
                                {activeThumbnailUrl ? (
                                  <img
                                    src={activeThumbnailUrl}
                                    alt={folder.first_video?.title || 'Folder thumbnail'}
                                    onError={() => {
                                      if (!useFallback) {
                                        setImageLoadErrors(prev => new Set(prev).add(folderImageKey));
                                      }
                                    }}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                      paddingLeft: '8px'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingLeft: '8px'
                                  }}>
                                    <svg
                                      className="w-12 h-12 text-slate-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                      />
                                    </svg>
                                  </div>
                                )}

                                {/* Video Title Overlay - shown when info button is toggled or global toggle is on */}
                                {(showThumbnailInfo.has(folderImageKey) || globalInfoToggle) && previewThumbnails[folderImageKey]?.title && (
                                  <div
                                    className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1.5 z-20"
                                    style={{ backdropFilter: 'blur(4px)' }}
                                  >
                                    <p className="text-white text-sm font-medium truncate">
                                      {previewThumbnails[folderImageKey].title}
                                    </p>
                                  </div>
                                )}

                                {/* Play overlay on hover - REMOVED */}
                                {/* 3-dot menu - moved to hover overlay (Top Right) */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                                  <CardMenu
                                    options={[
                                      {
                                        label: isStuck ? 'Unstick Folder' : 'Stick Folder',
                                        icon: isStuck ? (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                          </svg>
                                        ),
                                        action: 'toggleStick',
                                      },
                                    ]}
                                    onOptionClick={async (option) => {
                                      if (option.action === 'toggleStick') {
                                        try {
                                          const newStuckStatus = await toggleStuckFolder(folder.playlist_id, folder.folder_color);
                                          // Update local state
                                          const folderKey = `${folder.playlist_id}:${folder.folder_color}`;
                                          setStuckFolders(prev => {
                                            const next = new Set(prev);
                                            if (newStuckStatus) {
                                              next.add(folderKey);
                                            } else {
                                              next.delete(folderKey);
                                            }
                                            return next;
                                          });
                                        } catch (error) {
                                          console.error('Failed to toggle stick folder:', error);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                </InfiniteScrollWrapper>
              </div>

              {/* Up Arrow - Centered at bottom */}
              <div className="flex justify-center py-8 items-center gap-4">
                <button
                  ref={arrowButtonRef}
                  onClick={() => scrollToTop()}
                  className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-all border border-white/10 hover:border-sky-500/50 shadow-lg hover:shadow-sky-500/25"
                  title="Scroll to top"
                >
                  <ChevronUp size={24} />
                </button>
                <div className="text-slate-400 font-medium text-lg w-64 truncate">
                  {centeredPlaylistName || "Scroll to browse"}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div >
  );
};

export default PlaylistsPage;


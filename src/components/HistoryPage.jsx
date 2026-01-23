import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getWatchHistory, getPlaylistsForVideoIds, getAllPlaylists, getPlaylistItems, getVideoFolderAssignments, getFolderMetadata, getVideosInFolder } from '../api/playlistApi';
import { getThumbnailUrl, extractVideoId } from '../utils/youtubeUtils';
import { getFolderColorById } from '../utils/folderColors';
import { useLayoutStore } from '../store/layoutStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useNavigationStore } from '../store/navigationStore';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardContent from './CardContent';
import PageBanner from './PageBanner';

const HistoryPage = ({ onVideoSelect, onSecondPlayerSelect }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playlistMap, setPlaylistMap] = useState({}); // Maps video_id to array of playlist names
  const [folderMap, setFolderMap] = useState({}); // Maps video_id -> playlist_id -> [folder_colors]
  const [folderNameMap, setFolderNameMap] = useState({}); // Maps video_id -> playlist_id -> folder_color -> folder_name
  const [allPlaylists, setAllPlaylists] = useState([]); // All playlists for name-to-ID lookup
  const { inspectMode } = useLayoutStore();
  const { currentPlaylistItems, currentVideoIndex } = usePlaylistStore();
  const { setCurrentPage } = useNavigationStore();
  const { setPlaylistItems } = usePlaylistStore();

  // Helper to get inspect label
  const getInspectTitle = (label) => inspectMode ? label : undefined;

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load playlists first (needed for folder lookups)
      const playlists = await getAllPlaylists();
      setAllPlaylists(playlists || []);
      
      // Load history
      const historyData = await getWatchHistory(100);
      setHistory(historyData || []);
      
      // Fetch playlists for all videos in history
      if (historyData && historyData.length > 0) {
        const videoIds = historyData
          .map(item => item.video_id)
          .filter(id => id); // Filter out any null/undefined video_ids
        
        if (videoIds.length > 0) {
          try {
            const playlistsData = await getPlaylistsForVideoIds(videoIds);
            setPlaylistMap(playlistsData || {});
            
            // Load folder assignments and folder names for each video in each playlist
            const folderAssignments = {};
            const folderNames = {};
            
            for (const videoId of videoIds) {
              const playlistNames = playlistsData[videoId] || [];
              folderAssignments[videoId] = {};
              folderNames[videoId] = {};
              
              for (const playlistName of playlistNames) {
                const playlist = playlists.find(p => p.name === playlistName);
                if (!playlist) continue;
                
                try {
                  // Get playlist items to find the item_id for this video
                  const items = await getPlaylistItems(playlist.id);
                  const videoItem = items.find(item => item.video_id === videoId);
                  
                  if (videoItem) {
                    // Get folder assignments for this item
                    const folders = await getVideoFolderAssignments(playlist.id, videoItem.id);
                    folderAssignments[videoId][playlist.id] = folders || [];
                    
                    // Get folder names for each folder assignment
                    folderNames[videoId][playlist.id] = {};
                    for (const folderColor of folders || []) {
                      try {
                        const metadata = await getFolderMetadata(playlist.id, folderColor);
                        if (metadata && metadata[0]) {
                          // Custom folder name exists
                          folderNames[videoId][playlist.id][folderColor] = metadata[0];
                        } else {
                          // Fallback to folder color name
                          const folderColorInfo = getFolderColorById(folderColor);
                          folderNames[videoId][playlist.id][folderColor] = folderColorInfo.name;
                        }
                      } catch (error) {
                        // Fallback to folder color name on error
                        const folderColorInfo = getFolderColorById(folderColor);
                        folderNames[videoId][playlist.id][folderColor] = folderColorInfo.name;
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Failed to load folder assignments for video ${videoId} in playlist ${playlist.id}:`, error);
                }
              }
            }
            
            setFolderMap(folderAssignments);
            setFolderNameMap(folderNames);
          } catch (error) {
            console.error('Failed to load playlists for history videos:', error);
            // Don't block the UI if playlist loading fails
          }
        }
      }
    } catch (error) {
      console.error('Failed to load history data:', error);
      alert(`Failed to load watch history: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistBadgeClick = async (e, playlistName) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Find playlist by name
    const playlist = allPlaylists.find(p => p.name === playlistName);
    if (!playlist) {
      console.error(`Playlist "${playlistName}" not found`);
      return;
    }

    try {
      // Preview mode: Load playlist and navigate without changing the playing video
      // This allows users to browse the playlist while keeping the current video playing
      const items = await getPlaylistItems(playlist.id);
      setPlaylistItems(items, playlist.id, null, playlist.name);
      setCurrentPage('videos');
      // Note: We intentionally do NOT call onVideoSelect here to keep the current video playing
    } catch (error) {
      console.error('Failed to load playlist items:', error);
    }
  };

  const handleFolderBadgeClick = async (e, playlistName, folderColor) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Find playlist by name
    const playlist = allPlaylists.find(p => p.name === playlistName);
    if (!playlist || !folderColor) {
      console.error(`Playlist "${playlistName}" or folder not found`);
      return;
    }

    try {
      // Preview mode: Load folder videos and navigate without changing the playing video
      const items = await getVideosInFolder(playlist.id, folderColor);
      if (items.length === 0) {
        console.warn(`Folder ${folderColor} in playlist ${playlist.id} has no videos`);
        return;
      }
      setPlaylistItems(items, playlist.id, { playlist_id: playlist.id, folder_color: folderColor });
      setCurrentPage('videos');
      // Note: We intentionally do NOT call onVideoSelect here to keep the current video playing
    } catch (error) {
      console.error('Failed to load folder items:', error);
    }
  };

  const handleVideoClick = (video) => {
    if (onVideoSelect) {
      onVideoSelect(video.video_url);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

      // For older dates, show actual date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-slate-400">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-slate-400">No watch history yet</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <div className="flex-1 overflow-y-auto p-6">
        <PageBanner
          title="History"
          description="Your recently watched videos."
          color={null}
          isEditable={false}
        />
        <div className="flex flex-col space-y-3 max-w-5xl mx-auto">
          {history.map((item) => {
            const thumbnailUrl = item.thumbnail_url || getThumbnailUrl(item.video_id, 'medium');
            
            // Check if this video is currently playing
            const currentVideo = currentPlaylistItems?.[currentVideoIndex];
            const isCurrentlyPlaying = currentVideo && (
              currentVideo.video_id === item.video_id ||
              currentVideo.id === item.id ||
              (currentVideo.video_url && extractVideoId(currentVideo.video_url) === item.video_id) ||
              (item.video_url && extractVideoId(item.video_url) === extractVideoId(currentVideo.video_url))
            );

            return (
              <Card
                key={item.id}
                onClick={() => handleVideoClick(item)}
                className={`flex flex-row gap-5 p-3 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl transition-all group w-full border-2 ${
                  isCurrentlyPlaying 
                    ? 'border-red-500 ring-4 ring-red-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' 
                    : 'border-slate-700/50 hover:border-slate-600/70'
                }`}
                title={getInspectTitle(`History video: ${item.title || 'Untitled'}`)}
                variant="minimal"
              >
                {/* Left: Thumbnail */}
                <div className={`w-64 shrink-0 aspect-video rounded-lg overflow-hidden border-2 border-black relative shadow-md group-hover:shadow-xl transition-all ${
                  isCurrentlyPlaying ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-black shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]' : ''
                }`}>
                  <CardThumbnail
                    src={thumbnailUrl}
                    alt={item.title || 'Video thumbnail'}
                    overlay={
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-[2px] absolute inset-0 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoClick(item);
                          }}
                          className="bg-sky-500 hover:bg-sky-400 rounded-full p-3 transition-all active:scale-90 shadow-lg hover:scale-110"
                          style={{ color: '#052F4A' }}
                          title={getInspectTitle('Play video') || 'Play video'}
                        >
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </button>
                      </div>
                    }
                  />
                </div>

                {/* Right: Info */}
                <div className="flex flex-col justify-center flex-1 min-w-0 py-2">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight transition-colors"
                    style={{ color: '#052F4A' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}>
                    {item.title || 'Untitled Video'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50 text-slate-400 font-medium">
                      <Clock size={14} className="text-sky-500/80" />
                      {formatDate(item.watched_at)}
                    </span>
                    {/* Playlist badges */}
                    {playlistMap[item.video_id] && playlistMap[item.video_id].length > 0 && (
                      <>
                        {playlistMap[item.video_id].map((playlistName, idx) => {
                          // Find playlist to get ID
                          const playlist = allPlaylists.find(p => p.name === playlistName);
                          const playlistId = playlist?.id;
                          
                          // Get folder colors for this video in this playlist
                          const folderColors = playlistId && folderMap[item.video_id]?.[playlistId] || [];
                          const firstFolderColor = folderColors.length > 0 ? folderColors[0] : null;
                          const folderColorInfo = firstFolderColor ? getFolderColorById(firstFolderColor) : null;
                          
                          // Get folder name (custom name or color name)
                          const folderName = firstFolderColor && playlistId && folderNameMap[item.video_id]?.[playlistId]?.[firstFolderColor]
                            ? folderNameMap[item.video_id][playlistId][firstFolderColor]
                            : (folderColorInfo ? folderColorInfo.name : null);
                          
                          // Badge text: playlist name - folder name (or just playlist name if no folder)
                          const badgeText = folderName 
                            ? `${playlistName} - ${folderName}`
                            : playlistName;
                          
                          // Use folder color if available, otherwise default to sky
                          const badgeBg = folderColorInfo 
                            ? `${folderColorInfo.hex}20` // 20 = ~12.5% opacity in hex
                            : 'rgba(14, 165, 233, 0.1)'; // sky-500/10
                          const badgeBorder = folderColorInfo
                            ? `${folderColorInfo.hex}50` // 50 = ~31% opacity
                            : 'rgba(14, 165, 233, 0.3)'; // sky-500/30
                          const badgeTextColor = folderColorInfo
                            ? folderColorInfo.hex
                            : '#38bdf8'; // sky-400
                          const badgeHoverBg = folderColorInfo
                            ? `${folderColorInfo.hex}30` // 30 = ~19% opacity
                            : 'rgba(14, 165, 233, 0.2)'; // sky-500/20
                          const badgeHoverBorder = folderColorInfo
                            ? `${folderColorInfo.hex}70` // 70 = ~44% opacity
                            : 'rgba(14, 165, 233, 0.5)'; // sky-500/50
                          
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-0.5 px-2 py-1 rounded-md border font-medium transition-colors"
                              style={{
                                backgroundColor: badgeBg,
                                borderColor: badgeBorder,
                              }}
                            >
                              {/* Playlist name part */}
                              <button
                                onClick={(e) => handlePlaylistBadgeClick(e, playlistName)}
                                className="px-1.5 py-0.5 rounded transition-all cursor-pointer relative group/playlist"
                                style={{ color: badgeTextColor }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                title={getInspectTitle(`Click to navigate to playlist: ${playlistName}`) || `Click to navigate to playlist: ${playlistName}`}
                              >
                                <span className="line-clamp-1">{playlistName}</span>
                              </button>
                              
                              {/* Separator */}
                              {folderName && (
                                <span className="px-0.5" style={{ color: badgeTextColor, opacity: 0.6 }}>
                                  -
                                </span>
                              )}
                              
                              {/* Folder name part */}
                              {folderName && folderColorInfo && (
                                <button
                                  onClick={(e) => handleFolderBadgeClick(e, playlistName, firstFolderColor)}
                                  className="px-1.5 py-0.5 rounded transition-all cursor-pointer relative group/folder"
                                  style={{ color: badgeTextColor }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.boxShadow = `0 0 0 2px ${folderColorInfo.hex}80`;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                  title={getInspectTitle(`Click to navigate to folder: ${folderName} in ${playlistName}`) || `Click to navigate to folder: ${folderName} in ${playlistName}`}
                                >
                                  <span className="line-clamp-1">{folderName}</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;


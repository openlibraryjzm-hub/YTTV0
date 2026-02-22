import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Shuffle,
  Grid3x3,
  RotateCcw,
  Info,
  Check,
  X,
  Folder,
} from "lucide-react";
import CardMenu from "./NewCardMenu";
import ImageHoverPreview from "./ImageHoverPreview";
import { getFolderColorById } from "../utils/folderColors";
import { getThumbnailUrl } from "../utils/youtubeUtils";
import {
  getPlaylistItems,
  getPlaylistItemsPreview,
  getVideosInFolder,
  updatePlaylist,
  reorderPlaylistItem,
} from "../api/playlistApi";
import { usePlaylistStore } from "../store/playlistStore";
import { useLayoutStore } from "../store/layoutStore";
import { useNavigationStore } from "../store/navigationStore";
import { usePlaylistGroupStore } from "../store/playlistGroupStore";
import { useInspectLabel } from "../utils/inspectLabels";

const PlaylistCard = ({
  playlist,
  folders = [],
  activeThumbnailUrl,
  itemCount,
  videoCount = itemCount,
  orbCount = 0,
  bannerCount = 0,
  initialPreviewVideos = [],
  globalInfoToggle,
  folderMetadata = {},
  deletingPlaylistId,
  expandedPlaylists,

  onVideoSelect,
  togglePlaylistExpand,
  handleExportPlaylist,
  handleDeletePlaylist,
  loadPlaylists,
  onAssignToGroupClick,
  groupIdFromCarousel,
  onEnterFromGroup,
}) => {
  const { currentPlaylistId, setPlaylistItems, setPreviewPlaylist } =
    usePlaylistStore();
  const { viewMode, setViewMode, inspectMode } = useLayoutStore();
  const { setCurrentPage } = useNavigationStore();
  const { getGroupIdsForPlaylist, removePlaylistFromGroup } = usePlaylistGroupStore();
  const groupIdsForPlaylist = getGroupIdsForPlaylist(playlist.id);
  const isInAnyCarousel = groupIdsForPlaylist.length > 0;

  const getInspectTitle = (label) => (inspectMode ? label : undefined);

  const [previewThumbnail, setPreviewThumbnail] = useState(null); // { videoId, url, videoUrl, title, isShuffled }
  const [localPreviewVideos, setLocalPreviewVideos] =
    useState(initialPreviewVideos);
  const [showInfo, setShowInfo] = useState(false);
  const [activeFolderFilter, setActiveFolderFilter] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [hoveredPieSegment, setHoveredPieSegment] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [miniImageErrors, setMiniImageErrors] = useState(new Set());

  const pieChartRef = useRef(null);
  const pieDataRef = useRef({ folders, hoveredSegment: hoveredPieSegment });

  // Update refs for scroll handler
  useEffect(() => {
    pieDataRef.current = { folders, hoveredSegment: hoveredPieSegment };
  }, [folders, hoveredPieSegment]);

  // Sync initial videos from props if not shuffled
  useEffect(() => {
    if (!previewThumbnail?.isShuffled) {
      setLocalPreviewVideos(initialPreviewVideos);
    }
  }, [initialPreviewVideos, previewThumbnail?.isShuffled]);

  // Handle Global Info Toggle
  useEffect(() => {
    const fetchTitle = async () => {
      if (globalInfoToggle && !previewThumbnail?.title) {
        try {
          const items = await getPlaylistItems(playlist.id);
          if (items.length > 0) {
            let targetVideo = items[0];
            if (activeThumbnailUrl) {
              const coverMatch = items.find((item) => {
                const maxThumb =
                  item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") ||
                  getThumbnailUrl(item.video_id, "max");
                const stdThumb =
                  item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") ||
                  getThumbnailUrl(item.video_id, "standard");
                return (
                  maxThumb === activeThumbnailUrl ||
                  stdThumb === activeThumbnailUrl
                );
              });
              if (coverMatch) targetVideo = coverMatch;
            }
            setPreviewThumbnail((prev) => ({
              ...prev,
              title: targetVideo.title,
              videoId: targetVideo.video_id,
              videoUrl: targetVideo.video_url,
              url: prev?.url || activeThumbnailUrl,
              isShuffled: prev?.isShuffled || false,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch title for global toggle", error);
        }
      }
    };
    fetchTitle();
  }, [
    globalInfoToggle,
    playlist.id,
    previewThumbnail?.title,
    activeThumbnailUrl,
  ]);

  const displayedThumbnailUrl = previewThumbnail?.url || activeThumbnailUrl;
  const isExpanded = expandedPlaylists?.has(playlist.id);

  // Thumbnail URL and title for a preview item (video, tweet, orb, or banner) — plain image only, no SVG
  const getPreviewItemThumbnail = (item) => {
    if (!item) return null;
    if (item.isOrb) return item.customOrbImage ?? item.image ?? null;
    if (item.isBannerPreset) {
      return (
        item.splitscreenBanner?.image ||
        item.customBannerImage ||
        item.fullscreenBanner?.image ||
        item.image ||
        null
      );
    }
    return item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") || getThumbnailUrl(item.video_id, "medium");
  };
  const getPreviewItemTitle = (item) => item?.title ?? "";
  const getPreviewItemKey = (item, index) => item?.id ?? item?.video_id ?? `preview-${index}`;

  // Build previewThumbnail state from any item (video, orb, or banner) for shuffle/swap
  const previewThumbnailFromItem = (item) => {
    if (!item) return null;
    const url = item.isOrb
      ? (item.customOrbImage ?? null)
      : item.isBannerPreset
        ? (item.splitscreenBanner?.image || item.customBannerImage || item.fullscreenBanner?.image || item.image || null)
        : (item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") || getThumbnailUrl(item.video_id, "max"));
    return {
      url: url || null,
      title: getPreviewItemTitle(item),
      videoId: item.video_id ?? null,
      videoUrl: item.video_url ?? null,
      isShuffled: true,
      originalItem: item,
    };
  };

  const handleCardClick = async (e) => {
    if (e.target.closest('[data-card-menu="true"]')) return;
    if (typeof onEnterFromGroup === "function") {
      if (groupIdFromCarousel) onEnterFromGroup(groupIdFromCarousel);
      else onEnterFromGroup(null);
    }
    try {
      const items = await getPlaylistItems(playlist.id);
      setPlaylistItems(items, playlist.id, null, playlist.name);

      if (items.length > 0 && onVideoSelect) {
        if (previewThumbnail?.videoUrl) {
          onVideoSelect(previewThumbnail.videoUrl);
        } else {
          let targetVideo = items[0];
          if (activeThumbnailUrl) {
            const coverMatch = items.find((item) => {
              const maxThumb =
                item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") ||
                getThumbnailUrl(item.video_id, "max");
              const stdThumb =
                item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") ||
                getThumbnailUrl(item.video_id, "standard");
              return (
                maxThumb === activeThumbnailUrl ||
                stdThumb === activeThumbnailUrl
              );
            });
            if (coverMatch) targetVideo = coverMatch;
          }
          onVideoSelect(targetVideo.video_url);
        }
      }
    } catch (error) {
      console.error("Failed to load playlist items:", error);
    }
  };

  const handlePreviewPlaylist = async (e) => {
    e.stopPropagation();
    try {
      const items = await getPlaylistItems(playlist.id);
      setPreviewPlaylist(items, playlist.id, null);
      setCurrentPage("videos");
      if (viewMode === "full") {
        setViewMode("half");
      }
    } catch (error) {
      console.error("Failed to load playlist items for preview:", error);
    }
  };

  const handleShuffle = async (e) => {
    e.stopPropagation();
    try {
      if (activeFolderFilter) {
        const items = await getVideosInFolder(playlist.id, activeFolderFilter);
        if (items.length === 0) return;
        const randomVideo = items[Math.floor(Math.random() * items.length)];
        setPreviewThumbnail(previewThumbnailFromItem(randomVideo));
        const shuffledItems = [...items].sort(() => 0.5 - Math.random());
        setLocalPreviewVideos(shuffledItems.slice(0, 4));
      } else {
        const orbsAndBanners = (initialPreviewVideos || []).filter(
          (item) => item.isOrb || item.isBannerPreset
        );
        const allVideos = await getPlaylistItems(playlist.id);
        const pool = [...orbsAndBanners, ...allVideos];
        if (pool.length === 0) return;
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        setPreviewThumbnail(previewThumbnailFromItem(randomItem));
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        setLocalPreviewVideos(shuffled.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to shuffle thumbnail:", error);
    }
  };

  const handleResetShuffle = async (e) => {
    e.stopPropagation();
    setPreviewThumbnail(null);
    try {
      if (activeFolderFilter) {
        const items = (await getVideosInFolder(playlist.id, activeFolderFilter)).slice(0, 4);
        setLocalPreviewVideos(items);
      } else {
        // Restore default order: first 4 of combined list (orbs + banners + videos)
        setLocalPreviewVideos(initialPreviewVideos.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to reset preview videos:", error);
    }
  };

  const togglePieMenu = (e) => {
    e.stopPropagation();
    if (isMenuOpen) {
      setIsMenuOpen(false);
    } else {
      if (folders.length > 0) {
        setHoveredPieSegment(folders[0].folder_color);
      }
      setIsMenuOpen(true);
      setIsListOpen(false);
    }
  };

  const toggleFolderList = (e) => {
    e.stopPropagation();
    if (isListOpen) {
      setIsListOpen(false);
    } else {
      setIsListOpen(true);
      setIsMenuOpen(false);
    }
  };

  const handleSetAsCover = async (e) => {
    e.stopPropagation();
    try {
      if (displayedThumbnailUrl) {
        await updatePlaylist(
          playlist.id,
          null,
          null,
          null,
          displayedThumbnailUrl,
        );

        if (localPreviewVideos && previewThumbnail?.isShuffled) {
          let videoPosition = 1;
          for (let i = 0; i < localPreviewVideos.length; i++) {
            const item = localPreviewVideos[i];
            if (!item.isOrb && !item.isBannerPreset && item.id != null) {
              await reorderPlaylistItem(playlist.id, item.id, videoPosition);
              videoPosition++;
            }
          }
        }
        await loadPlaylists?.();

        if (previewThumbnail?.isShuffled) {
          setPreviewThumbnail(null);
        }
      }
    } catch (error) {
      console.error("Failed to set playlist cover:", error);
      alert("Failed to set playlist cover");
    }
  };

  const handleMiniVideoRightClick = async (e, clickedItem, index) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let currentMainItem = null;
      if (previewThumbnail?.originalItem) {
        currentMainItem = previewThumbnail.originalItem;
      } else if (previewThumbnail?.videoId != null) {
        currentMainItem = {
          video_id: previewThumbnail.videoId,
          video_url: previewThumbnail.videoUrl,
          title: previewThumbnail.title,
          thumbnail_url: previewThumbnail.url,
        };
      } else {
        const first = localPreviewVideos[0];
        if (first) {
          currentMainItem = first;
        } else {
          const items = await getPlaylistItems(playlist.id);
          if (items.length > 0) {
            let targetVideo = items[0];
            if (activeThumbnailUrl) {
              const coverMatch = items.find((item) => {
                const maxThumb =
                  item.thumbnail_url?.replace(/name=[a-z]+/, "name=large") ||
                  getThumbnailUrl(item.video_id, "max");
                const stdThumb =
                  item.thumbnail_url?.replace(/name=[a-z]+/, "name=medium") ||
                  getThumbnailUrl(item.video_id, "standard");
                return (
                  maxThumb === activeThumbnailUrl ||
                  stdThumb === activeThumbnailUrl
                );
              });
              if (coverMatch) targetVideo = coverMatch;
            }
            currentMainItem = targetVideo;
          }
        }
      }

      if (currentMainItem) {
        setPreviewThumbnail(previewThumbnailFromItem(clickedItem));
        setLocalPreviewVideos((prev) => {
          const next = [...prev];
          next[index] = currentMainItem;
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to swap thumbnails:", err);
    }
  };

  // Pie Chart calculations
  const totalVideos = folders.reduce((acc, f) => acc + (f.video_count || 1), 0);
  let cumulativeAngle = 0;
  const pieSegments = folders.map((folder) => {
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
      percentage: (videoCount / totalVideos) * 100,
    };
  });

  const activeFolderCount = folders.filter(
    (f) => (f.video_count || 0) > 0,
  ).length;
  const hoveredSegmentData = pieSegments.find(
    (s) => s.folder.folder_color === hoveredPieSegment,
  );

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer group relative w-full"
      title={getInspectTitle(`Playlist: ${playlist.name}`)}
      data-playlist-card="true"
      data-playlist-name={playlist.name}
    >
      <div
        className={`border-2 border-slate-700/50 rounded-xl p-2 bg-slate-100/90 hover:border-sky-500/50 transition-colors h-full flex flex-col ${String(playlist.id) === String(currentPlaylistId) ? "active-playlist-marker" : ""}`}
        data-active-playlist={
          String(playlist.id) === String(currentPlaylistId) ? "true" : "false"
        }
      >
        <div className="mb-2 flex items-center justify-between border-2 border-[#052F4A] rounded-md p-1 bg-slate-100/90 shadow-sm relative overflow-hidden h-[38px]">
          <h3
            className="font-bold text-lg truncate transition-colors pl-1 flex-1 text-left"
            style={{ color: "#052F4A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#052F4A")}
            title={playlist.name}
          >
            {playlist.name}
          </h3>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-0 bottom-0 pr-1 pl-4 bg-gradient-to-l from-slate-100 via-slate-100 to-transparent z-10">
            <div className="flex items-center">
              <button
                onClick={handlePreviewPlaylist}
                className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                title="Preview playlist"
              >
                <Grid3x3 size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="w-px h-5 bg-slate-300 mx-0.5" />

            <div className="flex items-center gap-0.5">
              {previewThumbnail?.isShuffled && (
                <button
                  onClick={handleResetShuffle}
                  className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                  title="Reset to default cover"
                >
                  <RotateCcw size={18} strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={handleShuffle}
                className="p-1 hover:bg-slate-200 rounded text-[#052F4A] hover:text-sky-600 transition-colors"
                title="Preview random thumbnail"
              >
                <Shuffle size={18} />
              </button>
            </div>

            <div className="w-px h-5 bg-slate-300 mx-0.5" />

            <div className="flex items-center gap-0.5">
              <button
                onClick={togglePieMenu}
                className={`p-1 rounded transition-colors ${isMenuOpen ? "bg-sky-500 text-white" : "hover:bg-slate-200 text-[#052F4A] hover:text-sky-600"}`}
                title="Folder colors"
              >
                <svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg overflow-hidden relative group mt-auto border-2 border-[#052F4A]"
          style={{
            width: "100%",
            paddingBottom: "56.25%",
            backgroundColor:
              displayedThumbnailUrl &&
              displayedThumbnailUrl.includes("twimg.com")
                ? "#e0f2fe"
                : "#0f172a",
          }}
          title={previewThumbnail?.title || getPreviewItemTitle(localPreviewVideos[0])}
        >
          {displayedThumbnailUrl ? (
            displayedThumbnailUrl.includes("twimg.com") ? (
              <ImageHoverPreview
                src={displayedThumbnailUrl}
                previewSrc={displayedThumbnailUrl?.replace(
                  /name=[a-z]+/,
                  "name=large",
                )}
                delay={500}
              >
                <img
                  src={displayedThumbnailUrl}
                  alt={playlist.name}
                  onError={() => setImageError(true)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </ImageHoverPreview>
            ) : (
              <img
                src={displayedThumbnailUrl}
                alt={playlist.name}
                onError={() => setImageError(true)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )
          ) : (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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

          {(showInfo || globalInfoToggle) && (previewThumbnail?.title || getPreviewItemTitle(localPreviewVideos[0])) && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1.5 z-20"
              style={{ backdropFilter: "blur(4px)" }}
            >
              <p className="text-white text-sm font-medium truncate">
                {previewThumbnail?.title || getPreviewItemTitle(localPreviewVideos[0])}
              </p>
            </div>
          )}

          <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 group/folder-area">
            <button
              onClick={toggleFolderList}
              className="transition-transform hover:scale-110 drop-shadow-md group/btn"
              title={`${activeFolderCount} folders with content`}
            >
              <div className="relative flex items-center justify-center">
                <Folder
                  size={32}
                  className={`transition-colors ${isListOpen ? "text-sky-500" : activeFolderFilter ? "" : "text-[#052F4A] opacity-90 group-hover/btn:text-sky-600"}`}
                  fill={
                    activeFolderFilter
                      ? getFolderColorById(activeFolderFilter).hex
                      : "currentColor"
                  }
                  stroke="white"
                  strokeWidth={2}
                />
                <span className="absolute inset-x-0 bottom-0 top-[3px] flex items-center justify-center text-white text-[10px] font-bold">
                  {activeFolderCount}
                </span>
                {activeFolderFilter && (
                  <div
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 shadow-md hover:bg-red-500 cursor-pointer border border-white/20 hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFolderFilter(null);
                    }}
                    title="Clear folder filter"
                  >
                    <X size={12} strokeWidth={3} className="text-white" />
                  </div>
                )}
              </div>
            </button>

            <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm" title={orbCount + bannerCount > 0 ? `${videoCount} video(s), ${orbCount} orb(s), ${bannerCount} banner(s)` : undefined}>
              {orbCount + bannerCount > 0
                ? `${videoCount} video${videoCount !== 1 ? "s" : ""}${orbCount ? `, ${orbCount} orb${orbCount !== 1 ? "s" : ""}` : ""}${bannerCount ? `, ${bannerCount} banner${bannerCount !== 1 ? "s" : ""}` : ""}`
                : `${itemCount} video${itemCount !== 1 ? "s" : ""}`}
            </span>
          </div>

          <button
            onClick={handleSetAsCover}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#052F4A]/90 hover:bg-sky-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 shadow-lg hover:scale-110 border border-white/20"
            title="Set as playlist cover"
          >
            <Check size={18} strokeWidth={3} />
          </button>

          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <CardMenu
              options={[
                {
                  label: isExpanded ? "Collapse Folders" : "Expand Folders",
                  icon: (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                      />
                    </svg>
                  ),
                  action: "toggleFolders",
                },
                {
                  label: "Export Playlist",
                  icon: (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                  action: "export",
                },
                {
                  label: "Assign to group",
                  icon: (
                    <svg
                      className="w-4 h-4 text-sky-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  ),
                  action: "openAssignToGroup",
                },
                ...(isInAnyCarousel
                  ? [
                      {
                        label: groupIdsForPlaylist.length > 1 ? "Remove from carousels" : "Remove from carousel",
                        icon: (
                          <svg
                            className="w-4 h-4 text-sky-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                        ),
                        action: "removeFromCarousel",
                      },
                    ]
                  : []),
                {
                  label:
                    deletingPlaylistId === playlist.id
                      ? "Deleting..."
                      : "Delete",
                  danger: true,
                  icon:
                    deletingPlaylistId === playlist.id ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    ),
                  action: "delete",
                  disabled: deletingPlaylistId === playlist.id,
                },
              ]}
              onOptionClick={(option) => {
                if (option.action === "toggleFolders")
                  togglePlaylistExpand?.(playlist.id);
                else if (option.action === "export")
                  handleExportPlaylist?.(playlist.id, playlist.name);
                else if (option.action === "delete")
                  handleDeletePlaylist?.(playlist.id, playlist.name, {
                    stopPropagation: () => {},
                  });
                else if (option.action === "openAssignToGroup")
                  onAssignToGroupClick?.();
                else if (option.action === "removeFromCarousel") {
                  groupIdsForPlaylist.forEach((gid) => removePlaylistFromGroup(gid, playlist.id));
                }
              }}
            />
          </div>
        </div>

        {isMenuOpen && (
          <div
            className="mt-2 rounded-lg bg-slate-800/90 border border-slate-600/50 p-3 animate-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">
                Colored Folders
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {folders.length > 0 ? (
              <div
                className="flex items-center gap-4"
                ref={(el) => {
                  if (el && pieChartRef.current !== el) {
                    pieChartRef.current = el;
                    const wheelHandler = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const segments = pieDataRef.current.folders || [];
                      if (segments.length === 0) return;
                      const currentHovered = pieDataRef.current.hoveredSegment;
                      const currentIndex = segments.findIndex(
                        (s) => s.folder_color === currentHovered,
                      );
                      let newIndex;
                      if (e.deltaY > 0)
                        newIndex =
                          currentIndex < segments.length - 1
                            ? currentIndex + 1
                            : 0;
                      else
                        newIndex =
                          currentIndex > 0
                            ? currentIndex - 1
                            : segments.length - 1;
                      setHoveredPieSegment(segments[newIndex].folder_color);
                    };
                    el.addEventListener("wheel", wheelHandler, {
                      passive: false,
                    });
                  }
                }}
              >
                <div
                  className="relative flex-shrink-0"
                  style={{ width: 140, height: 140 }}
                >
                  <svg
                    viewBox="-100 -100 200 200"
                    className="transform -rotate-90 w-full h-full"
                  >
                    {pieSegments.map((segment) => {
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
                      const isHovered =
                        hoveredPieSegment === segment.folder.folder_color;

                      return (
                        <path
                          key={segment.folder.folder_color}
                          d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`}
                          fill={segment.folderColorData.hex}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                            transformOrigin: "center",
                            opacity: hoveredPieSegment && !isHovered ? 0.4 : 1,
                            transform: isHovered ? "scale(1.05)" : "scale(1)",
                          }}
                          stroke="rgba(15, 23, 42, 0.8)"
                          strokeWidth="2"
                          onClick={async () => {
                            try {
                              const items = await getVideosInFolder(
                                playlist.id,
                                segment.folder.folder_color,
                              );
                              setPlaylistItems(
                                items,
                                playlist.id,
                                {
                                  playlist_id: playlist.id,
                                  folder_color: segment.folder.folder_color,
                                },
                                playlist.name,
                              );
                              if (items.length > 0 && onVideoSelect)
                                onVideoSelect(items[0].video_url);
                            } catch (error) {
                              console.error(
                                "Failed to load folder items:",
                                error,
                              );
                            }
                          }}
                        />
                      );
                    })}
                    {pieSegments.map((segment) => {
                      const midAngle =
                        (segment.startAngle + segment.endAngle) / 2;
                      const midRad = (midAngle * Math.PI) / 180;
                      const dotX = Math.cos(midRad) * 93;
                      const dotY = Math.sin(midRad) * 93;
                      const isSelected =
                        hoveredPieSegment === segment.folder.folder_color;
                      return (
                        <circle
                          key={`dot-${segment.folder.folder_color}`}
                          cx={dotX}
                          cy={dotY}
                          r={isSelected ? 7 : 5}
                          fill={segment.folderColorData.hex}
                          className="cursor-pointer transition-all duration-200"
                          style={{
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                          }}
                          stroke={
                            isSelected ? "white" : "rgba(15, 23, 42, 0.6)"
                          }
                          strokeWidth={isSelected ? 2 : 1}
                          onClick={() =>
                            setHoveredPieSegment(segment.folder.folder_color)
                          }
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {totalVideos}
                      </div>
                      <div className="text-[9px] text-slate-400">tagged</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-center h-[140px]">
                  {hoveredSegmentData ? (
                    <div className="flex flex-col items-center animate-in fade-in duration-150 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                          style={{
                            backgroundColor:
                              hoveredSegmentData.folderColorData.hex,
                          }}
                        />
                        <h4 className="text-sm font-semibold text-white truncate max-w-[120px]">
                          {hoveredSegmentData.displayName}
                        </h4>
                      </div>
                      <div className="w-full max-w-[140px] aspect-video rounded-md overflow-hidden bg-slate-900/50 shadow-md border border-slate-600/30">
                        {hoveredSegmentData.folder.first_video ? (
                          <img
                            src={getThumbnailUrl(
                              hoveredSegmentData.folder.first_video.video_id,
                              "standard",
                            )}
                            alt={hoveredSegmentData.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-slate-600"
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
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                        <span className="text-slate-400">
                          {hoveredSegmentData.videoCount} videos
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500">
                          {hoveredSegmentData.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
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
        )}

        {/* Mini Preview Strip */}
        <div className="mt-2 grid grid-cols-4 gap-2 px-1 pb-1">
          {localPreviewVideos.slice(0, 4).map((item, index) => {
            const slotKey = getPreviewItemKey(item, index);
            const thumbSrc = getPreviewItemThumbnail(item);
            const thumbFailed = miniImageErrors.has(slotKey);
            const showImg = thumbSrc && !thumbFailed;
            const isVideo = !item.isOrb && !item.isBannerPreset;
            const isTweet = isVideo && item.thumbnail_url?.includes("twimg.com");
            return (
              <div
                key={slotKey}
                className="aspect-video relative rounded-md overflow-hidden bg-black/50 border-2 border-[#052F4A] hover:ring-2 hover:ring-sky-500 transition-all cursor-pointer group/mini shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isVideo && item.video_url && onVideoSelect) onVideoSelect(item.video_url);
                }}
                onContextMenu={(e) => handleMiniVideoRightClick(e, item, index)}
                title={getPreviewItemTitle(item)}
              >
                {showImg ? (
                  <img
                    src={thumbSrc}
                    alt=""
                    className={`w-full h-full opacity-80 group-hover/mini:opacity-100 transition-opacity ${isTweet ? "object-contain bg-[#e0f2fe] p-0.5" : "object-cover"}`}
                    onError={() => setMiniImageErrors((prev) => new Set(prev).add(slotKey))}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${item.isOrb ? "bg-amber-900/60 text-amber-200" : item.isBannerPreset ? "bg-violet-900/60 text-violet-200" : "bg-slate-700/50 text-slate-400"}`}>
                    <span className="text-xs font-bold uppercase">{item.isOrb ? "Orb" : item.isBannerPreset ? "Banner" : ""}</span>
                  </div>
                )}
                {isVideo && showImg && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 bg-black/30 transition-opacity">
                    <Play size={12} className="text-white fill-current" />
                  </div>
                )}
              </div>
            );
          })}
          {Array.from({
            length: Math.max(0, 4 - localPreviewVideos.length),
          }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-video relative rounded-md bg-slate-800/20 border border-slate-700/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;

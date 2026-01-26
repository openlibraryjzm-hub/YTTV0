import React, { useState, useRef, useEffect } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';
import { Pen, Play, ChevronRight, ChevronLeft, RotateCcw, Clock, Pin, Sparkles, Info } from 'lucide-react';
import { getThumbnailUrl } from '../utils/youtubeUtils';


import UnifiedBannerBackground from './UnifiedBannerBackground';
import { useConfigStore } from '../store/configStore';

const PageBanner = ({ title, description, folderColor, onEdit, videoCount, countLabel = 'Video', creationYear, author, avatar, continueVideo, onContinue, pinnedVideos = [], onPinnedClick, children, childrenPosition = 'right', topRightContent, seamlessBottom = false, playlistBadges, onPlaylistBadgeLeftClick, onPlaylistBadgeRightClick, allPlaylists, filteredPlaylist, customDescription, onNavigateNext, onNavigatePrev, onReturn, showReturnButton, currentPlaylistId }) => {
    const { 
        pageBannerBgColor, setBannerHeight,
        customPageBannerImage2, pageBannerImage2Scale, pageBannerImage2XOffset, pageBannerImage2YOffset,
        userAvatar,
        layer2Folders,
        playlistLayer2Overrides
    } = useConfigStore();
    
    // Per-Playlist Layer 2 Image Selection
    // Each playlist can have its own selected Layer 2 image
    // Settings page (no currentPlaylistId): Uses global customPageBannerImage2 with global scale/offset
    // Videos page (with currentPlaylistId): Uses per-playlist override or defaults to Default folder's first image
    const getEffectiveLayer2Image = () => {
        // Settings page case: No playlist context, use global values for live preview
        if (!currentPlaylistId) {
            if (customPageBannerImage2) {
                return {
                    image: customPageBannerImage2,
                    scale: pageBannerImage2Scale,
                    xOffset: pageBannerImage2XOffset,
                    yOffset: pageBannerImage2YOffset,
                    imageId: null, // Global, not from a saved image
                    folderId: null
                };
            }
            return null;
        }
        
        // Videos page case: Check for playlist-specific override first
        if (playlistLayer2Overrides[currentPlaylistId]) {
            const override = playlistLayer2Overrides[currentPlaylistId];
            // Look up the CURRENT image from the library to get latest values
            const folder = layer2Folders?.find(f => f.id === override.folderId);
            const libraryImage = folder?.images?.find(img => img.id === override.imageId);
            
            if (libraryImage) {
                // Use latest values from library (live updates from Settings)
                return {
                    image: libraryImage.image,
                    scale: libraryImage.scale,
                    xOffset: libraryImage.xOffset,
                    yOffset: libraryImage.yOffset,
                    imageId: libraryImage.id,
                    folderId: override.folderId,
                    bgColor: libraryImage.bgColor
                };
            }
            // Fallback to stored values if image was deleted from library
            return {
                image: override.image,
                scale: override.scale,
                xOffset: override.xOffset,
                yOffset: override.yOffset,
                imageId: override.imageId,
                folderId: override.folderId,
                bgColor: override.bgColor
            };
        }
        
        // No override - use first image from Default folder as fallback
        const defaultFolder = layer2Folders?.find(f => f.id === 'default');
        if (defaultFolder && defaultFolder.images?.length > 0) {
            const defaultImage = defaultFolder.images[0];
            return {
                image: defaultImage.image,
                scale: defaultImage.scale,
                xOffset: defaultImage.xOffset,
                yOffset: defaultImage.yOffset,
                imageId: defaultImage.id,
                folderId: 'default',
                bgColor: defaultImage.bgColor // Include the image's paired background color
            };
        }
        
        // No default images available
        return null;
    };
    
    const effectiveLayer2 = getEffectiveLayer2Image();
    const effectiveLayer2Image = effectiveLayer2?.image || null;
    const effectiveLayer2Scale = effectiveLayer2?.scale ?? 100;
    const effectiveLayer2XOffset = effectiveLayer2?.xOffset ?? 50;
    const effectiveLayer2YOffset = effectiveLayer2?.yOffset ?? 50;
    const effectiveLayer2ImageId = effectiveLayer2?.imageId || null;
    // Use per-playlist bgColor if available, otherwise fall back to global pageBannerBgColor
    const effectiveBgColor = effectiveLayer2?.bgColor || pageBannerBgColor;
    const [badgesExpanded, setBadgesExpanded] = useState(false);
    const badgesContainerRef = useRef(null);
    
    // Info display state - shows author/year/count in thumbnail area
    const [showInfo, setShowInfo] = useState(false);
    
    // Thumbnail carousel state (0 = continue, 1 = pinned, 2 = ascii)
    const [activeThumbnail, setActiveThumbnail] = useState(0);
    // Track which pinned video is selected (when viewing pinned)
    const [activePinnedIndex, setActivePinnedIndex] = useState(0);
    
    // Determine which options are available
    const hasContinue = !!continueVideo;
    const hasPinned = pinnedVideos && pinnedVideos.length > 0;
    const hasMultiplePins = pinnedVideos && pinnedVideos.length > 1;
    const hasAscii = !!(userAvatar || avatar); // Use userAvatar from store or avatar prop
    const displayAvatar = userAvatar || avatar; // The actual avatar to display
    
    // Count available options for dot navigation
    const availableOptions = [];
    if (hasContinue) availableOptions.push('continue');
    if (hasPinned) availableOptions.push('pinned');
    if (hasAscii) availableOptions.push('ascii');
    const hasMultipleOptions = availableOptions.length > 1;
    const hasAnyOption = availableOptions.length > 0;
    
    // Get the active pinned video
    const activePinnedVideo = hasPinned ? pinnedVideos[activePinnedIndex] || pinnedVideos[0] : null;
    
    // Map activeThumbnail index to actual option type
    const getOptionAtIndex = (index) => availableOptions[index] || null;
    const currentOption = getOptionAtIndex(activeThumbnail);
    
    // Get the active video based on selection (null for ascii)
    const activeVideo = currentOption === 'continue' ? continueVideo : currentOption === 'pinned' ? activePinnedVideo : null;
    const activeLabel = currentOption === 'continue' ? 'CONTINUE?' : currentOption === 'pinned' ? 'PINNED' : 'SIGNATURE';
    const activeCallback = currentOption === 'continue' ? onContinue : currentOption === 'pinned' ? () => onPinnedClick && onPinnedClick(activePinnedVideo) : null;

    // Measure height for banner
    const bannerRef = React.useRef(null);

    React.useEffect(() => {
        if (!bannerRef.current) return;

        const updateDimensions = () => {
            const banner = bannerRef.current;
            if (!banner) return;
            setBannerHeight(banner.offsetHeight);
        };

        const observer = new ResizeObserver(updateDimensions);
        observer.observe(bannerRef.current);
        window.addEventListener('resize', updateDimensions);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateDimensions);
        };
    }, [setBannerHeight]);

    // Simple approach: show all badges, but limit height with CSS when collapsed
    const hasMoreBadges = playlistBadges && playlistBadges.length > 0;

    // Dynamic banner height based on expansion
    const bannerHeightClass = badgesExpanded && playlistBadges && playlistBadges.length > 0 
        ? 'min-h-[220px]' 
        : 'h-[220px]';

    return (
        <div ref={bannerRef} className={`w-full relative animate-fade-in group mx-auto ${bannerHeightClass} ${seamlessBottom ? 'mb-0' : 'mb-8'}`}>

            {/* Background Layer - Solid color (Layer 1) */}
            <div
                className="absolute inset-0 overflow-hidden shadow-lg"
                style={{
                    backgroundColor: effectiveBgColor,
                    boxShadow: seamlessBottom ? 'none' : `0 10px 25px -5px ${effectiveBgColor}50`
                }}
            >
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transform group-hover:scale-110 transition-transform duration-1000 ease-in-out" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
            </div>
            
            {/* Layer 2 Overlay - only covers right panel area (starts at border line) */}
            {effectiveLayer2Image && (
                <div 
                    className="absolute top-0 bottom-0 right-0 overflow-hidden"
                    style={{ left: '332px' }}
                >
                    <UnifiedBannerBackground
                        image={null}
                        image2={effectiveLayer2Image}
                        image2Scale={effectiveLayer2Scale}
                        image2XOffset={effectiveLayer2XOffset}
                        image2YOffset={effectiveLayer2YOffset}
                    />
                </div>
            )}
            
            {/* Left Panel Border - covers from left to 2px past thumbnail scroller */}
            <div 
                className="absolute top-0 bottom-0 left-0 pointer-events-none z-10"
                style={{ 
                    width: '332px',
                    border: '4px solid rgba(0,0,0,0.8)',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2), 0 0 15px rgba(0,0,0,0.5)'
                }}
            />
            
            {/* Right Panel Border - covers from left panel end to right edge */}
            <div 
                className="absolute top-0 bottom-0 right-0 pointer-events-none z-10"
                style={{ 
                    left: '332px',
                    border: '4px solid rgba(0,0,0,0.8)',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2), 0 0 15px rgba(0,0,0,0.5)'
                }}
            />

            {/* Top Right Content */}
            {topRightContent && (
                <div className="absolute top-4 right-4 z-30">
                    {topRightContent}
                </div>
            )}


            {/* Content Container - Allow overflow for dropdowns */}
            <div className="relative z-10 flex items-start h-full gap-8 w-full px-8 pt-4">
                <div className="flex flex-col justify-start min-w-0">
                    <div className="flex items-center gap-2">
                        {/* Previous Playlist Button - Left side */}
                        {(onNavigatePrev || onNavigateNext) && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onNavigatePrev) onNavigatePrev();
                                    }}
                                    className="flex items-center justify-center w-6 h-6 rounded-md bg-white hover:bg-white/80 text-black transition-all flex-shrink-0"
                                    title="Previous Playlist"
                                >
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                                
                                {/* Return Button - Middle */}
                                {onReturn && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onReturn) onReturn();
                                        }}
                                        className={`flex items-center justify-center w-6 h-6 rounded-md transition-all flex-shrink-0 ${
                                            showReturnButton 
                                                ? 'bg-white hover:bg-white/80 text-black' 
                                                : 'bg-white/50 text-gray-400 cursor-default'
                                        }`}
                                        title={showReturnButton ? "Return to original playlist" : "At original playlist"}
                                        disabled={!showReturnButton}
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                )}
                            </>
                        )}
                        
                        <h1 className="text-lg md:text-xl font-black text-white mb-0 tracking-tight drop-shadow-md truncate flex-1" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)' }}>
                            {title}
                        </h1>
                        
                        {/* Next Playlist Button - Right side */}
                        {(onNavigatePrev || onNavigateNext) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onNavigateNext) onNavigateNext();
                                }}
                                className="flex items-center justify-center w-6 h-6 rounded-md bg-white hover:bg-white/80 text-black transition-all flex-shrink-0"
                                title="Next Playlist"
                            >
                                <ChevronRight size={16} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    {showInfo && (customDescription ? (
                        <div className="mt-[7px] ml-[170px] max-h-[100px] overflow-y-auto">
                            {customDescription}
                        </div>
                    ) : description && (
                        <p className="text-sm md:text-base text-white/90 font-medium max-w-4xl leading-relaxed drop-shadow-sm opacity-90 line-clamp-6 mt-[7px] ml-[170px]" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)' }}>
                            {description}
                        </p>
                    ))}

                    {/* Playlist Badges */}
                    {playlistBadges && playlistBadges.length > 0 && (
                        <div 
                            ref={badgesContainerRef}
                            className={`flex flex-wrap items-center gap-2 mt-3 relative ${!badgesExpanded ? 'max-h-[72px] overflow-hidden' : ''}`}
                        >
                            {playlistBadges.map((playlistName, idx) => {
                                // Check if this playlist is currently filtered
                                const isFiltered = filteredPlaylist === playlistName;
                                
                                // Default sky color for badges, brighter when filtered
                                const badgeBg = isFiltered 
                                    ? 'rgba(14, 165, 233, 0.25)' // sky-500/25 when filtered
                                    : 'rgba(14, 165, 233, 0.1)'; // sky-500/10
                                const badgeBorder = isFiltered
                                    ? 'rgba(14, 165, 233, 0.6)' // sky-500/60 when filtered
                                    : 'rgba(14, 165, 233, 0.3)'; // sky-500/30
                                const badgeTextColor = '#38bdf8'; // sky-400
                                const badgeHoverBg = 'rgba(14, 165, 233, 0.2)'; // sky-500/20
                                const badgeHoverBorder = 'rgba(14, 165, 233, 0.5)'; // sky-500/50

                                return (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onPlaylistBadgeLeftClick) {
                                                onPlaylistBadgeLeftClick(e, playlistName);
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            if (onPlaylistBadgeRightClick) {
                                                onPlaylistBadgeRightClick(e, playlistName);
                                            }
                                        }}
                                        className="flex items-center gap-0.5 px-2 py-1 rounded-md border font-medium transition-all cursor-pointer"
                                        style={{
                                            backgroundColor: badgeBg,
                                            borderColor: badgeBorder,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = badgeHoverBg;
                                            e.currentTarget.style.borderColor = badgeHoverBorder;
                                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = badgeBg;
                                            e.currentTarget.style.borderColor = badgeBorder;
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        title={`Left click to filter | Right click to navigate: ${playlistName}`}
                                    >
                                        <span className="line-clamp-1 text-sm md:text-base font-medium text-white/80" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.9)' }}>
                                            {playlistName}
                                        </span>
                                    </button>
                                );
                            })}
                            
                            {/* Expand Button - Appears at end of second row when collapsed */}
                            {hasMoreBadges && !badgesExpanded && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setBadgesExpanded(true);
                                    }}
                                    className="absolute bottom-0 right-0 flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-all cursor-pointer z-10"
                                    style={{
                                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                        borderColor: 'rgba(14, 165, 233, 0.3)',
                                        color: '#38bdf8',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    title={`Show all ${playlistBadges.length} playlists`}
                                >
                                    <span className="text-sm" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.8)' }}>
                                        &gt;&gt;&gt;
                                    </span>
                                </button>
                            )}
                            {/* Collapse Button - Shows when expanded */}
                            {hasMoreBadges && badgesExpanded && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setBadgesExpanded(false);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-all cursor-pointer"
                                    style={{
                                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                        borderColor: 'rgba(14, 165, 233, 0.3)',
                                        color: '#38bdf8',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    title="Show less"
                                >
                                    <span className="text-sm" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.8)' }}>
                                        Show less
                                    </span>
                                    <ChevronRight 
                                        size={14} 
                                        className="rotate-90 transition-transform"
                                        style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 1px 2px rgba(0,0,0,0.8)' }}
                                    />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Bottom Content (e.g. Tabs) */}
                    {children && childrenPosition === 'bottom' && (
                        <div className="mt-4">
                            {children}
                        </div>
                    )}
                </div>

                {/* Right Content */}
                {children && childrenPosition === 'right' && (
                    <div className="ml-auto pl-8">
                        {children}
                    </div>
                )}
            </div>

            {/* Thumbnail/ASCII Section - Continue/Pinned/ASCII with dot navigation */}
            {hasAnyOption && (
                <div className="absolute bottom-1 flex items-end z-20" style={{ left: '166px', transform: 'translateX(-50%)' }}>
                    {/* Fixed-width container for content */}
                    <div className="flex flex-col items-center">
                        {/* Content row with optional pin bar and preview stack */}
                        <div className="flex items-stretch gap-[2px]">
                            {/* Clickable content area */}
                            <div
                                className={`flex flex-col items-center gap-2 group/thumb flex-shrink-0 ${activeCallback && !showInfo ? 'cursor-pointer' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!showInfo && activeCallback) activeCallback();
                                }}
                            >
                                {/* Show thumbnail with info overlays when info button is clicked */}
                                {showInfo && activeVideo ? (
                                    <div className="relative h-36 w-[240px] rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
                                        <img
                                            src={getThumbnailUrl(activeVideo.video_id, 'medium')}
                                            alt={activeVideo.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Info overlays - vertically aligned on right side */}
                                        {author && (
                                            <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white font-semibold text-xs truncate max-w-[90%]" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                                                {author}
                                            </span>
                                        )}
                                        {creationYear && (
                                            <span className="absolute top-1/2 right-1 -translate-y-1/2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                {creationYear}
                                            </span>
                                        )}
                                        {videoCount !== undefined && (
                                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                {videoCount} {videoCount === 1 ? countLabel : `${countLabel}s`}
                                            </span>
                                        )}
                                    </div>
                                ) : showInfo && !activeVideo ? (
                                    <div className="h-36 w-[240px] flex flex-col items-center justify-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm border-2 border-white/20 overflow-hidden px-2">
                                        {author && (
                                            <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white font-semibold text-sm truncate max-w-full" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                                                {author}
                                            </span>
                                        )}
                                        {creationYear && (
                                            <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                {creationYear}
                                            </span>
                                        )}
                                        {videoCount !== undefined && (
                                            <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white/90 font-medium text-xs">
                                                {videoCount} {videoCount === 1 ? countLabel : `${countLabel}s`}
                                            </span>
                                        )}
                                    </div>
                                ) : currentOption === 'ascii' ? (
                                    <div className="h-36 w-[240px] flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm border-2 border-white/20 overflow-hidden">
                                        {displayAvatar && displayAvatar.includes('\n') ? (
                                            <pre className="font-mono text-[5px] leading-none whitespace-pre text-white/90 drop-shadow-md select-none max-w-full max-h-full" style={{ textShadow: '-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000, 0 1px 2px rgba(0,0,0,1)' }}>
                                                {displayAvatar}
                                            </pre>
                                        ) : (
                                            <div className="font-mono text-xl font-bold text-white/90 drop-shadow-md whitespace-nowrap max-w-full truncate px-2" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.8)' }}>
                                                {displayAvatar}
                                            </div>
                                        )}
                                    </div>
                                ) : activeVideo && (
                                    <div className="relative h-36 w-[240px] rounded-lg overflow-hidden shadow-lg border-2 border-white/20 group-hover/thumb:border-white transition-all transform group-hover/thumb:scale-105">
                                        <img
                                            src={getThumbnailUrl(activeVideo.video_id, 'medium')}
                                            alt={activeVideo.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Pin type icon - only show when viewing pinned video */}
                                        {currentOption === 'pinned' && activePinnedVideo && (
                                            <div 
                                                className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm"
                                                title={
                                                    activePinnedVideo.isPriority && activePinnedVideo.isFollower ? 'Priority Follower Pin' :
                                                    activePinnedVideo.isPriority ? 'Priority Pin' :
                                                    activePinnedVideo.isFollower ? 'Follower Pin' : 'Pin'
                                                }
                                            >
                                                {/* Crown for priority */}
                                                {activePinnedVideo.isPriority && (
                                                    <span className="text-[10px]" style={{ color: '#FFD700' }}>👑</span>
                                                )}
                                                {/* Pin icon */}
                                                <Pin 
                                                    size={12} 
                                                    className={activePinnedVideo.isPriority ? 'text-yellow-400' : 'text-white'}
                                                    fill={activePinnedVideo.isPriority ? '#FFD700' : 'white'}
                                                />
                                                {/* Arrow for follower */}
                                                {activePinnedVideo.isFollower && (
                                                    <span className="text-[10px] text-sky-400">→</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                            <Play className="text-white fill-white" size={36} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Vertical pin bar with selection dot - only show when viewing pinned and multiple pins exist (max 10 segments) */}
                        {/* Positioned absolutely to the right of thumbnail to maintain uniform thumbnail width */}
                        {currentOption === 'pinned' && hasMultiplePins && (
                            <div className="absolute flex flex-row items-stretch gap-[2px]" style={{ left: 'calc(50% + 120px + 4px)', bottom: '31px' }}>
                                <div className="flex flex-col w-3 h-36 rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
                                    {pinnedVideos.slice(0, 10).map((pin, index) => {
                                        // Get folder color for this pinned video
                                        const pinFolderColor = pin.folder_color || pin.folderColor;
                                        const folderColorConfig = pinFolderColor ? FOLDER_COLORS.find(c => c.id === pinFolderColor) : null;
                                        const isPriority = pin.isPriority;
                                        // Priority pins get golden color, otherwise use folder color
                                        const segmentColor = isPriority ? '#FFD700' : (folderColorConfig?.hex || null);
                                        
                                        return (
                                            <button
                                                key={pin.id || index}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActivePinnedIndex(index);
                                                }}
                                                className={`flex-1 transition-all hover:opacity-100 ${
                                                    !segmentColor ? 'bg-white/50 hover:bg-white/70' : ''
                                                }`}
                                                style={{
                                                    borderBottom: index < Math.min(pinnedVideos.length, 10) - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                                                    ...(segmentColor ? {
                                                        backgroundColor: segmentColor,
                                                        opacity: isPriority ? 1 : 0.85
                                                    } : {}),
                                                    // Crown-like clip-path for priority pin (top segment with pointy top edge)
                                                    ...(isPriority && index === 0 ? {
                                                        clipPath: 'polygon(0% 30%, 25% 0%, 50% 20%, 75% 0%, 100% 30%, 100% 100%, 0% 100%)',
                                                        marginTop: '-2px',
                                                        paddingTop: '2px'
                                                    } : {})
                                                }}
                                                title={isPriority ? `👑 ${pin.title || 'Priority Pin'}` : (pin.title || `Pin ${index + 1}`)}
                                            />
                                        );
                                    })}
                                </div>
                                {/* Selection indicator dot */}
                                <div className="relative h-36 w-2 flex flex-col">
                                    {pinnedVideos.slice(0, 10).map((pin, index) => (
                                        <div key={index} className="flex-1 flex items-center justify-center">
                                            {activePinnedIndex === index && (
                                                <div 
                                                    className="w-1.5 h-1.5 rounded-full shadow-md" 
                                                    style={{ backgroundColor: pin.isPriority ? '#FFD700' : 'white' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Horizontal segmented bar with info button - show when multiple options exist */}
                        {hasMultipleOptions && (
                            <div className="flex flex-row items-center gap-1 mt-1 ml-[10px]">
                                <div className="flex flex-row h-5 w-[240px] rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
                                    {availableOptions.map((option, index) => (
                                        <button
                                            key={option}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveThumbnail(index);
                                            }}
                                            className={`flex-1 flex items-center justify-center transition-all ${
                                                activeThumbnail === index
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/30 text-white/70 hover:bg-white/50 hover:text-white'
                                            }`}
                                            style={{
                                                borderRight: index < availableOptions.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none'
                                            }}
                                            title={option === 'continue' ? 'Continue watching' : option === 'pinned' ? 'Pinned videos' : 'Signature'}
                                        >
                                            {option === 'continue' && <Clock size={12} />}
                                            {option === 'pinned' && <Pin size={12} />}
                                            {option === 'ascii' && <Sparkles size={12} />}
                                        </button>
                                    ))}
                                </div>
                                {/* Info Button - right of carousel buttons */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(!showInfo);
                                    }}
                                    onContextMenu={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (onEdit) onEdit();
                                    }}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                        showInfo 
                                            ? 'bg-white text-black' 
                                            : 'bg-white text-black hover:bg-white/80'
                                    }`}
                                    title={showInfo ? "Hide info | Right-click to edit" : "Show info | Right-click to edit"}
                                >
                                    <Info size={12} strokeWidth={2} />
                                </button>
                            </div>
                        )}
                        
                        {/* Info Button - show alone when no carousel options */}
                        {!hasMultipleOptions && (
                            <div className="mt-1 ml-[10px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(!showInfo);
                                    }}
                                    onContextMenu={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (onEdit) onEdit();
                                    }}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                        showInfo 
                                            ? 'bg-white text-black' 
                                            : 'bg-white text-black hover:bg-white/80'
                                    }`}
                                    title={showInfo ? "Hide info | Right-click to edit" : "Show info | Right-click to edit"}
                                >
                                    <Info size={12} strokeWidth={2} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Fallback Info Button - when no thumbnail/carousel options exist */}
            {!hasAnyOption && (
                <div className="absolute bottom-1 z-20" style={{ left: '166px', transform: 'translateX(-50%)' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInfo(!showInfo);
                        }}
                        onContextMenu={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onEdit) onEdit();
                        }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            showInfo 
                                ? 'bg-white text-black' 
                                : 'bg-white text-black hover:bg-white/80'
                        }`}
                        title={showInfo ? "Hide info | Right-click to edit" : "Show info | Right-click to edit"}
                    >
                        <Info size={12} strokeWidth={2} />
                    </button>
                </div>
            )}
        </div>
    );
};


export default PageBanner;

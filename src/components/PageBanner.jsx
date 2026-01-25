import React, { useState, useRef, useEffect } from 'react';
import { FOLDER_COLORS } from '../utils/folderColors';
import { Pen, Play, ChevronRight, ChevronUp, ChevronDown, RotateCcw, Clock, Pin, Sparkles, Info, Folder, Image } from 'lucide-react';
import { getThumbnailUrl } from '../utils/youtubeUtils';


import UnifiedBannerBackground from './UnifiedBannerBackground';
import { useConfigStore } from '../store/configStore';

const PageBanner = ({ title, description, folderColor, onEdit, videoCount, countLabel = 'Video', creationYear, author, avatar, continueVideo, onContinue, pinnedVideos = [], onPinnedClick, children, childrenPosition = 'right', topRightContent, seamlessBottom = false, playlistBadges, onPlaylistBadgeLeftClick, onPlaylistBadgeRightClick, allPlaylists, filteredPlaylist, customDescription, onNavigateNext, onNavigatePrev, onReturn, showReturnButton }) => {
    const { 
        bannerPattern, customPageBannerImage, bannerBgSize, setBannerHeight, setBannerBgSize, 
        pageBannerScrollEnabled, pageBannerImageScale, pageBannerImageXOffset, pageBannerImageYOffset,
        customPageBannerImage2, pageBannerImage2Scale, pageBannerImage2XOffset, pageBannerImage2YOffset,
        userAvatar,
        layer2Folders, applyLayer2Image, selectedLayer2FolderId, setSelectedLayer2FolderId
    } = useConfigStore();
    
    // Layer 2 strip view mode: 'folders' = show folder list, 'images' = show images from selected folder
    const [layer2ViewMode, setLayer2ViewMode] = useState('images');
    
    // Get the selected folder and its images
    const selectedFolder = layer2Folders?.find(f => f.id === selectedLayer2FolderId) || layer2Folders?.[0];
    const layer2Images = selectedFolder?.images || [];
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

    // Find color config if folderColor is provided
    // If folderColor is 'unsorted', distinct gray style
    const isUnsorted = folderColor === 'unsorted';

    const colorConfig = (!isUnsorted && folderColor)
        ? FOLDER_COLORS.find(c => c.id === folderColor)
        : null;

    // Determine gradient styles
    let gradientStyle;
    let shadowColor;

    // Measure height and calculate background size for Unified Banner
    const bannerRef = React.useRef(null);

    React.useEffect(() => {
        if (!bannerRef.current) return;

        const updateDimensions = () => {
            const banner = bannerRef.current;
            if (!banner) return;

            const width = banner.offsetWidth;
            const height = banner.offsetHeight;

            // If no custom image, just report height
            if (!customPageBannerImage) {
                setBannerHeight(height);
                return;
            }

            // Just report height for PageBanner spacing, we use cover/center now.
            setBannerHeight(height);
        };


        const observer = new ResizeObserver(updateDimensions);
        observer.observe(bannerRef.current);

        // Also listen to window resize for horizontal changes
        window.addEventListener('resize', updateDimensions);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateDimensions);
        };
    }, [customPageBannerImage, setBannerHeight, setBannerBgSize]);

    if (customPageBannerImage) {
        gradientStyle = {
            backgroundImage: `url(${customPageBannerImage})`,
            backgroundSize: 'cover', // Standard cover
            backgroundPositionY: 'center',
            backgroundPositionX: '0px', // Allow animation to take over X axis
            backgroundRepeat: 'repeat-x', // Repeat horizontally for scroll
            // backgroundAttachment: 'fixed', // Removed fixed to basic absolute stitching
        };
        // Use a neutral or dominant color for shadow if possible, or fallback
        shadowColor = colorConfig?.hex || '#3b82f6';
    } else if (isUnsorted) {
        gradientStyle = {
            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' // Slate/Gray
        };
        shadowColor = '#64748b';
    } else if (colorConfig) {
        gradientStyle = {
            background: `linear-gradient(135deg, ${colorConfig.hex}DD 0%, ${colorConfig.hex} 100%)`
        };
        shadowColor = colorConfig.hex;
    } else {
        // Default Playlist Blue
        gradientStyle = {
            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' // Sky to Blue
        };
        shadowColor = '#3b82f6';
    }

    // Check if custom image is a GIF
    const isGif = customPageBannerImage?.startsWith('data:image/gif');

    // Simple approach: show all badges, but limit height with CSS when collapsed
    const hasMoreBadges = playlistBadges && playlistBadges.length > 0;

    // Dynamic banner height based on expansion
    const bannerHeightClass = badgesExpanded && playlistBadges && playlistBadges.length > 0 
        ? 'min-h-[220px]' 
        : 'h-[220px]';

    return (
        <div ref={bannerRef} className={`w-full relative animate-fade-in group mx-auto ${bannerHeightClass} ${seamlessBottom ? 'mb-0' : 'mb-8'}`}>

            {/* Background Layer - Hides overflow for shapes/patterns/images */}
            <div
                className={`absolute inset-0 overflow-hidden ${seamlessBottom ? 'rounded-t-2xl rounded-b-none shadow-none' : 'rounded-2xl shadow-lg'}`}
                style={{
                    // Gradient styles only when NO custom image (fallback)
                    ...(!customPageBannerImage ? gradientStyle : {}),
                    boxShadow: seamlessBottom ? 'none' : `0 10px 25px -5px ${shadowColor}50`
                }}
            >
                {/* Unified GPU Banner */}
                {(customPageBannerImage || customPageBannerImage2) && (
                    <UnifiedBannerBackground
                        image={customPageBannerImage}
                        bgSize="cover"
                        yOffset="center"
                        isGif={isGif}
                        scrollEnabled={pageBannerScrollEnabled}
                        imageScale={pageBannerImageScale}
                        imageXOffset={pageBannerImageXOffset}
                        imageYOffset={pageBannerImageYOffset}
                        image2={customPageBannerImage2}
                        image2Scale={pageBannerImage2Scale}
                        image2XOffset={pageBannerImage2XOffset}
                        image2YOffset={pageBannerImage2YOffset}
                    />
                )}

                {/* Animated Pattern Overlay */}
                {!customPageBannerImage && !customPageBannerImage2 && (
                    <div className={`absolute inset-0 pointer-events-none z-0 pattern-${bannerPattern || 'diagonal'}`} />
                )}



                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transform group-hover:scale-110 transition-transform duration-1000 ease-in-out" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
            </div>

            {/* Top Right Content */}
            {topRightContent && (
                <div className="absolute top-4 right-4 z-30">
                    {topRightContent}
                </div>
            )}


            {/* Content Container - Allow overflow for dropdowns */}
            <div className="relative z-10 flex items-start h-full gap-8 w-full px-8 pt-4">
                <div className="flex flex-col justify-start min-w-0">
                    <h1 className="text-lg md:text-xl font-black text-white mb-0 tracking-tight drop-shadow-md truncate" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.8)' }}>
                        {title}
                    </h1>

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
                <div className="absolute bottom-1 left-[1px] flex items-end z-20">
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
                                    <div className="relative h-24 w-[160px] rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
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
                                    <div className="h-24 w-[160px] flex flex-col items-center justify-center gap-1 rounded-lg bg-black/50 backdrop-blur-sm border-2 border-white/20 overflow-hidden px-2">
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
                                    <div className="h-24 w-[160px] flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm border-2 border-white/20 overflow-hidden">
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
                                    <div className="relative h-24 w-[160px] rounded-lg overflow-hidden shadow-lg border-2 border-white/20 group-hover/thumb:border-white transition-all transform group-hover/thumb:scale-105">
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
                                            <Play className="text-white fill-white" size={24} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Vertical pin bar with selection dot - only show when viewing pinned and multiple pins exist (max 10 segments) */}
                            {currentOption === 'pinned' && hasMultiplePins && (
                                <div className="flex flex-row items-stretch gap-[2px]">
                                    <div className="flex flex-col w-3 h-24 rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
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
                                    <div className="relative h-24 w-2 flex flex-col">
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
                            
                            {/* Vertical Playlist Navigator - Up/Return/Down (right side of thumbnail) */}
                            {(onNavigateNext || onNavigatePrev) && (
                                <div className="flex flex-col h-24 w-6 rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
                                    {/* Up Chevron - Next Playlist */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onNavigateNext) onNavigateNext();
                                        }}
                                        className="flex-1 flex items-center justify-center bg-white hover:bg-white/80 text-black transition-all"
                                        title="Next Playlist"
                                    >
                                        <ChevronUp size={16} strokeWidth={2.5} />
                                    </button>
                                    
                                    {/* Middle - Return/Refresh Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onReturn) onReturn();
                                        }}
                                        className={`flex-1 flex items-center justify-center transition-all border-y border-black/30 bg-white ${
                                            showReturnButton 
                                                ? 'hover:bg-white/80 text-black' 
                                                : 'text-gray-400 cursor-default'
                                        }`}
                                        title={showReturnButton ? "Return to original playlist" : "At original playlist"}
                                        disabled={!showReturnButton}
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                    
                                    {/* Down Chevron - Previous Playlist */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onNavigatePrev) onNavigatePrev();
                                        }}
                                        className="flex-1 flex items-center justify-center bg-white hover:bg-white/80 text-black transition-all"
                                        title="Previous Playlist"
                                    >
                                        <ChevronDown size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Horizontal segmented bar with info button - show when multiple options exist */}
                        {hasMultipleOptions && (
                            <div className="flex flex-row items-center gap-1 mt-1 ml-[10px]">
                                <div className="flex flex-row h-5 w-[160px] rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
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
            
            {/* Vertical Thumbnail Strip - stacked thumbnails spanning banner height */}
            <div className="absolute top-2 bottom-2 left-[220px] flex flex-col gap-1 z-20">
                {/* 4 slots container */}
                <div className="flex-1 flex flex-col gap-1">
                    {layer2ViewMode === 'images' ? (
                        /* Images Mode: Show images from selected folder */
                        [0, 1, 2, 3].map((index) => {
                            const img = layer2Images[index];
                            const isActive = img && customPageBannerImage2 === img.image;
                            return (
                                <button
                                    key={index}
                                    onClick={() => img && applyLayer2Image(img)}
                                    className={`flex-1 w-[100px] rounded-md overflow-hidden border transition-all ${
                                        isActive 
                                            ? 'border-2 border-purple-400 ring-1 ring-purple-300' 
                                            : 'border border-white/20 hover:border-white/40'
                                    } bg-black/30 backdrop-blur-sm ${img ? 'cursor-pointer hover:scale-105' : ''}`}
                                    disabled={!img}
                                >
                                    {img ? (
                                        <img 
                                            src={img.image} 
                                            alt={`Layer 2 Option ${index + 1}`} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : null}
                                </button>
                            );
                        })
                    ) : (
                        /* Folders Mode: Show folder list with first image as thumbnail */
                        [0, 1, 2, 3].map((index) => {
                            const folder = layer2Folders?.[index];
                            const isSelected = folder && folder.id === selectedLayer2FolderId;
                            const firstImage = folder?.images?.[0];
                            return (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (folder) {
                                            // Select folder and switch to images view
                                            setSelectedLayer2FolderId(folder.id);
                                            // Use setTimeout to ensure state updates in sequence
                                            setTimeout(() => setLayer2ViewMode('images'), 0);
                                        }
                                    }}
                                    className={`flex-1 w-[100px] rounded-md overflow-hidden border transition-all relative ${
                                        isSelected 
                                            ? 'border-2 border-purple-400 ring-1 ring-purple-300' 
                                            : 'border border-white/20 hover:border-white/40'
                                    } bg-black/30 backdrop-blur-sm ${folder ? 'cursor-pointer hover:scale-105' : ''}`}
                                    disabled={!folder}
                                >
                                    {folder ? (
                                        <>
                                            {/* Folder thumbnail - first image or fallback */}
                                            {firstImage ? (
                                                <img 
                                                    src={firstImage.image} 
                                                    alt={folder.name}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Folder size={20} className="text-purple-300/50" />
                                                </div>
                                            )}
                                            {/* Folder info overlay */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                                <span className="text-[9px] text-white font-bold truncate max-w-[90px] text-center px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,1)' }}>
                                                    {folder.name}
                                                </span>
                                                <span className="text-[8px] text-white/70 font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                                    {folder.images.length} img
                                                </span>
                                            </div>
                                        </>
                                    ) : null}
                                </button>
                            );
                        })
                    )}
                </div>
                
                {/* Mode Switcher Bar */}
                <div className="flex flex-row h-5 w-[100px] rounded-md overflow-hidden border border-white/20 bg-black/20 backdrop-blur-sm">
                    <button
                        onClick={() => setLayer2ViewMode('folders')}
                        className={`flex-1 flex items-center justify-center transition-all ${
                            layer2ViewMode === 'folders'
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/30 text-white/70 hover:bg-white/50 hover:text-white'
                        }`}
                        title="Browse folders"
                    >
                        <Folder size={12} />
                    </button>
                    <button
                        onClick={() => setLayer2ViewMode('images')}
                        className={`flex-1 flex items-center justify-center transition-all border-l border-black/30 ${
                            layer2ViewMode === 'images'
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/30 text-white/70 hover:bg-white/50 hover:text-white'
                        }`}
                        title={`View images in ${selectedFolder?.name || 'folder'}`}
                    >
                        <Image size={12} />
                    </button>
                </div>
            </div>
            
            {/* Fallback Info Button - when no thumbnail/carousel options exist */}
            {!hasAnyOption && (
                <div className="absolute bottom-1 left-[1px] z-20">
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

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Card from './Card';
import CardThumbnail from './CardThumbnail';
import CardActions from './CardActions';
import BulkTagColorGrid from './BulkTagColorGrid';
import StarColorPicker from './StarColorPicker';
import ImageHoverPreview from './ImageHoverPreview';
import DrumstickRating from './DrumstickRating';
import { getFolderColorById, FOLDER_COLORS } from '../utils/folderColors';
import { usePinStore } from '../store/pinStore';
import { useLayoutStore } from '../store/layoutStore';
import { useFolderStore } from '../store/folderStore';
import { Pin, MessageCircle, Repeat2, Heart, Share, MoreHorizontal } from 'lucide-react';
import { getDrumstickRating, setDrumstickRating } from '../api/playlistApi';

const TweetCard = ({
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
    progress = 0,
    isWatched = false,
    isStickied = false,
    playlistId = null,
    folderMetadata = {},
    onRenameFolder,
}) => {
    const { inspectMode } = useLayoutStore();
    const { quickAssignFolder } = useFolderStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isStarHovered, setIsStarHovered] = useState(false);
    const starHoverTimeoutRef = useRef(null);
    const starHoverDelayRef = useRef(null);

    const getInspectTitle = (label) => inspectMode ? label : undefined;

    const thumbnailUrl = useMemo(() => {
        // Upgrade Twitter card thumbnail to 'medium' for better clarity than 'thumb'
        // without the full overhead of 'large' for every grid item
        return video.thumbnail_url?.replace(/name=[a-z]+/, 'name=medium') || video.thumbnail_url;
    }, [video]);

    const previewUrl = useMemo(() => {
        // Use video raw mp4 url if available, otherwise upgrade Twitter thumbnail
        if (video.video_url && video.video_url.includes('.mp4')) {
            return video.video_url;
        }
        return video.thumbnail_url?.replace(/name=[a-z]+/, 'name=large') || video.thumbnail_url;
    }, [video]);

    const isVideoMedia = useMemo(() => {
        return !!(video.video_url && video.video_url.includes('.mp4'));
    }, [video]);

    const primaryFolder = videoFolders.length > 0 ? getFolderColorById(videoFolders[0]) : null;
    const quickAssignColor = getFolderColorById(quickAssignFolder);

    // Pin logic (copied from VideoCard for consistency)
    const isPinnedVideo = usePinStore(state =>
        state.pinnedVideos.some(v => v.id === video.id) && !state.priorityPinIds.includes(video.id)
    );
    const isPriority = usePinStore(state => state.priorityPinIds.includes(video.id));
    const isFollower = usePinStore(state => state.followerPinIds.includes(video.id));
    const { togglePin, togglePriorityPin, removePin } = usePinStore();
    const pinLongPressTimerRef = useRef(null);
    const lastClickTimeRef = useRef(0);
    const [activePin, setActivePin] = useState(null);

    // Drumstick rating state
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

    const handlePinMouseDown = (e) => {
        e.stopPropagation();
        setActivePin('pressing');
        pinLongPressTimerRef.current = setTimeout(() => {
            togglePriorityPin(video);
            setActivePin('long-pressed');
            pinLongPressTimerRef.current = null;
        }, 600);
    };

    const handlePinMouseUp = (e) => {
        e.stopPropagation();
        setActivePin(null);
        if (pinLongPressTimerRef.current) {
            clearTimeout(pinLongPressTimerRef.current);
            pinLongPressTimerRef.current = null;
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTimeRef.current;
            lastClickTimeRef.current = now;
            if (timeSinceLastClick < 300 && (isPinnedVideo || isPriority)) {
                removePin(video.id);
                if (onPinClick) onPinClick(video);
            } else {
                togglePin(video);
                if (onPinClick) onPinClick(video);
            }
        }
    };

    const handlePinMouseLeave = (e) => {
        if (pinLongPressTimerRef.current) {
            clearTimeout(pinLongPressTimerRef.current);
            pinLongPressTimerRef.current = null;
            setActivePin(null);
        }
    };

    const menuOptions = [
        { label: isStickied ? 'Unsticky' : 'Sticky', action: 'toggleSticky', icon: <Pin size={14} className="text-amber-500" /> },
        { label: 'Delete', danger: true, action: 'delete', icon: <Share size={14} /> },
        { label: 'Move', action: 'moveToPlaylist', icon: <Share size={14} /> },
        { label: 'Cover', action: 'setPlaylistCover', icon: <Share size={14} /> },
        { label: 'Assign', submenu: 'folders', action: 'assignFolder', icon: <Share size={14} /> },
    ];

    const submenuOptions = {
        folders: FOLDER_COLORS.map(color => ({
            label: color.name,
            icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />,
            action: 'assignFolder',
            folderColor: color.id
        }))
    };

    // Parse author
    const authorMatch = video.author?.match(/^(.+?)\s*\(@(.+?)\)$/);
    const displayName = authorMatch ? authorMatch[1] : (video.author || 'Twitter User');
    const handle = authorMatch ? `@${authorMatch[2]}` : '';

    return (
        <Card
            onClick={bulkTagMode ? undefined : onVideoClick}
            selected={isSelected}
            playing={isCurrentlyPlaying}
            className={`h-full w-full group tweet-card transition-all duration-300 ${isCurrentlyPlaying ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''}`}
            variant="minimal"
        >
            <div
                className="relative flex flex-col h-full bg-[#e0f2fe] rounded-2xl border border-sky-200 dark:border-sky-800/30 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >

                {/* Profile & Content Header */}
                <div className="flex gap-2.5 p-3 pb-2">
                    <div className="flex-shrink-0">
                        {video.profile_image_url ? (
                            <img
                                src={video.profile_image_url}
                                className="w-10 h-10 rounded-full border border-slate-100 shadow-sm object-cover"
                                alt={displayName}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div
                            className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold"
                            style={{ display: video.profile_image_url ? 'none' : 'flex' }}
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 group/author cursor-pointer">
                                <span className="font-bold truncate hover:underline text-sm" style={{ color: '#052F4A' }}>{displayName}</span>
                                <span className="text-slate-500 text-xs truncate">{handle}</span>
                                <span className="text-slate-400 text-xs">·</span>
                                <span className="text-slate-400 text-xs hover:underline">2026</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <CardActions
                                    menuOptions={menuOptions}
                                    onMenuOptionClick={onMenuOptionClick}
                                    submenuOptions={submenuOptions}
                                    className="p-1 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-full"
                                />
                            </div>
                        </div>

                        <p className="mt-0.5 text-sm leading-normal line-clamp-3" style={{ color: '#052F4A' }}>
                            {video.title || "Check out this amazing content!"}
                        </p>
                    </div>
                </div>

                {/* Media Content */}
                <div className="px-3 pb-2 flex-1 flex flex-col min-h-0">
                    <div className="relative rounded-xl overflow-hidden border border-sky-100 dark:border-sky-800/20 flex-1 min-h-[140px] bg-[#d0eafb]/50 p-1.5">
                        <ImageHoverPreview
                            src={thumbnailUrl}
                            previewSrc={previewUrl}
                            isVideo={isVideoMedia}
                            alt={video.title}
                            delay={500}
                        >
                            <CardThumbnail
                                src={thumbnailUrl}
                                alt={video.title}
                                progress={progress}
                                className="h-full w-full object-contain rounded-lg"
                            />
                        </ImageHoverPreview>

                        {/* Floating Badges (Pin & Star) - Twitter Specific Style */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onMouseDown={handlePinMouseDown}
                                onMouseUp={handlePinMouseUp}
                                onMouseLeave={handlePinMouseLeave}
                                className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-95 ${isPriority ? 'bg-amber-500 text-white' :
                                    isPinnedVideo ? 'bg-sky-500 text-white' :
                                        'bg-black/40 text-white hover:bg-black/60'
                                    }`}
                            >
                                <Pin size={16} fill={isPriority || isPinnedVideo ? 'currentColor' : 'none'} />
                            </button>

                            <div
                                className="relative"
                                onMouseEnter={() => {
                                    if (starHoverDelayRef.current) clearTimeout(starHoverDelayRef.current);
                                    starHoverDelayRef.current = setTimeout(() => setIsStarHovered(true), 800);
                                }}
                                onMouseLeave={() => {
                                    if (starHoverDelayRef.current) clearTimeout(starHoverDelayRef.current);
                                    setTimeout(() => setIsStarHovered(false), 200);
                                }}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStarClick?.(e); }}
                                    className="p-2 rounded-full backdrop-blur-md shadow-lg bg-black/40 text-white hover:bg-black/60 transition-all"
                                    style={{ color: videoFolders.length > 0 ? (primaryFolder?.hex || '#fbbf24') : 'white' }}
                                >
                                    <Heart size={16} fill={videoFolders.length > 0 ? 'currentColor' : 'none'} />
                                </button>

                                {isStarHovered && (
                                    <div className="absolute right-full top-0 mr-2 pointer-events-auto">
                                        <StarColorPicker
                                            currentFolders={videoFolders}
                                            quickAssignFolder={quickAssignFolder}
                                            folderMetadata={folderMetadata}
                                            onColorLeftClick={(folderColor) => {
                                                onStarColorLeftClick?.(video, folderColor);
                                                setIsStarHovered(false);
                                            }}
                                            onColorRightClick={(folderColor) => {
                                                onStarColorRightClick?.(folderColor);
                                                setIsStarHovered(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Drumstick Rating */}
                            <div className="bg-black/40 rounded-full px-2 py-1 backdrop-blur-md shadow-lg flex items-center justify-center">
                                <DrumstickRating
                                    rating={drumstickRating}
                                    onRate={handleDrumstickRate}
                                    disabled={false}
                                />
                            </div>
                        </div>

                        {/* Watched Badge */}
                        {!isCurrentlyPlaying && isWatched && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}

                    </div>
                </div>


                {/* Bulk Tag Overlay */}
                {/* Bulk Tag Overlay */}
                {bulkTagMode && (
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 z-40">
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

            <style jsx>{`
        .tweet-card :global(.card-thumbnail) {
          height: 100% !important;
        }
      `}</style>
        </Card>
    );
};

export default TweetCard;

import React, { useState, useRef, useEffect } from 'react';
import { Layout, Plus, ArrowLeft, Trash2, Check, Image, Folder, Shuffle, Star, MapPin, ChevronDown, LayoutGrid, Palette, X } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
import PageGroupColumn from './PageGroupColumn';
import { FOLDER_COLORS } from '../utils/folderColors';
import { getAllPlaylists } from '../api/playlistApi';

export default function PagePage({ onBack, onNavigateToOrb, onNavigateToYou, onNavigateToApp }) {
    const {
        pageBannerBgColor, setPageBannerBgColor,
        customPageBannerImage2, setCustomPageBannerImage2,
        pageBannerImage2Scale, setPageBannerImage2Scale,
        pageBannerImage2XOffset, setPageBannerImage2XOffset,
        pageBannerImage2YOffset, setPageBannerImage2YOffset,
        // Layer 2 Folders
        layer2Folders, addLayer2Image, removeLayer2Image, updateLayer2Image, applyLayer2Image,
        addLayer2Folder, removeLayer2Folder, renameLayer2Folder, selectedLayer2FolderId, setSelectedLayer2FolderId,
        setLayer2FolderPlaylists, setLayer2FolderCondition, themeFolderId, setThemeFolder, clearThemeFolder,
        themeGroupLeaderId, themeGroupLeaderFolderId, setThemeGroupLeader, clearThemeGroupLeader,
        updateLayer2FolderFolders, assignLayer2ToGroup,
        assignLayer2ImageToColor, unassignLayer2ImageFromColor
    } = useConfigStore();

    const scrollContainerRef = useRef(null);
    const horizontalScrollRef = useRef(null);

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('banner'); // 'banner', 'folders', or 'groups'
    const [selectedGroupLeaderId, setSelectedGroupLeaderId] = useState(null); // ID of selected group leader image
    const [selectedGroupLeaderFolderId, setSelectedGroupLeaderFolderId] = useState(null); // Folder ID of selected group leader
    const [showGroupLeadersOnly, setShowGroupLeadersOnly] = useState(false); // Toggle to show only group leaders with members
    const [selectedBannerGroupLeaderId, setSelectedBannerGroupLeaderId] = useState(null); // ID of selected group leader for banner tab
    const [selectedBannerGroupLeaderFolderId, setSelectedBannerGroupLeaderFolderId] = useState(null); // Folder ID of selected group leader for banner tab
    const [expandedBannerGroupLeaderSelector, setExpandedBannerGroupLeaderSelector] = useState(false); // Dropdown state for group leader selector
    const [showAllImages, setShowAllImages] = useState(true); // Toggle to show all images instead of group members
    const [hideSubordinates, setHideSubordinates] = useState(false); // Toggle to hide subordinate images in groups tab
    const [hideSingletons, setHideSingletons] = useState(false); // Toggle to hide unassigned/non-leader images in groups tab
    const [editingImageId, setEditingImageId] = useState(null); // ID of image currently being edited
    const [editingImageFolderId, setEditingImageFolderId] = useState(null); // Folder ID of image currently being edited
    // State for assigning images to colored folders: { folderId, colorId } or null
    const [activeColorAssignment, setActiveColorAssignment] = useState(null);

    // Layer 2 Folder handlers
    const [hoveredLayer2ImageId, setHoveredLayer2ImageId] = useState(null);
    const [editingLayer2FolderName, setEditingLayer2FolderName] = useState('');
    const [hoveredLayer2FolderId, setHoveredLayer2FolderId] = useState(null);
    const [editingLayer2FolderId, setEditingLayer2FolderId] = useState(null);
    const [expandedConditionSelector, setExpandedConditionSelector] = useState(null); // folderId
    const [expandedDestinationSelector, setExpandedDestinationSelector] = useState(null); // imageId
    const [allPlaylists, setAllPlaylists] = useState([]);
    const [expandedFolderPlaylistSelector, setExpandedFolderPlaylistSelector] = useState(null);
    const [selectedFolderFilter, setSelectedFolderFilter] = useState(null); // null = show all
    const [folderAssignmentOpenId, setFolderAssignmentOpenId] = useState(null); // ID of folder with open color selector
    // Theme folder specific state
    const [expandedThemeConditionSelector, setExpandedThemeConditionSelector] = useState(false);
    const [expandedThemePlaylistSelector, setExpandedThemePlaylistSelector] = useState(false);
    const [expandedThemeDestinationSelector, setExpandedThemeDestinationSelector] = useState(null); // imageId
    const [hoveredThemeImageId, setHoveredThemeImageId] = useState(null);
    const [editingThemeFolderName, setEditingThemeFolderName] = useState('');
    const [isEditingThemeName, setIsEditingThemeName] = useState(false);
    const [pageColumnLeader, setPageColumnLeader] = useState(null); // {id, folderId} of group leader whose column is open

    // Fetch playlists for folder assignment dropdown
    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const playlists = await getAllPlaylists();
                setAllPlaylists(playlists || []);
            } catch (error) {
                console.error('Error fetching playlists for folder assignment:', error);
            }
        };
        fetchPlaylists();
    }, []);

    // Close folder assignment menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (folderAssignmentOpenId && !e.target.closest('.folder-assignment-menu')) {
                setFolderAssignmentOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [folderAssignmentOpenId]);

    // Close banner group leader selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (expandedBannerGroupLeaderSelector && !e.target.closest('[data-banner-group-leader-selector]')) {
                setExpandedBannerGroupLeaderSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expandedBannerGroupLeaderSelector]);

    // Initialize selected group leader from theme state
    useEffect(() => {
        if (themeGroupLeaderId && themeGroupLeaderFolderId) {
            setSelectedBannerGroupLeaderId(themeGroupLeaderId);
            setSelectedBannerGroupLeaderFolderId(themeGroupLeaderFolderId);
            // Clear all images mode when theme group leader is set
            setShowAllImages(false);
        }
        // Don't auto-clear showAllImages when theme is cleared - let user's selection persist
    }, [themeGroupLeaderId, themeGroupLeaderFolderId]);

    // Convert vertical wheel scrolling to horizontal scrolling (optimized)
    useEffect(() => {
        // Only attach when folders tab is active
        if (activeTab !== 'folders') return;

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
            }
        };

        // Add listener to container
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [activeTab]); // Re-attach when tab changes or component mounts

    const handlePageBanner2Upload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomPageBannerImage2(reader.result);
                // Clear editing state when uploading new image (not from library)
                setEditingImageId(null);
                setEditingImageFolderId(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLayer2FolderImageUpload = (e, folderId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                addLayer2Image(folderId, {
                    image: reader.result,
                    scale: 100,
                    xOffset: 50,
                    yOffset: 50,
                    bgColor: pageBannerBgColor // Save current Layer 1 color with the image
                });
            };
            reader.readAsDataURL(file);
        }
        // Reset input so the same file can be uploaded again
        e.target.value = '';
    };

    // Sticky toolbar detection
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

    // Calculate folder counts for prism bar
    const folderCounts = {};
    FOLDER_COLORS.forEach(color => {
        folderCounts[color.id] = layer2Folders.filter(folder =>
            folder.folderColors && folder.folderColors.includes(color.id)
        ).length;
    });

    // Filter folders based on selected folder color
    const filteredLayer2Folders = selectedFolderFilter
        ? layer2Folders.filter(folder =>
            folder.folderColors && folder.folderColors.includes(selectedFolderFilter)
        )
        : layer2Folders;

    // Toggle folder assignment for a Layer 2 folder
    const toggleFolderAssignment = (folderId, folderColorId) => {
        const folder = layer2Folders.find(f => f.id === folderId);
        if (!folder) return;

        const currentFolders = folder.folderColors || [];
        const newFolders = currentFolders.includes(folderColorId)
            ? currentFolders.filter(id => id !== folderColorId)
            : [...currentFolders, folderColorId];

        updateLayer2FolderFolders(folderId, newFolders);
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-transparent relative">
                {/* Page Banner */}
                <div className="px-4 pt-8 relative">
                    <PageBanner
                        title="Page Banner Configuration"
                        description="Customize page banners with two-layer system and groups"
                        folderColor={null}
                        seamlessBottom={true}
                        topRightContent={
                            onBack ? (
                                <button
                                    onClick={onBack}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Settings
                                </button>
                            ) : null
                        }
                    />
                    {/* Navigation Buttons - Positioned at bottom of banner */}
                    <div className="absolute left-12 flex items-center gap-1.5 z-30" style={{ top: 'calc(2rem + 220px - 32px)' }}>
                        <button
                            onClick={() => onNavigateToOrb?.()}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-white/90 hover:bg-white text-slate-800 shadow-md border border-white/20 backdrop-blur-sm"
                            title="Orb"
                        >
                            Orb
                        </button>
                        <button
                            onClick={() => onNavigateToYou?.()}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-white/90 hover:bg-white text-slate-800 shadow-md border border-white/20 backdrop-blur-sm"
                            title="You"
                        >
                            You
                        </button>
                        <button
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-sky-500 text-white shadow-md border border-white/20"
                            title="Page"
                        >
                            Page
                        </button>
                        <button
                            onClick={() => onNavigateToApp?.()}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-white/90 hover:bg-white text-slate-800 shadow-md border border-white/20 backdrop-blur-sm"
                            title="App"
                        >
                            App
                        </button>
                    </div>
                </div>

                {/* Sticky Sentinel */}
                <div ref={stickySentinelRef} className="absolute h-px w-full -mt-px pointer-events-none opacity-0" />

                {/* Sticky Toolbar */}
                <div
                    className={`sticky top-0 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden -mt-16
                    ${isStuck
                            ? 'backdrop-blur-xl border-y shadow-2xl mx-0 rounded-none mb-6 pt-2 pb-2 bg-slate-900/70'
                            : 'backdrop-blur-[2px] border-b border-x border-t border-white/10 shadow-xl mx-8 rounded-b-2xl mb-8 mt-0 pt-1 pb-0 bg-slate-900/40'
                        }
                    `}
                >
                    <div className={`px-4 flex items-center justify-between transition-all duration-300 relative z-10 ${isStuck ? 'h-[52px]' : 'py-0.5'}`}>
                        {/* Colored Prism Bar */}
                        <div className="flex-1 flex items-center shrink-0 h-6 mr-3 border-2 border-black rounded-lg overflow-hidden">
                            <button
                                onClick={() => setSelectedFolderFilter(null)}
                                className={`h-full px-2 flex items-center justify-center transition-all border-r-2 border-black ${selectedFolderFilter === null ? 'opacity-100 ring-2 ring-white' : 'opacity-60 hover:opacity-100'}`}
                                style={{ backgroundColor: '#1e293b' }}
                                title="Show All"
                            >
                                <span className="text-[10px] font-bold text-white/90 drop-shadow-md">All</span>
                            </button>
                            {FOLDER_COLORS.map((color, index) => {
                                const isLast = index === FOLDER_COLORS.length - 1;
                                const count = folderCounts[color.id] || 0;
                                const isSelected = selectedFolderFilter === color.id;

                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => setSelectedFolderFilter(isSelected ? null : color.id)}
                                        className={`h-full flex-1 flex items-center justify-center transition-all ${isSelected ? 'opacity-100 ring-2 ring-white' : 'opacity-60 hover:opacity-100'} ${isLast ? 'rounded-r-md' : ''}`}
                                        style={{ backgroundColor: color.hex }}
                                        title={`${color.name} (${count} folders)`}
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
                </div>

                {/* Content */}
                <div className="px-6 pt-2 pb-6 text-slate-800 space-y-3">
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Tab Navigation */}
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                            <button
                                onClick={() => setActiveTab('banner')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${activeTab === 'banner'
                                    ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                    : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                    }`}
                            >
                                <Layout size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Page Banner</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('folders')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${activeTab === 'folders'
                                    ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                    : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                    }`}
                            >
                                <Folder size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Folders</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('colors')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${activeTab === 'colors'
                                    ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                    : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                    }`}
                            >
                                <Palette size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Colors</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${activeTab === 'groups'
                                    ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                    : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                    }`}
                            >
                                <Folder size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Groups</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {/* Page Banner Editor Tab */}
                    {activeTab === 'banner' && (
                        <div className="space-y-4 border-t border-sky-50 pt-3 bg-white/50 p-3 rounded-2xl">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Layout size={14} /> Page Banner Editor
                            </h3>
                            <div className="space-y-4 px-1">
                                {/* Two-column layer controls */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Layer 1 - Group Leader Selector */}
                                    <div className="space-y-3 p-4 rounded-xl border-2 border-purple-200 bg-purple-50/30">
                                        {(() => {
                                            // Collect all images from all folders
                                            const allImages = [];
                                            layer2Folders.forEach(folder => {
                                                if (folder.images && folder.images.length > 0) {
                                                    folder.images.forEach(img => {
                                                        allImages.push({
                                                            ...img,
                                                            folderId: folder.id,
                                                            folderName: folder.name
                                                        });
                                                    });
                                                }
                                            });

                                            // Filter to only group leaders with at least 1 member
                                            const groupLeaders = allImages.filter(img =>
                                                img.groupMembers && img.groupMembers.length >= 1
                                            );

                                            // Find the selected group leader (use theme if set, otherwise use local selection)
                                            // But only if showAllImages is false
                                            const activeGroupLeaderId = (!showAllImages && (themeGroupLeaderId || selectedBannerGroupLeaderId)) || null;
                                            const activeGroupLeaderFolderId = (!showAllImages && (themeGroupLeaderFolderId || selectedBannerGroupLeaderFolderId)) || null;
                                            const selectedGroupLeader = activeGroupLeaderId && activeGroupLeaderFolderId
                                                ? allImages.find(img =>
                                                    img.id === activeGroupLeaderId && img.folderId === activeGroupLeaderFolderId
                                                )
                                                : null;

                                            // Get group members for the selected leader
                                            const groupLeaderKey = selectedGroupLeader ? `${selectedGroupLeader.folderId}:${selectedGroupLeader.id}` : null;
                                            const groupMembers = selectedGroupLeader?.groupMembers || [];

                                            return (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                                                            <Folder size={12} className="text-purple-500" />
                                                            {showAllImages ? 'All Images' : selectedGroupLeader ? 'Theme Group Leader' : 'Group Leader'}
                                                        </label>
                                                        {(selectedGroupLeader || showAllImages) && (
                                                            <div className="flex items-center gap-2">
                                                                {themeGroupLeaderId && (
                                                                    <span className="text-[8px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                                        <Star size={8} className="fill-current" />
                                                                        Theme
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        clearThemeGroupLeader();
                                                                        setSelectedBannerGroupLeaderId(null);
                                                                        setSelectedBannerGroupLeaderFolderId(null);
                                                                        setShowAllImages(false);
                                                                    }}
                                                                    className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Group Leader Selector */}
                                                    <div className="relative" data-banner-group-leader-selector>
                                                        <button
                                                            onClick={() => setExpandedBannerGroupLeaderSelector(!expandedBannerGroupLeaderSelector)}
                                                            className="flex items-center gap-2 px-2 py-1.5 bg-white hover:bg-slate-50 border-2 border-purple-200 rounded-lg text-[10px] font-medium text-slate-700 transition-all w-full justify-between"
                                                        >
                                                            <span className="truncate">
                                                                {showAllImages
                                                                    ? 'All Images'
                                                                    : selectedGroupLeader
                                                                        ? `${selectedGroupLeader.folderName} (${groupMembers.length} ${groupMembers.length === 1 ? 'member' : 'members'})`
                                                                        : 'Select Group Leader...'
                                                                }
                                                            </span>
                                                            <ChevronDown
                                                                size={12}
                                                                className={`transition-transform ${expandedBannerGroupLeaderSelector ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {expandedBannerGroupLeaderSelector && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-purple-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                                                                {/* All Images Option */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Set all images mode first
                                                                        setShowAllImages(true);
                                                                        // Clear group leader selection
                                                                        setSelectedBannerGroupLeaderId(null);
                                                                        setSelectedBannerGroupLeaderFolderId(null);
                                                                        // Clear theme (useEffect won't interfere since we set showAllImages first)
                                                                        clearThemeGroupLeader();
                                                                        setExpandedBannerGroupLeaderSelector(false);
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 border-b border-slate-100 ${showAllImages && !selectedGroupLeader
                                                                        ? 'bg-purple-50 text-purple-700'
                                                                        : 'hover:bg-slate-50 text-slate-600'
                                                                        }`}
                                                                >
                                                                    <div className="w-12 h-8 rounded border-2 border-slate-200 overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                                                                        <Image size={16} className="text-white" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-bold truncate">All Images</div>
                                                                        <div className="text-[9px] text-slate-500">Show all images from all folders</div>
                                                                    </div>
                                                                    {showAllImages && !selectedGroupLeader && (
                                                                        <Check size={12} className="text-purple-600 flex-shrink-0" />
                                                                    )}
                                                                </button>

                                                                {groupLeaders.length === 0 ? (
                                                                    <div className="px-3 py-4 text-[10px] text-slate-400 text-center">
                                                                        No group leaders found. Create groups in the Groups tab.
                                                                    </div>
                                                                ) : (
                                                                    groupLeaders.map((leader) => {
                                                                        const memberCount = leader.groupMembers?.length || 0;
                                                                        const isTheme = themeGroupLeaderId === leader.id && themeGroupLeaderFolderId === leader.folderId;
                                                                        const isSelected = (selectedBannerGroupLeaderId === leader.id &&
                                                                            selectedBannerGroupLeaderFolderId === leader.folderId) || isTheme;
                                                                        return (
                                                                            <button
                                                                                key={`${leader.folderId}-${leader.id}`}
                                                                                onClick={() => {
                                                                                    // Clear all images mode first
                                                                                    setShowAllImages(false);
                                                                                    // Set as theme group leader
                                                                                    setThemeGroupLeader(leader.id, leader.folderId);
                                                                                    setSelectedBannerGroupLeaderId(leader.id);
                                                                                    setSelectedBannerGroupLeaderFolderId(leader.folderId);
                                                                                    setExpandedBannerGroupLeaderSelector(false);
                                                                                }}
                                                                                className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 border-b border-slate-100 last:border-b-0 ${isSelected
                                                                                    ? 'bg-purple-50 text-purple-700'
                                                                                    : 'hover:bg-slate-50 text-slate-600'
                                                                                    }`}
                                                                            >
                                                                                <div className="w-12 h-8 rounded border-2 border-slate-200 overflow-hidden flex-shrink-0">
                                                                                    <img
                                                                                        src={leader.image}
                                                                                        alt=""
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="font-bold truncate flex items-center gap-1">
                                                                                        {leader.folderName}
                                                                                        {isTheme && (
                                                                                            <Star size={10} className="text-purple-500 fill-purple-500" />
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-[9px] text-slate-500">{memberCount} {memberCount === 1 ? 'member' : 'members'}</div>
                                                                                </div>
                                                                                {isSelected && (
                                                                                    <Check size={12} className="text-purple-600 flex-shrink-0" />
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Image Uploader - Always visible below dropdown */}
                                                        <label className="mt-2 w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-300 rounded-lg text-[10px] font-bold uppercase text-purple-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                            <Plus size={12} />
                                                            Upload Image
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            // Add to the folder of the selected group leader, or default if none selected
                                                                            const targetFolderId = selectedGroupLeader?.folderId || 'default';
                                                                            const targetFolder = layer2Folders.find(f => f.id === targetFolderId) || layer2Folders.find(f => f.id === 'default') || layer2Folders[0];
                                                                            if (targetFolder) {
                                                                                // Add the image
                                                                                addLayer2Image(targetFolder.id, {
                                                                                    image: reader.result,
                                                                                    scale: 100,
                                                                                    xOffset: 50,
                                                                                    yOffset: 50,
                                                                                    bgColor: pageBannerBgColor
                                                                                });

                                                                                // If a group leader is selected, automatically assign the new image to that group
                                                                                if (selectedGroupLeader) {
                                                                                    // Find the image we just added by matching the image data
                                                                                    // Use setTimeout to ensure the state has updated
                                                                                    setTimeout(() => {
                                                                                        const updatedFolders = useConfigStore.getState().layer2Folders;
                                                                                        const updatedFolder = updatedFolders.find(f => f.id === targetFolder.id);
                                                                                        const newImage = updatedFolder?.images?.find(img => img.image === reader.result);

                                                                                        if (newImage) {
                                                                                            assignLayer2ToGroup(
                                                                                                newImage.id,
                                                                                                targetFolder.id,
                                                                                                selectedGroupLeader.id,
                                                                                                selectedGroupLeader.folderId
                                                                                            );
                                                                                        }
                                                                                    }, 0);
                                                                                }
                                                                            }
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                    // Reset input
                                                                    e.target.value = '';
                                                                }}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>

                                                    {/* Group Images Grid (Leader + Members) or All Images Grid */}
                                                    {showAllImages ? (
                                                        allImages.length > 0 ? (
                                                            <>
                                                                <div className="text-[10px] font-bold text-slate-500 uppercase">
                                                                    All Images ({allImages.length} {allImages.length === 1 ? 'image' : 'images'})
                                                                </div>
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                                                                    {allImages.map((img) => {
                                                                        const isActive = customPageBannerImage2 === img.image;

                                                                        return (
                                                                            <div
                                                                                key={`${img.folderId}-${img.id}`}
                                                                                className="relative group"
                                                                                onMouseEnter={() => setHoveredLayer2ImageId(img.id)}
                                                                                onMouseLeave={() => setHoveredLayer2ImageId(null)}
                                                                            >
                                                                                <button
                                                                                    onClick={() => {
                                                                                        applyLayer2Image(img);
                                                                                        if (img.bgColor) {
                                                                                            setPageBannerBgColor(img.bgColor);
                                                                                        }
                                                                                        // Track which image is being edited
                                                                                        setEditingImageId(img.id);
                                                                                        setEditingImageFolderId(img.folderId);
                                                                                    }}
                                                                                    className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 ${isActive
                                                                                        ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg'
                                                                                        : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                                                        }`}
                                                                                    title={`${img.folderName} - Paired color: ${img.bgColor || 'none'}`}
                                                                                >
                                                                                    <img
                                                                                        src={img.image}
                                                                                        alt="Layer 2"
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                    {/* Folder name badge */}
                                                                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase backdrop-blur-sm">
                                                                                        {img.folderName}
                                                                                    </div>
                                                                                    {/* Paired color indicator */}
                                                                                    {img.bgColor && (
                                                                                        <div
                                                                                            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                                                            style={{ backgroundColor: img.bgColor }}
                                                                                            title={`Paired: ${img.bgColor}`}
                                                                                        />
                                                                                    )}
                                                                                    {/* Active Indicator */}
                                                                                    {isActive && (
                                                                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                                                            <Check className="text-white drop-shadow-md" size={16} />
                                                                                        </div>
                                                                                    )}
                                                                                </button>

                                                                                {/* Delete Button */}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (window.confirm('Delete this image?')) {
                                                                                            removeLayer2Image(img.folderId, img.id);
                                                                                        }
                                                                                    }}
                                                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-30 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                                                    title="Delete Image"
                                                                                >
                                                                                    <Trash2 size={10} />
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="py-4 text-center border-2 border-dashed border-purple-200 rounded-lg bg-white/50">
                                                                <p className="text-[10px] text-slate-400">No images found. Upload images to get started.</p>
                                                            </div>
                                                        )
                                                    ) : selectedGroupLeader ? (
                                                        <>
                                                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                                                                Group Images ({1 + groupMembers.length} {1 + groupMembers.length === 1 ? 'image' : 'images'})
                                                            </div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                                                                {/* Group Leader */}
                                                                <div
                                                                    key={`leader-${selectedGroupLeader.folderId}-${selectedGroupLeader.id}`}
                                                                    className="relative group"
                                                                    onMouseEnter={() => setHoveredLayer2ImageId(selectedGroupLeader.id)}
                                                                    onMouseLeave={() => setHoveredLayer2ImageId(null)}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            applyLayer2Image(selectedGroupLeader);
                                                                            if (selectedGroupLeader.bgColor) {
                                                                                setPageBannerBgColor(selectedGroupLeader.bgColor);
                                                                            }
                                                                            // Track which image is being edited
                                                                            setEditingImageId(selectedGroupLeader.id);
                                                                            setEditingImageFolderId(selectedGroupLeader.folderId);
                                                                        }}
                                                                        className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 relative ${customPageBannerImage2 === selectedGroupLeader.image
                                                                            ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg'
                                                                            : 'border-sky-400 hover:border-sky-500 hover:shadow-md'
                                                                            }`}
                                                                        title={`Group Leader - Paired color: ${selectedGroupLeader.bgColor || 'none'}`}
                                                                    >
                                                                        <img
                                                                            src={selectedGroupLeader.image}
                                                                            alt="Group Leader"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        {/* Leader Badge */}
                                                                        <div className="absolute top-1 left-1 bg-sky-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shadow-md">
                                                                            <Star size={8} className="fill-current" />
                                                                            Leader
                                                                        </div>
                                                                        {/* Paired color indicator */}
                                                                        {selectedGroupLeader.bgColor && (
                                                                            <div
                                                                                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                                                style={{ backgroundColor: selectedGroupLeader.bgColor }}
                                                                                title={`Paired: ${selectedGroupLeader.bgColor}`}
                                                                            />
                                                                        )}
                                                                        {/* Active Indicator */}
                                                                        {customPageBannerImage2 === selectedGroupLeader.image && (
                                                                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                                                <Check className="text-white drop-shadow-md" size={16} />
                                                                            </div>
                                                                        )}
                                                                    </button>

                                                                    {/* Delete Button (Leader) */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm('Delete this group leader image?')) {
                                                                                removeLayer2Image(selectedGroupLeader.folderId, selectedGroupLeader.id);
                                                                            }
                                                                        }}
                                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-30 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                                        title="Delete Image"
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                </div>

                                                                {/* Group Members */}
                                                                {groupMembers.map((memberKey) => {
                                                                    // Parse member key: "folderId:imageId"
                                                                    const [memberFolderId, memberImageId] = memberKey.split(':');
                                                                    const memberFolder = layer2Folders.find(f => f.id === memberFolderId);
                                                                    const memberImage = memberFolder?.images?.find(img => img.id === memberImageId);

                                                                    if (!memberImage) return null;

                                                                    const isActive = customPageBannerImage2 === memberImage.image;

                                                                    return (
                                                                        <div
                                                                            key={memberKey}
                                                                            className="relative group"
                                                                            onMouseEnter={() => setHoveredLayer2ImageId(memberImage.id)}
                                                                            onMouseLeave={() => setHoveredLayer2ImageId(null)}
                                                                        >
                                                                            <button
                                                                                onClick={() => {
                                                                                    applyLayer2Image(memberImage);
                                                                                    if (memberImage.bgColor) {
                                                                                        setPageBannerBgColor(memberImage.bgColor);
                                                                                    }
                                                                                    // Track which image is being edited
                                                                                    setEditingImageId(memberImage.id);
                                                                                    setEditingImageFolderId(memberFolderId);
                                                                                }}
                                                                                className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 ${isActive
                                                                                    ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg'
                                                                                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                                                    }`}
                                                                                title={`Paired color: ${memberImage.bgColor || 'none'}`}
                                                                            >
                                                                                <img
                                                                                    src={memberImage.image}
                                                                                    alt="Layer 2"
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                                {/* Paired color indicator */}
                                                                                {memberImage.bgColor && (
                                                                                    <div
                                                                                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                                                        style={{ backgroundColor: memberImage.bgColor }}
                                                                                        title={`Paired: ${memberImage.bgColor}`}
                                                                                    />
                                                                                )}
                                                                                {/* Active Indicator */}
                                                                                {isActive && (
                                                                                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                                                        <Check className="text-white drop-shadow-md" size={16} />
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                            {/* Delete Button (Member) */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (window.confirm('Delete this image?')) {
                                                                                        removeLayer2Image(memberFolderId, memberImageId);
                                                                                    }
                                                                                }}
                                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-30 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                                                title="Delete Image"
                                                                            >
                                                                                <Trash2 size={10} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="py-4 text-center border-2 border-dashed border-purple-200 rounded-lg bg-white/50">
                                                            <p className="text-[10px] text-slate-400">Select a group leader to view images</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Layer 2 - Overlay */}
                                    <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold uppercase text-slate-400">Layer 2 (Overlay)</label>
                                            {customPageBannerImage2 && (
                                                <button
                                                    onClick={() => {
                                                        setCustomPageBannerImage2(null);
                                                        setPageBannerImage2Scale(100);
                                                        setPageBannerImage2XOffset(50);
                                                        setPageBannerImage2YOffset(50);
                                                        // Clear editing state
                                                        setEditingImageId(null);
                                                        setEditingImageFolderId(null);
                                                    }}
                                                    className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        {customPageBannerImage2 ? (
                                            <>
                                                {/* Thumbnail */}
                                                <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                                                    <img src={customPageBannerImage2} alt="Layer 2" className="w-full h-full object-cover" />
                                                </div>
                                                {/* Scale */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-slate-500">Scale</label>
                                                        <span className="text-[10px] font-mono font-bold text-purple-600">{pageBannerImage2Scale}%</span>
                                                    </div>
                                                    <input type="range" min="50" max="200" step="5" value={pageBannerImage2Scale}
                                                        onChange={(e) => setPageBannerImage2Scale(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                </div>
                                                {/* X Position */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-slate-500">X Position</label>
                                                        <span className="text-[10px] font-mono font-bold text-purple-600">{pageBannerImage2XOffset}%</span>
                                                    </div>
                                                    <input type="range" min="0" max="100" step="1" value={pageBannerImage2XOffset}
                                                        onChange={(e) => setPageBannerImage2XOffset(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                </div>
                                                {/* Y Position */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-slate-500">Y Position</label>
                                                        <span className="text-[10px] font-mono font-bold text-purple-600">{pageBannerImage2YOffset}%</span>
                                                    </div>
                                                    <input type="range" min="0" max="100" step="1" value={pageBannerImage2YOffset}
                                                        onChange={(e) => setPageBannerImage2YOffset(parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                </div>
                                                {/* Paired Background Color */}
                                                <div className="space-y-1 pt-2 border-t border-slate-100">
                                                    <label className="text-[10px] font-bold text-slate-500">Paired Background Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={pageBannerBgColor}
                                                            onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                            className="w-8 h-8 rounded-lg cursor-pointer border-2 border-slate-200"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={pageBannerBgColor}
                                                            onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                            className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 uppercase"
                                                            placeholder="#000000"
                                                        />
                                                    </div>
                                                    <p className="text-[9px] text-slate-400">This color will be saved with the image config</p>
                                                </div>

                                                {/* Layer 1 Default Color Dropdown */}
                                                <div className="space-y-1 pt-2 border-t border-slate-100">
                                                    <label className="text-[10px] font-bold text-slate-500">Layer 1 Default (Fallback)</label>
                                                    <p className="text-[9px] text-slate-400 mb-1">Used when no paired color is set with an image</p>
                                                    <select
                                                        value={pageBannerBgColor}
                                                        onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 uppercase focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                                                    >
                                                        <option value="#1e293b">Slate (#1e293b)</option>
                                                        <option value="#0f172a">Dark (#0f172a)</option>
                                                        <option value="#18181b">Zinc (#18181b)</option>
                                                        <option value="#1e1b4b">Indigo (#1e1b4b)</option>
                                                        <option value="#172554">Blue (#172554)</option>
                                                        <option value="#14532d">Green (#14532d)</option>
                                                        <option value="#7f1d1d">Red (#7f1d1d)</option>
                                                        <option value="#78350f">Amber (#78350f)</option>
                                                    </select>
                                                </div>

                                                {/* Save Button - Show if editing an image from library */}
                                                {(() => {
                                                    // Find the current image in the library by matching image data
                                                    let currentImageFolderId = editingImageFolderId;
                                                    let currentImageId = editingImageId;

                                                    // If editing state not set, try to find image by matching image data
                                                    if (!currentImageId || !currentImageFolderId) {
                                                        for (const folder of layer2Folders) {
                                                            if (folder.images) {
                                                                const foundImage = folder.images.find(img => img.image === customPageBannerImage2);
                                                                if (foundImage) {
                                                                    currentImageFolderId = folder.id;
                                                                    currentImageId = foundImage.id;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }

                                                    // Show save button if we found the image in the library
                                                    if (currentImageId && currentImageFolderId) {
                                                        return (
                                                            <div className="pt-2 border-t border-slate-100">
                                                                <button
                                                                    onClick={() => {
                                                                        updateLayer2Image(currentImageFolderId, currentImageId, {
                                                                            scale: pageBannerImage2Scale,
                                                                            xOffset: pageBannerImage2XOffset,
                                                                            yOffset: pageBannerImage2YOffset,
                                                                            bgColor: pageBannerBgColor
                                                                        });
                                                                    }}
                                                                    className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                                                >
                                                                    <Check size={14} />
                                                                    Save Adjustments
                                                                </button>
                                                                <p className="text-[9px] text-slate-400 mt-1.5 text-center">
                                                                    Save these adjustments to the image. They will apply across all page banners.
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </>
                                        ) : (
                                            <>
                                                <label className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-400 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                    <Image size={12} />
                                                    Upload Layer 2
                                                    <input type="file" accept="image/*" onChange={handlePageBanner2Upload} className="hidden" />
                                                </label>

                                                {/* Layer 1 Default Color Dropdown */}
                                                <div className="space-y-1 pt-2 border-t border-slate-100">
                                                    <label className="text-[10px] font-bold text-slate-500">Layer 1 Default (Fallback)</label>
                                                    <p className="text-[9px] text-slate-400 mb-1">Used when no paired color is set with an image</p>
                                                    <select
                                                        value={pageBannerBgColor}
                                                        onChange={(e) => setPageBannerBgColor(e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700 uppercase focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                                                    >
                                                        <option value="#1e293b">Slate (#1e293b)</option>
                                                        <option value="#0f172a">Dark (#0f172a)</option>
                                                        <option value="#18181b">Zinc (#18181b)</option>
                                                        <option value="#1e1b4b">Indigo (#1e1b4b)</option>
                                                        <option value="#172554">Blue (#172554)</option>
                                                        <option value="#14532d">Green (#14532d)</option>
                                                        <option value="#7f1d1d">Red (#7f1d1d)</option>
                                                        <option value="#78350f">Amber (#78350f)</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                                    Set the paired background color in Layer 2 settings, then save to a folder. Each saved image remembers its paired color.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Layer 2 Folders Grid Tab */}
                    {activeTab === 'folders' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Folder size={14} /> Layer 2 Images
                                    {selectedFolderFilter && (
                                        <span className="text-[10px] font-normal normal-case text-slate-500">
                                            (Filtered by color)
                                        </span>
                                    )}
                                </h3>
                                <button
                                    onClick={() => setShowGroupLeadersOnly(!showGroupLeadersOnly)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${showGroupLeadersOnly
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                        }`}
                                    title={showGroupLeadersOnly ? 'Show all images' : 'Show only group leaders with members'}
                                >
                                    <Folder size={12} />
                                    {showGroupLeadersOnly ? 'Group Leaders Only' : 'All Images'}
                                </button>
                            </div>

                            {(() => {
                                // Flatten all images from filtered folders
                                const allImages = [];
                                filteredLayer2Folders.forEach(folder => {
                                    if (folder.images && folder.images.length > 0) {
                                        folder.images.forEach(img => {
                                            allImages.push({
                                                ...img,
                                                folderId: folder.id,
                                                folderName: folder.name,
                                                groupMembers: img.groupMembers // Ensure this property is carried over
                                            });
                                        });
                                    }
                                });

                                // Filter to only show group leaders with members if toggle is on
                                const filteredImages = showGroupLeadersOnly
                                    ? allImages.filter(img => img.groupMembers && img.groupMembers.length >= 1)
                                    : allImages;

                                if (filteredImages.length === 0) {
                                    return (
                                        <div className="text-center text-slate-400 py-12 bg-white/50 p-4 rounded-2xl">
                                            <Folder size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="text-sm font-medium">No images found</p>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {layer2Folders.length === 0
                                                    ? 'Use the Groups tab to create groups and set page banner themes'
                                                    : 'No images in the filtered folders'}
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {/* Horizontal Scrolling Images Container */}
                                        <div
                                            ref={horizontalScrollRef}
                                            className="horizontal-video-scroll"
                                            onWheel={(e) => {
                                                // Handle wheel scrolling on the images container
                                                const container = horizontalScrollRef.current;
                                                if (container && container.scrollWidth > container.clientWidth) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Direct scrollLeft assignment for better performance
                                                    container.scrollLeft += e.deltaY;
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                overflowX: 'scroll', // Force scrollbar to always show
                                                overflowY: 'visible', // Allow vertical overflow for buttons
                                                scrollbarWidth: 'thin', // Show scrollbar on Firefox
                                                scrollbarColor: 'rgba(148, 163, 184, 0.6) rgba(15, 23, 42, 0.3)', // Firefox scrollbar color
                                                WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                                                paddingTop: '12px', // Space for overflow elements at top (buttons at -top-2 need space)
                                                paddingBottom: '8px', // Space for overflow elements at bottom
                                            }}
                                        >
                                            <div
                                                className="flex gap-4 animate-fade-in"
                                                style={{
                                                    width: 'max-content'
                                                }}
                                            >
                                                {filteredImages.map((img) => {
                                                    const isActive = customPageBannerImage2 === img.image;
                                                    const isFromSelectedFolder = selectedLayer2FolderId === img.folderId;

                                                    return (
                                                        <div
                                                            key={`${img.folderId}-${img.id}`}
                                                            className="relative group flex flex-col items-center"
                                                            style={{
                                                                width: '320px',
                                                                flexShrink: 0
                                                            }}
                                                            onMouseEnter={() => setHoveredLayer2ImageId(img.id)}
                                                            onMouseLeave={() => setHoveredLayer2ImageId(null)}
                                                        >
                                                            {/* Image Thumbnail */}
                                                            <div className="relative w-full aspect-video mx-auto overflow-hidden rounded-lg border-4 transition-all duration-200 bg-slate-100">
                                                                <button
                                                                    onClick={() => {
                                                                        applyLayer2Image(img);
                                                                        if (img.bgColor) {
                                                                            setPageBannerBgColor(img.bgColor);
                                                                        }
                                                                        setSelectedLayer2FolderId(img.folderId);
                                                                    }}
                                                                    className={`w-full h-full transition-all duration-200 relative overflow-hidden ${isActive
                                                                        ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg scale-105'
                                                                        : isFromSelectedFolder
                                                                            ? 'border-purple-300 ring-2 ring-purple-100'
                                                                            : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                                        }`}
                                                                >
                                                                    <img
                                                                        src={img.image}
                                                                        alt="Layer 2"
                                                                        className="w-full h-full object-cover"
                                                                    />

                                                                    {/* Glass Overlay */}
                                                                    <div className="absolute inset-0 bg-purple-200/10 pointer-events-none" />

                                                                    {/* Active Indicator */}
                                                                    {isActive && (
                                                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center pointer-events-none">
                                                                            <Check className="text-white drop-shadow-md" size={24} />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            </div>

                                                            {/* Folder Name */}
                                                            <p className="mt-2 text-[10px] text-slate-500 text-center font-bold truncate w-full">
                                                                {img.folderName}
                                                            </p>

                                                            {/* Tooltip on hover */}
                                                            {hoveredLayer2ImageId === img.id && (
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                    {img.folderName}
                                                                </div>
                                                            )}

                                                            {/* Group View Button (for Leaders) */}
                                                            {img.groupMembers && img.groupMembers.length > 0 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPageColumnLeader({ id: img.id, folderId: img.folderId });
                                                                    }}
                                                                    className="absolute top-2 right-2 w-7 h-7 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center text-white shadow-md transition-all opacity-0 group-hover:opacity-100 z-30"
                                                                    title={`View Group (${img.groupMembers.length} members)`}
                                                                >
                                                                    <LayoutGrid size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* Layer 2 Colors (Assignments) Tab */}
                    {activeTab === 'colors' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Palette size={14} /> Layer 2 Colors
                                    {selectedFolderFilter && (
                                        <span className="text-[10px] font-normal normal-case text-slate-500">
                                            (Filtered by color)
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {filteredLayer2Folders.length === 0 ? (
                                <div className="text-center text-slate-400 py-12 bg-white/50 p-4 rounded-2xl">
                                    <Folder size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-sm font-medium">No folders found</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {filteredLayer2Folders.map(folder => (
                                        <div key={folder.id} className="bg-white/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                                            {/* Start Folder Header */}
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                                    <Folder size={16} className="text-sky-500" />
                                                    {folder.name}
                                                    <span className="text-[10px] font-normal text-slate-400">
                                                        ({folder.images ? folder.images.length : 0} images)
                                                    </span>
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {activeColorAssignment && activeColorAssignment.folderId === folder.id && (
                                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded animate-pulse">
                                                            Select image for {activeColorAssignment.colorId}...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Color Assignments */}
                                            <div className="mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                                                        <Palette size={10} />
                                                        Theme Color Assignments
                                                    </div>
                                                    {activeColorAssignment && activeColorAssignment.folderId === folder.id && (
                                                        <button
                                                            onClick={() => setActiveColorAssignment(null)}
                                                            className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                                                        >
                                                            <X size={10} /> Cancel
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                    {FOLDER_COLORS.map(color => {
                                                        const assignedImageId = folder.colorAssignments?.[color.id];
                                                        const assignedImage = assignedImageId && folder.images ? folder.images.find(i => i.id === assignedImageId) : null;
                                                        const isEditing = activeColorAssignment?.folderId === folder.id && activeColorAssignment?.colorId === color.id;

                                                        return (
                                                            <div key={color.id} className="flex flex-col items-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        if (isEditing) {
                                                                            setActiveColorAssignment(null);
                                                                        } else {
                                                                            setActiveColorAssignment({ folderId: folder.id, colorId: color.id });
                                                                        }
                                                                    }}
                                                                    className={`relative w-8 h-8 rounded-full border-2 transition-all flex-shrink-0 flex items-center justify-center ${isEditing
                                                                        ? 'ring-2 ring-offset-1 ring-purple-500 scale-110 z-10'
                                                                        : 'hover:scale-105 hover:shadow-sm'
                                                                        }`}
                                                                    style={{
                                                                        backgroundColor: color.hex,
                                                                        borderColor: assignedImage ? 'white' : 'transparent',
                                                                        opacity: (activeColorAssignment && !isEditing && activeColorAssignment.folderId === folder.id) ? 0.3 : 1
                                                                    }}
                                                                    title={`${color.name}${assignedImage ? ' (Click to change/remove)' : ' (Click to assign image)'}`}
                                                                >
                                                                    {assignedImage && (
                                                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative group/thumb">
                                                                            <img src={assignedImage.image} className="w-full h-full object-cover" alt="" />
                                                                        </div>
                                                                    )}
                                                                    {assignedImage && isEditing && (
                                                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md z-20 cursor-pointer"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                unassignLayer2ImageFromColor(folder.id, color.id);
                                                                                setActiveColorAssignment(null);
                                                                            }}
                                                                            title="Remove assignment"
                                                                        >
                                                                            <X size={8} />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[9px] text-slate-400 mt-1">
                                                    Click a color to assign an image from this folder. Used when this folder is the active theme.
                                                </p>
                                            </div>

                                            {/* Images Stream */}
                                            <div
                                                className="horizontal-video-scroll"
                                                style={{
                                                    width: '100%',
                                                    overflowX: 'scroll',
                                                    overflowY: 'visible',
                                                    scrollbarWidth: 'thin',
                                                    scrollbarColor: 'rgba(148, 163, 184, 0.6) rgba(15, 23, 42, 0.3)',
                                                    WebkitOverflowScrolling: 'touch',
                                                    paddingTop: '8px',
                                                    paddingBottom: '8px',
                                                    display: 'flex',
                                                    gap: '12px'
                                                }}
                                            >
                                                {(!folder.images || folder.images.length === 0) ? (
                                                    <div className="w-full py-8 text-center text-slate-400 text-[10px] border-2 border-dashed border-slate-100 rounded-lg">
                                                        No images in this folder
                                                    </div>
                                                ) : (
                                                    folder.images.map(img => {
                                                        const isActive = customPageBannerImage2 === img.image;
                                                        const isAssignedToActiveColor = activeColorAssignment?.folderId === folder.id &&
                                                            folder.colorAssignments?.[activeColorAssignment.colorId] === img.id;

                                                        return (
                                                            <div
                                                                key={img.id}
                                                                className="relative flex-shrink-0"
                                                                style={{ width: '200px' }}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        // Logic:
                                                                        // If Assigning Color: Assign this image
                                                                        // Else: Normal apply logic
                                                                        if (activeColorAssignment && activeColorAssignment.folderId === folder.id) {
                                                                            assignLayer2ImageToColor(folder.id, activeColorAssignment.colorId, img.id);
                                                                            setActiveColorAssignment(null); // Close picker
                                                                        } else {
                                                                            applyLayer2Image(img);
                                                                            if (img.bgColor) setPageBannerBgColor(img.bgColor);
                                                                            setSelectedLayer2FolderId(folder.id);
                                                                        }
                                                                    }}
                                                                    className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all relative ${isAssignedToActiveColor
                                                                        ? 'border-green-500 ring-4 ring-green-200'
                                                                        : activeColorAssignment && activeColorAssignment.folderId === folder.id
                                                                            ? 'border-purple-300 hover:border-purple-500 hover:scale-105 hover:shadow-md' // Selection mode
                                                                            : isActive
                                                                                ? 'border-sky-500 ring-2 ring-sky-200'
                                                                                : 'border-slate-200 hover:border-sky-300'
                                                                        }`}
                                                                >
                                                                    <img src={img.image} className="w-full h-full object-cover" alt="" />
                                                                    {/* Overlays */}
                                                                    {/* If assigned to ANY color in this folder, maybe show unique dots? */}
                                                                    {folder.colorAssignments && Object.entries(folder.colorAssignments).map(([cId, imgId]) => {
                                                                        if (imgId === img.id) {
                                                                            const color = FOLDER_COLORS.find(c => c.id === cId);
                                                                            if (color) {
                                                                                return (
                                                                                    <div key={cId}
                                                                                        className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-sm"
                                                                                        style={{ backgroundColor: color.hex }}
                                                                                        title={`Assigned to ${color.name}`}
                                                                                    />
                                                                                );
                                                                            }
                                                                        }
                                                                        return null;
                                                                    })}

                                                                    {isAssignedToActiveColor && (
                                                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                                            <Check className="text-white drop-shadow-md" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Layer 2 Groups Tab */}
                    {activeTab === 'groups' && (
                        <div className="space-y-2 border-t border-sky-50 pt-3 bg-white/50 p-3 rounded-2xl">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Folder size={14} /> Layer 2 Groups
                            </h3>
                            <div className="space-y-2 px-1">
                                {/* Collect all images from all folders */}
                                {(() => {
                                    // Flatten all images from all folders with folder context
                                    const allImages = [];
                                    layer2Folders.forEach(folder => {
                                        if (folder.images && folder.images.length > 0) {
                                            folder.images.forEach(img => {
                                                allImages.push({
                                                    ...img,
                                                    folderId: folder.id,
                                                    folderName: folder.name
                                                });
                                            });
                                        }
                                    });

                                    if (allImages.length === 0) {
                                        return (
                                            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                                                <p className="text-[10px] text-slate-400">No Layer 2 images saved yet</p>
                                            </div>
                                        );
                                    }

                                    // Find the selected group leader image
                                    const groupLeader = selectedGroupLeaderId && selectedGroupLeaderFolderId
                                        ? allImages.find(img => img.id === selectedGroupLeaderId && img.folderId === selectedGroupLeaderFolderId)
                                        : null;

                                    // Get group members for the selected leader
                                    const groupLeaderKey = groupLeader ? `${groupLeader.folderId}:${groupLeader.id}` : null;
                                    const groupMembers = groupLeader?.groupMembers || [];

                                    // Count how many images are assigned to this group
                                    const assignedCount = groupMembers.length;

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Left side: All Layer 2 images - click to select group leader */}
                                            <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Group Leader' : 'Select Group Leader'}
                                                    </label>
                                                    <button
                                                        onClick={() => setHideSubordinates(!hideSubordinates)}
                                                        className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md transition-all ${hideSubordinates ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        title="Hide images that are already assigned to a group"
                                                    >
                                                        {hideSubordinates ? 'Show Subordinates' : 'Hide Subordinates'}
                                                    </button>
                                                </div>
                                                {groupLeader && (
                                                    <div className="mb-3 pb-3 border-b border-slate-200 space-y-2 text-center">
                                                        <div className="text-xs font-bold text-sky-600">
                                                            {assignedCount} {assignedCount === 1 ? 'image' : 'images'} assigned
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">
                                                            Click images on the right to assign them to this group leader
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                    {allImages.filter(img => {
                                                        if (!hideSubordinates) return true;
                                                        // Check if this image is a member of ANY group
                                                        const currentImageKey = `${img.folderId}:${img.id}`;
                                                        const isSubordinate = allImages.some(parent => {
                                                            // check if parent has this image in its groupMembers
                                                            if (parent.id === img.id && parent.folderId === img.folderId) return false;
                                                            return parent.groupMembers && parent.groupMembers.includes(currentImageKey);
                                                        });
                                                        return !isSubordinate;
                                                    }).map((img) => {
                                                        const isGroupLeader = selectedGroupLeaderId === img.id && selectedGroupLeaderFolderId === img.folderId;
                                                        const isActive = customPageBannerImage2 === img.image;

                                                        return (
                                                            <div
                                                                key={`left-${img.folderId}-${img.id}`}
                                                                className="relative group"
                                                                onMouseEnter={() => setHoveredLayer2ImageId(img.id)}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedGroupLeaderId(img.id);
                                                                        setSelectedGroupLeaderFolderId(img.folderId);
                                                                        applyLayer2Image(img);
                                                                        if (img.bgColor) {
                                                                            setPageBannerBgColor(img.bgColor);
                                                                        }
                                                                    }}
                                                                    className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 relative overflow-hidden bg-slate-100 ${isGroupLeader
                                                                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                                                                        : isActive
                                                                            ? 'border-sky-400 ring-1 ring-sky-100'
                                                                            : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
                                                                        }`}
                                                                    style={{ width: '64px', height: '64px' }}
                                                                >
                                                                    <img
                                                                        src={img.image}
                                                                        alt="Layer 2"
                                                                        className="w-full h-full object-cover"
                                                                    />

                                                                    {/* Glass Overlay */}
                                                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-lg pointer-events-none">
                                                                        <div className="absolute inset-0 bg-sky-200/10" />
                                                                    </div>

                                                                    {/* Group Leader Badge */}
                                                                    {isGroupLeader && (
                                                                        <div className="absolute top-0 left-0 bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br rounded-tl uppercase z-20">
                                                                            Leader
                                                                        </div>
                                                                    )}

                                                                    {/* Active Indicator */}
                                                                    {isActive && !isGroupLeader && (
                                                                        <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center pointer-events-none z-20">
                                                                            <Check className="text-white drop-shadow-md" size={12} />
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {/* Tooltip on hover */}
                                                                {hoveredLayer2ImageId === img.id && (
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                        {img.folderName}
                                                                        {isGroupLeader && ' (Group Leader)'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Right side: All Layer 2 images - click to assign to group leader */}
                                            <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Assign Images to Group' : 'Select Group Leader'}
                                                    </label>
                                                    <button
                                                        onClick={() => setHideSingletons(!hideSingletons)}
                                                        className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md transition-all ${hideSingletons ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                        title="Hide images that are neither a group leader nor assigned to a group"
                                                    >
                                                        {hideSingletons ? 'Show Unassigned' : 'Hide Unassigned'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                    {allImages.filter(img => {
                                                        if (!hideSingletons) return true;
                                                        // Logic: Hide if (Not Assigned to ANY group) AND (Not a Leader with Subordinates)

                                                        // 1. Is it a group member of ANY group?
                                                        const currentImageKey = `${img.folderId}:${img.id}`;
                                                        const isSubordinate = allImages.some(parent => {
                                                            if (parent.id === img.id && parent.folderId === img.folderId) return false;
                                                            return parent.groupMembers && parent.groupMembers.includes(currentImageKey);
                                                        });
                                                        if (isSubordinate) return true; // It is assigned, so show it

                                                        // 2. Is it a group leader of ANY group (with members)?
                                                        const isLeader = img.groupMembers && img.groupMembers.length > 0;
                                                        if (isLeader) return true; // It is a leader, so show it

                                                        // If neither, it is a "Singleton" / "Unassigned" -> Hide it
                                                        return false;
                                                    }).map((img) => {
                                                        const imageKey = `${img.folderId}:${img.id}`;
                                                        const isGroupLeader = selectedGroupLeaderId === img.id && selectedGroupLeaderFolderId === img.folderId;
                                                        const isAssignedToGroup = groupLeaderKey && groupMembers.includes(imageKey);
                                                        const isActive = customPageBannerImage2 === img.image;

                                                        return (
                                                            <div
                                                                key={`right-${img.folderId}-${img.id}`}
                                                                className="relative group"
                                                                onMouseEnter={() => setHoveredLayer2ImageId(img.id)}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        if (groupLeader) {
                                                                            // Assign/unassign to group (don't assign the leader to itself)
                                                                            if (!(img.id === groupLeader.id && img.folderId === groupLeader.folderId)) {
                                                                                assignLayer2ToGroup(img.id, img.folderId, groupLeader.id, groupLeader.folderId);
                                                                            }
                                                                        } else {
                                                                            // Set as group leader
                                                                            setSelectedGroupLeaderId(img.id);
                                                                            setSelectedGroupLeaderFolderId(img.folderId);
                                                                            applyLayer2Image(img);
                                                                            if (img.bgColor) {
                                                                                setPageBannerBgColor(img.bgColor);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 relative overflow-hidden bg-slate-100 ${isGroupLeader
                                                                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                                                                        : isAssignedToGroup
                                                                            ? 'border-purple-500 ring-2 ring-purple-200 shadow-md'
                                                                            : isActive
                                                                                ? 'border-sky-400 ring-1 ring-sky-100'
                                                                                : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
                                                                        }`}
                                                                    style={{ width: '64px', height: '64px' }}
                                                                >
                                                                    <img
                                                                        src={img.image}
                                                                        alt="Layer 2"
                                                                        className="w-full h-full object-cover"
                                                                    />

                                                                    {/* Glass Overlay */}
                                                                    <div className="absolute inset-0 z-10 overflow-hidden rounded-lg pointer-events-none">
                                                                        <div className="absolute inset-0 bg-sky-200/10" />
                                                                    </div>

                                                                    {/* Group Leader Badge */}
                                                                    {isGroupLeader && (
                                                                        <div className="absolute top-0 left-0 bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br rounded-tl uppercase z-20">
                                                                            Leader
                                                                        </div>
                                                                    )}

                                                                    {/* Assigned Badge */}
                                                                    {isAssignedToGroup && !isGroupLeader && (
                                                                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-bl rounded-tr uppercase z-20">
                                                                            ✓
                                                                        </div>
                                                                    )}

                                                                    {/* Active Indicator */}
                                                                    {isActive && !isGroupLeader && !isAssignedToGroup && (
                                                                        <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center pointer-events-none z-20">
                                                                            <Check className="text-white drop-shadow-md" size={12} />
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {/* Tooltip on hover */}
                                                                {hoveredLayer2ImageId === img.id && (
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                        {img.folderName}
                                                                        {isGroupLeader && ' (Group Leader)'}
                                                                        {isAssignedToGroup && !isGroupLeader && ' (Assigned)'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Page Group Column Overlay */}
            {
                pageColumnLeader && (() => {
                    // flatten all images again to find leader and members
                    const allImages = [];
                    layer2Folders.forEach(folder => {
                        if (folder.images && folder.images.length > 0) {
                            folder.images.forEach(img => {
                                allImages.push({
                                    ...img,
                                    folderId: folder.id,
                                    folderName: folder.name
                                });
                            });
                        }
                    });

                    const leader = allImages.find(img => img.id === pageColumnLeader.id && img.folderId === pageColumnLeader.folderId);

                    if (!leader) {
                        setPageColumnLeader(null);
                        return null;
                    }

                    const members = leader.groupMembers?.map(memberKey => {
                        const [mid, mfid] = memberKey.split(':'); // wait, the key format is folderId:imageId ? 
                        // Let's check how it's stored. Looking at line 724: "const [memberFolderId, memberImageId] = memberKey.split(':');"
                        const [memberFolderId, memberImageId] = memberKey.split(':');
                        return allImages.find(img => img.id === memberImageId && img.folderId === memberFolderId);
                    }).filter(Boolean) || [];

                    return (
                        <PageGroupColumn
                            leader={leader}
                            members={members}
                            onClose={() => setPageColumnLeader(null)}
                            onImageSelect={(img) => {
                                applyLayer2Image(img);
                                if (img.bgColor) {
                                    setPageBannerBgColor(img.bgColor);
                                }
                            }}
                            activeImageId={customPageBannerImage2}
                        />
                    );
                })()
            }

        </div >
    );
}

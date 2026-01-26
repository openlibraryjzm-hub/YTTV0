import React, { useState, useRef, useEffect } from 'react';
import { Layout, Plus, ArrowLeft, Trash2, Check, Image, Folder, Shuffle, Star, MapPin, ChevronDown } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
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
        updateLayer2FolderFolders, assignLayer2ToGroup
    } = useConfigStore();

    const scrollContainerRef = useRef(null);
    const horizontalScrollRef = useRef(null);

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('banner'); // 'banner', 'library', 'folders', or 'groups'
    const [selectedGroupLeaderId, setSelectedGroupLeaderId] = useState(null); // ID of selected group leader image
    const [selectedGroupLeaderFolderId, setSelectedGroupLeaderFolderId] = useState(null); // Folder ID of selected group leader

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
                        description="Customize page banners with two-layer system and image library"
                        color={null}
                        isEditable={false}
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
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${
                                    activeTab === 'banner'
                                        ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                        : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                            >
                                <Layout size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Page Banner</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${
                                    activeTab === 'library'
                                        ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                        : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                            >
                                <Image size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Image Library</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('folders')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${
                                    activeTab === 'folders'
                                        ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                        : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                            >
                                <Folder size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Folders</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${
                                    activeTab === 'groups'
                                        ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                        : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                            >
                                <Folder size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Groups</span>
                            </button>
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
                                        {/* Layer 1 - Active Theme Folder */}
                                        <div className="space-y-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50/30">
                                            <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                                            <Star size={12} className="text-amber-500 fill-amber-500" />
                                            Active Theme Folder
                                        </label>
                                        {themeFolderId && (
                                            <button
                                                onClick={() => clearThemeFolder()}
                                                className="text-[9px] font-bold text-red-400 hover:text-red-500 transition-colors"
                                            >
                                                Clear Theme
                                            </button>
                                        )}
                                            </div>
                                            
                                            {themeFolderId ? (() => {
                                        const themeFolder = layer2Folders.find(f => f.id === themeFolderId);
                                        if (!themeFolder) return null;
                                        
                                        const assignedFolders = themeFolder.folderColors || [];
                                        
                                        return (
                                            <div className="space-y-3">
                                                {/* Folder Name & Badges */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {isEditingThemeName ? (
                                                            <input
                                                                type="text"
                                                                value={editingThemeFolderName}
                                                                onChange={(e) => setEditingThemeFolderName(e.target.value)}
                                                                onBlur={() => {
                                                                    if (editingThemeFolderName.trim()) {
                                                                        renameLayer2Folder(themeFolder.id, editingThemeFolderName.trim());
                                                                    }
                                                                    setIsEditingThemeName(false);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        if (editingThemeFolderName.trim()) {
                                                                            renameLayer2Folder(themeFolder.id, editingThemeFolderName.trim());
                                                                        }
                                                                        setIsEditingThemeName(false);
                                                                    }
                                                                }}
                                                                autoFocus
                                                                className="text-xs font-bold text-amber-700 bg-white border border-amber-400 rounded px-2 py-0.5 outline-none w-32"
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setIsEditingThemeName(true);
                                                                    setEditingThemeFolderName(themeFolder.name);
                                                                }}
                                                                className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                                                                title="Click to rename"
                                                            >
                                                                {themeFolder.name}
                                                            </button>
                                                        )}
                                                        <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                            <Star size={8} className="fill-current" />
                                                            Theme
                                                        </span>
                                                        {themeFolder.condition === 'random' && (
                                                            <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                                <Shuffle size={8} />
                                                                Random
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500">{themeFolder.images.length} images</span>
                                                        {/* Condition Selector */}
                                                        {themeFolder.images.length > 0 && (
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setExpandedThemeConditionSelector(!expandedThemeConditionSelector)}
                                                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                                                                        themeFolder.condition === 'random'
                                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                                    }`}
                                                                >
                                                                    <Shuffle size={9} className={themeFolder.condition === 'random' ? 'fill-current' : ''} />
                                                                    {themeFolder.condition === 'random' ? 'Random' : 'First'}
                                                                </button>
                                                                {expandedThemeConditionSelector && (
                                                                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                                                                        <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                                                                            Selection Mode
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                setLayer2FolderCondition(themeFolder.id, null);
                                                                                setExpandedThemeConditionSelector(false);
                                                                            }}
                                                                            className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                                !themeFolder.condition || themeFolder.condition === null
                                                                                    ? 'bg-amber-50 text-amber-700'
                                                                                    : 'hover:bg-slate-50 text-slate-600'
                                                                            }`}
                                                                        >
                                                                            {(!themeFolder.condition || themeFolder.condition === null) && <Check size={10} />}
                                                                            <span className={(!themeFolder.condition || themeFolder.condition === null) ? '' : 'ml-[18px]'}>
                                                                                First (Default)
                                                                            </span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setLayer2FolderCondition(themeFolder.id, 'random');
                                                                                setExpandedThemeConditionSelector(false);
                                                                            }}
                                                                            className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                                themeFolder.condition === 'random'
                                                                                    ? 'bg-amber-50 text-amber-700'
                                                                                    : 'hover:bg-slate-50 text-slate-600'
                                                                            }`}
                                                                        >
                                                                            {themeFolder.condition === 'random' && <Check size={10} />}
                                                                            <span className={themeFolder.condition === 'random' ? '' : 'ml-[18px]'}>
                                                                                <Shuffle size={10} className="inline mr-1" />
                                                                                Random
                                                                            </span>
                                                                        </button>
                                                                        <div className="px-2 py-1 text-[8px] text-slate-400 border-t border-slate-100">
                                                                            Random selects different image on each page entry
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Playlist Assignment Selector */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setExpandedThemePlaylistSelector(!expandedThemePlaylistSelector)}
                                                        className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-medium text-slate-600 transition-all w-full justify-between"
                                                    >
                                                        <span>
                                                            {(!themeFolder.playlistIds || themeFolder.playlistIds.length === 0) 
                                                                ? '📍 Shows on: All Playlists' 
                                                                : `📍 Shows on: ${themeFolder.playlistIds.length} playlist${themeFolder.playlistIds.length > 1 ? 's' : ''}`
                                                            }
                                                        </span>
                                                        <ChevronDown 
                                                            size={12} 
                                                            className={`transition-transform ${expandedThemePlaylistSelector ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                    
                                                    {expandedThemePlaylistSelector && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                                            <button
                                                                onClick={() => {
                                                                    setLayer2FolderPlaylists(themeFolder.id, []);
                                                                }}
                                                                className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                    (!themeFolder.playlistIds || themeFolder.playlistIds.length === 0)
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'hover:bg-slate-50 text-slate-600'
                                                                }`}
                                                            >
                                                                {(!themeFolder.playlistIds || themeFolder.playlistIds.length === 0) && <Check size={10} />}
                                                                <span className={(!themeFolder.playlistIds || themeFolder.playlistIds.length === 0) ? '' : 'ml-[18px]'}>
                                                                    All Playlists (Default)
                                                                </span>
                                                            </button>
                                                            
                                                            <div className="border-t border-slate-100 my-1" />
                                                            <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400">
                                                                Select specific playlists:
                                                            </div>
                                                            
                                                            {allPlaylists.map((playlist) => {
                                                                const isSelected = themeFolder.playlistIds?.includes(playlist.id);
                                                                return (
                                                                    <button
                                                                        key={playlist.id}
                                                                        onClick={() => {
                                                                            const currentIds = themeFolder.playlistIds || [];
                                                                            const newIds = isSelected
                                                                                ? currentIds.filter(id => id !== playlist.id)
                                                                                : [...currentIds, playlist.id];
                                                                            setLayer2FolderPlaylists(themeFolder.id, newIds);
                                                                        }}
                                                                        className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                            isSelected
                                                                                ? 'bg-amber-50 text-amber-700'
                                                                                : 'hover:bg-slate-50 text-slate-600'
                                                                        }`}
                                                                    >
                                                                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${
                                                                            isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'
                                                                        }`}>
                                                                            {isSelected && <Check size={8} className="text-white" />}
                                                                        </div>
                                                                        <span className="truncate">{playlist.name}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                            
                                                            {allPlaylists.length === 0 && (
                                                                <div className="px-3 py-2 text-[10px] text-slate-400 italic">
                                                                    No playlists found
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Folder Color Assignment */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setFolderAssignmentOpenId(folderAssignmentOpenId === themeFolder.id ? null : themeFolder.id)}
                                                        className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-medium text-slate-600 transition-all w-full justify-between"
                                                    >
                                                        <span>
                                                            {assignedFolders.length === 0 
                                                                ? '🎨 Assigned to: No Folders' 
                                                                : `🎨 Assigned to: ${assignedFolders.length} folder${assignedFolders.length > 1 ? 's' : ''}`
                                                            }
                                                        </span>
                                                        <ChevronDown 
                                                            size={12} 
                                                            className={`transition-transform ${folderAssignmentOpenId === themeFolder.id ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                    
                                                    {folderAssignmentOpenId === themeFolder.id && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg p-2 shadow-xl z-20">
                                                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">Assign to Folders</div>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                {FOLDER_COLORS.map((color) => {
                                                                    const isAssigned = assignedFolders.includes(color.id);
                                                                    return (
                                                                        <button
                                                                            key={color.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleFolderAssignment(themeFolder.id, color.id);
                                                                            }}
                                                                            className={`w-8 h-8 rounded border-2 transition-all ${
                                                                                isAssigned
                                                                                    ? 'border-black ring-2 ring-amber-300 scale-110'
                                                                                    : 'border-slate-300 hover:border-slate-400'
                                                                            }`}
                                                                            style={{ backgroundColor: color.hex }}
                                                                            title={color.name}
                                                                        >
                                                                            {isAssigned && (
                                                                                <Check size={12} className="text-white drop-shadow-md" />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Images Grid */}
                                                {themeFolder.images.length > 0 ? (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                        {themeFolder.images.map((img) => (
                                                            <div
                                                                key={img.id}
                                                                className="relative group"
                                                                onMouseEnter={() => setHoveredThemeImageId(img.id)}
                                                                onMouseLeave={() => setHoveredThemeImageId(null)}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        applyLayer2Image(img);
                                                                        if (img.bgColor) {
                                                                            setPageBannerBgColor(img.bgColor);
                                                                        }
                                                                        setSelectedLayer2FolderId(themeFolder.id);
                                                                    }}
                                                                    className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                                                                        customPageBannerImage2 === img.image
                                                                            ? 'border-amber-500 ring-2 ring-amber-200 shadow-lg'
                                                                            : 'border-slate-200 hover:border-amber-300 hover:shadow-md'
                                                                    }`}
                                                                    title={`Paired color: ${img.bgColor || 'none'}`}
                                                                >
                                                                    <img
                                                                        src={img.image}
                                                                        alt="Layer 2"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {/* Paired color indicator */}
                                                                    <div 
                                                                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                                        style={{ backgroundColor: img.bgColor || '#94a3b8' }}
                                                                        title={`Paired: ${img.bgColor || 'none'}`}
                                                                    />
                                                                    {/* Destination Badge */}
                                                                    {img.destinations && (img.destinations.pages?.length > 0 || img.destinations.folderColors?.length > 0) && (
                                                                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-md" title="Has destination assignments">
                                                                            <MapPin size={10} />
                                                                        </div>
                                                                    )}
                                                                    {/* Active Indicator */}
                                                                    {customPageBannerImage2 === img.image && (
                                                                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                                                            <Check className="text-white drop-shadow-md" size={16} />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                                
                                                                {/* Destination Assignment Button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedThemeDestinationSelector(
                                                                            expandedThemeDestinationSelector === img.id ? null : img.id
                                                                        );
                                                                    }}
                                                                    className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                                                                        img.destinations && (img.destinations.pages?.length > 0 || img.destinations.folderColors?.length > 0)
                                                                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                            : 'bg-slate-700/80 hover:bg-slate-600 text-white'
                                                                    }`}
                                                                    title="Assign destinations (pages/folders)"
                                                                >
                                                                    <MapPin size={10} />
                                                                </button>
                                                                
                                                                {/* Destination Assignment Dropdown */}
                                                                {expandedThemeDestinationSelector === img.id && (
                                                                    <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[280px] max-w-[320px] max-h-[400px] overflow-y-auto">
                                                                        <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
                                                                            Assign Destinations
                                                                        </div>
                                                                        
                                                                        {/* Pages Section */}
                                                                        <div className="px-2 py-1">
                                                                            <div className="text-[9px] font-bold uppercase text-slate-500 mb-1">Pages</div>
                                                                            <div className="text-[8px] text-slate-400 mb-2">Select pages where this image appears</div>
                                                                            {['videos', 'playlists', 'likes', 'history', 'pins'].map((page) => {
                                                                                const isSelected = img.destinations?.pages?.includes(page);
                                                                                return (
                                                                                    <button
                                                                                        key={page}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const currentPages = img.destinations?.pages || [];
                                                                                            const newPages = isSelected
                                                                                                ? currentPages.filter(p => p !== page)
                                                                                                : [...currentPages, page];
                                                                                            const newDestinations = {
                                                                                                ...(img.destinations || {}),
                                                                                                pages: newPages.length > 0 ? newPages : undefined
                                                                                            };
                                                                                            updateLayer2Image(themeFolder.id, img.id, { 
                                                                                                destinations: newPages.length > 0 || newDestinations.folderColors?.length > 0 ? newDestinations : null
                                                                                            });
                                                                                        }}
                                                                                        className={`w-full px-2 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 rounded ${
                                                                                            isSelected
                                                                                                ? 'bg-blue-50 text-blue-700'
                                                                                                : 'hover:bg-slate-50 text-slate-600'
                                                                                        }`}
                                                                                    >
                                                                                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${
                                                                                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                                                                                        }`}>
                                                                                            {isSelected && <Check size={8} className="text-white" />}
                                                                                        </div>
                                                                                        <span className="capitalize">{page}</span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        
                                                                        <div className="border-t border-slate-100 my-1" />
                                                                        
                                                                        {/* Folder Colors Section */}
                                                                        <div className="px-2 py-1">
                                                                            <div className="text-[9px] font-bold uppercase text-slate-500 mb-1">Colored Folders</div>
                                                                            <div className="text-[8px] text-slate-400 mb-2">Select folder colors where this image appears</div>
                                                                            <div className="grid grid-cols-4 gap-1">
                                                                                {FOLDER_COLORS.map((color) => {
                                                                                    const isSelected = img.destinations?.folderColors?.includes(color.id);
                                                                                    return (
                                                                                        <button
                                                                                            key={color.id}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const currentColors = img.destinations?.folderColors || [];
                                                                                                const newColors = isSelected
                                                                                                    ? currentColors.filter(c => c !== color.id)
                                                                                                    : [...currentColors, color.id];
                                                                                                const newDestinations = {
                                                                                                    ...(img.destinations || {}),
                                                                                                    folderColors: newColors.length > 0 ? newColors : undefined
                                                                                                };
                                                                                                updateLayer2Image(themeFolder.id, img.id, { 
                                                                                                    destinations: newColors.length > 0 || newDestinations.pages?.length > 0 ? newDestinations : null
                                                                                                });
                                                                                            }}
                                                                                            className={`w-full aspect-square rounded border-2 transition-all ${
                                                                                                isSelected
                                                                                                    ? 'border-white ring-2 ring-blue-500 ring-offset-1'
                                                                                                    : 'border-slate-300 hover:border-slate-400'
                                                                                            }`}
                                                                                            style={{ backgroundColor: color.hex }}
                                                                                            title={color.name}
                                                                                        >
                                                                                            {isSelected && (
                                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                                    <Check size={10} className="text-white drop-shadow-md" />
                                                                                                </div>
                                                                                            )}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Clear All Button */}
                                                                        <div className="border-t border-slate-100 px-2 py-2">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateLayer2Image(themeFolder.id, img.id, { destinations: null });
                                                                                    setExpandedThemeDestinationSelector(null);
                                                                                }}
                                                                                className="w-full px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded transition-all"
                                                                            >
                                                                                Clear All Destinations
                                                                            </button>
                                                                            <div className="text-[8px] text-slate-400 mt-1">
                                                                                No destinations = appears everywhere
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Delete Button */}
                                                                {hoveredThemeImageId === img.id && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeLayer2Image(themeFolder.id, img.id);
                                                                        }}
                                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-4 text-center border-2 border-dashed border-amber-200 rounded-lg bg-white/50">
                                                        <p className="text-[10px] text-slate-400">No images saved yet</p>
                                                    </div>
                                                )}
                                                
                                                {/* Add Image Button */}
                                                <label className="w-full py-2 bg-white border-2 border-dashed border-amber-200 rounded-lg text-[10px] font-bold uppercase text-amber-400 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                    <Plus size={12} />
                                                    Add Image to Theme Folder
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLayer2FolderImageUpload(e, themeFolder.id)}
                                                        className="hidden"
                                                    />
                                                </label>
                                                
                                                {/* Save Button */}
                                                {customPageBannerImage2 && (
                                                    <button
                                                        onClick={() => addLayer2Image(themeFolder.id, {
                                                            image: customPageBannerImage2,
                                                            scale: pageBannerImage2Scale,
                                                            xOffset: pageBannerImage2XOffset,
                                                            yOffset: pageBannerImage2YOffset,
                                                            bgColor: pageBannerBgColor
                                                        })}
                                                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={12} />
                                                        Save to Theme Folder
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <div className="space-y-2 py-4 text-center">
                                            <Star size={24} className="text-slate-300 mx-auto mb-2" />
                                            <p className="text-[10px] text-slate-400">No theme folder set</p>
                                            <p className="text-[9px] text-slate-300 leading-relaxed">
                                                Set a folder as theme in the Layer 2 Image Library section below
                                            </p>
                                        </div>
                                    )}
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
                                        Set the paired background color in Layer 2 settings, then save to library. Each saved image remembers its paired color.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Layer 2 Image Library Tab */}
                        {activeTab === 'library' && (
                            <div className="space-y-4 border-t border-sky-50 pt-3 bg-white/50 p-3 rounded-2xl">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Image size={14} /> Layer 2 Image Library
                                </h3>
                                <div className="space-y-4 px-1">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Folder size={14} className="text-purple-500" />
                                        <label className="text-xs font-bold uppercase text-slate-400">Layer 2 Image Library</label>
                                    </div>
                                    <button
                                        onClick={() => addLayer2Folder()}
                                        className="flex items-center gap-1 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                                    >
                                        <Plus size={10} />
                                        New Folder
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    Organize Layer 2 images in folders. Click to apply, hover to delete. Click folder name to rename.
                                </p>
                                
                                {layer2Folders.map((folder) => (
                                    <div 
                                        key={folder.id} 
                                        className={`space-y-3 p-4 rounded-xl border-2 transition-all ${
                                            selectedLayer2FolderId === folder.id 
                                                ? 'border-purple-400 bg-purple-50/50' 
                                                : 'border-purple-100 bg-purple-50/30'
                                        }`}
                                        onMouseEnter={() => setHoveredLayer2FolderId(folder.id)}
                                        onMouseLeave={() => setHoveredLayer2FolderId(null)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {editingLayer2FolderId === folder.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingLayer2FolderName}
                                                        onChange={(e) => setEditingLayer2FolderName(e.target.value)}
                                                        onBlur={() => {
                                                            if (editingLayer2FolderName.trim()) {
                                                                renameLayer2Folder(folder.id, editingLayer2FolderName.trim());
                                                            }
                                                            setEditingLayer2FolderId(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                if (editingLayer2FolderName.trim()) {
                                                                    renameLayer2Folder(folder.id, editingLayer2FolderName.trim());
                                                                }
                                                                setEditingLayer2FolderId(null);
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="text-xs font-bold text-purple-600 bg-white border border-purple-400 rounded px-2 py-0.5 outline-none w-32"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingLayer2FolderId(folder.id);
                                                            setEditingLayer2FolderName(folder.name);
                                                        }}
                                                        className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                                                        title="Click to rename"
                                                    >
                                                        {folder.name}
                                                    </button>
                                                )}
                                                {selectedLayer2FolderId === folder.id && (
                                                    <span className="text-[8px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded-full uppercase">Active</span>
                                                )}
                                                {themeFolderId === folder.id && (
                                                    <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                        <Star size={8} className="fill-current" />
                                                        Theme
                                                    </span>
                                                )}
                                                {folder.condition === 'random' && (
                                                    <span className="text-[8px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                        <Shuffle size={8} />
                                                        Random
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400">{folder.images.length} images</span>
                                                {/* Condition Selector */}
                                                {folder.images.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => {
                                                                setExpandedConditionSelector(
                                                                    expandedConditionSelector === folder.id ? null : folder.id
                                                                );
                                                            }}
                                                            className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                                                                folder.condition === 'random'
                                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                            }`}
                                                            title={folder.condition === 'random' ? 'Random selection enabled' : 'Set selection mode'}
                                                        >
                                                            <Shuffle size={9} className={folder.condition === 'random' ? 'fill-current' : ''} />
                                                            {folder.condition === 'random' ? 'Random' : 'First'}
                                                        </button>
                                                        {/* Condition Dropdown */}
                                                        {expandedConditionSelector === folder.id && (
                                                            <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                                                                <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100">
                                                                    Selection Mode
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setLayer2FolderCondition(folder.id, null);
                                                                        setExpandedConditionSelector(null);
                                                                    }}
                                                                    className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                        !folder.condition || folder.condition === null
                                                                            ? 'bg-purple-50 text-purple-700'
                                                                            : 'hover:bg-slate-50 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {(!folder.condition || folder.condition === null) && <Check size={10} />}
                                                                    <span className={(!folder.condition || folder.condition === null) ? '' : 'ml-[18px]'}>
                                                                        First (Default)
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setLayer2FolderCondition(folder.id, 'random');
                                                                        setExpandedConditionSelector(null);
                                                                    }}
                                                                    className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                        folder.condition === 'random'
                                                                            ? 'bg-amber-50 text-amber-700'
                                                                            : 'hover:bg-slate-50 text-slate-600'
                                                                    }`}
                                                                >
                                                                    {folder.condition === 'random' && <Check size={10} />}
                                                                    <span className={folder.condition === 'random' ? '' : 'ml-[18px]'}>
                                                                        <Shuffle size={10} className="inline mr-1" />
                                                                        Random
                                                                    </span>
                                                                </button>
                                                                <div className="px-2 py-1 text-[8px] text-slate-400 border-t border-slate-100">
                                                                    Random selects different image on each page entry
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Set as Theme Button */}
                                                {folder.images.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            if (themeFolderId === folder.id) {
                                                                clearThemeFolder();
                                                            } else {
                                                                setThemeFolder(folder.id);
                                                            }
                                                        }}
                                                        className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                                                            themeFolderId === folder.id
                                                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                        }`}
                                                        title={themeFolderId === folder.id ? 'Remove theme (applies app-wide)' : 'Set as page banner theme (applies app-wide)'}
                                                    >
                                                        <Star size={9} className={themeFolderId === folder.id ? 'fill-current' : ''} />
                                                        {themeFolderId === folder.id ? 'Theme' : 'Set Theme'}
                                                    </button>
                                                )}
                                                {folder.id !== 'default' && hoveredLayer2FolderId === folder.id && (
                                                    <button
                                                        onClick={() => removeLayer2Folder(folder.id)}
                                                        className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                                                        title="Delete folder"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Playlist Assignment Selector */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setExpandedFolderPlaylistSelector(
                                                    expandedFolderPlaylistSelector === folder.id ? null : folder.id
                                                )}
                                                className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-medium text-slate-600 transition-all w-full justify-between"
                                            >
                                                <span>
                                                    {(!folder.playlistIds || folder.playlistIds.length === 0) 
                                                        ? '📍 Shows on: All Playlists' 
                                                        : `📍 Shows on: ${folder.playlistIds.length} playlist${folder.playlistIds.length > 1 ? 's' : ''}`
                                                    }
                                                </span>
                                                <ChevronDown 
                                                    size={12} 
                                                    className={`transition-transform ${expandedFolderPlaylistSelector === folder.id ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            
                                            {/* Playlist Dropdown */}
                                            {expandedFolderPlaylistSelector === folder.id && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                                    {/* All Playlists Option */}
                                                    <button
                                                        onClick={() => {
                                                            setLayer2FolderPlaylists(folder.id, []);
                                                        }}
                                                        className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                            (!folder.playlistIds || folder.playlistIds.length === 0)
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : 'hover:bg-slate-50 text-slate-600'
                                                        }`}
                                                    >
                                                        {(!folder.playlistIds || folder.playlistIds.length === 0) && <Check size={10} />}
                                                        <span className={(!folder.playlistIds || folder.playlistIds.length === 0) ? '' : 'ml-[18px]'}>
                                                            All Playlists (Default)
                                                        </span>
                                                    </button>
                                                    
                                                    <div className="border-t border-slate-100 my-1" />
                                                    <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400">
                                                        Select specific playlists:
                                                    </div>
                                                    
                                                    {allPlaylists.map((playlist) => {
                                                        const isSelected = folder.playlistIds?.includes(playlist.id);
                                                        return (
                                                            <button
                                                                key={playlist.id}
                                                                onClick={() => {
                                                                    const currentIds = folder.playlistIds || [];
                                                                    const newIds = isSelected
                                                                        ? currentIds.filter(id => id !== playlist.id)
                                                                        : [...currentIds, playlist.id];
                                                                    setLayer2FolderPlaylists(folder.id, newIds);
                                                                }}
                                                                className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 ${
                                                                    isSelected
                                                                        ? 'bg-purple-50 text-purple-700'
                                                                        : 'hover:bg-slate-50 text-slate-600'
                                                                }`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${
                                                                    isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-300'
                                                                }`}>
                                                                    {isSelected && <Check size={8} className="text-white" />}
                                                                </div>
                                                                <span className="truncate">{playlist.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                    
                                                    {allPlaylists.length === 0 && (
                                                        <div className="px-3 py-2 text-[10px] text-slate-400 italic">
                                                            No playlists found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Images Grid */}
                                        {folder.images.length > 0 ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                                {folder.images.map((img) => (
                                                    <div
                                                        key={img.id}
                                                        className="relative group"
                                                        onMouseEnter={() => setHoveredLayer2ImageId(img.id)}
                                                        onMouseLeave={() => setHoveredLayer2ImageId(null)}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                applyLayer2Image(img);
                                                                // Also load the image's paired bgColor
                                                                if (img.bgColor) {
                                                                    setPageBannerBgColor(img.bgColor);
                                                                }
                                                                setSelectedLayer2FolderId(folder.id);
                                                            }}
                                                            className={`w-full aspect-video rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                                                                customPageBannerImage2 === img.image
                                                                    ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg'
                                                                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                                                            }`}
                                                            title={`Paired color: ${img.bgColor || 'none'}`}
                                                        >
                                                            <img
                                                                src={img.image}
                                                                alt="Layer 2"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {/* Paired color indicator */}
                                                            <div 
                                                                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-md"
                                                                style={{ backgroundColor: img.bgColor || '#94a3b8' }}
                                                                title={`Paired: ${img.bgColor || 'none'}`}
                                                            />
                                                            {/* Destination Badge */}
                                                            {img.destinations && (img.destinations.pages?.length > 0 || img.destinations.folderColors?.length > 0) && (
                                                                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-md" title="Has destination assignments">
                                                                    <MapPin size={10} />
                                                                </div>
                                                            )}
                                                            {/* Active Indicator */}
                                                            {customPageBannerImage2 === img.image && (
                                                                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                                    <Check className="text-white drop-shadow-md" size={16} />
                                                                </div>
                                                            )}
                                                        </button>
                                                        
                                                        {/* Destination Assignment Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedDestinationSelector(
                                                                    expandedDestinationSelector === img.id ? null : img.id
                                                                );
                                                            }}
                                                            className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                                                                img.destinations && (img.destinations.pages?.length > 0 || img.destinations.folderColors?.length > 0)
                                                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                    : 'bg-slate-700/80 hover:bg-slate-600 text-white'
                                                            }`}
                                                            title="Assign destinations (pages/folders)"
                                                        >
                                                            <MapPin size={10} />
                                                        </button>
                                                        
                                                        {/* Destination Assignment Dropdown */}
                                                        {expandedDestinationSelector === img.id && (
                                                            <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[280px] max-w-[320px] max-h-[400px] overflow-y-auto">
                                                                <div className="px-2 py-1 text-[9px] font-bold uppercase text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
                                                                    Assign Destinations
                                                                </div>
                                                                
                                                                {/* Pages Section */}
                                                                <div className="px-2 py-1">
                                                                    <div className="text-[9px] font-bold uppercase text-slate-500 mb-1">Pages</div>
                                                                    <div className="text-[8px] text-slate-400 mb-2">Select pages where this image appears</div>
                                                                    {['videos', 'playlists', 'likes', 'history', 'pins'].map((page) => {
                                                                        const isSelected = img.destinations?.pages?.includes(page);
                                                                        return (
                                                                            <button
                                                                                key={page}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const currentPages = img.destinations?.pages || [];
                                                                                    const newPages = isSelected
                                                                                        ? currentPages.filter(p => p !== page)
                                                                                        : [...currentPages, page];
                                                                                    const newDestinations = {
                                                                                        ...(img.destinations || {}),
                                                                                        pages: newPages.length > 0 ? newPages : undefined
                                                                                    };
                                                                                    updateLayer2Image(folder.id, img.id, { 
                                                                                        destinations: newPages.length > 0 || newDestinations.folderColors?.length > 0 ? newDestinations : null
                                                                                    });
                                                                                }}
                                                                                className={`w-full px-2 py-1.5 text-left text-[10px] font-medium transition-all flex items-center gap-2 rounded ${
                                                                                    isSelected
                                                                                        ? 'bg-blue-50 text-blue-700'
                                                                                        : 'hover:bg-slate-50 text-slate-600'
                                                                                }`}
                                                                            >
                                                                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${
                                                                                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                                                                                }`}>
                                                                                    {isSelected && <Check size={8} className="text-white" />}
                                                                                </div>
                                                                                <span className="capitalize">{page}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                
                                                                <div className="border-t border-slate-100 my-1" />
                                                                
                                                                {/* Folder Colors Section */}
                                                                <div className="px-2 py-1">
                                                                    <div className="text-[9px] font-bold uppercase text-slate-500 mb-1">Colored Folders</div>
                                                                    <div className="text-[8px] text-slate-400 mb-2">Select folder colors where this image appears</div>
                                                                    <div className="grid grid-cols-4 gap-1">
                                                                        {FOLDER_COLORS.map((color) => {
                                                                            const isSelected = img.destinations?.folderColors?.includes(color.id);
                                                                            return (
                                                                                <button
                                                                                    key={color.id}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const currentColors = img.destinations?.folderColors || [];
                                                                                        const newColors = isSelected
                                                                                            ? currentColors.filter(c => c !== color.id)
                                                                                            : [...currentColors, color.id];
                                                                                        const newDestinations = {
                                                                                            ...(img.destinations || {}),
                                                                                            folderColors: newColors.length > 0 ? newColors : undefined
                                                                                        };
                                                                                        updateLayer2Image(folder.id, img.id, { 
                                                                                            destinations: newColors.length > 0 || newDestinations.pages?.length > 0 ? newDestinations : null
                                                                                        });
                                                                                    }}
                                                                                    className={`w-full aspect-square rounded border-2 transition-all ${
                                                                                        isSelected
                                                                                            ? 'border-white ring-2 ring-blue-500 ring-offset-1'
                                                                                            : 'border-slate-300 hover:border-slate-400'
                                                                                    }`}
                                                                                    style={{ backgroundColor: color.hex }}
                                                                                    title={color.name}
                                                                                >
                                                                                    {isSelected && (
                                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                                            <Check size={10} className="text-white drop-shadow-md" />
                                                                                        </div>
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Clear All Button */}
                                                                <div className="border-t border-slate-100 px-2 py-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateLayer2Image(folder.id, img.id, { destinations: null });
                                                                            setExpandedDestinationSelector(null);
                                                                        }}
                                                                        className="w-full px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded transition-all"
                                                                    >
                                                                        Clear All Destinations
                                                                    </button>
                                                                    <div className="text-[8px] text-slate-400 mt-1">
                                                                        No destinations = appears everywhere
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Delete Button */}
                                                        {hoveredLayer2ImageId === img.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeLayer2Image(folder.id, img.id);
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                                                            >
                                                                <Trash2 size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-4 text-center border-2 border-dashed border-purple-200 rounded-lg bg-white/50">
                                                <p className="text-[10px] text-slate-400">No images saved yet</p>
                                            </div>
                                        )}
                                        
                                        {/* Add Image Button */}
                                        <label className="w-full py-2 bg-white border-2 border-dashed border-purple-200 rounded-lg text-[10px] font-bold uppercase text-purple-400 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                            <Plus size={12} />
                                            Add Image to Folder
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleLayer2FolderImageUpload(e, folder.id)}
                                                className="hidden"
                                            />
                                        </label>
                                        
                                        {/* Save Button */}
                                        {customPageBannerImage2 && (
                                            <button
                                                onClick={() => addLayer2Image(folder.id, {
                                                    image: customPageBannerImage2,
                                                    scale: pageBannerImage2Scale,
                                                    xOffset: pageBannerImage2XOffset,
                                                    yOffset: pageBannerImage2YOffset,
                                                    bgColor: pageBannerBgColor
                                                })}
                                                className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={12} />
                                                Save to This Folder
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                                ({filteredLayer2Folders.length} {filteredLayer2Folders.length === 1 ? 'folder' : 'folders'})
                                            </span>
                                        )}
                                    </h3>
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
                                                    folderName: folder.name
                                                });
                                            });
                                        }
                                    });

                                    if (allImages.length === 0) {
                                        return (
                                            <div className="text-center text-slate-400 py-12 bg-white/50 p-4 rounded-2xl">
                                                <Folder size={48} className="mx-auto mb-4 opacity-50" />
                                                <p className="text-sm font-medium">No images found</p>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {layer2Folders.length === 0 
                                                        ? 'Switch to the Image Library tab to create your first folder and add images'
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
                                                {allImages.map((img) => {
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
                                                                    className={`w-full h-full transition-all duration-200 relative overflow-hidden ${
                                                                        isActive
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
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Group Leader' : 'Select Group Leader'}
                                                    </label>
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
                                                        {allImages.map((img) => {
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
                                                                        className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 relative overflow-hidden bg-slate-100 ${
                                                                            isGroupLeader
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
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Assign Images to Group' : 'Select Group Leader'}
                                                    </label>
                                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                        {allImages.map((img) => {
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
                                                                        className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 relative overflow-hidden bg-slate-100 ${
                                                                            isGroupLeader
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
            </div>
        </div>
    );
}

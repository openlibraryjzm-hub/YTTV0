import React, { useState, useRef, useEffect } from 'react';
import { Smile, Plus, ArrowLeft, Trash2, Check, Folder, Settings } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
import { FOLDER_COLORS } from '../utils/folderColors';

export default function OrbPage({ onBack, onNavigateToYou, onNavigateToPage, onNavigateToApp }) {
    const {
        customOrbImage, setCustomOrbImage,
        isSpillEnabled, setIsSpillEnabled,
        orbSpill, setOrbSpill,
        orbImageScale, setOrbImageScale,
        orbImageXOffset, setOrbImageXOffset,
        orbImageYOffset, setOrbImageYOffset,
        addOrbFavorite,
        orbFavorites,
        removeOrbFavorite,
        applyOrbFavorite,
        updateOrbFavoriteFolders,
        assignOrbToGroup
    } = useConfigStore();

    const [hoveredFavoriteId, setHoveredFavoriteId] = useState(null);
    const [activeTab, setActiveTab] = useState('presets'); // 'presets', 'configuration', or 'groups'
    const [selectedFolderFilter, setSelectedFolderFilter] = useState(null); // null = show all
    const [folderAssignmentOpenId, setFolderAssignmentOpenId] = useState(null); // ID of preset with open folder selector
    const [selectedGroupLeaderId, setSelectedGroupLeaderId] = useState(null); // ID of selected group leader preset


    const handleOrbImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomOrbImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleSpillQuadrant = (q) => {
        setOrbSpill({ ...orbSpill, [q]: !orbSpill[q] });
    };

    const handleSaveCurrentOrbAsFavorite = () => {
        if (!customOrbImage) return;
        addOrbFavorite({
            customOrbImage,
            isSpillEnabled,
            orbSpill: { ...orbSpill },
            orbImageScale,
            orbImageXOffset,
            orbImageYOffset,
        });
    };


    const scrollContainerRef = useRef(null);
    const horizontalScrollRef = useRef(null);

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

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
        // Only attach when presets tab is active
        if (activeTab !== 'presets') return;
        
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

    // Calculate folder counts for prism bar
    const folderCounts = {};
    FOLDER_COLORS.forEach(color => {
        folderCounts[color.id] = orbFavorites.filter(fav => 
            fav.folderColors && fav.folderColors.includes(color.id)
        ).length;
    });

    // Filter presets based on selected folder
    const filteredFavorites = selectedFolderFilter 
        ? orbFavorites.filter(fav => 
            fav.folderColors && fav.folderColors.includes(selectedFolderFilter)
        )
        : orbFavorites;

    // Toggle folder assignment for a preset
    const toggleFolderAssignment = (favoriteId, folderColorId) => {
        const favorite = orbFavorites.find(f => f.id === favoriteId);
        if (!favorite) return;
        
        const currentFolders = favorite.folderColors || [];
        const newFolders = currentFolders.includes(folderColorId)
            ? currentFolders.filter(id => id !== folderColorId)
            : [...currentFolders, folderColorId];
        
        updateOrbFavoriteFolders(favoriteId, newFolders);
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-transparent relative">
                {/* Page Banner */}
                <div className="px-4 pt-8 relative">
                    <PageBanner
                        title="Orb Configuration"
                        description="Customize your central orb with images, spill effects, and presets"
                        color={null}
                        isEditable={false}
                        showAscii={false}
                        orbControls={{
                            customOrbImage,
                            isSpillEnabled,
                            onImageUpload: handleOrbImageUpload,
                            onToggleSpill: (e) => {
                                if (e) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }
                                setIsSpillEnabled(!isSpillEnabled);
                            },
                            onRemoveImage: () => setCustomOrbImage(null)
                        }}
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
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-sky-500 text-white shadow-md border border-white/20"
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
                            onClick={() => onNavigateToPage?.()}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-white/90 hover:bg-white text-slate-800 shadow-md border border-white/20 backdrop-blur-sm"
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
                        ? 'backdrop-blur-xl border-y shadow-2xl mx-0 rounded-none mb-4 pt-2 pb-2 bg-slate-900/70'
                        : 'backdrop-blur-[2px] border-b border-x border-t border-white/10 shadow-xl mx-8 rounded-b-2xl mb-2 mt-0 pt-1 pb-0 bg-slate-900/40'
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
                                            title={`${color.name} (${count} presets)`}
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
                                onClick={() => setActiveTab('presets')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${
                                    activeTab === 'presets'
                                        ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                        : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                            >
                                <Smile size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Presets</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('configuration')}
                                className={`rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200 px-4 h-9 gap-1.5 ${
                                    activeTab === 'configuration'
                                        ? 'bg-white border-sky-500 text-sky-600 transform scale-105'
                                        : 'bg-white border-[#334155] text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                            >
                                <Settings size={14} />
                                <span className="font-bold text-xs uppercase tracking-wide">Configuration</span>
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

                        {/* SVG ClipPath Definitions for Each Preset (available in all tabs) */}
                        {orbFavorites.length > 0 && (
                            <svg width="0" height="0" className="absolute pointer-events-none">
                                <defs>
                                    {orbFavorites.map((favorite) => (
                                        <clipPath key={favorite.id} id={`orbClipPath-${favorite.id}`} clipPathUnits="objectBoundingBox">
                                            <circle cx="0.5" cy="0.5" r="0.5" />
                                            {favorite.isSpillEnabled && favorite.orbSpill?.tl && <rect x="-50" y="-50" width="50.5" height="50.5" />}
                                            {favorite.isSpillEnabled && favorite.orbSpill?.tr && <rect x="0.5" y="-50" width="50.5" height="50.5" />}
                                            {favorite.isSpillEnabled && favorite.orbSpill?.bl && <rect x="-50" y="0.5" width="50.5" height="50.5" />}
                                            {favorite.isSpillEnabled && favorite.orbSpill?.br && <rect x="0.5" y="0.5" width="50.5" height="50.5" />}
                                        </clipPath>
                                    ))}
                                </defs>
                            </svg>
                        )}

                        {/* Tab Content */}
                        {activeTab === 'configuration' && (
                            <div className="space-y-2 border-t border-sky-50 pt-3 bg-white/50 p-3 rounded-2xl">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Settings size={14} /> Orb Configuration
                                </h3>
                                <div className="space-y-2 px-1">

                                {/* Image Scale Slider */}
                                {customOrbImage && isSpillEnabled && (
                                    <div className="space-y-1 border-t border-slate-100 pt-2">
                                        <label className="text-xs font-bold uppercase text-slate-400 px-1">Image Scale</label>
                                        <div className="flex flex-col items-center gap-1 max-w-[50%]">
                                            <span className="text-xs font-mono font-bold text-sky-600">{orbImageScale.toFixed(2)}x</span>
                                            <div className="flex items-center gap-2 w-full">
                                                <span className="text-[10px] font-bold text-slate-300">0.5x</span>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="3.0"
                                                    step="0.05"
                                                    value={orbImageScale}
                                                    onChange={(e) => setOrbImageScale(parseFloat(e.target.value))}
                                                    className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                />
                                                <span className="text-[10px] font-bold text-slate-300">3.0x</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Image Position Offset Sliders and Spill Areas */}
                                {customOrbImage && isSpillEnabled && (
                                    <div className="space-y-2 border-t border-slate-100 pt-2">
                                        <div className="flex items-start gap-4">
                                            {/* Left side: Image Position Sliders */}
                                            <div className="flex-1 space-y-2 max-w-[50%]">
                                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Image Position</label>
                                                
                                                {/* X Offset */}
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-slate-500 px-1">Horizontal (X)</label>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono font-bold text-sky-600">{orbImageXOffset}px</span>
                                                            {orbImageXOffset !== 0 && (
                                                                <button
                                                                    onClick={() => setOrbImageXOffset(0)}
                                                                    className="text-[9px] font-bold text-slate-400 hover:text-sky-500 transition-colors"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full">
                                                            <span className="text-[10px] font-bold text-slate-300">-100</span>
                                                            <input
                                                                type="range"
                                                                min="-100"
                                                                max="100"
                                                                step="1"
                                                                value={orbImageXOffset}
                                                                onChange={(e) => setOrbImageXOffset(parseInt(e.target.value))}
                                                                className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-300">+100</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Y Offset */}
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-slate-500 px-1">Vertical (Y)</label>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono font-bold text-sky-600">{orbImageYOffset}px</span>
                                                            {orbImageYOffset !== 0 && (
                                                                <button
                                                                    onClick={() => setOrbImageYOffset(0)}
                                                                    className="text-[9px] font-bold text-slate-400 hover:text-sky-500 transition-colors"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full">
                                                            <span className="text-[10px] font-bold text-slate-300">-100</span>
                                                            <input
                                                                type="range"
                                                                min="-100"
                                                                max="100"
                                                                step="1"
                                                                value={orbImageYOffset}
                                                                onChange={(e) => setOrbImageYOffset(parseInt(e.target.value))}
                                                                className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all border border-slate-200"
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-300">+100</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right side: Spill Areas */}
                                            <div className="flex-1 space-y-1 -mt-[60px]">
                                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Spill Areas</label>
                                                
                                                {/* Interactive Visualizer */}
                                                <div className="relative w-36 h-36 border-2 border-slate-100 rounded-xl overflow-hidden bg-slate-50 mx-auto select-none">
                                                    {/* The Image Background */}
                                                    <img
                                                        src={customOrbImage}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale transition-transform duration-300 origin-center"
                                                        style={{ transform: `scale(${orbImageScale}) translate(${orbImageXOffset * 0.5}px, ${orbImageYOffset * 0.5}px)` }}
                                                        alt=""
                                                    />

                                                    {/* The Circle Mask (Inverse) */}
                                                    <div className="absolute inset-0 pointer-events-none z-10">
                                                        <svg width="100%" height="100%" viewBox="0 0 100 100">
                                                            <defs>
                                                                <mask id="circleMask">
                                                                    <rect width="100" height="100" fill="white" />
                                                                    <circle cx="50" cy="50" r="35" fill="black" />
                                                                </mask>
                                                            </defs>
                                                            <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#circleMask)" />
                                                        </svg>
                                                    </div>

                                                    {/* Quadrant Toggles */}
                                                    <div className="absolute inset-0 z-20 grid grid-cols-2 grid-rows-2">
                                                        {['tl', 'tr', 'bl', 'br'].map((q) => (
                                                            <button
                                                                key={q}
                                                                onClick={() => toggleSpillQuadrant(q)}
                                                                className={`
                                                                    relative border-dashed border-white/30 transition-all duration-200 hover:bg-sky-500/20 active:scale-95 flex items-center justify-center
                                                                    ${q === 'tl' ? 'border-r border-b rounded-tl-xl' : ''}
                                                                    ${q === 'tr' ? 'border-l border-b rounded-tr-xl' : ''}
                                                                    ${q === 'bl' ? 'border-r border-t rounded-bl-xl' : ''}
                                                                    ${q === 'br' ? 'border-l border-t rounded-br-xl' : ''}
                                                                    ${orbSpill[q] ? 'bg-sky-500/30' : ''}
                                                                `}
                                                            >
                                                                {orbSpill[q] && (
                                                                    <div className="p-1 bg-sky-500 rounded-full text-white shadow-sm">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Center Label */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                                        <div className="bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                            ORB
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description/Tip underneath */}
                                                <div className="text-[10px] text-slate-500 space-y-0.5">
                                                    <p>Click quadrants to toggle spill.</p>
                                                    <ul className="list-disc pl-3 space-y-0">
                                                        <li><span className="font-bold text-sky-600">Selected:</span> Overflows</li>
                                                        <li><span className="font-bold text-slate-400">Unselected:</span> Clipped</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Save Current Configuration Button */}
                                <div className="border-t border-slate-100 pt-2 mt-2">
                                    <button
                                        onClick={handleSaveCurrentOrbAsFavorite}
                                        disabled={!customOrbImage}
                                        className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${customOrbImage
                                            ? 'bg-sky-500 border-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 shadow-md hover:shadow-lg'
                                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Plus size={14} />
                                        Save Current Configuration as Preset
                                    </button>
                                    {!customOrbImage && (
                                        <p className="text-[10px] text-slate-400 text-center mt-1">
                                            Upload an orb image first to save it as a preset
                                        </p>
                                    )}
                                </div>
                                </div>
                            </div>
                        )}

                        {/* Saved Presets - Horizontal Scrolling Layout */}
                        {activeTab === 'presets' && (
                            <div className="space-y-4 overflow-visible">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Smile size={14} /> Saved Presets
                                        {selectedFolderFilter && (
                                            <span className="text-[10px] font-normal normal-case text-slate-500">
                                                ({filteredFavorites.length} {filteredFavorites.length === 1 ? 'preset' : 'presets'})
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                
                                {orbFavorites.length === 0 ? (
                                    <div className="text-center text-slate-400 py-12 bg-white/50 p-4 rounded-2xl">
                                        <Smile size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-sm font-medium">No presets saved yet</p>
                                        <p className="text-xs text-slate-500 mt-2">Switch to the Configuration tab to create your first preset</p>
                                    </div>
                                ) : (
                                    <>
                                
                                {/* Horizontal Scrolling Presets Container */}
                                <div 
                                    ref={horizontalScrollRef}
                                    className="horizontal-video-scroll" 
                                    onWheel={(e) => {
                                        // Handle wheel scrolling on the presets container
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
                                            width: 'max-content',
                                            paddingTop: '0px', // No additional padding needed
                                        }}
                                    >
                                        {filteredFavorites.map((favorite) => {
                                            const assignedFolders = favorite.folderColors || [];
                                            return (
                                            <div
                                                key={favorite.id}
                                                className="relative group flex flex-col items-center"
                                                style={{ 
                                                    zIndex: folderAssignmentOpenId === favorite.id ? 100 : 'auto',
                                                    width: '200px',
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                onMouseLeave={() => {
                                                    setHoveredFavoriteId(null);
                                                    // Don't close if menu is open - let click outside handle it
                                                    if (folderAssignmentOpenId !== favorite.id) {
                                                        setFolderAssignmentOpenId(null);
                                                    }
                                                }}
                                            >
                                                {/* Favorite Thumbnail with Spill Effect */}
                                                <div className="relative w-full aspect-square mx-auto overflow-visible">
                                                    <button
                                                        onClick={() => applyOrbFavorite(favorite)}
                                                        className={`w-full h-full rounded-full border-4 transition-all duration-200 relative overflow-visible bg-sky-50 ${
                                                            favorite.customOrbImage === customOrbImage
                                                                ? 'border-sky-500 ring-4 ring-sky-200 shadow-lg scale-105'
                                                                : 'border-slate-200 hover:border-sky-300 hover:shadow-md'
                                                        }`}
                                                    >
                                                        {/* Image Layer with Spill Effect */}
                                                        <div 
                                                            className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40" 
                                                            style={{ 
                                                                clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#orbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                                overflow: 'visible'
                                                            }}
                                                        >
                                                            <img
                                                                src={favorite.customOrbImage}
                                                                alt={favorite.name}
                                                                className="max-w-none transition-all duration-500"
                                                                style={{
                                                                    width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                    height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                    transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * 0.3}px, ${(favorite.orbImageYOffset || 0) * 0.3}px)` : 'none',
                                                                    objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                                }}
                                                            />
                                                        </div>
                                                        
                                                        {/* Glass Overlay */}
                                                        <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                            <div className="absolute inset-0 bg-sky-200/10" />
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* Name */}
                                                <p className="mt-2 text-[10px] text-slate-500 text-center font-bold truncate w-full">
                                                    {favorite.name}
                                                </p>

                                                {/* Spill Indicator */}
                                                {favorite.isSpillEnabled && (
                                                    <div className="absolute top-0 right-0 bg-sky-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        Spill
                                                    </div>
                                                )}

                                                {/* Folder Assignment Button (on hover) */}
                                                {hoveredFavoriteId === favorite.id && (
                                                    <div className="absolute -top-2 -left-2 flex flex-col gap-1 z-[100]">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFolderAssignmentOpenId(folderAssignmentOpenId === favorite.id ? null : favorite.id);
                                                            }}
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all ${
                                                                assignedFolders.length > 0
                                                                    ? 'bg-sky-500 hover:bg-sky-600 text-white'
                                                                    : 'bg-slate-400 hover:bg-slate-500 text-white'
                                                            }`}
                                                            title="Assign to folders"
                                                        >
                                                            <Folder size={12} />
                                                        </button>
                                                        
                                                        {/* Folder Color Selector */}
                                                        {folderAssignmentOpenId === favorite.id && (
                                                            <div className="folder-assignment-menu absolute top-7 left-0 bg-white border-2 border-slate-200 rounded-lg p-2 shadow-xl z-[100] min-w-[200px]">
                                                                <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">Assign to Folders</div>
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {FOLDER_COLORS.map((color) => {
                                                                        const isAssigned = assignedFolders.includes(color.id);
                                                                        return (
                                                                            <button
                                                                                key={color.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    toggleFolderAssignment(favorite.id, color.id);
                                                                                }}
                                                                                className={`w-8 h-8 rounded border-2 transition-all ${
                                                                                    isAssigned
                                                                                        ? 'border-black ring-2 ring-sky-300 scale-110'
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
                                                )}

                                                {/* Delete Button (on hover) */}
                                                {hoveredFavoriteId === favorite.id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeOrbFavorite(favorite.id);
                                                        }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}

                                                {/* Assigned Folder Indicators */}
                                                {assignedFolders.length > 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 pb-1">
                                                        {assignedFolders.slice(0, 3).map((folderId) => {
                                                            const color = FOLDER_COLORS.find(c => c.id === folderId);
                                                            if (!color) return null;
                                                            return (
                                                                <div
                                                                    key={folderId}
                                                                    className="w-3 h-3 rounded-full border border-white/50 shadow-sm"
                                                                    style={{ backgroundColor: color.hex }}
                                                                    title={color.name}
                                                                />
                                                            );
                                                        })}
                                                        {assignedFolders.length > 3 && (
                                                            <div className="w-3 h-3 rounded-full bg-slate-400 border border-white/50 shadow-sm flex items-center justify-center">
                                                                <span className="text-[6px] font-bold text-white">+{assignedFolders.length - 3}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                        })}
                                    </div>
                                </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Orb Groups Tab */}
                        {activeTab === 'groups' && (
                            <div className="space-y-2 border-t border-sky-50 pt-3 bg-white/50 p-3 rounded-2xl">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Folder size={14} /> Orb Groups
                                </h3>
                                <div className="space-y-2 px-1">
                                    {(() => {
                                        // Find the selected group leader preset
                                        const groupLeader = selectedGroupLeaderId 
                                            ? orbFavorites.find(fav => fav.id === selectedGroupLeaderId)
                                            : null;
                                        
                                        // Get group members for the selected leader
                                        const groupMembers = groupLeader?.groupMembers || [];
                                        const assignedCount = groupMembers.length;

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Left side: All orb presets - click to select group leader */}
                                                <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Group Leader' : 'Select Group Leader'}
                                                    </label>
                                                    {groupLeader && (
                                                        <div className="mb-3 pb-3 border-b border-slate-200 space-y-2 text-center">
                                                            <div className="text-xs font-bold text-sky-600">
                                                                {assignedCount} {assignedCount === 1 ? 'preset' : 'presets'} assigned
                                                            </div>
                                                            <p className="text-[10px] text-slate-400">
                                                                Click presets on the right to assign them to this group leader
                                                            </p>
                                                        </div>
                                                    )}
                                                    {orbFavorites.length > 0 ? (
                                                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                            {orbFavorites.map((favorite) => {
                                                                const isGroupLeader = selectedGroupLeaderId === favorite.id;
                                                                const isActive = favorite.customOrbImage === customOrbImage;
                                                                
                                                                return (
                                                                    <div
                                                                        key={favorite.id}
                                                                        className="relative group"
                                                                        onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                                    >
                                                                        <button
                                                                            onClick={() => {
                                                                                applyOrbFavorite(favorite);
                                                                                setSelectedGroupLeaderId(favorite.id);
                                                                            }}
                                                                            className={`w-full aspect-square rounded-full border-2 transition-all duration-200 relative overflow-visible bg-sky-50 ${
                                                                                isGroupLeader
                                                                                    ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                                                                                    : isActive
                                                                                    ? 'border-sky-400 ring-1 ring-sky-100'
                                                                                    : 'border-slate-200 hover:border-sky-300 hover:shadow-sm'
                                                                            }`}
                                                                            style={{ width: '64px', height: '64px' }}
                                                                        >
                                                                            {/* Image with spill effect - reuses clipPath from presets tab */}
                                                                            <div 
                                                                                className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center" 
                                                                                style={{ 
                                                                                    clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#orbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                                                    overflow: 'visible'
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={favorite.customOrbImage}
                                                                                    alt={favorite.name}
                                                                                    className="max-w-none transition-all duration-500"
                                                                                    style={{
                                                                                        width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                        height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                        transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * 0.2}px, ${(favorite.orbImageYOffset || 0) * 0.2}px)` : 'none',
                                                                                        objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            
                                                                            {/* Glass Overlay */}
                                                                            <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                                                <div className="absolute inset-0 bg-sky-200/10" />
                                                                            </div>

                                                                            {/* Group Leader Badge */}
                                                                            {isGroupLeader && (
                                                                                <div className="absolute -top-1 -left-1 bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full uppercase z-20">
                                                                                    Leader
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                        
                                                                        {/* Tooltip on hover */}
                                                                        {hoveredFavoriteId === favorite.id && (
                                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                                {favorite.name}
                                                                                {isGroupLeader && ' (Group Leader)'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                                                            <p className="text-[10px] text-slate-400">No orb presets saved yet</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right side: All orb presets - click to assign to group leader */}
                                                <div className="space-y-3 p-4 rounded-xl border-2 border-slate-100 bg-white">
                                                    <label className="text-xs font-bold uppercase text-slate-400">
                                                        {groupLeader ? 'Assign Presets to Group' : 'Select Group Leader'}
                                                    </label>
                                                    {orbFavorites.length > 0 ? (
                                                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[600px] overflow-y-auto pr-2">
                                                            {orbFavorites.map((favorite) => {
                                                                const isGroupLeader = selectedGroupLeaderId === favorite.id;
                                                                const isAssignedToGroup = groupLeader && groupMembers.includes(favorite.id);
                                                                const isActive = favorite.customOrbImage === customOrbImage;
                                                                
                                                                return (
                                                                    <div
                                                                        key={favorite.id}
                                                                        className="relative group"
                                                                        onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                                    >
                                                                        <button
                                                                            onClick={() => {
                                                                                if (groupLeader) {
                                                                                    // Assign/unassign to group (don't assign the leader to itself)
                                                                                    if (!isGroupLeader) {
                                                                                        assignOrbToGroup(favorite.id, groupLeader.id);
                                                                                    }
                                                                                } else {
                                                                                    // Set as group leader
                                                                                    applyOrbFavorite(favorite);
                                                                                    setSelectedGroupLeaderId(favorite.id);
                                                                                }
                                                                            }}
                                                                            className={`w-full aspect-square rounded-full border-2 transition-all duration-200 relative overflow-visible bg-sky-50 ${
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
                                                                            {/* Image with spill effect - reuses clipPath from presets tab */}
                                                                            <div 
                                                                                className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center" 
                                                                                style={{ 
                                                                                    clipPath: favorite.isSpillEnabled && favorite.orbSpill ? `url(#orbClipPath-${favorite.id})` : 'circle(50% at 50% 50%)',
                                                                                    overflow: 'visible'
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={favorite.customOrbImage}
                                                                                    alt={favorite.name}
                                                                                    className="max-w-none transition-all duration-500"
                                                                                    style={{
                                                                                        width: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                        height: favorite.isSpillEnabled ? `calc(100% * ${favorite.orbImageScale || 1})` : '100%',
                                                                                        transform: favorite.isSpillEnabled ? `translate(${(favorite.orbImageXOffset || 0) * 0.2}px, ${(favorite.orbImageYOffset || 0) * 0.2}px)` : 'none',
                                                                                        objectFit: favorite.isSpillEnabled ? 'contain' : 'cover'
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            
                                                                            {/* Glass Overlay */}
                                                                            <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                                                                                <div className="absolute inset-0 bg-sky-200/10" />
                                                                            </div>

                                                                            {/* Group Leader Badge */}
                                                                            {isGroupLeader && (
                                                                                <div className="absolute -top-1 -left-1 bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full uppercase z-20">
                                                                                    Leader
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {/* Assigned Badge */}
                                                                            {isAssignedToGroup && !isGroupLeader && (
                                                                                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full uppercase z-20">
                                                                                    ✓
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                        
                                                                        {/* Tooltip on hover */}
                                                                        {hoveredFavoriteId === favorite.id && (
                                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                                                                {favorite.name}
                                                                                {isGroupLeader && ' (Group Leader)'}
                                                                                {isAssignedToGroup && !isGroupLeader && ' (Assigned)'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                                                            <p className="text-[10px] text-slate-400">No orb presets saved yet</p>
                                                        </div>
                                                    )}
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

import React, { useState, useRef, useEffect } from 'react';
import { Image, Palette, Box, ArrowLeft, Check, Crop, Move, Repeat } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
import { FOLDER_COLORS } from '../utils/folderColors';
import { THEMES } from '../utils/themes';
import { usePlaylistStore } from '../store/playlistStore';
import { Save, ChevronDown } from 'lucide-react';

function ConfigSection({ title, icon: Icon, children }) {
    return (
        <div className="space-y-4 border-t border-sky-50 pt-6 first:border-0 first:pt-0 bg-white/50 p-4 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">{Icon && <Icon size={14} />} {title}</h3>
            <div className="space-y-4 px-1">{children}</div>
        </div>
    );
}

export default function AppPage({ onBack, currentThemeId, onThemeChange, onNavigateToOrb, onNavigateToYou, onNavigateToPage }) {
    const {
        fullscreenBanner, updateFullscreenBanner,
        splitscreenBanner, updateSplitscreenBanner,
        bannerCropModeActive, setBannerCropModeActive,
        setBannerPreviewMode,
        playerBorderPattern, setPlayerBorderPattern,
        bannerPresets, addBannerPreset
    } = useConfigStore();

    const { allPlaylists } = usePlaylistStore();

    const scrollContainerRef = useRef(null);

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

    // Banner Edit Mode State
    const [activeBannerMode, setActiveBannerMode] = useState('fullscreen'); // 'fullscreen' | 'splitscreen'
    const activeBanner = activeBannerMode === 'fullscreen' ? fullscreenBanner : splitscreenBanner;
    const updateActiveBanner = activeBannerMode === 'fullscreen' ? updateFullscreenBanner : updateSplitscreenBanner;

    // Sync preview mode to store for LayoutShell to pick up
    useEffect(() => {
        setBannerPreviewMode(activeBannerMode);
        return () => setBannerPreviewMode(null);
    }, [activeBannerMode, setBannerPreviewMode]);

    // Mock state for app banner (visual presets)
    const [mockAppBanner, setMockAppBanner] = useState('default');

    // Save Preset State
    const [selectedPlaylistIds, setSelectedPlaylistIds] = useState([]);
    const [saveConfig, setSaveConfig] = useState({ fullscreen: true, splitscreen: true });
    const [isPlaylistDropdownOpen, setIsPlaylistDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPlaylistDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePlaylistSelection = (id) => {
        setSelectedPlaylistIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSavePreset = () => {
        // Enforce at least one selection
        if (!saveConfig.fullscreen && !saveConfig.splitscreen) {
            alert('Please select at least one configuration (Fullscreen or Splitscreen) to save.');
            return;
        }

        const newPreset = {
            id: Date.now().toString(),
            name: `Banner ${new Date().toLocaleDateString()}`,
            // Save selected configurations (undefined keys will be ignored/merged by store)
            fullscreenBanner: saveConfig.fullscreen ? fullscreenBanner : undefined,
            splitscreenBanner: saveConfig.splitscreen ? splitscreenBanner : undefined,

            // Legacy fallbacks: Prefer splitscreen for thumbnail (as it has the interesting spill/shape), fallback to fullscreen
            customBannerImage: (saveConfig.splitscreen && splitscreenBanner.image ? splitscreenBanner.image : fullscreenBanner.image),
            bannerVerticalPosition: (saveConfig.splitscreen ? splitscreenBanner.verticalPosition : fullscreenBanner.verticalPosition),
            bannerScale: (saveConfig.splitscreen ? splitscreenBanner.scale : fullscreenBanner.scale),

            playlistIds: selectedPlaylistIds,
            playerControllerXOffset: (saveConfig.fullscreen ? fullscreenBanner.playerControllerXOffset : splitscreenBanner.playerControllerXOffset)
        };

        addBannerPreset(newPreset);
        setSelectedPlaylistIds([]);
        alert('Banner Preset Saved!');
    };


    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateActiveBanner({ image: reader.result });
                setMockAppBanner('uploaded');
            };
            reader.readAsDataURL(file);
        }
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

    // Mock folder counts for prism bar (will be wired up later)
    const folderCounts = {};

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-transparent relative">
                {/* Page Banner */}
                <div className="px-4 pt-8 relative">
                    <PageBanner
                        title="App Configuration"
                        description="Customize app banner, color palette, and player borders"
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
                            onClick={() => onNavigateToPage?.()}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-white/90 hover:bg-white text-slate-800 shadow-md border border-white/20 backdrop-blur-sm"
                            title="Page"
                        >
                            Page
                        </button>
                        <button
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-sky-500 text-white shadow-md border border-white/20"
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
                            {FOLDER_COLORS.map((color, index) => {
                                const isFirst = index === 0;
                                const isLast = index === FOLDER_COLORS.length - 1;
                                const count = folderCounts[color.id] || 0;

                                return (
                                    <button
                                        key={color.id}
                                        className={`h-full flex-1 flex items-center justify-center transition-all opacity-60 hover:opacity-100 ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
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
                <div className="p-6 text-slate-800 space-y-6">
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <ConfigSection title="Color Palette" icon={Palette}>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(THEMES).map(([id, theme]) => (
                                    <button
                                        key={id}
                                        onClick={() => onThemeChange && onThemeChange(id)}
                                        className={`p-3 rounded-xl text-xs font-bold uppercase transition-all border-2 text-left flex flex-col gap-2 ${currentThemeId === id
                                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md ring-2 ring-sky-200'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${theme.bg.replace('from-', 'from-').replace('via-', 'via-').replace('to-', 'to-')} shadow-inner`}></div>
                                        <span className="px-1">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </ConfigSection>

                        <ConfigSection title="App Banner" icon={Image}>
                            {/* Mode Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                <button
                                    onClick={() => setActiveBannerMode('fullscreen')}
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeBannerMode === 'fullscreen'
                                        ? 'bg-white text-sky-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Fullscreen Area
                                </button>
                                <button
                                    onClick={() => setActiveBannerMode('splitscreen')}
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeBannerMode === 'splitscreen'
                                        ? 'bg-white text-sky-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Splitscreen Area
                                </button>
                            </div>

                            {/* Current Banner Display */}
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Current App Banner ({activeBannerMode})</label>
                                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                                </div>
                                <div className="w-full h-32 rounded-xl overflow-hidden shadow-sm border-2 border-slate-100 relative group bg-slate-50">
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            backgroundImage: `url(${activeBanner.image || "/banner.PNG"})`,
                                            backgroundSize: `${activeBanner.scale ?? 100}% auto`,
                                            backgroundPosition: `0% ${activeBanner.verticalPosition ?? 0}%`,
                                            backgroundRepeat: 'repeat-x',
                                            ...(activeBanner.maskPath?.length > 2 ? {
                                                maskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
                                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
                                                        <polygon points='${activeBanner.maskPath.map(p => `${p.x},${p.y}`).join(' ')}' fill='black' />
                                                    </svg>
                                                `.replace(/\n/g, '').trim())}")`,
                                                WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
                                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>
                                                        <polygon points='${activeBanner.maskPath.map(p => `${p.x},${p.y}`).join(' ')}' fill='black' />
                                                    </svg>
                                                `.replace(/\n/g, '').trim())}")`,
                                                maskSize: `${activeBanner.scale ?? 100}% auto`,
                                                WebkitMaskSize: `${activeBanner.scale ?? 100}% auto`,
                                                maskPosition: `0% ${activeBanner.verticalPosition ?? 0}%`,
                                                WebkitMaskPosition: `0% ${activeBanner.verticalPosition ?? 0}%`,
                                                maskRepeat: 'repeat-x',
                                                WebkitMaskRepeat: 'repeat-x'
                                            } : {})
                                        }}
                                    />
                                    {!activeBanner.image && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 pointer-events-none"></div>
                                    )}
                                    <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow-md pointer-events-none">
                                        {activeBanner.image ? "Custom Upload" : "/public/banner.PNG"}
                                    </div>
                                    {activeBanner.image && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                            <button
                                                onClick={() => setBannerCropModeActive(true)}
                                                className="px-4 py-2 bg-sky-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-sky-600 transition-colors shadow-lg flex items-center gap-2"
                                            >
                                                <Crop size={14} />
                                                Crop Shape
                                            </button>
                                            <button
                                                onClick={() => {
                                                    updateActiveBanner({ image: null, maskPath: [] });
                                                    setMockAppBanner('default');
                                                }}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scale Slider */}
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Image Scale</label>
                                    <span className="text-[10px] font-bold text-slate-500">{activeBanner.scale ?? 100}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">-200%</span>
                                    <input
                                        type="range"
                                        min="-200"
                                        max="200"
                                        value={activeBanner.scale ?? 100}
                                        onChange={(e) => updateActiveBanner({ scale: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">200%</span>
                                </div>
                            </div>

                            {/* Animation Toggle */}
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <label className="text-xs font-bold uppercase text-slate-400">Animate Scroll</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={activeBanner.scrollEnabled}
                                        onChange={(e) => updateActiveBanner({ scrollEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                                </label>
                            </div>

                            {/* Clip Left Slider */}
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Clip From Left</label>
                                    <span className="text-[10px] font-bold text-slate-500">{activeBanner.clipLeft ?? 0}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">0%</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={activeBanner.clipLeft ?? 0}
                                        onChange={(e) => updateActiveBanner({ clipLeft: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">100%</span>
                                </div>
                                <p className="text-[10px] text-slate-400 px-1">
                                    Hides the left portion of the banner, revealing the theme color underneath.
                                </p>
                            </div>

                            {/* Horizontal Offset Slider */}
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Horizontal Offset</label>
                                    <span className="text-[10px] font-bold text-slate-500">{activeBanner.horizontalOffset ?? 0}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">-200%</span>
                                    <input
                                        type="range"
                                        min="-200"
                                        max="200"
                                        value={activeBanner.horizontalOffset ?? 0}
                                        onChange={(e) => updateActiveBanner({ horizontalOffset: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">+200%</span>
                                </div>
                                <p className="text-[10px] text-slate-400 px-1">
                                    Shifts the entire tiled pattern left or right to fine-tune positioning.
                                </p>
                            </div>

                            {/* Vertical Position Slider */}
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Vertical Alignment</label>
                                    <span className="text-[10px] font-bold text-slate-500">{activeBanner.verticalPosition}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">-200%</span>
                                    <input
                                        type="range"
                                        min="-200"
                                        max="200"
                                        value={activeBanner.verticalPosition ?? 0}
                                        onChange={(e) => updateActiveBanner({ verticalPosition: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">+200%</span>
                                </div>
                            </div>

                            {/* Spill Height Slider */}
                            <div className="space-y-3 pt-2 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Spill Over</label>
                                    <span className="text-[10px] font-bold text-slate-500">{activeBanner.spillHeight ?? 0}px</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">None</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="500"
                                        step="10"
                                        value={activeBanner.spillHeight ?? 0}
                                        onChange={(e) => updateActiveBanner({ spillHeight: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">Max</span>
                                </div>
                                <p className="text-[10px] text-slate-400 px-1">
                                    Allows the banner image to "spill" out of the header area and overlay the content below.
                                </p>
                            </div>

                            {/* Presets */}
                            <div className="space-y-3 pt-2">
                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Presets</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['Default', 'Cosmic', 'Nature', 'Industrial'].map((name) => {
                                        const id = name.toLowerCase();
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => {
                                                    setMockAppBanner(id);
                                                    if (id === 'default') {
                                                        updateActiveBanner({ image: null });
                                                    }
                                                    // Future: Set other presets if we have assets
                                                }}
                                                className={`p-2 rounded-xl text-xs font-bold uppercase transition-all border-2 flex flex-col gap-2 items-center ${mockAppBanner === id
                                                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                                                    : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600'
                                                    }`}
                                            >
                                                <div className="w-full h-16 bg-slate-100 rounded-lg overflow-hidden relative">
                                                    {/* Representational placeholder visuals */}
                                                    {id === 'default' && <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-600 opacity-50" />}
                                                    {id === 'cosmic' && <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 via-indigo-900 to-black opacity-80" />}
                                                    {id === 'nature' && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-800 opacity-60" />}
                                                    {id === 'industrial' && <div className="absolute inset-0 bg-gradient-to-bl from-slate-600 to-zinc-900 opacity-70" />}
                                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50">IMG</span>
                                                </div>
                                                <span>{name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Upload Action */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="w-full py-3 bg-white border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold uppercase text-slate-500 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-600 hover:shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer relative overflow-hidden">
                                    <div className="p-1 bg-slate-100 rounded-md group-hover:bg-white transition-colors">
                                        <Image size={14} />
                                    </div>
                                    Upload Custom Banner
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerUpload}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-[10px] text-slate-400 text-center mt-2">
                                    Supports PNG, JPG, WEBP. Recommended size: 1920x200px.
                                </p>
                            </div>



                            <div className="pt-4 border-t border-slate-100">
                                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Save as Preset</label>

                                {/* Config Selection Checkboxes */}
                                <div className="flex gap-4 mb-3 px-1">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${saveConfig.fullscreen ? 'bg-sky-500 border-sky-500' : 'border-slate-300 bg-white group-hover:border-sky-300'}`}>
                                            {saveConfig.fullscreen && <Check size={12} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={saveConfig.fullscreen}
                                            onChange={(e) => setSaveConfig(prev => ({ ...prev, fullscreen: e.target.checked }))}
                                        />
                                        <span className={`text-xs font-bold ${saveConfig.fullscreen ? 'text-slate-700' : 'text-slate-400'}`}>Fullscreen</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${saveConfig.splitscreen ? 'bg-sky-500 border-sky-500' : 'border-slate-300 bg-white group-hover:border-sky-300'}`}>
                                            {saveConfig.splitscreen && <Check size={12} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={saveConfig.splitscreen}
                                            onChange={(e) => setSaveConfig(prev => ({ ...prev, splitscreen: e.target.checked }))}
                                        />
                                        <span className={`text-xs font-bold ${saveConfig.splitscreen ? 'text-slate-700' : 'text-slate-400'}`}>Splitscreen</span>
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    {/* Playlist Selector Dropdown */}
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsPlaylistDropdownOpen(!isPlaylistDropdownOpen)}
                                            className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2.5 rounded-lg text-xs font-medium transition-all"
                                        >
                                            <span className="truncate">
                                                {selectedPlaylistIds.length === 0
                                                    ? "Assign to Playlists (Optional)"
                                                    : `${selectedPlaylistIds.length} Playlists Selected`}
                                            </span>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isPlaylistDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isPlaylistDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto p-1 text-xs">
                                                {allPlaylists.map(playlist => {
                                                    const isSelected = selectedPlaylistIds.includes(playlist.id);
                                                    return (
                                                        <button
                                                            key={playlist.id}
                                                            onClick={() => togglePlaylistSelection(playlist.id)}
                                                            className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors ${isSelected
                                                                ? 'bg-sky-50 text-sky-600'
                                                                : 'hover:bg-slate-50 text-slate-600'
                                                                }`}
                                                        >
                                                            <span className="truncate">{playlist.name}</span>
                                                            {isSelected && <Check size={12} className="text-sky-500" />}
                                                        </button>
                                                    );
                                                })}
                                                {allPlaylists.length === 0 && (
                                                    <div className="px-3 py-4 text-center text-slate-400 italic">
                                                        No playlists found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSavePreset}
                                        className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold uppercase tracking-wide rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Save size={14} />
                                        Save Preset
                                    </button>
                                </div>
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Player Controller" icon={Move}>
                            <div className="space-y-3 pt-2 pb-4">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Horizontal Position (X-Offset)</label>
                                    <span className="text-[10px] font-bold text-slate-500">{activeBanner.playerControllerXOffset ?? 0}px</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400">Left</span>
                                    <input
                                        type="range"
                                        min="-500"
                                        max="500"
                                        value={activeBanner.playerControllerXOffset ?? 0}
                                        onChange={(e) => updateActiveBanner({ playerControllerXOffset: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">Right</span>
                                </div>
                                <p className="text-[10px] text-slate-400 px-1">
                                    Adjusts the horizontal position of the entire player controller.
                                </p>
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Player Borders" icon={Box}>
                            <div className="grid grid-cols-2 gap-3">
                                {['Diagonal', 'Dots', 'Mesh', 'Solid'].map((name) => {
                                    const id = name === 'Mesh' ? 'waves' : name.toLowerCase();
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setPlayerBorderPattern(id)}
                                            className={`p-3 rounded-xl text-xs font-bold uppercase transition-all border-2 text-left flex items-center justify-between ${playerBorderPattern === id
                                                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-sky-200 hover:text-sky-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#052F4A] relative overflow-hidden shadow-sm border border-slate-200">
                                                    <div className={`absolute inset-0 pattern-${id}`}></div>
                                                </div>
                                                <span>{name}</span>
                                            </div>
                                            {playerBorderPattern === id && <Check size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </ConfigSection>
                    </div>
                </div>
            </div>
        </div>





    );
}

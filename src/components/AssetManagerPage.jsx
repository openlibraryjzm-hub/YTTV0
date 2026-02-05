import React, { useState } from 'react';
import { ChevronLeft, Sliders, Box, Layers, Grid, Palette, Layout, FileImage, Folder, Plus, Smile, Check } from 'lucide-react';
import { useLayoutStore } from '../store/layoutStore';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';

const AssetManagerPage = () => {
    // Global State
    const {
        layer2Folders,
        orbFavorites,
        customPageBannerImage2,
        customOrbImage,
        applyLayer2Image,
        setPageBannerBgColor,
        applyOrbFavorite
    } = useConfigStore();
    // Local state for UI toggles (visual only for now)
    const [activeTab, setActiveTab] = useState('orb'); // 'orb' | 'page' | 'app' | 'theme'
    const [browserMode, setBrowserMode] = useState('folder'); // 'folder' | 'file'
    const [selectedQuadrant, setSelectedQuadrant] = useState(null);

    // Mock data for carousel (not used but kept for now)
    const folders = [
        { id: 1, name: 'Cyberpunk', count: 12, color: 'from-pink-500 to-rose-500' },
        { id: 2, name: 'Nature', count: 8, color: 'from-emerald-400 to-green-600' },
        { id: 3, name: 'Abstract', count: 24, color: 'from-blue-400 to-indigo-600' },
        { id: 4, name: 'Minimal', count: 5, color: 'from-slate-300 to-slate-500' },
        { id: 5, name: 'Neon', count: 15, color: 'from-purple-400 to-fuchsia-600' },
    ];

    const files = [
        { id: 1, name: 'Banner_01.png', type: 'image' },
        { id: 2, name: 'Banner_02.png', type: 'image' },
        { id: 3, name: 'Banner_03.png', type: 'image' },
        { id: 4, name: 'Banner_04.png', type: 'image' },
    ];

    // Colors for palette
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
    ];

    return (
        <div className="h-full w-full bg-[#e0f2fe] flex flex-col p-4 gap-4 overflow-hidden">

            {/* Header: 4-Tab Navigation (Centered at top) */}
            <div className="flex items-center justify-center px-1">
                <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                    {[
                        { id: 'orb', label: 'Orb', icon: Smile },
                        { id: 'page', label: 'Page', icon: Layout },
                        { id: 'app', label: 'App', icon: Box },
                        { id: 'theme', label: 'Theme', icon: Palette }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white text-slate-800 shadow-sm scale-105 ring-1 ring-black/5'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-sky-500' : 'opacity-70'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>



            {/* --- ZONE 1: PAGE BANNER (Visual Only) --- */}
            <div className="w-full">
                <PageBanner
                    title=""
                    description=""
                />
            </div>

            {/* --- ZONE 2: CAROUSEL (Content Navigation) --- */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 relative group/carousel">
                {/* Sub-Navigation: Folder / File (Visual Only for now) */}
                <div className="flex items-center px-2 gap-4 border-b border-white/40 mx-2">
                    <button
                        onClick={() => setBrowserMode('folder')}
                        className={`flex items-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${browserMode === 'folder'
                            ? 'border-sky-500 text-sky-700'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Folder size={14} className={browserMode === 'folder' ? 'fill-sky-500/20' : ''} />
                        Folder
                    </button>
                    <button
                        className="flex items-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-300 cursor-not-allowed"
                        title="File view coming soon"
                    >
                        <FileImage size={14} />
                        File
                    </button>
                </div>

                {/* SVG Definitions for Orb Clip Paths */}
                {orbFavorites.length > 0 && (
                    <svg width="0" height="0" className="absolute pointer-events-none">
                        <defs>
                            {orbFavorites.map((favorite) => (
                                <clipPath key={favorite.id} id={`assetOrbClipPath-${favorite.id}`} clipPathUnits="objectBoundingBox">
                                    <circle cx="0.5" cy="0.5" r="0.5" />
                                    {/* TL */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.tl && (
                                        favorite.orbAdvancedMasks?.tl
                                            ? <rect x={favorite.orbMaskRects?.tl.x / 100} y={favorite.orbMaskRects?.tl.y / 100} width={favorite.orbMaskRects?.tl.w / 100} height={favorite.orbMaskRects?.tl.h / 100} />
                                            : <rect x="-50" y="-50" width="50.5" height="50.5" />
                                    )}
                                    {/* TR */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.tr && (
                                        favorite.orbAdvancedMasks?.tr
                                            ? <rect x={favorite.orbMaskRects?.tr.x / 100} y={favorite.orbMaskRects?.tr.y / 100} width={favorite.orbMaskRects?.tr.w / 100} height={favorite.orbMaskRects?.tr.h / 100} />
                                            : <rect x="0.5" y="-50" width="50.5" height="50.5" />
                                    )}
                                    {/* BL */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.bl && (
                                        favorite.orbAdvancedMasks?.bl
                                            ? <rect x={favorite.orbMaskRects?.bl.x / 100} y={favorite.orbMaskRects?.bl.y / 100} width={favorite.orbMaskRects?.bl.w / 100} height={favorite.orbMaskRects?.bl.h / 100} />
                                            : <rect x="-50" y="0.5" width="50.5" height="50.5" />
                                    )}
                                    {/* BR */}
                                    {favorite.isSpillEnabled && favorite.orbSpill?.br && (
                                        favorite.orbAdvancedMasks?.br
                                            ? <rect x={favorite.orbMaskRects?.br.x / 100} y={favorite.orbMaskRects?.br.y / 100} width={favorite.orbMaskRects?.br.w / 100} height={favorite.orbMaskRects?.br.h / 100} />
                                            : <rect x="0.5" y="0.5" width="50.5" height="50.5" />
                                    )}
                                </clipPath>
                            ))}
                        </defs>
                    </svg>
                )}

                {/* Scrollable Viewport */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar px-1">
                    <div className="flex gap-4 h-full pb-2 w-max">
                        {/* --- PAGE TAB: FOLDERS / LAYERS --- */}
                        {activeTab === 'page' && (
                            (() => {
                                // Flatten images from all folders
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
                                        <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                            <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                                No page banners found.<br />Add images in Page Settings.
                                            </div>
                                        </div>
                                    );
                                }

                                return allImages.map((img) => {
                                    const isActive = customPageBannerImage2 === img.image;

                                    return (
                                        <div
                                            key={`${img.folderId}-${img.id}`}
                                            className="relative group flex flex-col items-center"
                                            style={{ width: '300px', flexShrink: 0 }}
                                        >
                                            {/* Image Thumbnail */}
                                            <div className="relative w-full aspect-video mx-auto overflow-hidden rounded-xl border-4 transition-all duration-300 bg-slate-100 shadow-md group-hover:shadow-xl">
                                                <button
                                                    onClick={() => {
                                                        applyLayer2Image(img);
                                                        if (img.bgColor) setPageBannerBgColor(img.bgColor);
                                                    }}
                                                    className={`w-full h-full transition-all duration-200 relative overflow-hidden ${isActive
                                                        ? 'border-purple-500 ring-4 ring-purple-200 scale-[1.02]'
                                                        : 'border-slate-200 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <img
                                                        src={img.image}
                                                        alt="Layer 2"
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Glass Overlay on Hover */}
                                                    <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors pointer-events-none" />

                                                    {/* Active Indicator */}
                                                    {isActive && (
                                                        <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                                                            <Check className="text-white drop-shadow-xl" size={32} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Quick Info */}
                                            <div className="mt-2 text-center">
                                                <p className="text-xs font-bold text-slate-600 truncate px-2">
                                                    {img.folderName}
                                                </p>
                                                {img.bgColor && (
                                                    <div className="flex items-center justify-center gap-1 mt-0.5">
                                                        <div className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: img.bgColor }} />
                                                        <span className="text-[10px] text-slate-400 font-mono uppercase">{img.bgColor}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        )}

                        {/* --- ORB TAB: PRESETS --- */}
                        {activeTab === 'orb' && (
                            (() => {
                                if (orbFavorites.length === 0) {
                                    return (
                                        <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                            <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                                No orb presets found.<br />Save presets in Orb Settings.
                                            </div>
                                        </div>
                                    );
                                }

                                return orbFavorites.map((item) => {
                                    const isCurrent = customOrbImage === item.customOrbImage; // Simple check

                                    return (
                                        <div key={item.id} className="relative group flex flex-col items-center gap-2" style={{ width: '120px', flexShrink: 0 }}>
                                            <button
                                                onClick={() => applyOrbFavorite(item)}
                                                className={`w-24 h-24 relative rounded-full border-4 transition-all duration-300 ${isCurrent
                                                    ? 'border-sky-500 ring-4 ring-sky-200 shadow-xl scale-110 z-10'
                                                    : 'border-white hover:border-sky-300 shadow-lg hover:shadow-xl hover:scale-105'
                                                    }`}
                                                title={item.name}
                                            >
                                                {/* Image Layer with Spill Effect */}
                                                <div
                                                    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
                                                    style={{
                                                        clipPath: item.isSpillEnabled && item.orbSpill ? `url(#assetOrbClipPath-${item.id})` : 'circle(50% at 50% 50%)',
                                                    }}
                                                >
                                                    <img
                                                        src={item.customOrbImage}
                                                        alt=""
                                                        className="max-w-none transition-all duration-300"
                                                        style={{
                                                            width: item.isSpillEnabled ? `calc(100% * ${item.orbImageScale || 1})` : '100%',
                                                            height: item.isSpillEnabled ? `calc(100% * ${item.orbImageScale || 1})` : '100%',
                                                            transform: item.isSpillEnabled ? `translate(${(item.orbImageXOffset || 0) * 0.3}px, ${(item.orbImageYOffset || 0) * 0.3}px)` : 'none',
                                                            objectFit: item.isSpillEnabled ? 'contain' : 'cover'
                                                        }}
                                                    />
                                                </div>

                                                {/* Active Check */}
                                                {isCurrent && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full z-20 backdrop-blur-[1px]">
                                                        <Check size={28} className="text-white drop-shadow-xl" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>

                                            {/* Name Label */}
                                            <div className="text-center px-1">
                                                <p className={`text-xs font-bold truncate transition-colors ${isCurrent ? 'text-sky-600' : 'text-slate-600'}`}>
                                                    {item.name || 'Untitled Orb'}
                                                </p>
                                                <p className="text-[9px] text-slate-400">
                                                    {item.groupMembers?.length > 0 ? `${item.groupMembers.length + 1} variants` : 'Preset'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        )}

                        {/* --- APP TAB (Placeholder) --- */}
                        {activeTab === 'app' && (
                            <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                    App assets coming soon.
                                </div>
                            </div>
                        )}

                        {/* --- THEME TAB (Placeholder) --- */}
                        {activeTab === 'theme' && (
                            <div className="w-full h-full flex items-center justify-center min-w-[300px]">
                                <div className="text-center text-slate-400 italic text-sm bg-white/30 px-6 py-4 rounded-xl border border-white/40">
                                    Theme configuration coming soon.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- ZONE 3: CONFIGURATION (Fine-Tuning) --- */}
            <div className="h-48 shrink-0 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-4 flex gap-4">

                {/* Column 1: Spatial Controls (Quadrants) */}
                <div className="w-40 bg-slate-100/80 rounded-xl p-3 flex flex-col gap-3 border border-slate-200/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</span>
                        <div className="w-8 h-4 bg-sky-500 rounded-full relative cursor-pointer">
                            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-2">
                        {['TL', 'TR', 'BL', 'BR'].map((q, i) => (
                            <button
                                key={q}
                                onClick={() => setSelectedQuadrant(q)}
                                className={`rounded-lg border transition-all ${selectedQuadrant === q ? 'bg-sky-500 border-sky-600 text-white' : 'bg-white border-slate-200 hover:border-sky-300 text-slate-400'}`}
                            >
                            </button>
                        ))}
                    </div>

                    <button className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold rounded-lg transition-colors">
                        ADVANCED
                    </button>
                </div>

                {/* Column 2: Properties & Adjustments */}
                <div className="flex-1 flex flex-col gap-3">

                    {/* Module A: Properties Header */}
                    <div className="flex items-start gap-4 h-1/2">
                        {/* Color Palette */}
                        <div className="flex-1 grid grid-cols-8 gap-1.5 content-start">
                            {colors.map((c, i) => (
                                <button key={i} className={`w-5 h-5 rounded-full ${c} hover:scale-110 hover:shadow-md transition-all border border-black/5 ring-1 ring-transparent hover:ring-white/50`} />
                            ))}
                        </div>

                        {/* Theme Selector */}
                        <div className="w-32 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Theme</label>
                            <select className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                                <option>Midnight</option>
                                <option>Daylight</option>
                                <option>Sunset</option>
                            </select>
                        </div>

                        {/* Context Selector */}
                        <div className="w-32 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Context</label>
                            <select className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                                <option>Global</option>
                                <option>Local</option>
                            </select>
                        </div>
                    </div>

                    {/* Module B: Transformation Sliders */}
                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex flex-col justify-center">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-600 flex items-center gap-1"><Box size={10} /> Scale</span>
                                <span className="font-mono text-slate-500">1.0x</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-600 flex items-center gap-1"><Layers size={10} /> Opacity</span>
                                <span className="font-mono text-slate-500">100%</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-600 flex items-center gap-1">X-Offset</span>
                                <span className="font-mono text-slate-500">0px</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-600 flex items-center gap-1">Y-Offset</span>
                                <span className="font-mono text-slate-500">0px</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AssetManagerPage;

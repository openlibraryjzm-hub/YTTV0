import React, { useState, useRef, useEffect } from 'react';
import { Smile, Plus, ArrowLeft, Trash2, Check } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
import { FOLDER_COLORS } from '../utils/folderColors';

function ConfigSection({ title, icon: Icon, children }) {
    return (
        <div className="space-y-4 border-t border-sky-50 pt-6 first:border-0 first:pt-0 bg-white/50 p-4 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">{Icon && <Icon size={14} />} {title}</h3>
            <div className="space-y-4 px-1">{children}</div>
        </div>
    );
}

export default function OrbPage({ onBack }) {
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
        applyOrbFavorite
    } = useConfigStore();

    const [hoveredFavoriteId, setHoveredFavoriteId] = useState(null);


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
    const { userName, userAvatar } = useConfigStore();

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

    // Mock folder counts for prism bar (will be wired up later)
    const folderCounts = {};

    return (
        <div className="w-full h-full flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-transparent relative">
                {/* Page Banner */}
                <div className="px-4 pt-8">
                    <PageBanner
                        title="Orb Configuration"
                        description="Customize your central orb with images, spill effects, and presets"
                        color={null}
                        isEditable={false}
                        author={userName}
                        avatar={userAvatar}
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
                        {/* Left Side: 4 Buttons + Colored Prism */}
                        <div className="flex items-center gap-0 overflow-x-auto no-scrollbar mask-gradient-right flex-1 min-w-0 pr-0">
                            {/* 4 Navigation Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 pr-3">
                                <button
                                    onClick={onBack}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-sky-500 text-white shadow-sm border border-white/5"
                                    title="Orb"
                                >
                                    Orb
                                </button>
                                <button
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-white/5"
                                    title="You"
                                >
                                    You
                                </button>
                                <button
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-white/5"
                                    title="Page"
                                >
                                    Page
                                </button>
                                <button
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-white/5"
                                    title="App"
                                >
                                    App
                                </button>
                            </div>

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
                </div>

                {/* Content */}
                <div className="p-6 text-slate-800 space-y-6">
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Orb Configuration Section - At the top as requested */}
                        <ConfigSection title="Orb Configuration" icon={Smile}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 ml-1">Custom Orb Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-full border-4 border-slate-100 overflow-hidden flex items-center justify-center bg-slate-50 relative group">
                                            {customOrbImage ? (
                                                <img src={customOrbImage} alt="Orb" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-slate-300 text-xs text-center p-2">No Image</div>
                                            )}
                                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                                                <span className="text-xs font-bold">Change</span>
                                                <input type="file" onChange={handleOrbImageUpload} accept="image/*" className="hidden" />
                                            </label>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Upload a custom image for the central orb. You can enable "Spill" to let the image break out of the circle in specific corners.
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setIsSpillEnabled(!isSpillEnabled)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border-2 ${isSpillEnabled
                                                        ? 'bg-sky-500 border-sky-500 text-white shadow-md'
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                                >
                                                    {isSpillEnabled ? 'Spill Enabled' : 'Spill Disabled'}
                                                </button>
                                                {customOrbImage && (
                                                    <button
                                                        onClick={() => setCustomOrbImage(null)}
                                                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 transition-colors"
                                                    >
                                                        Remove Image
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Scale Slider */}
                                {customOrbImage && isSpillEnabled && (
                                    <div className="space-y-2 border-t border-slate-100 pt-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold uppercase text-slate-400">Image Scale</label>
                                            <span className="text-xs font-mono font-bold text-sky-600">{orbImageScale.toFixed(2)}x</span>
                                        </div>
                                        <div className="flex items-center gap-3">
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
                                )}

                                {/* Image Position Offset Sliders */}
                                {customOrbImage && isSpillEnabled && (
                                    <div className="space-y-4 border-t border-slate-100 pt-4">
                                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Image Position</label>
                                        
                                        {/* X Offset */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-bold text-slate-500">Horizontal (X)</label>
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
                                            </div>
                                            <div className="flex items-center gap-3">
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

                                        {/* Y Offset */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-bold text-slate-500">Vertical (Y)</label>
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
                                            </div>
                                            <div className="flex items-center gap-3">
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
                                )}

                                {customOrbImage && isSpillEnabled && (
                                    <div className="space-y-2 border-t border-slate-100 pt-4">
                                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Spill Areas</label>
                                        <div className="flex gap-8">
                                            {/* Interactive Visualizer */}
                                            <div className="relative w-48 h-48 border-2 border-slate-100 rounded-xl overflow-hidden bg-slate-50 mx-auto select-none">
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

                                            <div className="flex-1 text-xs text-slate-500 space-y-2 py-2">
                                                <p>Click the quadrants to toggle spill for that area.</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    <li><span className="font-bold text-sky-600">Selected:</span> Image overflows the circle in this corner.</li>
                                                    <li><span className="font-bold text-slate-400">Unselected:</span> Image is clipped to the circle in this corner.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Save Current Configuration Button */}
                                <div className="border-t border-slate-100 pt-4 mt-4">
                                    <button
                                        onClick={handleSaveCurrentOrbAsFavorite}
                                        disabled={!customOrbImage}
                                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${customOrbImage
                                            ? 'bg-sky-500 border-sky-500 text-white hover:bg-sky-600 hover:border-sky-600 shadow-md hover:shadow-lg'
                                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Plus size={16} />
                                        Save Current Configuration as Preset
                                    </button>
                                    {!customOrbImage && (
                                        <p className="text-[10px] text-slate-400 text-center mt-2">
                                            Upload an orb image first to save it as a preset
                                        </p>
                                    )}
                                </div>
                            </div>
                        </ConfigSection>

                        {/* Saved Presets - Vertical Grid with 4 Columns */}
                        {orbFavorites.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Smile size={14} /> Saved Presets
                                </h3>
                                
                                {/* SVG ClipPath Definitions for Each Preset */}
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

                                <div className="grid grid-cols-4 gap-4">
                                        {orbFavorites.map((favorite) => (
                                            <div
                                                key={favorite.id}
                                                className="relative group flex flex-col items-center"
                                                onMouseEnter={() => setHoveredFavoriteId(favorite.id)}
                                                onMouseLeave={() => setHoveredFavoriteId(null)}
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
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

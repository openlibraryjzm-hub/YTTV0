import React, { useState, useRef, useEffect } from 'react';
import { Image, Palette, Box, ArrowLeft, Check } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
import { FOLDER_COLORS } from '../utils/folderColors';
import { THEMES } from '../utils/themes';

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
        customBannerImage, setCustomBannerImage,
        playerBorderPattern, setPlayerBorderPattern
    } = useConfigStore();

    const scrollContainerRef = useRef(null);

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

    // Mock state for app banner
    const [mockAppBanner, setMockAppBanner] = useState('default');

    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomBannerImage(reader.result);
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
                            {/* Current Banner Display */}
                            <div className="space-y-3 pb-4 border-b border-slate-100">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold uppercase text-slate-400">Current App Banner</label>
                                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                                </div>
                                <div className="w-full h-32 rounded-xl overflow-hidden shadow-sm border-2 border-slate-100 relative group bg-slate-50">
                                    <img
                                        src={customBannerImage || "/banner.PNG"}
                                        alt="Current Banner"
                                        className="w-full h-full object-cover"
                                    />
                                    {!customBannerImage && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                    )}
                                    <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow-md">
                                        {customBannerImage ? "Custom Upload" : "/public/banner.PNG"}
                                    </div>
                                    {customBannerImage && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setCustomBannerImage(null);
                                                    setMockAppBanner('default');
                                                }}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                Remove Custom Banner
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                                                        setCustomBannerImage(null);
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

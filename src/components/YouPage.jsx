import React, { useState, useRef, useEffect } from 'react';
import { User, Smile, ArrowLeft, ExternalLink } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import PageBanner from './PageBanner';
import { FOLDER_COLORS } from '../utils/folderColors';
import { openUrl } from '@tauri-apps/plugin-opener';

const AVATARS = [
    '( ͡° ͜ʖ ͡°)',
    '( ͠° ͟ʖ ͡°)',
    '( ͡~ ͜ʖ ͡°)',
    '( . •́ _ʖ •̀ .)',
    '( ಠ ͜ʖ ಠ)',
    '( ͡o ͜ʖ ͡o)',
    '( ͡◉ ͜ʖ ͡◉)',
    '( ͡☉ ͜ʖ ͡☉)',
    '( ͡⚆ ͜ʖ ͡⚆)',
    '( ͡◎ ͜ʖ ͡◎)',
    '( ✧≖ ͜ʖ≖)',
    '( ง ͠° ͟ل͜ ͡°) ง',
    '( ͡° ͜V ͡°)',
    '¯\\_(ツ)_/¯',
    '(>_>)',
    '(^_^)',
    '(¬_¬)',
    `
   /\\
  /  \\
  |  |
  |  |
 / == \\
 |/**\\|
`,
    `
 .--.
|o_o |
|:_/ |
//   \\ \\
(|     | )
/'\\_   _/\`\\
\\___)=(___/
`,
    'custom'
];

function ConfigSection({ title, icon: Icon, children }) {
    return (
        <div className="space-y-4 border-t border-sky-50 pt-6 first:border-0 first:pt-0 bg-white/50 p-4 rounded-2xl">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">{Icon && <Icon size={14} />} {title}</h3>
            <div className="space-y-4 px-1">{children}</div>
        </div>
    );
}

export default function YouPage({ onBack, onNavigateToOrb, onNavigateToPage, onNavigateToApp }) {
    const {
        userName, setUserName, userAvatar, setUserAvatar
    } = useConfigStore();

    const scrollContainerRef = useRef(null);
    // Remove unused userName, userAvatar since we're not showing ASCII art

    // Sticky toolbar state
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef(null);

    // Local state for custom avatar
    const [customAvatar, setCustomAvatar] = useState('');

    const handleAvatarSelect = (avatar) => {
        if (avatar === 'custom') {
            setUserAvatar(customAvatar || 'Custom');
        } else {
            setUserAvatar(avatar.trim());
        }
    };

    const isMultiLine = (text) => text.includes('\n');

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
                        title="Signature & Profile"
                        description="Customize your pseudonym and ASCII signature"
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
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider bg-sky-500 text-white shadow-md border border-white/20"
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
                        <ConfigSection title="Pseudonym" icon={User}>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all placeholder:text-slate-300"
                                    placeholder="Enter your name..."
                                />
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Signature" icon={Smile}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {AVATARS.map((avatar, index) => {
                                    const isCustom = avatar === 'custom';
                                    const isSelected = isCustom ? !AVATARS.slice(0, -1).includes(userAvatar) : userAvatar === avatar.trim();
                                    const multiline = isMultiLine(avatar);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAvatarSelect(avatar)}
                                            className={`p-4 rounded-xl text-sm font-medium transition-all border-2 flex items-center justify-center min-h-[64px] ${isSelected
                                                ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md ring-2 ring-sky-200'
                                                : 'border-slate-100 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-600 hover:shadow-sm'
                                                }`}
                                        >
                                            {isCustom ? (
                                                <span className="italic opacity-50">Custom...</span>
                                            ) : (
                                                <span className={`font-mono text-xs ${multiline ? 'text-[4px] leading-none whitespace-pre text-left' : 'text-lg'}`}>{avatar.trim()}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Avatar Input - Shown if Custom is selected or user types in it */}
                            <div className={`mt-4 space-y-2 transition-all duration-300 ${!AVATARS.slice(0, -1).map(a => a.trim()).includes(userAvatar) ? 'opacity-100 translate-y-0' : 'opacity-50 grayscale'}`}>
                                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Custom ASCII Avatar (Multi-line supported)</label>
                                <textarea
                                    value={AVATARS.slice(0, -1).map(a => a.trim()).includes(userAvatar) ? customAvatar : userAvatar}
                                    onChange={(e) => {
                                        setCustomAvatar(e.target.value);
                                        setUserAvatar(e.target.value);
                                    }}
                                    className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-mono text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all min-h-[120px] text-xs leading-tight whitespace-pre"
                                    placeholder="Paste your ASCII art here..."
                                />
                            </div>
                        </ConfigSection>

                        {/* Preview */}
                        <div className="mt-8 p-6 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl shadow-lg text-white">
                            <h3 className="text-xs font-black uppercase tracking-widest text-sky-100 mb-4 opacity-70 text-center">Banner Preview</h3>
                            <div className="flex items-center gap-6 justify-center">
                                {/* Auto-detect Layout wrapped in flexible container */}
                                {isMultiLine(userAvatar) ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-2xl font-black tracking-tight drop-shadow-md opacity-90">
                                            <span>{userName}</span>
                                        </div>
                                        <pre className="font-mono text-[4px] leading-none whitespace-pre text-white/90 drop-shadow-md">
                                            {userAvatar}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="text-3xl font-black tracking-tight drop-shadow-md">
                                        <span className="mr-2 opacity-90">{userAvatar}</span>
                                        <span>{userName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* External Link Banner */}
                        <button
                            onClick={() => openUrl('https://emojicombos.com/')}
                            className="w-full p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-200 group hover:shadow-xl hover:shadow-purple-300 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="text-left space-y-1">
                                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                        Need more ASCII art?
                                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] uppercase tracking-wider font-bold">Recommended</span>
                                    </h3>
                                    <p className="text-indigo-50 text-xs font-medium max-w-sm leading-relaxed">
                                        Visit <span className="font-bold text-white underline decoration-white/50 underline-offset-2">EmojiCombos.com</span> to find the perfect text art collection or draw your own masterpiece.
                                    </p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors backdrop-blur-sm">
                                    <ExternalLink className="text-white" size={20} />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

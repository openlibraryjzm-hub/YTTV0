import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize, ZoomIn, Move, Check, MousePointer2 } from 'lucide-react';

export default function OrbCropModal({
    isOpen,
    onClose,
    image,
    spillConfig = { tl: false, tr: false, bl: false, br: false },
    scale = 1,
    xOffset = 0,
    yOffset = 0
}) {
    // 1. Local State for Advanced Editing
    const [advancedMasks, setAdvancedMasks] = useState({
        tl: false, tr: false, bl: false, br: false
    });

    // Tracks custom crop rects (0-100% of entire 80vmin container)
    const [maskRects, setMaskRects] = useState({
        tl: { x: 0, y: 0, w: 50, h: 50 },
        tr: { x: 50, y: 0, w: 50, h: 50 },
        bl: { x: 0, y: 50, w: 50, h: 50 },
        br: { x: 50, y: 50, w: 50, h: 50 }
    });

    // Interaction State
    const containerRef = useRef(null);
    const [interaction, setInteraction] = useState(null); // { type: 'drag'|'resize', q: string, handle?: string, startX, startY, startRect }

    // Toggle advanced mode
    const toggleAdvanced = (q) => {
        setAdvancedMasks(prev => ({ ...prev, [q]: !prev[q] }));
        if (!advancedMasks[q]) {
            // Default reset on enable
            const defaults = {
                tl: { x: 5, y: 5, w: 40, h: 40 },
                tr: { x: 55, y: 5, w: 40, h: 40 },
                bl: { x: 5, y: 55, w: 40, h: 40 },
                br: { x: 55, y: 55, w: 40, h: 40 }
            };
            setMaskRects(prev => ({ ...prev, [q]: defaults[q] }));
        }
    };

    // Interaction Handlers
    const initDrag = (e, q) => {
        if (e.target.dataset.handle) return; // Ignore if clicking a resize handle
        e.preventDefault();
        e.stopPropagation();
        setInteraction({
            type: 'drag',
            q,
            startX: e.clientX,
            startY: e.clientY,
            startRect: { ...maskRects[q] }
        });
    };

    const initResize = (e, q, handle) => {
        e.preventDefault();
        e.stopPropagation();
        setInteraction({
            type: 'resize',
            q,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startRect: { ...maskRects[q] }
        });
    };

    // Global Move/Up Listener
    useEffect(() => {
        if (!interaction || !containerRef.current) return;

        const handleMove = (e) => {
            const containerRect = containerRef.current.getBoundingClientRect();
            const deltaX = ((e.clientX - interaction.startX) / containerRect.width) * 100;
            const deltaY = ((e.clientY - interaction.startY) / containerRect.height) * 100;

            setMaskRects(prev => {
                const q = interaction.q;
                const start = interaction.startRect;
                let newR = { ...start };

                // Quadrant Bounds
                const bounds = {
                    minX: (q === 'tr' || q === 'br') ? 50 : 0,
                    maxX: (q === 'tl' || q === 'bl') ? 50 : 100,
                    minY: (q === 'bl' || q === 'br') ? 50 : 0,
                    maxY: (q === 'tl' || q === 'tr') ? 50 : 100,
                };
                const minSize = 5; // Minimum 5% width/height

                if (interaction.type === 'drag') {
                    // Calculate proposed position
                    let proposedX = start.x + deltaX;
                    let proposedY = start.y + deltaY;

                    // Clamp to bounds while maintaining size
                    proposedX = Math.max(bounds.minX, Math.min(bounds.maxX - newR.w, proposedX));
                    proposedY = Math.max(bounds.minY, Math.min(bounds.maxY - newR.h, proposedY));

                    newR.x = proposedX;
                    newR.y = proposedY;
                } else if (interaction.type === 'resize') {
                    const h = interaction.handle;

                    // Horizontal Logic
                    if (h.includes('w')) { // Left edge changed (nw, sw)
                        const proposedX = Math.min(start.x + start.w - minSize, Math.max(bounds.minX, start.x + deltaX));
                        newR.w = start.x + start.w - proposedX;
                        newR.x = proposedX;
                    } else if (h.includes('e')) { // Right edge changed (ne, se)
                        const proposedW = Math.max(minSize, Math.min(bounds.maxX - start.x, start.w + deltaX));
                        newR.w = proposedW;
                    }

                    // Vertical Logic
                    if (h.includes('n')) { // Top edge changed (nw, ne)
                        const proposedY = Math.min(start.y + start.h - minSize, Math.max(bounds.minY, start.y + deltaY));
                        newR.h = start.y + start.h - proposedY;
                        newR.y = proposedY;
                    } else if (h.includes('s')) { // Bottom edge changed (sw, se)
                        const proposedH = Math.max(minSize, Math.min(bounds.maxY - start.y, start.h + deltaY));
                        newR.h = proposedH;
                    }
                }

                return { ...prev, [q]: newR };
            });
        };

        const handleUp = () => setInteraction(null);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [interaction]);


    if (!isOpen || !image) return null;

    const visualMultiplier = 3.5;

    const getMaskRectProps = (q) => {
        if (advancedMasks[q]) {
            const r = maskRects[q];
            return { x: r.x, y: r.y, width: r.w, height: r.h };
        } else {
            switch (q) {
                case 'tl': return { x: -5000, y: -5000, width: 5050, height: 5050 };
                case 'tr': return { x: 50, y: -5000, width: 5050, height: 5050 };
                case 'bl': return { x: -5000, y: 50, width: 5050, height: 5050 };
                case 'br': return { x: 50, y: 50, width: 5050, height: 5050 };
                default: return {};
            }
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in fade-in duration-300 ${interaction ? 'cursor-grabbing' : ''}`}>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50 pointer-events-none">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black uppercase text-white tracking-widest drop-shadow-2xl flex items-center gap-4">
                        <Maximize className="text-sky-500 hidden sm:block" size={42} />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Orb Editor
                        </span>
                    </h2>
                    <p className="text-sky-400/80 text-sm font-bold tracking-wider uppercase ml-1 sm:ml-[60px]">
                        Full Canvas Mode
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="pointer-events-auto p-4 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 group"
                >
                    <X size={32} className="group-hover:scale-110 transition-transform duration-300" />
                </button>
            </div>

            {/* Main Canvas Area */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-[#050510]">

                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
                    }}
                />

                {/* The Reference Frame (80vmin) */}
                <div
                    ref={containerRef}
                    className="relative w-[80vmin] h-[80vmin] flex items-center justify-center group"
                >

                    {/* Source Image */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img
                            src={image}
                            className="w-full h-full object-contain transition-transform duration-300 origin-center opacity-90 max-w-none max-h-none"
                            style={{
                                transform: `scale(${scale}) translate(${xOffset * visualMultiplier}px, ${yOffset * visualMultiplier}px)`
                            }}
                            alt="Orb Preview"
                        />
                    </div>

                    {/* Mask Overlay */}
                    <div className="absolute inset-0 z-20 overflow-visible pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                            <defs>
                                <mask id="orbMenuMask">
                                    <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
                                    <circle cx="50" cy="50" r="50" fill="black" />
                                    {spillConfig.tl && <rect fill="black" {...getMaskRectProps('tl')} />}
                                    {spillConfig.tr && <rect fill="black" {...getMaskRectProps('tr')} />}
                                    {spillConfig.bl && <rect fill="black" {...getMaskRectProps('bl')} />}
                                    {spillConfig.br && <rect fill="black" {...getMaskRectProps('br')} />}
                                </mask>
                            </defs>
                            <rect x="-5000" y="-5000" width="10000" height="10000" fill="rgba(2, 6, 23, 0.95)" mask="url(#orbMenuMask)" />

                            {/* Visual Guides */}
                            <circle cx="50" cy="50" r="50" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.5" />
                            <rect x="-120" y="10" width="110" height="80" rx="4" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                            <rect x="110" y="10" width="110" height="80" rx="4" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                            <line x1="50" y1="-1000" x2="50" y2="1000" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.2" />
                            <line x1="-1000" y1="50" x2="1000" y2="50" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.2" />
                        </svg>
                    </div>

                    {/* CENTER CONTROLS */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-auto">
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 p-1 bg-black/50 backdrop-blur-md rounded-lg shadow-2xl border border-white/10">
                            {['tl', 'tr', 'bl', 'br'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => toggleAdvanced(q)}
                                    disabled={!spillConfig[q]}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${!spillConfig[q] ? 'opacity-20 cursor-not-allowed bg-slate-800' :
                                            advancedMasks[q] ? 'bg-sky-500 text-white shadow-lg scale-110' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                        }`}
                                >
                                    <MousePointer2 size={12} className={advancedMasks[q] ? "fill-current" : ""} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Crop Rects */}
                    <div className="absolute inset-0 pointer-events-none z-40">
                        {['tl', 'tr', 'bl', 'br'].map(q => {
                            if (!spillConfig[q] || !advancedMasks[q]) return null;
                            const r = maskRects[q];
                            return (
                                <div
                                    key={q}
                                    onMouseDown={(e) => initDrag(e, q)}
                                    className="absolute border-2 border-sky-400 bg-sky-500/10 hover:bg-sky-500/20 pointer-events-auto transition-colors group cursor-grab active:cursor-grabbing shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                                    style={{
                                        left: `${r.x}%`,
                                        top: `${r.y}%`,
                                        width: `${r.w}%`,
                                        height: `${r.h}%`
                                    }}
                                >
                                    {/* Resize Handles */}
                                    <div
                                        data-handle="nw"
                                        onMouseDown={(e) => initResize(e, q, 'nw')}
                                        className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm hover:scale-125 transition-transform cursor-nwse-resize z-50"
                                    />
                                    <div
                                        data-handle="ne"
                                        onMouseDown={(e) => initResize(e, q, 'ne')}
                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm hover:scale-125 transition-transform cursor-nesw-resize z-50"
                                    />
                                    <div
                                        data-handle="sw"
                                        onMouseDown={(e) => initResize(e, q, 'sw')}
                                        className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm hover:scale-125 transition-transform cursor-nesw-resize z-50"
                                    />
                                    <div
                                        data-handle="se"
                                        onMouseDown={(e) => initResize(e, q, 'se')}
                                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-sky-500 rounded-sm hover:scale-125 transition-transform cursor-nwse-resize z-50"
                                    />

                                    {/* Label */}
                                    <div className="absolute top-1 left-1 bg-sky-500 text-white text-[8px] font-bold px-1 rounded shadow-sm opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        {q.toUpperCase()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Bottom Stats Bar */}
                <div className="absolute bottom-12 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-6 text-xs font-medium text-white/50 z-50">
                    <div className="flex items-center gap-2">
                        <ZoomIn size={14} className="text-sky-400" />
                        <span className="text-white">Scale: <span className="font-mono text-sky-400">{scale.toFixed(2)}x</span></span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Move size={14} className="text-sky-400" />
                        <span className="text-white">Pos: <span className="font-mono text-sky-400">{xOffset}, {yOffset}</span></span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className={Object.values(advancedMasks).some(Boolean) ? "text-sky-400" : "text-slate-500"}>
                            {Object.values(advancedMasks).filter(Boolean).length} Custom Masks
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}

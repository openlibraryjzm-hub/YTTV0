import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize, ZoomIn, Move, Check, PenTool, Trash2, Undo2, MousePointer2 } from 'lucide-react';

export default function BannerCropModal({
    isOpen,
    onClose,
    image,
    maskPath = [],
    setMaskPath,
    scale = 100,
    verticalPosition = 0
}) {
    // Interaction State
    const containerRef = useRef(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [hoverPoint, setHoverPoint] = useState(null); // Index of point being hovered
    const [isDrawing, setIsDrawing] = useState(true);

    // --- Image Dimension & Guideline Logic ---
    const [imgDims, setImgDims] = useState(null); // { w, h, naturalW, naturalH }
    const [guideLineY, setGuideLineY] = useState(null); // Percentage position (0-100) of the 200px line

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        setImgDims({ naturalWidth, naturalHeight });
    };

    useEffect(() => {
        if (!imgDims) return;

        // Calculate where the 200px line falls on the image
        // We assume a standard 1920px reference width for the "100%" scale context
        // This is an estimation since viewport width varies, but 1920 is a good target
        const REFERENCE_WIDTH = 1920;
        const displayWidth = (scale / 100) * REFERENCE_WIDTH;
        const displayHeight = displayWidth * (imgDims.naturalHeight / imgDims.naturalWidth);
        const CONTAINER_HEIGHT = 200; // The fixed header height

        // Background-position-y logic:
        // Position is relative to container - image size difference
        // If pos = 0%, top aligned. Image offset = 0.
        // If pos = 50%, center aligned. Image offset = (200 - H) * 0.5.
        // If pos = 100%, bottom aligned. Image offset = (200 - H) * 1.

        // Image Top (relative to container) = (CONTAINER_HEIGHT - displayHeight) * (verticalPosition / 100);
        // We want the line at Y=200px relative to container top.
        // Line Y relative to Image Top = 200 - Image Top
        // Line Y % = (Line Y relative / displayHeight) * 100

        const imageTopOffset = (CONTAINER_HEIGHT - displayHeight) * ((verticalPosition || 0) / 100);
        const lineYRelative = CONTAINER_HEIGHT - imageTopOffset;
        const lineYPercent = (lineYRelative / displayHeight) * 100;

        setGuideLineY(lineYPercent);

    }, [imgDims, scale, verticalPosition]);

    // --- Path Interaction ---

    const handleCanvasClick = (e) => {
        if (!isDrawing) return;
        if (!containerRef.current) return;

        // Ignore clicks on UI elements
        if (e.target.closest('button') || e.target.closest('input')) return;

        const containerRect = containerRef.current.getBoundingClientRect();

        // Calculate percentages relative to the IMAGE container
        const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

        // Clone current path
        const currentPath = maskPath || [];

        // Close path logic (clicking near start)
        if (currentPath.length >= 3 && hoverPoint === 0) {
            return;
        }

        const newPath = [...currentPath, { x, y }];
        setMaskPath(newPath);
    };

    if (!isOpen || !image) return null;

    // Helper to generate SVG points string from percentages
    const getPolygonPoints = () => {
        const points = maskPath || [];
        return points.map(p => `${p.x},${p.y}`).join(' ');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in fade-in duration-300">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50 pointer-events-none">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black uppercase text-white tracking-widest drop-shadow-2xl flex items-center gap-4">
                        <PenTool className="text-sky-500 hidden sm:block" size={42} />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Image Mask Editor
                        </span>
                    </h2>
                    <p className="text-sky-400/80 text-sm font-bold tracking-wider uppercase ml-1 sm:ml-[60px]">
                        Draw Mask on Single Image Tile
                    </p>
                </div>

                <div className="flex gap-4 pointer-events-auto">
                    <div className="bg-sky-500/10 border border-sky-500/20 px-4 py-2 rounded-lg text-sky-300 text-xs font-medium animate-pulse">
                        Mask is applied to every tile. Dashed line = approx banner bottom.
                    </div>

                    <button
                        onClick={onClose}
                        className="p-4 rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 group"
                    >
                        <X size={32} className="group-hover:scale-110 transition-transform duration-300" />
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div
                className={`relative w-full h-full grid place-items-center overflow-auto select-none bg-[#050510] cursor-crosshair`}
                onClick={handleCanvasClick}
            >

                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
                    }}
                />

                {/* The Reference Frame - Sized to Image */}
                <div
                    ref={containerRef}
                    className="relative flex-shrink-0 group shadow-2xl transition-all duration-200 ease-out border border-white/10 bg-black/50"
                    style={{
                        // Scale controls visual zoom of the editor
                        transform: `scale(${canvasScale})`,
                        width: 'auto',
                        height: 'auto',
                        maxWidth: '80vw',
                        maxHeight: '80vh'
                    }}
                >

                    {/* Source Image - Natural Size */}
                    <img
                        src={image}
                        className="block rounded-lg pointer-events-none opacity-50 select-none"
                        draggable={false}
                        style={{ maxWidth: '80vw', maxHeight: '80vh' }}
                        onLoad={handleImageLoad}
                    />

                    {/* SVG Editor Overlay */}
                    <div className="absolute inset-0 z-20 overflow-visible">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>

                            {/* Guideline (200px mark) */}
                            {guideLineY !== null && (
                                <g pointerEvents="none">
                                    <line
                                        x1="-50"
                                        y1={guideLineY}
                                        x2="150"
                                        y2={guideLineY}
                                        stroke="#f43f5e"
                                        strokeWidth="0.5"
                                        strokeDasharray="2 2"
                                        opacity="0.9"
                                    />
                                    <text
                                        x="2"
                                        y={guideLineY - 1}
                                        fill="#f43f5e"
                                        fontSize="3"
                                        fontFamily="sans-serif"
                                        fontWeight="bold"
                                        textAnchor="start"
                                        style={{ textShadow: '0px 1px 2px black' }}
                                    >
                                        BANNER EDGE (APPROX)
                                    </text>
                                </g>
                            )}

                            {/* Active Path Lines */}
                            {maskPath.length > 0 && (
                                <g>
                                    <polyline
                                        points={getPolygonPoints()}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="0.5"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    {/* Preview Fill */}
                                    {maskPath.length > 2 && (
                                        <polygon
                                            points={getPolygonPoints()}
                                            fill="rgba(56, 189, 248, 0.2)"
                                            stroke="none"
                                        />
                                    )}
                                    {/* Points */}
                                    {maskPath.map((p, idx) => (
                                        <circle
                                            key={idx}
                                            cx={p.x}
                                            cy={p.y}
                                            r={1.5}
                                            fill={idx === 0 ? "#4ade80" : "#38bdf8"}
                                            className="cursor-pointer hover:r-2 transition-all pointer-events-auto"
                                            vectorEffect="non-scaling-stroke"
                                            onMouseEnter={() => setHoverPoint(idx)}
                                            onMouseLeave={() => setHoverPoint(null)}
                                        />
                                    ))}
                                </g>
                            )}
                        </svg>
                    </div>

                    {/* Result Preview (High Opacity) - Clamped to Mask */}
                    <div className="absolute inset-0 z-10 pointer-events-none rounded-lg overflow-hidden">
                        <div
                            className="w-full h-full"
                            style={{
                                clipPath: maskPath.length > 0 ? `polygon(${maskPath.map(p => `${p.x}% ${p.y}%`).join(', ')})` : 'none'
                            }}
                        >
                            <img
                                src={image}
                                className="w-full h-full object-fill select-none"
                                draggable={false}
                            />
                        </div>
                    </div>

                </div>

                {/* Floating Toolbar */}
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col gap-3 shadow-2xl z-[60] animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="flex-1">
                            <span className="font-mono text-white">{maskPath.length}</span> points
                        </div>
                        <button
                            onClick={() => {
                                const newPath = [...maskPath];
                                newPath.pop();
                                setMaskPath(newPath);
                            }}
                            disabled={maskPath.length === 0}
                            className="p-1.5 hover:bg-white/10 rounded text-sky-400 disabled:opacity-30"
                            title="Undo Last Point"
                        >
                            <Undo2 size={14} />
                        </button>
                        <button
                            onClick={() => setMaskPath([])}
                            disabled={maskPath.length === 0}
                            className="p-1.5 hover:bg-red-500/20 rounded text-red-400 disabled:opacity-30"
                            title="Clear Path"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Bottom Stats Bar */}
                <div className="absolute bottom-12 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-6 text-xs font-medium text-white/50 z-50">
                    <div className="flex items-center gap-2">
                        <ZoomIn size={14} className="text-sky-400" />
                        <span className="text-white">Canvas Zoom:</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={canvasScale}
                            onChange={(e) => setCanvasScale(parseFloat(e.target.value))}
                            className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400"
                        />
                        <span className="font-mono text-sky-400 w-8 text-right">{(canvasScale * 100).toFixed(0)}%</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

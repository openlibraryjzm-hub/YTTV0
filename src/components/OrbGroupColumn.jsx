import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

const OrbGroupColumn = ({
    leader,
    members,
    onClose,
    onOrbSelect,
    activeOrbId
}) => {
    const columnRef = useRef(null);
    const { customOrbImage } = useConfigStore();

    useEffect(() => {
        if (columnRef.current) {
            columnRef.current.scrollTop = 0;
        }
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const renderOrbVisual = (orb) => {
        const isSpill = orb.isSpillEnabled;
        const clipPathUrl = isSpill && orb.orbSpill ? `url(#orbClipPath-${orb.id})` : 'circle(50% at 50% 50%)';

        return (
            <div className="relative w-full aspect-square max-w-[300px] mx-auto">
                <div className={`w-full h-full rounded-full border-4 transition-all duration-200 relative overflow-visible bg-sky-50 ${activeOrbId === orb.id
                        ? 'border-sky-500 ring-4 ring-sky-200 shadow-lg'
                        : 'border-slate-200 group-hover/card:border-sky-300'
                    }`}>
                    {/* Image Layer */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-all duration-500 flex items-center justify-center z-40"
                        style={{
                            clipPath: clipPathUrl,
                            overflow: 'visible'
                        }}
                    >
                        <img
                            src={orb.customOrbImage}
                            alt={orb.name}
                            className="max-w-none transition-all duration-500"
                            style={{
                                width: isSpill ? `calc(100% * ${orb.orbImageScale || 1})` : '100%',
                                height: isSpill ? `calc(100% * ${orb.orbImageScale || 1})` : '100%',
                                transform: isSpill ? `translate(${(orb.orbImageXOffset || 0) * 0.3}px, ${(orb.orbImageYOffset || 0) * 0.3}px)` : 'none',
                                objectFit: isSpill ? 'contain' : 'cover'
                            }}
                        />
                    </div>

                    {/* Glass Overlay */}
                    <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
                        <div className="absolute inset-0 bg-sky-200/10" />
                    </div>
                </div>

                {/* Spill Badge */}
                {isSpill && (
                    <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider z-50 shadow-md">
                        Spill
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background to make orbs pop
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800/50 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 backdrop-blur-md"
            >
                <X size={24} />
            </button>

            {/* Column Container */}
            <div
                ref={columnRef}
                className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-20 gap-16 animate-in slide-in-from-bottom-10 duration-500"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Header / Leader Info */}
                <div className="flex flex-col items-center gap-2 mb-4 text-white animate-in fade-in slide-in-from-top-4 duration-700">
                    <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                        {leader.name}
                    </h2>
                    <p className="text-sky-400 font-bold tracking-wide uppercase text-sm bg-sky-900/30 px-3 py-1 rounded-full border border-sky-500/20">
                        {members.length} Subordinates
                    </p>
                </div>

                {members.length === 0 && (
                    <div className="text-slate-400 text-lg font-medium">
                        No subordinates found
                    </div>
                )}

                {/* Subordinates List */}
                {members.map((member) => (
                    <div
                        key={member.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onOrbSelect) onOrbSelect(member);
                        }}
                        className="group/card relative flex flex-col items-center transition-all duration-300 transform hover:scale-110 cursor-pointer"
                    >
                        {/* Orb Visual Area */}
                        <div className="relative w-[280px] h-[280px] flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover/card:drop-shadow-[0_20px_40px_rgba(14,165,233,0.2)] transition-all">
                            {renderOrbVisual(member)}
                        </div>

                        {/* Name Label */}
                        <div className="mt-6 flex flex-col items-center gap-2">
                            <h3 className="text-xl font-bold text-white text-center drop-shadow-md group-hover/card:text-sky-400 transition-colors bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 group-hover/card:border-sky-500/50">
                                {member.name}
                            </h3>
                            {activeOrbId === member.id && (
                                <span className="text-[10px] font-bold bg-sky-500 text-white px-3 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-sky-500/20">
                                    Active
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrbGroupColumn;

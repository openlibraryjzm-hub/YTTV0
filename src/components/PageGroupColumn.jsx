import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const PageGroupColumn = ({
    leader,
    members,
    onClose,
    onSelect,
    activeId
}) => {
    const columnRef = useRef(null);

    useEffect(() => {
        if (columnRef.current) {
            columnRef.current.scrollTop = 0;
        }
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const renderBannerVisual = (banner) => {
        return (
            <div className="relative w-full aspect-video mx-auto">
                <div className={`w-full h-full rounded-lg border-2 transition-all duration-200 relative overflow-hidden bg-slate-800 ${activeId === banner.id
                    ? 'border-purple-500 ring-4 ring-purple-500/30 shadow-lg'
                    : 'border-slate-600 group-hover/card:border-purple-400'
                    }`}>
                    <img
                        src={banner.image}
                        alt={banner.folderName || 'Banner'}
                        className="w-full h-full object-cover transition-all duration-500 group-hover/card:scale-105"
                        style={{
                            transform: `scale(${(banner.scale || 100) / 100}) translate(${(banner.xOffset || 50) - 50}%, ${(banner.yOffset || 50) - 50}%)`
                        }}
                    />

                    {/* Glass Overlay just for sheen */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </div>
            </div>
        );
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)'
            }}
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800/80 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 backdrop-blur-md"
            >
                <X size={24} />
            </button>

            {/* Column Container */}
            <div
                ref={columnRef}
                className="h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-20 gap-12 animate-in slide-in-from-bottom-10 duration-500"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Header / Leader Info */}
                <div className="flex flex-col items-center gap-2 mb-4 text-white animate-in fade-in slide-in-from-top-4 duration-700">
                    <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-md text-center">
                        {leader.folderName || 'Banner Group'}
                    </h2>
                    <p className="text-purple-300 font-bold tracking-wide uppercase text-sm bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/30">
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
                            if (onSelect) onSelect(member);
                        }}
                        className="group/card relative flex flex-col items-center transition-all duration-300 transform hover:scale-105 cursor-pointer w-[80%] max-w-[400px]"
                    >
                        {/* Banner Visual Area */}
                        <div className="relative w-full shadow-2xl transition-all">
                            {renderBannerVisual(member)}
                        </div>

                        {/* Name Label */}
                        <div className="mt-4 flex flex-col items-center gap-2">
                            {member.folderName && (
                                <h3 className="text-sm font-bold text-white text-center drop-shadow-md group-hover/card:text-purple-300 transition-colors bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    {member.folderName}
                                </h3>
                            )}
                            {activeId === member.id && (
                                <span className="text-[10px] font-bold bg-purple-500 text-white px-3 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-purple-500/20">
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

export default PageGroupColumn;

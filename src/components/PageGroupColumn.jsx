import React, { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { useConfigStore } from '../store/configStore';

const PageGroupColumn = ({
    leader,
    members,
    onClose,
    onImageSelect,
    activeImageId
}) => {
    const columnRef = useRef(null);
    const { setPageBannerBgColor } = useConfigStore();

    useEffect(() => {
        if (columnRef.current) {
            columnRef.current.scrollTop = 0;
        }
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div
            className="absolute inset-0 z-[100] flex flex-col"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                        {leader.folderName}
                    </h2>
                    <p className="text-sky-400 font-bold tracking-wide uppercase text-sm bg-sky-900/30 px-3 py-1 rounded-full border border-sky-500/20">
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                    </p>
                </div>

                {members.length === 0 && (
                    <div className="text-slate-400 text-lg font-medium">
                        No group members found
                    </div>
                )}

                {/* Main Content: Leader Visual + Members List */}
                {/* We can show the leader at the top or just the members. 
                    Let's show the leader prominently first. */}

                {leader && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onImageSelect) onImageSelect(leader);
                        }}
                        className="group/card relative flex flex-col items-center transition-all duration-300 transform hover:scale-105 cursor-pointer max-w-2xl w-full px-4"
                    >
                        <div className="relative w-full aspect-video flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover/card:drop-shadow-[0_20px_40px_rgba(147,51,234,0.2)] transition-all rounded-xl overflow-hidden border-2 border-purple-500/50 group-hover/card:border-purple-400">
                            <img
                                src={leader.image}
                                alt={leader.folderName}
                                className="w-full h-full object-cover"
                            />
                            {/* Glass Overlay */}
                            <div className="absolute inset-0 bg-purple-500/10 mix-blend-overlay" />
                            {/* Leader Badge */}
                            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                Group Leader
                            </div>
                        </div>
                        {/* Name Label */}
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <h3 className="text-xl font-bold text-white text-center drop-shadow-md group-hover/card:text-purple-400 transition-colors">
                                {leader.folderName} (Leader)
                            </h3>
                            {activeImageId === leader.image && (
                                <span className="text-[10px] font-bold bg-purple-500 text-white px-3 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-purple-500/20">
                                    Active
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Subordinates List */}
                <div className="flex flex-col gap-12 w-full max-w-2xl px-4">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onImageSelect) onImageSelect(member);
                            }}
                            className="group/card relative flex flex-col items-center transition-all duration-300 transform hover:scale-105 cursor-pointer"
                        >
                            {/* Image Visual Area */}
                            <div className="relative w-full aspect-video flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover/card:drop-shadow-[0_20px_40px_rgba(56,189,248,0.2)] transition-all rounded-xl overflow-hidden border border-white/10 group-hover/card:border-sky-400/50">
                                <img
                                    src={member.image}
                                    alt={member.folderName}
                                    className="w-full h-full object-cover"
                                />
                                {/* Glass Overlay */}
                                <div className="absolute inset-0 bg-sky-500/5 mix-blend-overlay" />
                            </div>

                            {/* Name Label */}
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-300 text-center drop-shadow-md group-hover/card:text-sky-400 transition-colors">
                                    {member.folderName}
                                </h3>
                                {activeImageId === member.image && (
                                    <span className="text-[10px] font-bold bg-sky-500 text-white px-3 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-sky-500/20">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageGroupColumn;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfigStore } from '../store/configStore';
import { useMissionStore } from '../store/missionStore';
import { CheckCircle, Plus, Play, Lock, Clock, Trash2, RotateCcw, LayoutGrid, List, X } from 'lucide-react';

const HomeHub = ({ onUnlock }) => {
    const { fullscreenBanner } = useConfigStore();
    const {
        timeBank,
        missions,
        categories,
        addCategory,
        removeCategory,
        addMission,
        removeMission,
        completeMission,
        resetMission,
        resetDailyMissions,
        unlockApp,
        isAppLocked
    } = useMissionStore();

    const [activeTab, setActiveTab] = useState(categories[0] || 'Daily');
    const [newMissionText, setNewMissionText] = useState('');
    const [newMissionTime, setNewMissionTime] = useState(15); // Default 15 mins
    const [isAddingMission, setIsAddingMission] = useState(false);
    const [newCategoryText, setNewCategoryText] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [hoveredMission, setHoveredMission] = useState(null);

    // Ensure active tab exists
    useEffect(() => {
        if (!categories.includes(activeTab) && categories.length > 0) {
            setActiveTab(categories[0]);
        }
    }, [categories, activeTab]);

    // Use app banner as background if available
    const bgImage = fullscreenBanner?.image;

    // Format seconds to HH:MM:SS
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAddMission = (e) => {
        e.preventDefault();
        if (newMissionText.trim()) {
            addMission(newMissionText, newMissionTime, activeTab);
            setNewMissionText('');
            setIsAddingMission(false);
        }
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (newCategoryText.trim()) {
            addCategory(newCategoryText);
            setActiveTab(newCategoryText);
            setNewCategoryText('');
            setIsAddingCategory(false);
        }
    };

    const handleLaunch = () => {
        if (timeBank > 0) {
            onUnlock();
        }
    };

    const filteredMissions = missions.filter(m => m.category === activeTab || (!m.category && activeTab === 'Daily'));

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black text-white select-none">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                {bgImage ? (
                    <div
                        className="w-full h-full bg-cover bg-center opacity-30 blur-md scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black opacity-80" />
                )}
                <div className="absolute inset-0 bg-black/60" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-6xl h-[90vh] flex flex-col md:flex-row gap-8 p-8">

                {/* Left Column: Status & Launch */}
                <div className="w-full md:w-1/3 flex flex-col justify-center items-center md:items-start space-y-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center md:text-left"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-200 to-slate-400">
                            ATLAS
                        </h1>
                        <p className="text-xl text-blue-300/60 font-mono tracking-[0.3em] uppercase mt-2">
                            Mission Control
                        </p>
                    </motion.div>

                    {/* Time Bank Display */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative group w-full max-w-sm"
                    >
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity" />
                        <div className="relative border border-white/10 bg-black/40 backdrop-blur-md rounded-2xl p-6 text-center shadow-lg">
                            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                                <Clock size={20} />
                                <span className="text-sm font-bold uppercase tracking-widest">Time Bank</span>
                            </div>
                            <div className={`text-5xl font-mono font-bold tracking-wider ${timeBank > 0 ? 'text-white' : 'text-red-400'}`}>
                                {formatTime(timeBank)}
                            </div>
                            <div className="mt-2 text-xs text-white/40">
                                {timeBank > 0 ? 'System Ready' : 'Insufficient Resources'}
                            </div>
                        </div>
                    </motion.div>

                    {/* Launch Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLaunch}
                        disabled={timeBank <= 0}
                        className={`
              relative w-full max-w-sm px-8 py-5 rounded-xl font-bold text-xl tracking-widest uppercase flex justify-center items-center gap-3 transition-all
              ${timeBank > 0
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] cursor-pointer border border-blue-400/30'
                                : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'}
            `}
                    >
                        {timeBank > 0 ? (
                            <>
                                <Play size={24} fill="currentColor" />
                                Launch System
                            </>
                        ) : (
                            <>
                                <Lock size={24} />
                                System Locked
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Right Column: Mission Log with Tabs */}
                <div className="flex-1 flex flex-col bg-black/40 border border-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">

                    {/* Top Bar: Tabs & Controls */}
                    <div className="flex flex-col border-b border-white/10 bg-white/5">
                        <div className="flex items-center justify-between p-4 pb-2">
                            <h2 className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
                                <LayoutGrid size={20} className="text-blue-400" />
                                LOGS
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAddingMission(!isAddingMission)}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs uppercase font-bold tracking-wider ${isAddingMission ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                    title="Add New Mission"
                                >
                                    <Plus size={16} /> Add Task
                                </button>
                            </div>
                        </div>

                        {/* Tabs Scroll Area */}
                        <div className="flex items-center px-4 overflow-x-auto custom-scrollbar gap-2 pb-0">
                            {categories.map(cat => (
                                <div
                                    key={cat}
                                    className={`
                    group relative flex items-center border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === cat
                                            ? 'border-blue-500 bg-white/5'
                                            : 'border-transparent hover:bg-white/5'}
                  `}
                                >
                                    <button
                                        onClick={() => setActiveTab(cat)}
                                        className={`
                      px-4 py-2 text-sm font-medium
                      ${activeTab === cat ? 'text-blue-400' : 'text-white/40 hover:text-white'}
                    `}
                                    >
                                        {cat}
                                    </button>

                                    {/* Delete Category Button (Only if more than 1 category) */}
                                    {categories.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // If deleting active tab, switch to first available
                                                if (activeTab === cat) {
                                                    const remaining = categories.filter(c => c !== cat);
                                                    setActiveTab(remaining[0]);
                                                }
                                                removeCategory(cat);
                                            }}
                                            className={`
                        mr-2 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all
                        ${activeTab === cat ? 'text-blue-400 hover:bg-blue-500/20' : 'text-white/40 hover:text-red-400 hover:bg-white/10'}
                      `}
                                            title={`Delete ${cat}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Add Category Button */}
                            {isAddingCategory ? (
                                <form onSubmit={handleAddCategory} className="flex items-center">
                                    <input
                                        type="text"
                                        value={newCategoryText}
                                        onChange={(e) => setNewCategoryText(e.target.value)}
                                        placeholder="Tab Name"
                                        className="bg-black/50 border border-blue-500/50 rounded px-2 py-1 text-xs text-white w-24 outline-none mr-1"
                                        autoFocus
                                        onBlur={() => !newCategoryText && setIsAddingCategory(false)}
                                    />
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsAddingCategory(true)}
                                    className="px-3 py-2 text-white/20 hover:text-blue-400 transition-colors"
                                    title="New Tab"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
                        {isAddingMission && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={handleAddMission}
                                className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4 space-y-4"
                            >
                                <div>
                                    <label className="text-xs text-blue-300 uppercase tracking-wider font-bold mb-1 block">Task Description</label>
                                    <input
                                        type="text"
                                        value={newMissionText}
                                        onChange={(e) => setNewMissionText(e.target.value)}
                                        placeholder="Enter mission objective..."
                                        className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-white focus:border-blue-500 outline-none text-sm placeholder-white/20"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-blue-300 uppercase tracking-wider font-bold mb-1 block">Reward (Minutes)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[5, 10, 15, 30, 45, 60].map(mins => (
                                            <button
                                                key={mins}
                                                type="button"
                                                onClick={() => setNewMissionTime(mins)}
                                                className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-all ${newMissionTime === mins ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-transparent border-white/20 text-white/60 hover:border-white/40'}`}
                                            >
                                                {mins}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingMission(false)}
                                        className="text-xs text-white/50 hover:text-white px-3 py-1.5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded font-bold uppercase tracking-wider"
                                    >
                                        Add to {activeTab}
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        <AnimatePresence mode="popLayout">
                            {filteredMissions.length === 0 && !isAddingMission && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-white/20 py-10"
                                >
                                    <List size={40} className="mb-2 opacity-50" />
                                    <p className="italic">No missions in this sector.</p>
                                </motion.div>
                            )}

                            {filteredMissions.map((mission) => (
                                <motion.div
                                    key={mission.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`
                    relative group p-4 rounded-lg border transition-all duration-300
                    ${mission.completed
                                            ? 'bg-black/40 border-green-500/20 opacity-60'
                                            : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10'}
                  `}
                                    onMouseEnter={() => setHoveredMission(mission.id)}
                                    onMouseLeave={() => setHoveredMission(null)}
                                >
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
                          ${mission.completed ? 'border-green-500 bg-green-500/20' : 'border-white/20 group-hover:border-blue-400'}
                        `}
                                                    onClick={() => !mission.completed && completeMission(mission.id)}
                                                >
                                                    {mission.completed && <CheckCircle size={12} className="text-green-500" />}
                                                </div>
                                                <h3 className={`font-medium truncate ${mission.completed ? 'text-green-500/50 line-through decoration-green-500/30' : 'text-white'}`}>
                                                    {mission.text}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Reward Badge */}
                                            <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${mission.completed ? 'bg-green-900/20 text-green-700/50 border-green-900/20' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>
                                                +{Math.floor(mission.reward / 60)}m
                                            </span>

                                            {/* Actions */}
                                            <div className={`flex items-center gap-1 transition-opacity duration-200 ${hoveredMission === mission.id || mission.completed ? 'opacity-100' : 'opacity-0'}`}>
                                                {mission.completed && (
                                                    <button
                                                        onClick={() => resetMission(mission.id)}
                                                        className="p-1.5 text-white/40 hover:text-yellow-400 hover:bg-white/10 rounded transition-colors"
                                                        title="Reset Mission Reward"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => removeMission(mission.id)}
                                                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                                    title="Delete Mission"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Footer of Card */}
                    <div className="p-3 bg-black/40 border-t border-white/10 flex justify-between items-center text-xs text-white/30">
                        <span>{filteredMissions.filter(m => m.completed).length} / {filteredMissions.length} COMPLETED</span>
                        {filteredMissions.some(m => m.completed) && (
                            <button
                                onClick={resetDailyMissions}
                                className="hover:text-white transition-colors flex items-center gap-1"
                            >
                                RESET ALL <RotateCcw size={10} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-8 text-xs text-white/30 font-mono tracking-wider flex items-center gap-4 hidden md:flex"
            >
                <span>ATLAS OS v2.1</span>
                <span>•</span>
                <span>GAMIFICATION MODULE ACTIVE</span>
            </motion.div>
        </div>
    );
};

export default HomeHub;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfigStore } from '../store/configStore';
import { useMissionStore } from '../store/missionStore';
import { CheckCircle, Plus, Play, Lock, Clock, Trash2, RotateCcw, LayoutGrid, List, X, Package, Star, Zap, Shield, Gift, Hexagon, Grid, Target } from 'lucide-react';
import PokedexModal from './PokedexModal';

import { usePokedexStore } from '../store/pokedexStore';

// Define clip paths for quadrants (same as in PokedexModal)
const CLIP_PATHS = [
    'polygon(0 0, 50% 0, 50% 50%, 0 50%)',       // TL (0)
    'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)', // TR (1)
    'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)', // BL (2)
    'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' // BR (3)
];

const LootboxOverlay = ({ onClose, type = 'standard' }) => {
    const [stage, setStage] = useState('locked'); // locked, shaking, opening, revealed
    const [rewards, setRewards] = useState([]);
    const { unlockPiece, getPokemonById, getMissingPieces, getAllPokemon, standardTargetId, setStandardTarget } = usePokedexStore();

    const generateRewards = () => {
        const newRewards = [];
        const missingGlobal = getMissingPieces(); // Array of {pokemonId, pieceIndex}

        // Define counts based on type
        let loopCount = 0;
        if (type === 'mini') loopCount = 1;
        if (type === 'standard') loopCount = 4;

        if (type === 'legendary') {
            // Legendary: Find a Pokemon that isn't fully unlocked
            // efficient way: grouped by id? 
            // Let's just iterate all 151 and find one not fully unlocked.
            const all = getAllPokemon();
            const incomplete = all.filter(p => !p.isUnlocked);

            if (incomplete.length > 0) {
                const target = incomplete[Math.floor(Math.random() * incomplete.length)];
                // Get missing pieces for this specific pokemon
                const missingIndices = [0, 1, 2, 3].filter(i => !target.pieces.includes(i));

                // Unlock all of them
                missingIndices.forEach(idx => unlockPiece(target.id, idx));

                // Return single special reward
                newRewards.push({
                    id: 0,
                    type: 'full_unlock',
                    pokemonId: target.id,
                    pokemonName: target.name,
                    amount: missingIndices.length // How many pieces were actually granted
                });
                return newRewards;
            } else {
                // Fallback if everything is unlocked
                loopCount = 1; // Give a credit reward
            }
        }

        // Standard Supply Logic with Consistency Mechanic
        let currentStandardTargetId = standardTargetId;

        // If 'standard', we need to ensure we have a valid target for the first slot
        if (type === 'standard') {
            const all = getAllPokemon();
            const targetData = currentStandardTargetId ? all.find(p => p.id === currentStandardTargetId) : null;

            // If no target, or target is fully unlocked, pick a new one
            if (!targetData || targetData.isUnlocked) {
                const incomplete = all.filter(p => !p.isUnlocked);
                if (incomplete.length > 0) {
                    const newTarget = incomplete[Math.floor(Math.random() * incomplete.length)];
                    currentStandardTargetId = newTarget.id;
                    setStandardTarget(newTarget.id);
                } else {
                    currentStandardTargetId = null; // Everything unlocked
                }
            }
        }

        for (let i = 0; i < loopCount; i++) {
            let pieceToUnlock = null;

            // Special handling for the first slot of a Standard crate
            if (type === 'standard' && i === 0 && currentStandardTargetId) {
                // Find a missing piece for the target
                // We re-fetch state/missing here or just filter missingGlobal? 
                // missingGlobal is a snapshot at start. 
                const targetMissing = missingGlobal.filter(p => p.pokemonId === currentStandardTargetId);

                if (targetMissing.length > 0) {
                    // User requested order: TR (1), TL (0), BL (2), BR (3)
                    const priorityOrder = [1, 0, 2, 3];

                    // Find the first missing piece index in our priority list that actually exists in targetMissing
                    const preferredPieceIndex = priorityOrder.find(pIndex =>
                        targetMissing.some(tm => tm.pieceIndex === pIndex)
                    );

                    if (preferredPieceIndex !== undefined) {
                        pieceToUnlock = targetMissing.find(tm => tm.pieceIndex === preferredPieceIndex);
                    } else {
                        // Fallback (shouldn't happen if targetMissing > 0)
                        pieceToUnlock = targetMissing[0];
                    }
                }
            }

            // Normal random logic (or fallback if target had no pieces found in missingGlobal - likely logic error or just unlocked)
            if (!pieceToUnlock && missingGlobal.length > 0) {
                const randomIndex = Math.floor(Math.random() * missingGlobal.length);
                pieceToUnlock = missingGlobal[randomIndex];
            }

            if (pieceToUnlock) {
                // Remove from missing pool locally to avoid duplicates IN THIS BATCH
                // We must find the index in missingGlobal effectively
                const globalIndex = missingGlobal.findIndex(p => p.pokemonId === pieceToUnlock.pokemonId && p.pieceIndex === pieceToUnlock.pieceIndex);
                if (globalIndex !== -1) {
                    missingGlobal.splice(globalIndex, 1);
                }

                // Unlock it
                unlockPiece(pieceToUnlock.pokemonId, pieceToUnlock.pieceIndex);

                // Get data for display
                const pokemonData = getPokemonById(pieceToUnlock.pokemonId);

                newRewards.push({
                    id: i,
                    type: 'shard',
                    pokemonId: pieceToUnlock.pokemonId,
                    pieceIndex: pieceToUnlock.pieceIndex,
                    pokemonName: pokemonData.name,
                    currentPieces: pokemonData.pieces,
                    isFullyUnlocked: pokemonData.isUnlocked,
                    isTargetReward: (type === 'standard' && i === 0 && currentStandardTargetId === pieceToUnlock.pokemonId)
                });
            } else {
                newRewards.push({
                    id: i,
                    type: 'credit',
                    amount: 500,
                    pokemonId: null
                });
            }
        }
        return newRewards;
    };

    const handleOpen = () => {
        if (stage !== 'locked') return;
        setStage('shaking');
        setTimeout(() => {
            setStage('opening');
            setRewards(generateRewards());
            setTimeout(() => {
                setStage('revealed');
            }, 500);
        }, 800);
    };

    // Crate Styles based on Type
    const getCrateStyle = () => {
        switch (type) {
            case 'mini': return { color: 'green', title: 'Mini Cache', icon: <Package size={60} /> };
            case 'legendary': return { color: 'yellow', title: 'Legendary Vault', icon: <Shield size={80} /> };
            default: return { color: 'blue', title: 'Standard Supply', icon: <Package size={80} /> };
        }
    };

    const crateStyle = getCrateStyle();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="relative w-full max-w-5xl h-[700px] flex flex-col items-center justify-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 p-4 text-white/40 hover:text-white transition-colors z-50"
                >
                    <X size={32} />
                </button>

                <AnimatePresence mode="wait">
                    {stage === 'locked' || stage === 'shaking' ? (
                        <motion.div
                            key="crate"
                            className="cursor-pointer group relative"
                            onClick={handleOpen}
                            animate={stage === 'shaking' ? {
                                x: [0, -10, 10, -10, 10, 0],
                                rotate: [0, -5, 5, -5, 5, 0],
                                scale: [1, 1.05, 1]
                            } : {
                                y: [0, -10, 0],
                            }}
                            transition={stage === 'shaking' ? { duration: 0.5 } : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        >
                            {/* Crate Glow */}
                            <div className={`absolute inset-0 bg-${crateStyle.color}-500/30 blur-[60px] rounded-full scale-150 group-hover:bg-${crateStyle.color}-400/40 transition-all duration-500`} />

                            {/* Crate Visual */}
                            <div className={`relative w-64 h-64 bg-slate-900 border-4 border-${crateStyle.color}-500/50 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_80px_rgba(59,130,246,0.8)] group-hover:border-${crateStyle.color}-400 transition-all duration-300 transform perspective-1000 rotate-x-12`}>
                                <div className="absolute inset-2 border-2 border-white/10 rounded-2xl border-dashed" />
                                <div className={`text-${crateStyle.color}-400 group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]`}>
                                    {crateStyle.icon}
                                </div>
                                <div className={`absolute bottom-6 text-xs text-${crateStyle.color}-300 font-mono tracking-[0.3em] uppercase`}>
                                    {crateStyle.title}
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-16 left-0 right-0 text-center text-white/60 font-mono text-sm tracking-wider"
                            >
                                CLICK TO OPEN
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="rewards"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            <motion.h2
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-12 tracking-tighter"
                            >
                                {type === 'legendary' ? 'LEGENDARY UNLOCK' : 'SHARDS ACQUIRED'}
                            </motion.h2>

                            <div className={`grid gap-6 w-full px-8 ${rewards.length === 1 ? 'place-items-center' : 'grid-cols-4'}`}>
                                {rewards.map((reward, index) => {
                                    if (reward.type === 'full_unlock') {
                                        return (
                                            <motion.div
                                                key="full-unlock"
                                                initial={{ scale: 0, rotateY: 180 }}
                                                animate={{ scale: 1.2, rotateY: 0 }}
                                                transition={{ type: "spring", stiffness: 100 }}
                                                className="relative aspect-[3/4] w-64 bg-gradient-to-br from-yellow-600/30 to-amber-900/30 border-2 border-yellow-400 rounded-xl p-6 flex flex-col items-center justify-between group shadow-[0_0_50px_rgba(234,179,8,0.3)]"
                                            >
                                                <div className="absolute inset-0 bg-yellow-500/10 animate-pulse rounded-xl" />
                                                <div className="text-xs font-mono text-yellow-300 uppercase tracking-widest w-full text-center border-b border-yellow-500/30 pb-2 z-10">
                                                    COMPLETE DATASET
                                                </div>

                                                <div className="flex-1 w-full relative flex items-center justify-center my-4 z-10">
                                                    <img
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${reward.pokemonId}.png`}
                                                        alt={reward.pokemonName}
                                                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                                                    />
                                                </div>

                                                <div className="text-xl font-black text-white uppercase tracking-tighter z-10 text-center">
                                                    {reward.pokemonName}
                                                </div>
                                                <div className="text-xs font-mono text-yellow-400 mt-2 z-10">
                                                    +{reward.amount} SHARDS FOUND
                                                </div>
                                            </motion.div>
                                        );
                                    }

                                    if (reward.type === 'credit') {
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ scale: 0, rotateY: 90 }}
                                                animate={{ scale: 1, rotateY: 0 }}
                                                transition={{
                                                    delay: 0.4 + (index * 0.15),
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 15
                                                }}
                                                className="relative aspect-[3/4] bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex flex-col items-center justify-between group hover:scale-105 transition-all duration-300"
                                            >
                                                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="text-xs font-mono text-yellow-500/60 uppercase tracking-widest w-full text-center border-b border-yellow-500/20 pb-2">
                                                    Bonus Reward
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                                    <Hexagon size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                                    <div className="text-3xl font-bold text-white drop-shadow-md">
                                                        {reward.amount}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-yellow-100 uppercase tracking-wide">
                                                    Credits
                                                </div>
                                            </motion.div>
                                        );
                                    }

                                    // Existing Shard Logic
                                    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${reward.pokemonId}.png`;
                                    // const isNewPiece = reward.currentPieces.includes(reward.pieceIndex); // Logic check: currentPieces has the piece. Was it new?
                                    // Actually, unlockPiece adds if not present. So if it's there now, we got it.
                                    // But we don't know if we *already* had it before this specific click without checking pre-state.
                                    // For now, let's just highlight the piece we "found" regardless if duplicate.

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ scale: 0, rotateY: 90 }}
                                            animate={{ scale: 1, rotateY: 0 }}
                                            transition={{
                                                delay: 0.4 + (index * 0.15),
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 15
                                            }}
                                            className={`relative aspect-[3/4] max-w-[200px] border rounded-xl p-4 flex flex-col items-center justify-between group transition-all duration-300 overflow-hidden 
                                                ${reward.isTargetReward
                                                    ? 'bg-blue-900/20 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                                    : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10'
                                                }`}
                                        >
                                            {/* Background Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            {/* Header */}
                                            <div className="text-xs font-mono text-white/40 uppercase tracking-widest w-full text-center border-b border-white/10 pb-2 z-10">
                                                {reward.isTargetReward ? (
                                                    <span className="text-blue-400 font-bold flex items-center justify-center gap-1">
                                                        <Target size={10} /> TARGET
                                                    </span>
                                                ) : (
                                                    `Packet #${reward.pokemonId}`
                                                )}
                                            </div>

                                            {/* Sprite Display */}
                                            <div className="flex-1 w-full relative flex items-center justify-center my-4 z-10">
                                                <div className="relative w-24 h-24">
                                                    {/* Silhouette Base */}
                                                    <img
                                                        src={spriteUrl}
                                                        alt={reward.pokemonName}
                                                        className="absolute w-full h-full object-contain filter brightness-0 opacity-100 grayscale"
                                                    />

                                                    {/* Unlocked Pieces */}
                                                    {CLIP_PATHS.map((clipPath, i) => (
                                                        <img
                                                            key={i}
                                                            src={spriteUrl}
                                                            alt=""
                                                            className={`
                                                                absolute w-full h-full object-contain
                                                                ${reward.currentPieces.includes(i) ? 'opacity-100' : 'opacity-0'}
                                                                ${i === reward.pieceIndex ? 'filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] z-20 brightness-110' : ''}
                                                            `}
                                                            style={{ clipPath }}
                                                        />
                                                    ))}
                                                </div>

                                                {/* "Found" Indicator for the specific piece */}
                                                <div className={`
                                                    absolute w-full h-full pointer-events-none border-2 border-yellow-400/0
                                                    ${reward.pieceIndex === 0 ? 'top-0 left-0 w-1/2 h-1/2 rounded-tl-lg' : ''}
                                                    ${reward.pieceIndex === 1 ? 'top-0 right-0 w-1/2 h-1/2 rounded-tr-lg' : ''}
                                                    ${reward.pieceIndex === 2 ? 'bottom-0 left-0 w-1/2 h-1/2 rounded-bl-lg' : ''}
                                                    ${reward.pieceIndex === 3 ? 'bottom-0 right-0 w-1/2 h-1/2 rounded-br-lg' : ''}
                                                `}>
                                                    {/* Optional: Add flashy border to the specific piece quadrant if we want to get fancy with CSS composition */}
                                                </div>
                                            </div>

                                            {/* Name Footer */}
                                            <div className="text-sm font-bold text-white/90 uppercase tracking-wide z-10 text-center">
                                                {reward.isFullyUnlocked ? reward.pokemonName : '???'}
                                                <div className="text-[10px] font-mono text-blue-400 mt-1">
                                                    Shard {['TL', 'TR', 'BL', 'BR'][reward.pieceIndex]}
                                                </div>
                                            </div>

                                            {/* New/Duplicate Badge (Mock logic for now, could compare pieces length) */}
                                            {/* <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] font-bold rounded border border-yellow-500/30">
                                                NEW!
                                            </div> */}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                onClick={onClose}
                                className="mt-12 px-10 py-4 bg-white text-black font-black text-lg uppercase tracking-widest rounded-full hover:bg-blue-400 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]"
                            >
                                Claim All
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const LootboxShop = ({ onClose, onOpenCrate }) => {
    const items = [
        {
            id: 'mini',
            title: 'Mini Cache',
            desc: 'Contains 1 Puzzle Shard',
            cost: 'FREE',
            color: 'green',
            icon: <Package size={40} className="text-green-400" />,
            delay: 0.1
        },
        {
            id: 'standard',
            title: 'Standard Supply',
            desc: 'Contains 4 Puzzle Shards',
            cost: 'FREE',
            color: 'blue',
            icon: <Package size={50} className="text-blue-400" />,
            delay: 0.2
        },
        {
            id: 'legendary',
            title: 'Legendary Vault',
            desc: 'Unlocks a FULL Pokemon Entry',
            cost: 'FREE',
            color: 'yellow',
            icon: <Shield size={60} className="text-yellow-400" />,
            delay: 0.3
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={onClose}
        >
            <div className="w-full max-w-6xl p-8 flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-5xl font-black text-white italic tracking-tighter mb-2">SUPPLY DEPOT</h2>
                    <p className="text-white/40 font-mono tracking-widest uppercase text-sm">Select Requisition Package</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    {items.map((item) => (
                        <motion.button
                            key={item.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: item.delay }}
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onOpenCrate(item.id)}
                            className={`group relative h-[400px] bg-slate-900/50 border border-${item.color}-500/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-6 overflow-hidden hover:border-${item.color}-500 hover:bg-${item.color}-900/10 transition-all duration-300`}
                        >
                            {/* Background Glow */}
                            <div className={`absolute inset-0 bg-${item.color}-500/5 group-hover:bg-${item.color}-500/20 transition-colors blur-3xl`} />

                            {/* Icon */}
                            <div className={`p-6 rounded-full bg-black/40 border border-${item.color}-500/20 group-hover:border-${item.color}-500 group-hover:shadow-[0_0_30px_rgba(var(--${item.color}-500),0.3)] transition-all`}>
                                {item.icon}
                            </div>

                            {/* Info */}
                            <div className="text-center z-10">
                                <h3 className={`text-2xl font-bold text-white mb-2 uppercase tracking-wide group-hover:text-${item.color}-400 transition-colors`}>{item.title}</h3>
                                <p className="text-white/50 text-sm max-w-[200px] leading-relaxed">{item.desc}</p>
                            </div>

                            {/* Button Fake */}
                            <div className={`mt-auto px-8 py-3 rounded-full bg-${item.color}-600/20 border border-${item.color}-500/50 text-${item.color}-300 font-mono font-bold text-sm uppercase tracking-widest group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
                                {item.cost}
                            </div>
                        </motion.button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="mt-12 text-white/30 hover:text-white flex items-center gap-2 text-sm uppercase tracking-widest transition-colors"
                >
                    <X size={16} /> Cancel Requisition
                </button>
            </div>
        </motion.div>
    );
};

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
    } = useMissionStore();

    const [activeTab, setActiveTab] = useState(categories[0] || 'Daily');
    const [newMissionText, setNewMissionText] = useState('');
    const [newMissionTime, setNewMissionTime] = useState(15); // Default 15 mins
    const [isAddingMission, setIsAddingMission] = useState(false);
    const [newCategoryText, setNewCategoryText] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [hoveredMission, setHoveredMission] = useState(null);

    // Lootbox & Shop State
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isLootboxOpen, setIsLootboxOpen] = useState(false);
    const [selectedCrateType, setSelectedCrateType] = useState('standard');

    const [isPokedexOpen, setIsPokedexOpen] = useState(false);

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

    const openCrate = (type) => {
        setSelectedCrateType(type);
        setIsShopOpen(false);
        setIsLootboxOpen(true);
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
            <div className={`relative z-10 w-full max-w-6xl h-[90vh] flex flex-col md:flex-row gap-8 p-8 transition-opacity duration-300 ${(isLootboxOpen || isPokedexOpen || isShopOpen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

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

                    {/* Action Buttons */}
                    <div className="w-full max-w-sm space-y-4">
                        {/* Launch Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLaunch}
                            disabled={timeBank <= 0}
                            className={`
                              relative w-full px-8 py-5 rounded-xl font-bold text-xl tracking-widest uppercase flex justify-center items-center gap-3 transition-all
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

                        {/* Pokedex Trigger */}
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsPokedexOpen(true)}
                            className="w-full px-6 py-4 rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm flex items-center justify-center gap-3 group transition-all"
                        >
                            <Grid size={20} className="text-red-400 group-hover:text-red-300 transition-colors" />
                            <span className="font-mono text-sm tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">Pokédex Archive</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" />
                        </motion.button>

                        {/* Lootbox Trigger (Opened Shop) */}
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsShopOpen(true)}
                            className="w-full px-6 py-4 rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm flex items-center justify-center gap-3 group transition-all"
                        >
                            <Gift size={20} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                            <span className="font-mono text-sm tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">Supply Depot</span>
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse ml-2" />
                        </motion.button>
                    </div>

                </div>

                {/* Right Column: Mission Log with Tabs */}
                {/* ... existing right column code ... */}
                <div className="flex-1 flex flex-col bg-black/40 border border-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
                    {/* ... (Existing Mission Log UI) ... */}
                    <div className="flex flex-col border-b border-white/10 bg-white/5">
                        <div className="flex items-center justify-between p-4 pb-2">
                            {/* ... Header ... */}
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
                        {/* ... Tab Area ... */}
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
                                    {categories.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
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
                                {/* ... Mission Form ... */}
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
                                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                                    <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded font-bold uppercase">Add</button>
                                </div>
                            </motion.form>
                        )}

                        <AnimatePresence mode="popLayout">
                            {filteredMissions.map((mission) => (
                                <motion.div
                                    key={mission.id}
                                    layout
                                    className={`relative group p-4 rounded-lg border transition-all duration-300 ${mission.completed ? 'bg-black/40 border-green-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10'}`}
                                    onMouseEnter={() => setHoveredMission(mission.id)}
                                    onMouseLeave={() => setHoveredMission(null)}
                                >
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${mission.completed ? 'border-green-500 bg-green-500/20' : 'border-white/20 group-hover:border-blue-400'}`} onClick={() => !mission.completed && completeMission(mission.id)}>
                                                    {mission.completed && <CheckCircle size={12} className="text-green-500" />}
                                                </div>
                                                <h3 className={`font-medium truncate ${mission.completed ? 'text-green-500/50' : 'text-white'}`}>{mission.text}</h3>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => removeMission(mission.id)} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
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

            {/* Overlays */}
            <AnimatePresence>
                {isShopOpen && (
                    <LootboxShop onClose={() => setIsShopOpen(false)} onOpenCrate={openCrate} />
                )}
                {isLootboxOpen && (
                    <LootboxOverlay onClose={() => setIsLootboxOpen(false)} type={selectedCrateType} />
                )}
                {isPokedexOpen && (
                    <PokedexModal onClose={() => setIsPokedexOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default HomeHub;

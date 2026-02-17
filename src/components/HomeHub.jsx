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
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-blue-50/90 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="relative w-full max-w-5xl h-[700px] flex flex-col items-center justify-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 p-4 text-blue-900/40 hover:text-blue-600 transition-colors z-50"
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
                            <div className={`relative w-64 h-64 bg-white border-4 border-${crateStyle.color}-400/50 rounded-3xl flex items-center justify-center shadow-[0_10px_40px_rgba(59,130,246,0.15)] group-hover:shadow-[0_20px_60px_rgba(59,130,246,0.25)] group-hover:border-${crateStyle.color}-400 transition-all duration-300 transform perspective-1000 rotate-x-12`}>
                                <div className="absolute inset-2 border-2 border-blue-100 rounded-2xl border-dashed" />
                                <div className={`text-${crateStyle.color}-500 group-hover:text-${crateStyle.color}-600 transition-colors duration-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.2)]`}>
                                    {crateStyle.icon}
                                </div>
                                <div className={`absolute bottom-6 text-xs text-${crateStyle.color}-300 font-mono tracking-[0.3em] uppercase`}>
                                    {crateStyle.title}
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-16 left-0 right-0 text-center text-blue-900/40 font-mono text-sm tracking-wider"
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
                                className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-12 tracking-tighter"
                            >
                                {type === 'legendary' ? 'LEGENDARY UNLOCK' : 'SHARDS ACQUIRED'}
                            </motion.h2>

                            <div className={`grid gap-6 w-full px-8 ${rewards.length === 1 ? 'place-items-center' : 'grid-cols-4'}`}>
                                {rewards.map((reward, index) => {
                                    if (reward.type === 'full_unlock') {
                                        return (
                                            <motion.div
                                                initial={{ scale: 0.8, rotate: -5 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 100 }}
                                                className="relative aspect-[3/4] w-64 bg-gradient-to-br from-yellow-50 to-amber-100 border-4 border-yellow-400 rounded-2xl p-6 flex flex-col items-center justify-between group shadow-[0_15px_40px_rgba(234,179,8,0.2)]"
                                            >
                                                <div className="absolute inset-0 bg-yellow-400/5 animate-pulse rounded-xl" />
                                                <div className="text-xs font-black font-mono text-yellow-700 uppercase tracking-widest w-full text-center border-b border-yellow-400/20 pb-2 z-10">
                                                    COMPLETE DATASET
                                                </div>

                                                <div className="flex-1 flex items-center justify-center p-4 drop-shadow-xl group-hover:scale-110 transition-transform">
                                                    <img
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${reward.pokemonId}.png`}
                                                        alt={reward.pokemonName}
                                                        className="w-full h-full object-contain pixel-art drop-shadow-md transition-transform group-hover:scale-110"
                                                    />
                                                </div>

                                                <div className="text-xl font-black text-slate-800 uppercase tracking-tighter z-10 text-center">
                                                    {reward.pokemonName}
                                                </div>
                                                <div className="text-xs font-bold text-yellow-600 mt-2 z-10 tracking-widest uppercase bg-white/50 px-3 py-1 rounded-full border border-yellow-200">
                                                    LEGENDARY
                                                </div>
                                            </motion.div>
                                        );
                                    }

                                    if (reward.type === 'credit') {
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ scale: 0.8, y: 20 }}
                                                animate={{ scale: 1, y: 0 }}
                                                transition={{
                                                    delay: 0.4 + (index * 0.15),
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 15
                                                }}
                                                className="relative aspect-[3/4] w-48 bg-white border-2 border-yellow-200 rounded-xl p-4 flex flex-col items-center justify-between shadow-lg"
                                            >
                                                <div className="text-[10px] font-black font-mono text-yellow-700 uppercase tracking-widest w-full text-center border-b border-yellow-100 pb-2">
                                                    Bonus Reward
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                                    <Hexagon size={48} className="text-yellow-500 drop-shadow-[0_10px_15px_rgba(234,179,8,0.2)]" />
                                                    <div className="text-3xl font-black text-slate-800">
                                                        {reward.amount}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">
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
                                                    ? 'bg-blue-50 border-blue-400/50 shadow-[0_10px_30px_rgba(59,130,246,0.1)]'
                                                    : 'bg-white border-blue-100 hover:border-blue-400/50 hover:bg-blue-50/50'
                                                }`}
                                        >
                                            {/* Background Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            {/* Header */}
                                            <div className="text-xs font-mono text-blue-900/30 uppercase tracking-widest w-full text-center border-b border-blue-100 pb-2 z-10">
                                                {reward.isTargetReward ? (
                                                    <span className="text-blue-600 font-bold flex items-center justify-center gap-1">
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
                                                        className="w-full h-full brightness-0 opacity-[0.05]"
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
                                            <div className="text-sm font-bold text-slate-800 uppercase tracking-wide z-10 text-center">
                                                {reward.isFullyUnlocked ? reward.pokemonName : '???'}
                                                <div className="text-[10px] font-mono text-blue-600 mt-1">
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
                                className="mt-12 px-10 py-4 bg-blue-600 text-white font-black text-lg uppercase tracking-widest rounded-full hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.4)]"
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
    const { coins, spendCoins, resetCoins } = useMissionStore();

    const items = [
        {
            id: 'mini',
            title: 'Mini Cache',
            desc: 'Contains 1 Puzzle Shard',
            price: 5,
            color: 'green',
            icon: <Package size={40} className="text-green-600" />,
            delay: 0.1
        },
        {
            id: 'standard',
            title: 'Standard Supply',
            desc: 'Contains 4 Puzzle Shards',
            price: 15,
            color: 'blue',
            icon: <Package size={50} className="text-blue-600" />,
            delay: 0.2
        },
        {
            id: 'legendary',
            title: 'Legendary Vault',
            desc: 'Unlocks a FULL Pokemon Entry',
            price: 60,
            color: 'yellow',
            icon: <Shield size={60} className="text-yellow-600" />,
            delay: 0.3
        }
    ];

    const handlePurchase = (item) => {
        if (coins >= item.price) {
            spendCoins(item.price);
            onOpenCrate(item.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-blue-50/95 backdrop-blur-xl"
            onClick={onClose}
        >
            <div className="w-full max-w-6xl p-8 flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-5xl font-black text-slate-800 italic tracking-tighter mb-2">SUPPLY DEPOT</h2>
                    <p className="text-blue-900/40 font-mono tracking-widest uppercase text-sm mb-6">Select Requisition Package</p>

                    <div className="inline-flex items-center gap-3 bg-blue-100/50 border border-blue-200 rounded-full px-6 py-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center border border-blue-400">
                            <span className="text-white font-bold text-sm">$</span>
                        </div>
                        <span className="text-2xl font-black text-slate-800">{coins}</span>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Credits Available</span>

                        {coins > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Are you sure you want to discard all your Credits?")) {
                                        resetCoins();
                                    }
                                }}
                                className="ml-2 p-1.5 text-yellow-900/40 hover:text-red-500 bg-yellow-900/10 hover:bg-black/20 rounded-full transition-all"
                                title="Discard Credits"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    {items.map((item) => (
                        <motion.button
                            key={item.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: item.delay }}
                            whileHover={coins >= item.price ? { scale: 1.05, y: -10 } : {}}
                            whileTap={coins >= item.price ? { scale: 0.95 } : {}}
                            onClick={() => handlePurchase(item)}
                            disabled={coins < item.price}
                            className={`group relative h-[400px] bg-white border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-6 overflow-hidden transition-all duration-300 
                                ${coins >= item.price
                                    ? `border-${item.color}-100 hover:border-${item.color}-500 shadow-xl hover:shadow-${item.color}-100 cursor-pointer`
                                    : 'border-slate-50 opacity-50 grayscale cursor-not-allowed'
                                }`}
                        >
                            {/* Background Glow */}
                            <div className={`absolute inset-0 bg-${item.color}-500/5 group-hover:bg-${item.color}-500/20 transition-colors blur-3xl`} />

                            {/* Icon */}
                            <div className={`p-6 rounded-full bg-blue-50 border border-${item.color}-100 group-hover:border-${item.color}-500 group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)] transition-all`}>
                                {item.icon}
                            </div>

                            {/* Info */}
                            <div className="text-center z-10">
                                <h3 className={`text-2xl font-bold text-slate-800 mb-2 uppercase tracking-wide group-hover:text-${item.color}-600 transition-colors`}>{item.title}</h3>
                                <p className="text-slate-500 text-sm max-w-[200px] leading-relaxed">{item.desc}</p>
                            </div>

                            {/* Button Fake */}
                            <div className={`mt-auto px-8 py-3 rounded-full border-2 font-mono font-bold text-sm uppercase tracking-widest transition-all flex items-center gap-2
                                ${coins >= item.price
                                    ? `bg-${item.color}-50 border-${item.color}-200 text-${item.color}-600 group-hover:bg-${item.color}-500 group-hover:text-white`
                                    : 'bg-slate-50 border-slate-100 text-slate-300'
                                }`}>
                                <span className={coins >= item.price ? "text-inherit" : "text-white/20"}>$</span> {item.price}
                            </div>
                        </motion.button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="mt-12 text-blue-900/40 hover:text-blue-600 flex items-center gap-2 text-sm uppercase tracking-widest transition-colors"
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
        coins,
        missions,
        categories,
        addCategory,
        removeCategory,
        addMission,
        removeMission,
        completeMission,
        resetMission,
        resetDailyMissions,
        resetTimeBank,
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
    const [categoryToDelete, setCategoryToDelete] = useState(null);

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-blue-50 text-slate-800 select-none">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                {bgImage ? (
                    <div
                        className="w-full h-full bg-cover bg-center opacity-30 blur-md scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 via-white to-blue-50 opacity-100" />
                )}
                <div className="absolute inset-0 bg-white/40" />
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
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800">
                            ATLAS
                        </h1>
                        <p className="text-xl text-blue-900/40 font-mono tracking-[0.3em] uppercase mt-2">
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
                        <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative border border-blue-100 bg-white/80 backdrop-blur-md rounded-2xl p-6 text-center shadow-[0_10px_40px_rgba(59,130,246,0.1)]">
                            {timeBank > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to reset your Time Bank to 0?")) {
                                            resetTimeBank();
                                        }
                                    }}
                                    className="absolute top-3 right-3 p-2 text-blue-900/10 hover:text-red-500 transition-colors"
                                    title="Reset Time"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                                <Clock size={20} />
                                <span className="text-sm font-bold uppercase tracking-widest">Time Bank</span>
                            </div>
                            <div className={`text-5xl font-mono font-bold tracking-wider ${timeBank > 0 ? 'text-slate-800' : 'text-red-500'}`}>
                                {formatTime(timeBank)}
                            </div>
                            <div className="mt-2 text-xs text-blue-900/40">
                                {timeBank > 0 ? 'System Ready' : 'Insufficient Resources'}
                            </div>

                            {/* Coin Display */}
                            <div className="absolute -right-4 -bottom-4 bg-white border border-blue-100 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl transform rotate-[-2deg]">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                    <span className="text-white font-bold text-lg">$</span>
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-xl font-black text-slate-800">{coins || 0}</span>
                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Credits</span>
                                </div>
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
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] cursor-pointer border border-blue-400/30'
                                    : 'bg-blue-100 text-blue-300 border border-blue-200 cursor-not-allowed'}
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
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsPokedexOpen(true)}
                            className="w-full px-6 py-4 rounded-xl border border-blue-100 bg-white/60 backdrop-blur-sm flex items-center justify-center gap-3 group transition-all shadow-sm hover:shadow-md"
                        >
                            <Grid size={20} className="text-blue-600 group-hover:text-blue-500 transition-colors" />
                            <span className="font-mono text-sm tracking-widest uppercase text-slate-600 group-hover:text-slate-800 transition-colors">Pokédex Archive</span>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-2" />
                        </motion.button>

                        {/* Lootbox Trigger (Opened Shop) */}
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsShopOpen(true)}
                            className="w-full px-6 py-4 rounded-xl border border-blue-100 bg-white/60 backdrop-blur-sm flex items-center justify-center gap-3 group transition-all shadow-sm hover:shadow-md"
                        >
                            <Gift size={20} className="text-indigo-600 group-hover:text-indigo-500 transition-colors" />
                            <span className="font-mono text-sm tracking-widest uppercase text-slate-600 group-hover:text-slate-800 transition-colors">Supply Depot</span>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse ml-2" />
                        </motion.button>
                    </div>

                </div>

                {/* Right Column: Mission Log with Tabs */}
                {/* ... existing right column code ... */}
                <div className="flex-1 flex flex-col bg-white/80 border border-blue-100 backdrop-blur-md rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(59,130,246,0.1)]">
                    {/* ... (Existing Mission Log UI) ... */}
                    <div className="flex flex-col border-b border-blue-100 bg-blue-50/20">
                        <div className="flex items-center justify-between p-4 pb-2">
                            {/* ... Header ... */}
                            <h2 className="text-xl font-bold tracking-wider text-slate-800 flex items-center gap-2">
                                <LayoutGrid size={20} className="text-blue-600" />
                                LOGS
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAddingMission(!isAddingMission)}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs uppercase font-bold tracking-wider ${isAddingMission ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'}`}
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
                                            ? 'border-blue-600 bg-blue-50/50'
                                            : 'border-transparent hover:bg-blue-50/30'}
                   `}
                                >
                                    <button
                                        onClick={() => setActiveTab(cat)}
                                        className={`
                       px-4 py-2 text-sm font-medium transition-colors
                       ${activeTab === cat ? 'text-blue-700' : 'text-slate-400 hover:text-slate-800'}
                     `}
                                    >
                                        {cat}
                                    </button>
                                    {categories.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCategoryToDelete(cat);
                                            }}
                                            className={`
                         mr-2 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all
                         ${activeTab === cat ? 'text-blue-600 hover:bg-blue-200/50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}
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
                                        className="bg-white border border-blue-200 rounded px-2 py-1 text-xs text-slate-800 w-24 outline-none mr-1 focus:border-blue-500"
                                        autoFocus
                                        onBlur={() => !newCategoryText && setIsAddingCategory(false)}
                                    />
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsAddingCategory(true)}
                                    className="px-3 py-2 text-blue-900/20 hover:text-blue-600 transition-colors"
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
                                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-4 shadow-inner"
                            >
                                {/* ... Mission Form ... */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-blue-800 uppercase tracking-wider font-extrabold mb-1 block">Task Description</label>
                                        <input
                                            type="text"
                                            value={newMissionText}
                                            onChange={(e) => setNewMissionText(e.target.value)}
                                            placeholder="Enter mission objective..."
                                            className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-slate-800 focus:border-blue-500 outline-none text-sm placeholder-slate-300 shadow-sm"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-blue-800 uppercase tracking-wider font-extrabold mb-1 block">Reward (Minutes)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={newMissionTime}
                                                onChange={(e) => setNewMissionTime(Math.max(1, parseInt(e.target.value) || 0))}
                                                className="w-20 bg-white border border-blue-200 rounded px-3 py-2 text-slate-800 focus:border-blue-500 outline-none text-sm text-center font-mono shadow-sm"
                                            />
                                            <div className="flex gap-1">
                                                {[5, 10, 15, 30, 60].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setNewMissionTime(m)}
                                                        className={`px-3 py-2 rounded text-xs font-bold border transition-all ${newMissionTime === m ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-white border-blue-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                                    >
                                                        {m}m
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                                    <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded font-black uppercase tracking-widest shadow-md hover:bg-blue-500 transition-colors">Add Mission</button>
                                </div>
                            </motion.form>
                        )}

                        <AnimatePresence mode="popLayout">
                            {filteredMissions.map((mission) => (
                                <motion.div
                                    key={mission.id}
                                    layout
                                    className={`relative group p-4 rounded-xl border-2 transition-all duration-300 ${mission.completed ? 'bg-blue-50/50 border-blue-100 opacity-60' : 'bg-white border-blue-50 hover:border-blue-300 hover:shadow-lg shadow-sm'}`}
                                    onMouseEnter={() => setHoveredMission(mission.id)}
                                    onMouseLeave={() => setHoveredMission(null)}
                                >
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${mission.completed ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-100 bg-blue-50 group-hover:border-blue-400 group-hover:bg-white'}`} onClick={() => !mission.completed && completeMission(mission.id)}>
                                                    {mission.completed && <CheckCircle size={14} />}
                                                </div>
                                                <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
                                                    <h3 className={`font-bold truncate ${mission.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{mission.text}</h3>
                                                    <span className={`text-[10px] font-mono font-black px-2 py-1 rounded-full border-2 whitespace-nowrap flex items-center gap-1 ${mission.completed ? 'bg-blue-100 border-blue-200 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                        <Clock size={10} />
                                                        {Math.floor(mission.reward / 60)}M
                                                    </span>
                                                    <span className={`text-[10px] font-mono font-black px-2 py-1 rounded-full border-2 whitespace-nowrap flex items-center gap-1 ${mission.completed ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                        <span className="font-bold text-[10px]">$</span>
                                                        {mission.coinReward || Math.floor(mission.reward / 60)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {mission.completed && (
                                                <button onClick={() => resetMission(mission.id)} className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors" title="Reset Mission">
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => removeMission(mission.id)} className="p-1.5 text-blue-900/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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
                className="absolute bottom-8 text-xs text-blue-900/40 font-mono tracking-widest flex items-center gap-4 hidden md:flex"
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
                {categoryToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10001] flex items-center justify-center bg-blue-900/10 backdrop-blur-sm"
                        onClick={() => setCategoryToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border-2 border-red-100 p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />

                            <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Trash2 className="text-red-500" />
                                Delete Category?
                            </h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Are you sure you want to delete <span className="text-red-500 font-extrabold">"{categoryToDelete}"</span>?
                                <br />All missions in this category will be moved to the default "Daily" tab.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setCategoryToDelete(null)}
                                    className="px-4 py-2 text-slate-400 hover:text-slate-600 font-black uppercase text-xs tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (activeTab === categoryToDelete) {
                                            const remaining = categories.filter(c => c !== categoryToDelete);
                                            setActiveTab(remaining[0]);
                                        }
                                        removeCategory(categoryToDelete);
                                        setCategoryToDelete(null);
                                    }}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg shadow-red-900/20 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HomeHub;

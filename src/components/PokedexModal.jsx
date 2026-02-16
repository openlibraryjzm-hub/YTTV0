import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check, Grid, Search } from 'lucide-react';
import { usePokedexStore } from '../store/pokedexStore';

// Define clip paths for quadrants
const CLIP_PATHS = [
    'polygon(0 0, 50% 0, 50% 50%, 0 50%)',       // TL (0)
    'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)', // TR (1)
    'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)', // BL (2)
    'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' // BR (3)
];

const PokemonCard = ({ pokemon }) => {
    const { id, name, isFullyUnlocked, pieces } = pokemon;
    // Use official artwork for better quality if possible, otherwise sprite
    // Official artwork: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png
    // Pixel sprite: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    // Fallback to pixel sprite on error? Handled by img onError normally but let's stick to one source for now.

    return (
        <motion.div
            layout
            className={`
                relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group
                ${isFullyUnlocked
                    ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 hover:z-10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
            `}
        >
            {/* Background Grid Pattern for empty slots */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '10px 10px'
                }}
            />

            {/* ID Badge */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-white/30 font-bold z-20">
                #{String(id).padStart(3, '0')}
            </div>

            {/* Main Image Container */}
            <div className="absolute inset-0 p-4">
                <div className="relative w-full h-full flex items-center justify-center">

                    {/* Base Layer: Silhouette (Always visible to show shape, or only if no pieces?) 
                        Decision: Always show black silhouette as base. 
                        As pieces are added, the color version overlays it.
                        This creates the "filling in" effect.
                    */}
                    <img
                        src={spriteUrl}
                        alt={name}
                        className="absolute w-full h-full object-contain filter brightness-0 opacity-40 grayscale"
                        draggable={false}
                    />

                    {/* Puzzle Piece Layers (Colored) */}
                    {CLIP_PATHS.map((clipPath, index) => (
                        <img
                            key={index}
                            src={spriteUrl}
                            alt={`${name} piece ${index}`}
                            className={`
                                absolute w-full h-full object-contain transition-opacity duration-500
                                ${pieces && pieces.includes(index) ? 'opacity-100' : 'opacity-0'}
                            `}
                            style={{ clipPath }}
                            draggable={false}
                        />
                    ))}
                </div>
            </div>

            {/* Name Label */}
            <div className={`
                absolute bottom-0 left-0 right-0 p-2 text-center text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors
                ${isFullyUnlocked ? 'bg-blue-600/80 text-white' : 'bg-black/40 text-white/30'}
            `}>
                {isFullyUnlocked ? name : '???'}
            </div>

            {/* Lock Overlay for completely locked (0 pieces) - Optional, maybe just silhouette is enough */}
            {(!pieces || pieces.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Lock size={24} className="text-white/20" />
                </div>
            )}

            {/* Completion Checkmark */}
            {isFullyUnlocked && (
                <div className="absolute top-2 right-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={16} strokeWidth={3} />
                </div>
            )}

        </motion.div>
    );
};

const PokedexModal = ({ onClose }) => {
    // Get store data
    const {
        unlockedPieces,
        getAllPokemon,
        resetProgress
    } = usePokedexStore();

    // Re-render when unlockedPieces changes
    const [pokemonList, setPokemonList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isResetConfirming, setIsResetConfirming] = useState(false);

    useEffect(() => {
        // Hydrate data
        const data = getAllPokemon(); // This function in store should return array of { id, name, pieces, isFullyUnlocked }
        setPokemonList(data);
    }, [unlockedPieces]); // Re-run when pieces change

    const filteredList = pokemonList.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).includes(searchQuery)
    );

    // Calculate stats
    const totalUnlocked = pokemonList.filter(p => p.isFullyUnlocked).length;
    const totalPieces = Object.values(unlockedPieces).reduce((acc, curr) => acc + curr.length, 0);
    const totalPossiblePieces = 151 * 4;
    const progressPercent = (totalPieces / totalPossiblePieces) * 100;

    const handleReset = () => {
        resetProgress();
        setIsResetConfirming(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[90vw] h-[90vh] bg-slate-900/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-600 border-4 border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                            <div className="w-4 h-4 rounded-full bg-blue-400 animate-pulse border-2 border-white/20" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-white">POKÉDEX <span className="text-white/20 text-xl not-italic ml-2">GEN 1</span></h2>
                            <div className="flex items-center gap-4 text-xs font-mono text-white/40 mt-1">
                                <span>SEEN: {151}</span>
                                <span className={totalUnlocked === 151 ? 'text-yellow-400' : ''}>OWNED: {totalUnlocked}</span>
                                <span className="text-blue-400">PIECES: {totalPieces}/{totalPossiblePieces}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 max-w-md px-8">
                        <div className="flex justify-between text-xs font-bold text-white/30 mb-2 uppercase tracking-wider">
                            <span>Database Completion</span>
                            <span>{Math.floor(progressPercent)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                            <input
                                type="text"
                                placeholder="Search Pokémon..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-black/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-64 transition-all focus:w-80"
                            />
                        </div>

                        {/* Reset Button */}
                        {isResetConfirming ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full animate-pulse transition-colors"
                                >
                                    CONFIRM WIPE?
                                </button>
                                <button
                                    onClick={() => setIsResetConfirming(false)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsResetConfirming(true)}
                                className="px-4 py-2 text-red-500/50 hover:text-red-400 hover:bg-red-900/20 text-xs font-bold rounded-full transition-all border border-transparent hover:border-red-500/30"
                            >
                                RESET DATABASE
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                        {filteredList.map(pokemon => (
                            <PokemonCard key={pokemon.id} pokemon={pokemon} />
                        ))}
                    </div>

                    {
                        filteredList.length === 0 && (
                            <div className="w-full h-64 flex flex-col items-center justify-center text-white/20">
                                <Grid size={48} className="mb-4 opacity-50" />
                                <p>No data found matching coordinates.</p>
                            </div>
                        )
                    }
                </div>

                {/* Decorative Footer */}
                <div className="h-2 bg-gradient-to-r from-red-600 via-blue-600 to-red-600 opacity-50" />
            </div>
        </motion.div >
    );
};

export default PokedexModal;

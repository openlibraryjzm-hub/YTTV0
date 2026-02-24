import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check, Grid, Search } from 'lucide-react';
import { usePokedexStore } from '../store/pokedexStore';
import { GEN_1_POKEMON_TYPES } from '../data/gen1PokemonTypes';
import { GEN_1_POKEMON_LORE } from '../data/gen1PokemonLore';
import { GEN_1_POKEMON_PHYSICAL } from '../data/gen1PokemonPhysical';

// Pokemon DB sprite URL pattern: https://img.pokemondb.net/sprites/{game}/{normal|shiny}/{slug}.png
// One game per generation (Gen 1–6); table layout: rows = Normal, Shiny | cols = Gen 1…6
const POKEMON_DB_GENS = [
    { key: 'red-blue', gen: 1, label: 'Gen 1' },
    { key: 'silver', gen: 2, label: 'Gen 2' },
    { key: 'ruby-sapphire', gen: 3, label: 'Gen 3' },
    { key: 'diamond-pearl', gen: 4, label: 'Gen 4' },
    { key: 'black-white', gen: 5, label: 'Gen 5' },
    { key: 'x-y', gen: 6, label: 'Gen 6' }
];
const SPRITE_VARIANTS = [
    { key: 'normal', label: 'Normal' },
    { key: 'shiny', label: 'Shiny' }
];

const GEN_1_SLUG_OVERRIDES = {
    29: 'nidoran-f',
    32: 'nidoran-m',
    83: 'farfetchd',
    122: 'mr-mime'
};

function getPokemonSlug(id, name) {
    if (GEN_1_SLUG_OVERRIDES[id]) return GEN_1_SLUG_OVERRIDES[id];
    return name.toLowerCase()
        .replace(/[♀♂'.]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^\-|\-$/g, '');
}

function getPokemonDbSpriteUrl(slug, gameKey, variant) {
    return `https://img.pokemondb.net/sprites/${gameKey}/${variant}/${slug}.png`;
}

// Define clip paths for quadrants
const CLIP_PATHS = [
    'polygon(0 0, 50% 0, 50% 50%, 0 50%)',       // TL (0)
    'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)', // TR (1)
    'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)', // BL (2)
    'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' // BR (3)
];

const PokemonCard = ({ pokemon, onSelect }) => {
    const { id, name, isFullyUnlocked, pieces } = pokemon;
    // Use official artwork for better quality if possible, otherwise sprite
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    const handleClick = () => {
        if (isFullyUnlocked && onSelect) onSelect(pokemon);
    };

    return (
        <motion.div
            layout
            onClick={handleClick}
            role={isFullyUnlocked ? 'button' : undefined}
            tabIndex={isFullyUnlocked ? 0 : undefined}
            onKeyDown={e => { if (isFullyUnlocked && onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(pokemon); } }}
            className={`
                relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group
                ${isFullyUnlocked
                    ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 hover:z-10 cursor-pointer'
                    : 'bg-white/5 border-white/10 hover:border-white/20'}
            `}
        >
            {/* Background Grid Pattern for empty slots */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                    backgroundSize: '10px 10px'
                }}
            />

            {/* ID Badge */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-blue-900/20 font-black z-20">
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
                absolute bottom-0 left-0 right-0 p-2 text-center text-xs font-black uppercase tracking-wider backdrop-blur-sm transition-colors
                ${isFullyUnlocked ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-400'}
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
                <div className="absolute top-2 right-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={16} strokeWidth={4} />
                </div>
            )}

        </motion.div>
    );
};

const POKEDEX_VERSION_PREFERRED = 'sun'; // Pokemon Sun entries (same as on Pokemon DB)

// Type colors (aligned with Pokemon DB / classic games) for badges
const TYPE_COLORS = {
    normal: 'bg-slate-400 text-white',
    fire: 'bg-orange-500 text-white',
    water: 'bg-blue-500 text-white',
    electric: 'bg-amber-400 text-slate-900',
    grass: 'bg-green-500 text-white',
    ice: 'bg-cyan-300 text-slate-900',
    fighting: 'bg-rose-600 text-white',
    poison: 'bg-violet-600 text-white',
    ground: 'bg-amber-700 text-white',
    flying: 'bg-indigo-300 text-slate-900',
    psychic: 'bg-pink-500 text-white',
    bug: 'bg-lime-600 text-white',
    rock: 'bg-amber-600 text-white',
    ghost: 'bg-purple-500 text-white',
    dragon: 'bg-indigo-600 text-white',
    dark: 'bg-slate-700 text-white',
    steel: 'bg-slate-400 text-slate-900',
    fairy: 'bg-pink-300 text-slate-900'
};

function normalizeFlavorText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

const PokemonDetailPopup = ({ pokemon, onClose }) => {
    const { id, name } = pokemon;
    const slug = getPokemonSlug(id, name);
    const officialArtUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    const [pokedexEntry, setPokedexEntry] = useState(null);
    const [pokedexVersion, setPokedexVersion] = useState(POKEDEX_VERSION_PREFERRED);
    const [pokedexLoading, setPokedexLoading] = useState(true);

    // Types, lore, and physical from hardcoded Gen 1 data (atlas/gen1-pokemon-reference.md → src/data/)
    const types = GEN_1_POKEMON_TYPES[id] || [];
    const lore = GEN_1_POKEMON_LORE[id];
    const physical = GEN_1_POKEMON_PHYSICAL[id];
    // Female % for gender ring (0–100); null = genderless
    const femalePct = physical == null ? null : physical.genderRate === -1 ? null : physical.genderRate === 0 ? 0 : physical.genderRate === 8 ? 100 : physical.genderRate >= 1 && physical.genderRate <= 7 ? physical.genderRate * 12.5 : Math.round((physical.genderRate / 256) * 100);

    useEffect(() => {
        let cancelled = false;
        setPokedexLoading(true);
        setPokedexEntry(null);
        setPokedexVersion(POKEDEX_VERSION_PREFERRED);
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Not ok')))
            .then(data => {
                if (cancelled) return;
                const entries = data.flavor_text_entries || [];
                const enSun = entries.find(e => e.language?.name === 'en' && e.version?.name === POKEDEX_VERSION_PREFERRED);
                if (enSun) {
                    setPokedexEntry(normalizeFlavorText(enSun.flavor_text));
                    setPokedexVersion('Sun');
                } else {
                    const firstEn = entries.find(e => e.language?.name === 'en');
                    if (firstEn) {
                        setPokedexEntry(normalizeFlavorText(firstEn.flavor_text));
                        const ver = firstEn.version?.name?.replace(/-/g, ' ') || 'other';
                        setPokedexVersion(ver.replace(/\b\w/g, c => c.toUpperCase()));
                    } else {
                        setPokedexEntry('');
                    }
                }
            })
            .catch(() => {
                if (!cancelled) setPokedexEntry('');
            })
            .finally(() => {
                if (!cancelled) setPokedexLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10002] flex items-center justify-center bg-blue-50/90 backdrop-blur-xl p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_20px_60px_rgba(59,130,246,0.15)] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-100"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Nameplate - light theme to match Pokedex/HomeHub; pr-14 leaves room for close button */}
                <div className="relative px-8 pt-8 pb-4 pr-14 border-b border-blue-100 bg-blue-50/20">
                    <div className="relative flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-blue-900/40 font-mono text-xs uppercase tracking-[0.3em] mb-1">National №</p>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
                                {name}
                            </h2>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-slate-500 font-mono text-lg">#{String(id).padStart(3, '0')}</p>
                                {types.length > 0 && (
                                    <span className="flex items-center gap-1.5 flex-wrap">
                                        {types.map((typeName) => (
                                            <span
                                                key={typeName}
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${TYPE_COLORS[typeName] || 'bg-slate-300 text-slate-700'}`}
                                            >
                                                {typeName}
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Pokémon image with gender-ratio ring (blue = male, pink = female); moved left for close button space */}
                        <div className="relative flex-shrink-0 mr-12 flex items-center justify-center">
                            <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                                {physical != null && (() => {
                                    const r = 48;
                                    const circumference = 2 * Math.PI * r;
                                    return (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                                            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="5" className="stroke-slate-200/80" />
                                            {femalePct === null ? (
                                                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="5" strokeDasharray="4 6" className="stroke-slate-400" />
                                            ) : (
                                                <>
                                                    <circle
                                                        cx="50" cy="50" r={r}
                                                        fill="none" strokeWidth="5"
                                                        stroke="#ec4899"
                                                        strokeDasharray={`${(femalePct / 100) * circumference} ${circumference}`}
                                                        strokeDashoffset={0}
                                                        className="transition-[stroke-dasharray] duration-500"
                                                    />
                                                    <circle
                                                        cx="50" cy="50" r={r}
                                                        fill="none" strokeWidth="5"
                                                        stroke="#3b82f6"
                                                        strokeDasharray={`${((100 - femalePct) / 100) * circumference} ${circumference}`}
                                                        strokeDashoffset={-((femalePct / 100) * circumference)}
                                                        className="transition-[stroke-dasharray] duration-500"
                                                    />
                                                </>
                                            )}
                                        </svg>
                                    );
                                })()}
                                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white/90 flex items-center justify-center">
                                    <img
                                        src={officialArtUrl}
                                        alt={name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pokédex entry (Sun preferred; from PokeAPI) — styled as iconic quote */}
                <div className="px-6 pt-4 pb-4 border-b border-blue-100">
                    <div className="relative py-6 px-8 rounded-2xl bg-gradient-to-b from-slate-50/90 to-blue-50/50 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <span className="absolute top-4 left-6 text-5xl font-serif text-blue-300/60 leading-none select-none" aria-hidden>"</span>
                        <span className="absolute top-4 right-6 text-5xl font-serif text-blue-300/60 leading-none select-none transform scale-x-[-1]" aria-hidden>"</span>
                        {pokedexLoading ? (
                            <p className="text-slate-400 italic text-center py-4">Loading…</p>
                        ) : pokedexEntry ? (
                            <>
                                <p className="text-slate-700 text-base md:text-lg leading-relaxed text-center font-serif italic max-w-xl mx-auto">
                                    {pokedexEntry}
                                </p>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.25em] text-center mt-4">
                                    — Pokémon {pokedexVersion}
                                </p>
                            </>
                        ) : (
                            <p className="text-slate-400 italic text-center py-4">No entry available.</p>
                        )}
                    </div>
                </div>

                {/* Lore summary (from atlas/gen1-pokemon-reference.md when available) */}
                {lore && (
                    <div className="px-6 pt-4 pb-4 border-b border-blue-100">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">Lore</h3>
                        <p className="text-slate-700 text-sm leading-relaxed font-medium tracking-wide">{lore}</p>
                    </div>
                )}

                {/* Sprites table: rows = Normal, Shiny | columns = Gen 1–6 (like Pokemon DB) */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Sprites</h3>
                    <p className="text-xs text-blue-900/40 font-mono mb-4">Source: Pokémon Database</p>
                    <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-sm">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-blue-100 bg-blue-50/50">
                                    <th className="p-3 text-xs font-black text-slate-500 uppercase tracking-wider">Type</th>
                                    {POKEMON_DB_GENS.map(({ label }) => (
                                        <th key={label} className="p-3 text-xs font-black text-slate-600 uppercase tracking-wider text-center">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {SPRITE_VARIANTS.map(({ key: variantKey, label: variantLabel }) => (
                                    <tr key={variantKey} className="border-b border-blue-50 last:border-b-0">
                                        <td className="p-3 text-xs font-bold text-slate-600 uppercase tracking-wider align-middle w-20">
                                            {variantLabel}
                                        </td>
                                        {POKEMON_DB_GENS.map(({ key: gameKey, gen }) => {
                                            const isGen1Shiny = variantKey === 'shiny' && gen === 1;
                                            return (
                                                <td key={gameKey} className="p-2 text-center align-middle">
                                                    <div className="w-14 h-14 mx-auto rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-center overflow-hidden">
                                                        {isGen1Shiny ? (
                                                            <span className="text-slate-300 font-light text-2xl tracking-[0.2em]" aria-hidden="true">—</span>
                                                        ) : (
                                                            <img
                                                                src={getPokemonDbSpriteUrl(slug, gameKey, variantKey)}
                                                                alt={`${name} ${variantLabel}`}
                                                                className="w-full h-full object-contain pixel-art"
                                                                loading="lazy"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="h-2 bg-gradient-to-r from-red-500 via-blue-500 to-indigo-600 opacity-100 shadow-[0_-4px_10px_rgba(59,130,246,0.1)]" />
            </motion.div>
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
    const [selectedPokemon, setSelectedPokemon] = useState(null);

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
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-blue-50/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[90vw] h-[90vh] bg-white border border-blue-100 rounded-2xl flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(59,130,246,0.15)] relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-blue-50/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500 border-4 border-white flex items-center justify-center shadow-lg">
                            <div className="w-4 h-4 rounded-full bg-blue-400 animate-pulse border-2 border-white/40" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-slate-800">POKÉDEX <span className="text-blue-900/20 text-xl not-italic ml-2 font-mono">GEN 1</span></h2>
                            <div className="flex items-center gap-4 text-xs font-mono text-blue-900/40 mt-1 uppercase font-black">
                                <span>SEEN: {151}</span>
                                <span className={totalUnlocked === 151 ? 'text-yellow-600' : ''}>OWNED: {totalUnlocked}</span>
                                <span className="text-blue-600">PIECES: {totalPieces}/{totalPossiblePieces}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 max-w-md px-8">
                        <div className="flex justify-between text-xs font-black text-blue-900/20 mb-2 uppercase tracking-widest">
                            <span>Database Completion</span>
                            <span>{Math.floor(progressPercent)}%</span>
                        </div>
                        <div className="h-3 w-full bg-blue-50 rounded-full overflow-hidden border border-blue-100/50 shadow-inner">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search Pokémon..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white border border-blue-100 rounded-full py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-blue-500 outline-none w-64 transition-all focus:w-80 shadow-sm"
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
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-full transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsResetConfirming(true)}
                                className="px-4 py-2 text-red-500/50 hover:text-red-500 hover:bg-red-50 text-xs font-black rounded-full transition-all border border-transparent hover:border-red-200"
                            >
                                RESET DATABASE
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-3 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors border border-blue-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                        {filteredList.map(pokemon => (
                            <PokemonCard
                                key={pokemon.id}
                                pokemon={pokemon}
                                onSelect={setSelectedPokemon}
                            />
                        ))}
                    </div>

                    {
                        filteredList.length === 0 && (
                            <div className="w-full h-64 flex flex-col items-center justify-center text-blue-900/20">
                                <Grid size={48} className="mb-4 opacity-30" />
                                <p className="font-mono font-black uppercase tracking-widest">No data found matching coordinates.</p>
                            </div>
                        )
                    }
                </div>

                {/* Decorative Footer */}
                <div className="h-2 bg-gradient-to-r from-red-500 via-blue-500 to-indigo-600 opacity-100 shadow-[0_-4px_10px_rgba(59,130,246,0.1)]" />
            </div>

            {/* Detail popup (only when an unlocked Pokémon is clicked) */}
            <AnimatePresence>
                {selectedPokemon && (
                    <PokemonDetailPopup
                        key={selectedPokemon.id}
                        pokemon={selectedPokemon}
                        onClose={() => setSelectedPokemon(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div >
    );
};

export default PokedexModal;

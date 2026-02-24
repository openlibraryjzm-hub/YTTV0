import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Gen 1 Pokemon Data (1-151)
// We generate this programmatically to save space, fetching names/types could be done via an API or a large JSON if needed.
// For now, we'll just store IDs and names if simple, or fetch names on the fly?
// Better to have a static list of names for Gen 1 to avoid layout shift/loading.
const GEN_1_NAMES = [
    "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
    "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
    "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot",
    "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok",
    "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina",
    "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable",
    "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat",
    "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat",
    "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck",
    "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag",
    "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop",
    "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool",
    "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash",
    "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo",
    "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder",
    "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee",
    "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute",
    "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung",
    "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela",
    "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu",
    "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar",
    "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto",
    "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte",
    "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno",
    "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo",
    "Mew"
];

export const usePokedexStore = create(
    persist(
        (set, get) => ({
            // Core State: unlockedPieces[pokemonId] = [pieceIndex1, pieceIndex2, ...]
            // pieceIndex is 0 (TL), 1 (TR), 2 (BL), 3 (BR)
            // Core State: unlockedPieces[pokemonId] = [pieceIndex1, pieceIndex2, ...]
            // pieceIndex is 0 (TL), 1 (TR), 2 (BL), 3 (BR)
            unlockedPieces: {},
            standardTargetId: null, // Track the current "consistent" Pokemon target

            // Actions
            setStandardTarget: (id) => set({ standardTargetId: id }),

            unlockPiece: (pokemonId, pieceIndex) => set((state) => {
                const currentPieces = state.unlockedPieces[pokemonId] || [];
                if (currentPieces.includes(pieceIndex)) return state; // Already owned

                const newPieces = [...currentPieces, pieceIndex].sort();

                // If this completes the current standard target, clear it so a new one is picked next time
                let newTargetId = state.standardTargetId;
                if (state.standardTargetId === pokemonId && newPieces.length === 4) {
                    newTargetId = null;
                }

                return {
                    unlockedPieces: {
                        ...state.unlockedPieces,
                        [pokemonId]: newPieces
                    },
                    standardTargetId: newTargetId
                };
            }),

            isFullyUnlocked: (pokemonId) => {
                const pieces = get().unlockedPieces[pokemonId];
                return pieces && pieces.length === 4;
            },

            // Getters
            getPokemonById: (id) => {
                const pieces = get().unlockedPieces[id] || [];
                return {
                    id,
                    name: GEN_1_NAMES[id - 1] || `Pokemon #${id}`,
                    pieces,
                    isUnlocked: pieces.length === 4
                };
            },

            getMissingPieces: () => {
                const missing = [];
                const state = get();
                // 151 Pokemon, 4 pieces each
                for (let i = 1; i <= 151; i++) {
                    const unlocked = state.unlockedPieces[i] || [];
                    // Only check 0-3
                    for (let p = 0; p < 4; p++) {
                        if (!unlocked.includes(p)) {
                            missing.push({ pokemonId: i, pieceIndex: p });
                        }
                    }
                }
                return missing;
            },

            getAllPokemon: () => {
                return GEN_1_NAMES.map((name, index) => {
                    const id = index + 1;
                    const pieces = get().unlockedPieces[id] || [];
                    return {
                        id,
                        name,
                        pieces,
                        isUnlocked: pieces.length === 4,
                        isFullyUnlocked: pieces.length === 4
                    };
                });
            },

            // Debug/Testing
            unlockAll: () => {
                const allUnlocked = {};
                for (let i = 1; i <= 151; i++) {
                    allUnlocked[i] = [0, 1, 2, 3];
                }
                set({ unlockedPieces: allUnlocked });
            },

            resetProgress: () => set({ unlockedPieces: {}, standardTargetId: null })
        }),
        {
            name: 'pokedex-storage',
            version: 1,
        }
    )
);

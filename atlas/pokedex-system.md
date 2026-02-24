# Pokédex & Loot System

## Overview
The **Pokédex & Loot System** is a gamification module integrated into the ATLAS OS Mission Hub. It provides a long-term collection goal for users, rewarding them with "Puzzle Shards" that unlock Generation 1 Pokémon data entries.

The system is built around the concept of "Data Recovery," where users must collect 4 unique cryptographic shards (Top-Left, Top-Right, Bottom-Left, Bottom-Right) to fully reconstruct a Pokémon's profile.

## Core Features

### 1. The Supply Depot (`LootboxShop`)
Accessed via the Mission Hub, the Supply Depot offers three distinct tiers of requisition packages:

| Crate Tier | Cost | Rewards | Mechanic |
| :--- | :--- | :--- | :--- |
| **Mini Cache** | 5 Credits | 1 Shard | Quick, single-piece reward. |
| **Standard Supply** | 15 Credits | 4 Shards | Standard progression. Includes **Target Priority** (see below). |
| **Legendary Vault** | 60 Credits | Full Unlock | Instantly unlocks *all* missing pieces for a random incomplete Pokémon. |

### 2. Smart Progression Mechanics

#### Standard Supply Consistency (Targeting)
To prevent bad luck (RNG) from stalling progress, the **Standard Supply** crate implements a "Targeting System":
1.  **Selection**: The system automatically selects a random incomplete Pokémon as the "Active Target".
2.  **Guaranteed Drop**: The **first slot** (leftmost card) of *every* Standard crate is guaranteed to be a piece for this Target Pokémon.
3.  **Deterministic Order**: Pieces for the target are awarded in a specific order: **TR -> TL -> BL -> BR**.
4.  **Cycling**: Once the target is fully completed, the system immediately selects a new target for the next crate.

#### Duplicate Protection
The system intelligently generates rewards:
-   It prioritizes pieces you **do not** have.
-   If you collect all 151 Pokémon (604 pieces), the system falls back to awarding **Credits** (Bonus Rewards).

### 3. The Pokédex Archive (`PokedexModal`)
A visual gallery tracking collection progress, featuring the **Atlas Blue** light theme.
-   **Status Indicators**:
    -   **???**: Name hidden until all 4 pieces are collected.
    -   **Silhouette**: Reduced opacity silhouette with a blue-toned grid background.
    -   **Shards**: Vivid colored shards overlay the minimal silhouette.
    -   **Full Unlock**: Fully reconstructed entries feature a bold `blue-600` name label and a checkmark indicator; cards are **clickable** to open the detail popup.
-   **Search**: Real-time filtering by Name or ID with an expanded focus search bar.
-   **Database Reset**: A confirmation-gated button to wipe progress, designed with a clean white/red safety UI.

### 4. Pokémon Detail Popup (unlocked only)
Clicking a **fully unlocked** Pokémon card opens a detail popup (light theme, aligned with Pokedex/Home Hub).

-   **Nameplate**: National № label, large Pokémon name, `#XXX` ID, and official artwork thumbnail.
-   **Pokédex entry**: Official in-game flavor text. **Pokémon Sun** is preferred; fetched from PokeAPI (`/pokemon-species/{id}`). If no Sun entry exists, the first available English entry is shown with the game name (e.g. Red, X). Styled as a data card with gradient background, left accent bar, and title line "POKÉDEX ENTRY • Pokémon Sun".
-   **Sprites table**: Layout matches [Pokémon Database](https://pokemondb.net): one row for **Normal**, one for **Shiny**; columns **Gen 1–6**. Sprites are sourced from `img.pokemondb.net` (URL pattern: `.../sprites/{game}/{normal|shiny}/{slug}.png`). Games used: Red/Blue (Gen 1), Silver (Gen 2), Ruby/Sapphire (Gen 3), Diamond/Pearl (Gen 4), Black/White (Gen 5), X/Y (Gen 6). **Gen 1 Shiny** has no sprite on the source site; that cell shows a stylized em-dash placeholder instead of an image.
-   **Lazy loading**: Sprites and Pokédex text load only when the popup opens (per Pokémon), avoiding bulk requests for all 151 entries.

## Technical Architecture

### State Management (`pokedexStore.js`)
Uses `zustand` with `persist` middleware to save progress to local storage.

-   **`unlockedPieces`**: Object mapping `pokemonId` (1-151) to an array of unlocked indices `[0, 1, 2, 3]`.
-   **`standardTargetId`**: Stores the ID of the current "Active Target" for the Standard Supply consistency mechanic.
-   **Actions**:
    -   `unlockPiece(id, index)`: Handles logic to add pieces and check for Target completion.
    -   `getMissingPieces()`: Returns a flat array of all missing shards for the loot generator.
    -   `resetProgress()`: Wipes state.

### Components
-   **`HomeHub.jsx`**: Orchestrates the overlay states (`isShopOpen`, `isLootboxOpen`, `isPokedexOpen`).
-   **`LootboxOverlay`**: Handles the opening animation, reward generation, and card rendering.
-   **`LootboxShop`**: The UI for selecting crate tiers.
-   **`PokedexModal.jsx`**: Grid view of the collection; hosts **`PokemonCard`** (clickable when fully unlocked) and **`PokemonDetailPopup`** (nameplate, Pokédex entry, sprites table). Slug mapping for Pokemon DB URLs: Gen 1 name overrides for Nidoran♀/♂, Farfetch'd, Mr. Mime; otherwise derived from name (lowercase, hyphenated).

## Asset Handling
-   **Grid / puzzle**: PokeAPI GitHub raw assets for official artwork; CSS `clip-path` slices into 4 puzzle quadrants.
-   **Detail popup**: Same PokeAPI artwork for the nameplate thumbnail; **Pokemon DB** (`img.pokemondb.net`) for Normal/Shiny sprites by generation (lazy-loaded when popup opens). **PokeAPI** `GET /pokemon-species/{id}` for Pokédex flavor text (Sun preferred, English).

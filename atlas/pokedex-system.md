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
    -   **Silhouette**: Reduced opacity (`opacity-5`) silhouette with a blue-toned grid background.
    -   **Shards**: Vivid colored shards overlay the minimal silhouette.
    -   **Full Unlock**: Fully reconstructed entries feature a bold `blue-600` name label and a checkmark indicator.
-   **Search**: Real-time filtering by Name or ID with a expanded focus search bar.
-   **Database Reset**: A confirmation-gated button to wipe progress, designed with a clean white/red safety UI.

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
-   **`PokedexModal`**: The grid view of the collection.

## Asset Handling
-   **Source**: Uses `PokeAPI` GitHub raw assets for images.
-   **Rendering**: Uses CSS `clip-path` to dynamically slice the official artwork into 4 puzzle quadrants without needing separate image assets.

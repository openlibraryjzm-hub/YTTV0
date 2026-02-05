# Asset Manager Page Documentation

## Overview

The **Asset Manager Page** (`AssetManagerPage.jsx`) is a centralized hub designed to manage, browse, and configure the visual assets of the application. It consolidates the configuration for **Orb Presets**, **Page Banners** (Layer 2), **App Assets**, and **Themes** into a single, unified interface.

This page replaces scattered configuration screens with a cohesive **4-tab workflow**, allowing users to contextually switch between different asset types while maintaining a consistent set of adjustment tools (Spatial Controls, Properties).

## Key Features

-   **Unified 4-Tab Navigation**: Seamlessly switch between **Orb**, **Page**, **App**, and **Theme** contexts.
-   **Contextual Content Carousel**: Displays relevant assets (e.g., Orb Presets, Page Banners) based on the active tab.
-   **Sub-Navigation (View Modes)**: Toggle between **Folder** (Categories/Groupings) and **File** (Individual Assets) views.
-   **Spatial Configuration**: Precise controls for positioning assets (Top-Left, Top-Right, etc.) and fine-tuning coordinates.
-   **Property Adjustments**: Global controls for **Scale**, **Opacity**, and **Offsets**.

---

## Page Layout & Zones

The page is organized into three distinct vertical zones:

### 1. Header & Navigation (Zone 0)
Located at the very top of the page, this zone contains the primary navigation:
-   **Orb Tab**: Manage generic and custom Orbs.
-   **Page Tab**: Manage Page Banners (Layer 2 images) and their folder associations.
-   **App Tab**: (Placeholder) Future home for application icons and window assets.
-   **Theme Tab**: (Placeholder) Future home for global color themes and styling.

The navigation is centered and provides visual feedback for the active state.

### 2. Page Banner (Zone 1)
Directly below the navigation is a **visual-only** instance of the `PageBanner`.
-   **Reduced Profile**: The banner text (Title/Description) is hidden to reduce visual clutter, serving primarily as a visual anchor and preview area for potential banner changes.

### 3. Content Carousel (Zone 2)
The main interactive area for browsing assets.
-   **Sub-Navigation**: A toggle bar between **Folder** view (default) and **File** view (currently visual-only).
-   **Dynamic Content**:
    -   **Active Tab = Orb**: Displays the **Orb Presets Carousel** (derived from `orbFavorites`). Users can click a preset to apply it.
    -   **Active Tab = Page**: Displays the **Page Banners Carousel** (derived from `layer2Folders`). Flattens generic folders into a browsable image list.
    -   **App/Theme**: Displays "Coming Soon" placeholders.

### 4. Configuration Panel (Zone 3)
A fixed-height panel at the bottom for fine-tuning the selected asset.
-   **Spatial Controls**: a 2x2 grid representing screen quadrants (TL, TR, BL, BR) for quick anchor positioning.
-   **Property Controls**: Sliders and inputs for:
    -   **Scale**: 0.1x to 2.0x
    -   **Opacity**: 0% to 100%
    -   **X/Y Offsets**: Pixel-perfect adjustment.
-   **Context Selectors**: Dropdowns for "Theme" (Midnight, Daylight, etc.) and "Context" (Global vs Local).

---

## State Management

The page utilizes local state for interface control and global stores for data persistence.

### Local State (`AssetManagerPage.jsx`)
-   `activeTab`: Strings `'orb' | 'page' | 'app' | 'theme'`. Determines the top-level context.
-   `browserMode`: Strings `'folder' | 'file'`. Determines the sub-view mode for the carousel.
-   `selectedQuadrant`: Strings `'TL' | 'TR' | 'BL' | 'BR'`. Visual state for the position selector.

### Global Dependencies (`useConfigStore`)
-   **Data Sources**:
    -   `layer2Folders`: Source for Page Banner images.
    -   `orbFavorites`: Source for Orb Presets.
-   **Actions**:
    -   `applyLayer2Image(img)`: Sets the global background/banner image.
    -   `setPageBannerBgColor(color)`: Updates the banner background color.
    -   `applyOrbFavorite(item)`: Sets the global Orb configuration.

---

## Future Roadmap

1.  **App Tab Implementation**: Add management for application dock icons, tray icons, and window decorations.
2.  **Theme Tab Implementation**: Expose a color token editor for global theme customization.
3.  **File View Integration**: Activate the 'File' browser mode to allow managing raw assets (uploads/deletes) independent of their logical folders.
4.  **Advanced Spatial Controls**: Link the quadrant selector to actual store values (`orbImageXOffset`, etc.).

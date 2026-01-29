# Advanced Orb Editing & Cropping

This document details the "Advanced Orb Crop" feature, a fullscreen editor designed to provide precise control over "Spillover Orb" images.

## 1. Feature Overview

The Advanced Orb Editor allows users to define custom, non-standard crop areas for each of the four orb quadrants (Top-Left, Top-Right, Bottom-Left, Bottom-Right). Instead of the default "infinite spill" (where the image simply overflows the quadrant boundaries), users can define precise rectangular masks.

**Entry Point:**
- Located in the **Orb Configuration** tab of the settings page.
- Accessed via a small "Expand/Arrows" button overlaid on the "Spill Areas" visualizer.

## 2. Component Architecture

### `OrbCropModal.jsx`
- **Type**: Fullscreen Modal (Z-Index 100).
- **Container**: Uses an `80vmin` square reference frame to maximize screen real estate while maintaining the orb's aspect ratio.
- **Visuals**:
  - Renders the full high-resolution orb image `object-contain`.
  - Overlays a complex SVG mask that dims "inactive" areas and reveals "active" spill areas.
  - Draws "Ghost UI" guides (wireframes of the Playlist and Video menu rectangles) to show context.

### State Management
The feature determines its state from the global `configStore` to ensure persistence across sessions and presets.

**New Config Keys:**
- `orbAdvancedMasks` (`{ tl, tr, bl, br }`): Booleans toggling whether a quadrant uses the default infinite spill or a custom user-defined mask.
- `orbMaskRects` (`{ tl: {x,y,w,h}, ... }`): detailed coordinate objects (0-100%) defining the custom crop rectangle for each quadrant.

## 3. UI Interactions

### Center Control Cluster
- A centralized "D-Pad" of buttons allows users to toggle "Advanced Mode" for specific quadrants.
- Buttons are mapped spatially to mirror the quadrants they control (e.g., TL button is in the cluster's TL position).

### Interactive Drawing Tool
- **Drag & Drop**: When a quadrant is in "Advanced Mode", a blue selection box appears.
- **Resizing**: Corner handles allow resizing the crop area.
- **Relaxed Bounds**: Logic permits dragging/resizing well outside the standard 0-100% box (range: -50% to 150%). This allows users to capture "true spillover" content that exists far outside the central orb area.

## 4. Implementation Status

**Completed Features:**
- Global Store integration for persistence (`configStore`).
- Fullscreen modal UI with high-res image visualizer.
- "Infinite Spill" (Global) vs "Custom Mask" (Local) toggle logic.
- **Relaxed Bounds System**: Users can drag masks freely across quadrants or outside the container.
- **Real-Time Visualization**: The `OrbPage` settings visualizer now supports `overflow-visible`, correctly showing masks that drift outside the standard box.

## 6. Player Controller Sync

The main application header (`PlayerController.jsx`) has been fully integrated:
1.  It subscribes to `orbAdvancedMasks` and `orbMaskRects`.
2.  The central `orbClipPath` SVG immediately reflects standard vs. custom masks.
3.  If a custom mask is used, the header orb shows *only* that specific cutout; otherwise, it shows the standard quadrant spill.

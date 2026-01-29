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
- **Constraints**: Logic prevents drag/resize actions from leaving the designated quadrant boundaries (e.g., a TL crop cannot be dragged into the TR area).

## 4. Current Implementation Status

**Implemented:**
- Global Store integration for persistence.
- Fullscreen modal UI with high-res image visualizer.
- "Infinite Spill" vs "Custom Mask" toggle logic.
- SVG masking system to virtually "cut" the image in real-time.
- Interactive drag-and-resize handlers for custom masks.

**Known Limitations / Active Development:**
- Drag movement constraints may currently be too restrictive.
- Real-time reflection on the main Orb Page visualizer depends on the store updates propagating correctly.

## 5. Integration

The `OrbPage.jsx` component has been updated to:
1. Pass the global `configStore` state (`orbAdvancedMasks`, `orbMaskRects`) into the modal.
2. Render these advanced masks in its own miniature visualizer preview, ensuring what you see in the editor is what you get in the settings dashboard.

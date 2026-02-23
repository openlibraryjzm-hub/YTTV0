###App Banner

The App Banner is the top-level banner that spans the full width of the application and serves as the background for the Player Controller. It provides a customizable, animated background layer that creates visual continuity across the top of the application.

**Related Documentation:**
- **Player Controller**: See `advanced-player-controller.md` for the controller that sits on this banner
- **Layout**: See `ui-layout.md` for layout system details
- **Page Banner**: See `page-banner.md` for the page-level banners used on Videos/Playlists pages
- **Settings**: See `ui-pages.md` Section 4.1.8 for banner customization options

---

#### ### App Banner Overview

**1: User-Perspective Description**

Users see a full-width banner at the very top of the application (200px height) that serves as the backdrop for the Player Controller:

- **Default Image**: Displays `/public/banner.PNG` by default, spanning the full width of the viewport
- **Infinite Scroll Animation**: The banner image continuously scrolls from left to right in a seamless 60-second loop
  - Creates a dynamic, living background effect
  - Animation is GPU-accelerated for smooth 60fps performance
- **Custom Upload Support**: Users can upload custom banner images via Settings → Appearance → App Banner
  - **Supported Formats**: PNG, JPG, WEBP, GIF
  - **Static Images**: Scroll infinitely in the same left-to-right animation
  - **GIFs**: Play natively without scrolling animation (to avoid motion conflicts)
- **Window Controls Integration**: Custom window controls (Minimize, Maximize, Close) float in the top-right corner
- **Draggable Region**: The entire banner area is draggable (`data-tauri-drag-region`), allowing users to move the window
- **Smart Spill Interaction**: If a "Spill Over" height is set, the portion extending beyond the header (200px) is **click-through**. On hover over the spill, the **Active Banner** (splitscreen layer) dims to a fixed opacity so you can see through to the content below (opacity is tunable via `SPILL_HOVER_OPACITY` in `LayoutShell.jsx`, default 0.2).
  - **Precision Hitbox**: The system uses a **ray-casting point-in-polygon algorithm** to detect hovers based on the exact **SVG crop shape** and **Left Clip** settings, so transparency is only triggered when hovering visible spill pixels.
- **Hover Popup**: Hovering the rightmost 1/6th reveals a 185x110px popup split into zones: 
  - **Top Section**: Centered orb flanked by two wide 40x16px rectangles.
  - **Bottom Right**: Split into a top 1/3 strip and a main 2/3 area.
  - **Bottom Left**: Currently empty.

**2: File Manifest**

**UI/Components:**
- `src/LayoutShell.jsx`: Renders the banner as the background of `.layout-shell__top-controller`. Handles dual-mode logic (`activeBanner` switching).
- `src/components/PlayerController.jsx`: Sits on top of the banner, handles banner upload via `handleBannerUpload`
- `src/components/AppPage.jsx`: The primary configuration page for App Banner settings, offering dual-mode editing (Fullscreen/Splitscreen toggles).
- `src/components/WindowControls.jsx`: Window controls positioned in top-right corner of banner

**State Management:**
- `src/store/configStore.js`:
  - `fullscreenBanner` & `splitscreenBanner`: Independent configuration objects for each mode.
    - `image`: Base64 string of uploaded banner image
    - `clipLeft`: Percentage (0-100) to clip from left
    - `horizontalOffset`: Percentage (-200 to +200) to shift pattern
    - `verticalPosition`: Percentage (-200 to +200) for vertical alignment
    - `scale`: Percentage (25-200) for image sizing
    - `spillHeight`: Pixels (0-500) for vertical spill
    - `maskPath`: SVG path data for custom cropping
    - `scrollEnabled`: Boolean for animation
    - `playerControllerXOffset`: Pixels (-500 to +500) for horizontal controller positioning
  - `bannerPreviewMode`: Ephemeral state to force the layout to preview a specific mode during editing.

**CSS/Styling:**
- `src/LayoutShell.css`:
  - `.layout-shell__top-controller`: Main banner container (200px height, full width)
  - `@keyframes bannerScrollRight`: CSS animation for infinite horizontal scroll (60s duration)
  - Background image styling with `background-repeat: repeat-x` for seamless looping

**API/Bridge:**
- No Tauri commands - all state is client-side (localStorage via Zustand persist)

**Backend:**
- No database tables - uses localStorage only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Default Banner Display:**
   - On app load → `LayoutShell.jsx` checks the appropriate banner config based on `viewMode` (`full` vs `split`).
   - If image is null → Falls back to default behavior.
   - Applies mode-specific settings (scale, offset, clip) dynamically.

2. **Custom Banner Upload Flow:**
   - User navigates to **App Configuration** page.
   - User selects **Fullscreen Area** or **Splitscreen Area** via toggle.
   - User uploads image → `updateActiveBanner({ image: ... })` updates the specific config object in `configStore`.
   - `LayoutShell.jsx` immediately reflects the change thanks to `bannerPreviewMode` overriding the actual view mode for live feedback.

3. **Dual Mode Configuration:**
   - **Fullscreen Mode**: Used when no pages are open.
   - **Splitscreen Mode**: Used when pages (Playlists, Videos, etc.) are open (Half/Quarter view).
   - Each mode maintains its own independent set of properties (Image, Scale, Offset, etc.).
   - **Player Controller Offset**: The horizontal position of the player controller controls (Search, Buttons) is also saved per mode.

4. **Banner Removal Flow:**
   - User clicks "Remove Custom Banner" → Updates active config to `null` image.
   - Falls back to default.

**Source of Truth:**
- `configStore.fullscreenBanner` - Configuration for Fullscreen mode.
- `configStore.splitscreenBanner` - Configuration for Splitscreen mode.
- `state.viewMode` (layoutStore) - Determines which config is currently active.

**4: Technical Implementation Details**

**Dual Mode & Live Preview:**
- `AppPage.jsx` sets `bannerPreviewMode` ('fullscreen' or 'splitscreen') when entering the tab.
- `LayoutShell.jsx` uses this priority logic: `activeBanner = bannerPreviewMode || (viewMode === 'full' ? fullscreen : splitscreen)`.
- This ensures users seeing the **Split Layout** can still see and edit the **Fullscreen Banner** as if they were in fullscreen mode.

**Image Sizing & Positioning:**
- **Scale**: `background-size: ${scale}vw auto` (-200% to 200%).
- **Vertical Alignment**: `background-position-y` (-200% to +200%).
- **Horizontal Offset**: `background-position-x` shift (-200% to +200%).
- **Spill Over**: `height: 200px + spillHeight`.
  - In **Fullscreen Preview** (or Mode): Spill is clipped to 200px to maintain clean header.
  - In **Splitscreen Mode**: Spill flows down under content, creating layered effect.
  - **Banner Layers**:
    - **Layer 0 (Background)**: The Fullscreen Banner config is rendered at the bottom (z-14), always clipped to 200px height. This provides a consistent "base" aesthetic even when using transparency in the upper layer.
    - **Layer 1 (Overlay)**: The Splitscreen Banner config is rendered on top (z-15) with full spill capabilities.
  - **Spill Interaction**: The spill-over area is **always click-through** (`pointer-events: none`). When hovered over the visible spill shape, the **Active Banner** (Layer 1 in Splitscreen) dims to a configurable opacity (default 0.2) so you can see through to the player/content below.
    - **Border Overlap**: The spill layer (z-15) sits visually **above** the Player Border Separator (z-10), allowing the banner art to "break the frame", while transparent areas naturally reveal the border pattern underneath.
    - **Precision Hitbox**: The system uses a **ray-casting point-in-polygon algorithm** to detect hovers based on the exact **SVG crop shape** and **Left Clip** settings.

**Advanced Customization Logic:**
- **Masking (Shape Cropping):**
  - Uses CSS `mask-image` with dynamically generated SVG data.
  - Configurable via `InlineBannerCropMode` (interactive overlay).
  - Masks are saved per-mode.
- **Scroll Control:**
  - `bannerScrollEnabled` toggles CSS animation.
  - Automatically disabled for GIFs.

**Window Integration:**
- Banner serves as draggable region.
- Window controls are absolutely positioned.
- Z-index layering: Banner (z-0) → Controller Wrapper (z-10) → Window Controls (z-20).

---

#### ### Customization Options

**Settings Integration:**
- **Location**: App Configuration Page (`AppPage.jsx`).
- **Mode Toggle**: Buttons to switch between **Fullscreen Area** and **Splitscreen Area**.
- **Controls**:
  - **Image Upload**: Per-mode image.
  - **Vertical Alignment**: -200% to +200% range.
  - **Image Scale**: -200% to 200% (allows flipping).
  - **Spill Over**: 0-500px height extension.
  - **Crop Shape**: Interactive SVG masking tool.
  - **Clip From Left**: 0-100% left-side clipping.
  - **Horizontal Offset**: -200% to +200% pattern shift.
  - **Player Controller Horizontal Offset**: -500px to +500px shift for buttons/search bar.

**Preset System:**
- **Save as Preset**:
  - Located in App Configuration page.
  - **Modular Saving**: Checkboxes to save **Fullscreen Config**, **Splitscreen Config**, or **Both**.
  - This allows creating "Mix and Match" presets.
- **Legacy Compatibility**:
  - Presets saved with new dual-mode data also populate legacy fields (`customBannerImage`, etc.) based on the Fullscreen config (priority) or Splitscreen config.
  - Old presets are automatically migrated to dual-mode structure on application load (v13 migration).

**File Format Support:**
- **PNG/JPG/WEBP**: Static images.
- **GIF**: Animated GIFs (native playback).

**Persistence:**
- Store: `config-storage-v12` (localStorage).
- Persistence: JSON stringified state.

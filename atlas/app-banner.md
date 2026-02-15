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
- **Separator Line**: A 12px separator line at the bottom uses the selected animated pattern (Diagonal, Dots, Mesh, Solid) to separate the banner from app content
- **Hover Popup**: Hovering the rightmost 1/6th reveals a 185x110px popup split into zones: 
  - **Top Section**: Centered orb flanked by two wide 40x16px rectangles.
  - **Bottom Right**: Split into a top 1/3 strip and a main 2/3 area.
  - **Bottom Left**: Currently empty.

**2: File Manifest**

**UI/Components:**
- `src/LayoutShell.jsx`: Renders the banner as the background of `.layout-shell__top-controller`
- `src/components/PlayerController.jsx`: Sits on top of the banner, handles banner upload via `handleBannerUpload`
- `src/components/SettingsPage.jsx`: Provides UI for uploading and managing custom banner images
- `src/components/WindowControls.jsx`: Window controls positioned in top-right corner of banner

**State Management:**
- `src/store/configStore.js`:
  - `customBannerImage`: Base64 string of uploaded banner image (null = use default `/banner.PNG`)
  - `setCustomBannerImage(imageDataUrl)`: Sets custom banner image and persists to localStorage
  - `bannerClipLeft`: Percentage (0-100) to clip from left side of banner (default: 0)
  - `bannerHorizontalOffset`: Percentage (-50 to +50) to shift tiled pattern horizontally (default: 0)
  - `bannerScrollEnabled`: Boolean controlling scroll animation

**CSS/Styling:**
- `src/LayoutShell.css`:
  - `.layout-shell__top-controller`: Main banner container (200px height, full width)
  - `@keyframes bannerScrollRight`: CSS animation for infinite horizontal scroll (60s duration)
  - Background image styling with `background-repeat: repeat-x` for seamless looping

**API/Bridge:**
- No Tauri commands - all state is client-side (localStorage)

**Backend:**
- No database tables - uses localStorage only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Default Banner Display:**
   - On app load → `LayoutShell.jsx` checks `customBannerImage` from `configStore`
   - If `customBannerImage === null` → Uses default `/banner.PNG` from public folder
   - CSS applies `background-image: url('/banner.PNG')` with `background-repeat: repeat-x`
   - `@keyframes bannerScrollRight` animation starts → Scrolls from `0` to `100vw` over 60 seconds, loops infinitely

2. **Custom Banner Upload Flow:**
   - User navigates to Settings → Appearance → App Banner
   - User clicks "Upload" button → File picker opens
   - User selects image file → `handleBannerUpload` (PlayerController.jsx line 1382) reads file via FileReader
   - FileReader converts to base64 Data URL → `setCustomBannerImage(imageDataUrl)` updates `configStore`
   - `useEffect` in configStore persists to localStorage → `localStorage.setItem('customBannerImage', imageDataUrl)`
   - `LayoutShell.jsx` detects change → Updates inline style: `backgroundImage: url(${customBannerImage})`
   - Animation continues with custom image

3. **GIF Detection & Handling:**
   - Component checks if uploaded image is GIF → `customBannerImage?.startsWith('data:image/gif')`
   - If GIF detected → Disables scroll animation (`animation: 'none'` in inline styles)
   - GIF plays natively without horizontal scrolling to avoid motion conflicts
   - Static images continue with infinite scroll animation

4. **Banner Removal Flow:**
   - User clicks "Remove Custom Banner" in Settings → `setCustomBannerImage(null)`
   - State updates → Removes from localStorage
   - `LayoutShell.jsx` detects null → Falls back to default `/banner.PNG`
   - Default banner resumes infinite scroll animation

**Source of Truth:**
- `configStore.customBannerImage` - Custom banner image (null = default)
- localStorage `'customBannerImage'` - Persisted custom image (client-side only)
- `/public/banner.PNG` - Default banner image (fallback when no custom image)

**State Dependencies:**
- When `customBannerImage` changes → `LayoutShell` updates inline background-image style → Banner image updates
- When GIF detected → Animation disabled → GIF plays natively
- When custom image removed → Falls back to default → Default animation resumes
- Banner animation runs continuously regardless of state changes (CSS keyframe animation)

**4: Technical Implementation Details**

**Animation Mechanism:**
- Uses CSS `@keyframes bannerScrollRight` animation
- Animates `background-position-x` from `0` to `100vw` over 60 seconds
- `background-repeat: repeat-x` ensures seamless looping
- Animation is GPU-accelerated (uses `transform` properties where possible)

**Image Sizing:**
- Image Sizing:
  - Default: `background-size: 100vw auto` (Scale: 100%) - Image width matches viewport width
  - Scaling: Controlled by "Image Scale" slider (25% to 200%)
    - allows shrinking image to repeat more frequently (e.g. 50%) or zooming in (e.g. 150%)
    - Logic: `background-size: ${scale}vw auto`
  - Vertical Alignment: User-adjustable via "Vertical Alignment" slider (0% = top, 50% = center, 100% = bottom)
  - Spill Over: User-adjustable "Spill Height" (0px to 500px)
    - Allows the banner image to extend vertically beyond the 200px header area
    - Renders *behind* the header content but naturally flows down into the player/page area
    - Creates a "draped" or "layered" aesthetic where the banner background bleeds into the main application

**Advanced Customization Logic:**
- **Masking (Shape Cropping):**
  - Uses CSS `mask-image` with a dynamically generated SVG data URI
  - User draws a polygon on a single image tile via `BannerCropModal`
  - The SVG mask is applied to the background layer, synchronized with `background-position`, `background-size`, and `background-repeat`
  - This ensures the mask scales and repeats perfectly with the image tiles
- **Scroll Control:**
  - `bannerScrollEnabled` boolean toggle controls the CSS animation
  - When disabled (or for GIFs), `animation: 'none'` is applied inline
  - Allows users to create static, tiled patterns instead of scrolling banners
- Height: Fixed at 200px (banner container height), but background layer can exceed this via Spill Over

**Performance Considerations:**
- Animation uses CSS transforms for GPU acceleration
- GIF detection prevents double-animation (native GIF playback + scroll)
- Base64 images stored in localStorage (consider size limits for very large images)

**Window Integration:**
- Banner serves as draggable region for window movement
- Window controls positioned absolutely in top-right corner
- Z-index layering: Banner (z-100) → Window Controls (z-101) → Player Controller content (z-102)

---

#### ### Customization Options

**Settings Integration:**
- **Location**: Settings → Appearance → App Banner
- **Upload Button**: Allows selecting PNG/JPG/WEBP/GIF files
- **Preview**: Shows current active banner with all customizations applied
- **Remove Button**: Appears on hover when custom banner is active
- **Controls**:
  - **Vertical Alignment**: Adjusts `background-position-y` (0-100%)
  - **Image Scale**: Adjusts `background-size` (25-200% width)
  - **Spill Over**: Extends banner height (0-500px) below header
    - **View Mode Dependency**: Spill visibility is controlled by view mode
    - In **Fullscreen mode** (no pages open): Spill is clipped/hidden, only banner (200px) visible
    - In **Split-screen mode** (pages open): Full spill is visible, SVG mask is applied
    - Height setting is preserved across modes - only visibility changes
    - This keeps the fullscreen experience clean while enabling advanced compositions in split-screen
  - **Crop Shape**: Activates **inline crop mode** for drawing custom SVG masks directly on the banner
    - **Inline Editing**: Instead of opening a modal, clicking "Crop Shape" enters a special editing mode
    - **Direct Interaction**: Draw your mask path directly on the actual banner at the top of the screen
    - **Spill Area Support**: The interactive area extends to include the banner spill (if enabled)
      - **Banner Area (0-200px): ALWAYS VISIBLE** - No need to draw points here
      - **Spill Area (200px+): SELECTIVE** - Draw points to include specific portions
      - A dashed line with "SPILL AREA BELOW" label marks where the banner ends and spill begins
      - The SVG path you draw only controls what parts of the spill are visible
      - This creates a **composite mask**: full banner rectangle + your custom spill shape
      - Perfect for selectively including parts of the spilled image (e.g., character's body extending below banner)
    - **Real-Time Preview**: See your changes applied instantly as you draw
    - **Contextual Controls**: Floating control panel appears in the bottom-right with:
      - Point counter showing how many points you've placed
      - Instructions and keyboard shortcuts
      - **Live Preview Toggle**: Enable/disable real-time mask updates
        - When OFF: See the full uncropped image while placing points
        - When ON: See the mask applied in real-time as you draw
        - Useful when the crop obscures where you need to place the next point
      - Undo button (or Ctrl+Z) to remove the last point
      - Clear button (or Delete/Backspace) to start over
      - Done button (or Esc) to exit crop mode
    - **Visual Feedback**:
      - Cursor preview dot shows where your next point will be placed
      - Green dot marks the starting point
      - Blue dots mark subsequent points
      - Dashed lines connect points as you draw
      - Semi-transparent fill preview appears once you have 3+ points
      - Hover near the first point to see a "close path" preview
    - **Smart Drawing**: The system intelligently knows what is the banner image and prevents invalid placements
    - **No Context Switching**: No need to switch between a modal and the actual banner - what you see is what you get
  - **Clip From Left**: Slider to hide left portion of banner (0-100%)
    - Reveals theme color underneath the clipped area
    - Useful for showing banner only on right side while left shows theme color
  - **Horizontal Offset**: Slider to shift entire tiled pattern left/right (-50% to +50%)
    - Fine-tune positioning of tiles within the banner area
    - Works in conjunction with Clip From Left for precise control
  - **Animate Scroll**: Toggle to enable/disable horizontal scrolling (auto-disabled for GIFs)

**File Format Support:**
- **PNG/JPG/WEBP**: Static images that can scroll infinitely or be tiled
- **GIF**: Animated GIFs that play natively (scroll animation disabled by default or via toggle)

**Persistence:**
- Custom banner images are stored as base64 Data URLs in localStorage
- Persists across app restarts
- No database storage required

---

**Preset System:**
- **Save as Preset**: Located in the App Banner configuration section.
  - Captures the current active banner configuration (image, scale, clip, offset, scroll, spill).
  - Allows assigning the new preset to one or more playlists immediately upon saving.
- **Preset Management**:
  - Saved presets appear as `BannerPresetCard` items in the Videos interface (if assigned to the current playlist).
  - Clicking a preset card instantly applies its configuration to the App Banner.
  - Presets can be reassigned to different playlists via a dropdown menu on the card.

---

#### ### Visual Integration

**With Player Controller:**
- Banner provides the background layer for the entire Player Controller
- Player Controller content (orb, menus, buttons) sits on top with appropriate z-indexing
- Banner animation creates a dynamic backdrop that doesn't interfere with controller functionality

**With Top Border Separator:**
- 12px separator line at bottom of banner uses animated patterns
- Separator acts as visual boundary between banner and main content
- Pattern selection (Diagonal, Dots, Mesh, Solid) configured in Settings → Player Borders

**Window Controls:**
- Custom window controls (Minimize, Maximize, Close) float in top-right
- Positioned absolutely over banner background
- Maintains visibility regardless of banner image/color

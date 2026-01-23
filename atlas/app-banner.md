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
- Default banner: `background-size: 100vw 100%` - Image width matches viewport width
- Custom images: Same sizing applied, ensuring seamless horizontal repetition
- Height: Fixed at 200px (banner container height)

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
- **Preview**: Shows current active banner (default or custom)
- **Remove Button**: Appears on hover when custom banner is active
- **Presets**: Placeholder preset buttons (Default, Cosmic, Nature, Industrial) - currently only "Default" is functional

**File Format Support:**
- **PNG/JPG/WEBP**: Static images that scroll infinitely
- **GIF**: Animated GIFs that play natively (scroll animation disabled)

**Persistence:**
- Custom banner images are stored as base64 Data URLs in localStorage
- Persists across app restarts
- No database storage required

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

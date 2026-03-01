# AppPage

AppPage is a dedicated page for App Banner, Color Palette, and Player Borders configuration, accessed via the "App" button in the Settings Page navigation. It appears as a full page below the Page Banner.

**Related Documentation:**
- **Settings Page**: See `ui-pages.md` (Section 4.1.8) for Settings Page overview
- **State Management**: See `state-management.md` for configStore details
- **App Banner**: See `app-banner.md` for comprehensive App Banner documentation

---

## 1: User-Perspective Description

- **Page Structure**:
  - **Page Banner**: "App Configuration" title with description
  - **Back Button**: "Back to Settings" button in banner's top-right corner
  - **Navigation Buttons**: Four buttons (Orb, You, Page, App) positioned at bottom of Page Banner
  - **Sticky Toolbar**: Contains Colored Prism Bar with clickable filtering
    - **Color Bars**: Each of 16 folder colors displayed (functionality to be wired up)
  - **Scrollable Content**: Configuration sections below the banner

- **App Banner Configuration (Dual Mode)**:
  - **Mode Toggles**: Dedicated buttons to switch between **Fullscreen Area** and **Splitscreen Area** configuration.
  - **Live Preview**: Selecting a mode forces the main app layout (background) to reflect that mode instantly, allowing you to edit the "Fullscreen" look even while the settings page is open (which would normally force a "Splitscreen" layout).
  - **Image Upload**: Upload custom banner images per mode.
  - **Adjustment Sliders**:
    - **Scale**: 25% - 200%.
    - **Vertical Position**: -200% - +200%.
    - **Horizontal Offset**: -200% - +200%.
    - **Spill Height**: 0px - 500px.
    - **Clip Left**: 0% - 100%.
  - **Crop Shape**: Interactive SVG mask editor (Inline).
  - **Animate Scroll**: Toggle horizontal scrolling.

- **Player Controller Section**:
  - **Layout**: Simple slider control.
  - **Horizontal Position**: Slider to adjust X-offset (-500px to +500px).
    - **Independent Per Mode**: This offset is saved separately for Fullscreen vs Splitscreen.
    - **Note**: In current builds, explicit horizontal offsets in Splitscreen mode are entirely bypassed, as the Player Controller now utilizes an intelligent auto-anchoring CSS Grid stacked layout to perfectly center elements.

- **Preset Management**:
  - **Save Functionality**: Save the current configuration as a named preset.
  - **Modular Saving**: Choose to save **Fullscreen**, **Splitscreen**, or **Both** configurations into the preset.
  - **Playlist Assignment**: Assign presets to automatically load when visiting specific playlists.
  - **Preset Grid**: View and manage saved presets via `BannerPresetCard` items in the Videos interface.

- **Color Palette Section**:
  - **Layout**: 2-column grid of theme options
  - **Theme Cards**: Each theme displays:
    - Gradient preview showing theme colors
    - Theme name
    - Active theme highlighted with sky-blue border and ring
  - **Selection**: Click any theme card to apply it app-wide
  - **Active Indicator**: Current theme shows "Active" badge and highlighted styling

- **Player Borders Section**:
  - **Layout**: 2-column grid of border pattern options
  - **Pattern Options**: Diagonal, Dots, Mesh (waves), Solid
    - Each pattern shows preview thumbnail
    - Selected pattern highlighted with sky-blue border and checkmark
  - **Selection**: Click any pattern to apply it to player borders
  - **Active Indicator**: Current pattern shows checkmark icon

## 2: File Manifest

**UI/Components:**
- `src/components/AppPage.jsx`: Dedicated App Banner, Color Palette, and Player Borders configuration page component
- `src/components/PageBanner.jsx`: Page banner with back button
- `src/components/BannerPresetCard.jsx`: (Not directly on this page, but related to the preset system managed here)

**State Management:**
- `src/store/configStore.js`:
  - `fullscreenBanner`: Configuration object for fullscreen mode.
  - `splitscreenBanner`: Configuration object for splitscreen mode.
  - `bannerPreviewMode`: Ephemeral state to override layout for editing.
  - `playerBorderPattern`: Player border pattern state.
  - `bannerPresets`: Array of saved presets.
  - `addBannerPreset`: Action to save new preset.
  - `activeThemeId`: Theme state.

## 3: The Logic & State Chain

**App Banner Flow:**
1. User toggles mode (Title Button) → `setActiveBannerMode('fullscreen'|'splitscreen')`
2. `useEffect` updates `bannerPreviewMode` in store → `LayoutShell` re-renders background to match.
3. User adjusts slider → `updateActiveBanner({ propert: value })` updates the specific config object.
4. User clicks "Save Preset" → Modular save logic checks checkboxes (`saveConfig`) → Creates preset object → `addBannerPreset`.

**Player Controller Position Flow:**
1. User adjusts slider → `updateActiveBanner({ playerControllerXOffset: val })` updates store (inside the banner config object).
2. Store persists to `localStorage`.
3. `LayoutShell` detects change → Updates controller wrapper transform.

**Color Palette Flow:**
1. User clicks theme card → `onThemeChange(id)` called → Parent SettingsPage updates theme
2. Theme change applies app-wide → All components using theme colors update
3. Active theme highlighted in grid

**Source of Truth:**
- `configStore.fullscreenBanner`: Source for Fullscreen mode (and legacy fallbacks).
- `configStore.splitscreenBanner`: Source for Splitscreen mode.
- `configStore.bannerPreviewMode`: Source for LayoutShell override.

**State Dependencies:**
- When `bannerPreviewMode` changes → `LayoutShell` view mode logic is overridden.
- When `activeBanner` properties change → Background styles update immediately.

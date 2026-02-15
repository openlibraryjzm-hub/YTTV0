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

- **Color Palette Section**:
  - **Layout**: 2-column grid of theme options
  - **Theme Cards**: Each theme displays:
    - Gradient preview showing theme colors
    - Theme name
    - Active theme highlighted with sky-blue border and ring
  - **Selection**: Click any theme card to apply it app-wide
  - **Active Indicator**: Current theme shows "Active" badge and highlighted styling

- **App Banner Section**:
  - **Current Banner Display**: Shows the active app banner with preview
    - Displays custom uploaded banner or default banner
    - Shows banner source label (Custom Upload or /public/banner.PNG)
    - Hover overlay with "Remove Custom Banner" button when custom banner is set
  - **Presets**: Grid of preset banner options (Default, Cosmic, Nature, Industrial)
    - Each preset shows preview thumbnail
    - Selected preset highlighted with sky-blue border
    - Default preset clears custom banner
  - **Upload Action**: Upload button for custom banner images
    - Supports PNG, JPG, WEBP formats
    - Recommended size: 1920x200px
    - Uploaded banner replaces default banner

- **Player Controller Section**:
  - **Layout**: Simple slider control
  - **Horizontal Position**: Slider to adjust X-offset (-500px to +500px)
    - Allows centering or offsetting the controller relative to the banner
    - Useful for alignment with custom banner setups

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

**State Management:**
- `src/store/configStore.js`:
  - `customBannerImage`, `setCustomBannerImage`: Custom app banner image (Base64 string)
  - `playerControllerXOffset`, `setPlayerControllerXOffset`: Horizontal offset for player controller (px)
  - `playerBorderPattern`, `setPlayerBorderPattern`: Player border pattern ('diagonal' | 'dots' | 'waves' | 'solid')
- `src/utils/themes.js`: Theme definitions with color palettes
- Theme selection managed by parent SettingsPage via `currentThemeId` and `onThemeChange` props

## 3: The Logic & State Chain

**Color Palette Flow:**
1. User clicks theme card → `onThemeChange(id)` called → Parent SettingsPage updates theme
2. Theme change applies app-wide → All components using theme colors update
3. Active theme highlighted in grid

**App Banner Flow:**
1. User uploads banner → `handleBannerUpload()` reads file as Data URL → `setCustomBannerImage()` updates store
2. Store persists to `localStorage` → App banner component detects change → Updates banner display
3. User clicks preset → Sets mock state and clears custom banner if "Default" selected
4. User clicks "Remove Custom Banner" → `setCustomBannerImage(null)` → Default banner restored

**Player Controller Position Flow:**
1. User adjusts slider → `setPlayerControllerXOffset(val)` updates store
2. Store persists to `localStorage` → LayoutShell detects change → Updates wrapper `transform` style
3. Controller moves horizontally in real-time

**Player Borders Flow:**
1. User clicks border pattern → `setPlayerBorderPattern(id)` updates store
2. Store persists to `localStorage` → Player component detects change → Updates border pattern CSS class
3. Pattern preview shows visual representation of each option

**Source of Truth:**
- `configStore.customBannerImage`: Custom app banner image (null = use default)
- `configStore.playerControllerXOffset`: Current x-offset
- `configStore.playerBorderPattern`: Current border pattern
- `currentThemeId` (from parent): Active theme ID
- All state persisted to `localStorage` via Zustand persist middleware

**State Dependencies:**
- When `customBannerImage` changes → App banner component updates display
- When `playerControllerXOffset` changes → LayoutShell updates wrapper transform
- When `playerBorderPattern` changes → Player borders update CSS class
- When theme changes → Color palette grid highlights active theme

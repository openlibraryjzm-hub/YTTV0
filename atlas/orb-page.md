# OrbPage

OrbPage is a dedicated page for orb configuration, accessed via the "Orb" button in the Settings Page sticky toolbar. It appears as a full page below the Page Banner (not a modal), matching the structure of VideosPage.

**Related Documentation:**
- **Settings Page**: See `ui-pages.md` (Section 4.1.8) for Settings Page overview
- **State Management**: See `state-management.md` for configStore details

---

## 1: User-Perspective Description

- **Page Structure**:
  - **Page Banner**: "Orb Configuration" title with description (no author/avatar to avoid ASCII art)
    - **Spill Editor**: Left side of banner shows interactive spill editor with visualizer, quadrant toggles, and upload controls
  - **Back Button**: "Back to Settings" button in banner's top-right corner
  - **Navigation Buttons**: Four buttons (Orb, You, Page, App) positioned at bottom of Page Banner
  - **Sticky Toolbar**: Contains Colored Prism Bar with clickable filtering
    - **"All" Button**: Shows all presets (leftmost, dark background)
    - **Color Bars**: Each of 16 folder colors is clickable to filter presets by assigned folder
    - **Counts**: Shows number of presets assigned to each folder color
    - **Active Filter**: Selected color shows white ring highlight
  - **Tab Navigation**: Three tabs below the sticky toolbar
    - **Presets Tab**: Horizontal scrolling grid of saved presets
    - **Configuration Tab**: Orb configuration controls
    - **Groups Tab**: Two-column layout for group management (left: select group leader, right: assign presets to group)

- **Presets Tab**:
  - **Layout**: Horizontal scrolling grid (4 columns visible, scrolls horizontally)
  - **Scroll Wheel Support**: Mouse wheel scrolls horizontally through presets
  - **Filtering**: Grid filters based on selected folder color from prism bar
  - **Group Leaders Toggle**: Toggle button in header to show only presets that are group leaders with at least 1 member
    - When enabled, only group leaders with members are displayed
    - Toggle shows "Group Leaders Only" when active, "All Presets" when inactive
  - **Preset Thumbnails**: Circular orbs showing actual spill effects using SVG clipPath
    - Each preset displays with its saved spill configuration (image overflows in enabled quadrants)
    - Scale and position offsets are applied to match the actual orb appearance
    - Active preset shows sky-blue border and ring indicator
  - **Preset Name**: Displayed below each thumbnail
  - **Spill Badge**: Top-right badge on presets with spill enabled
  - **Folder Assignment**: Folder icon button (top-left on hover) opens color grid to assign presets to folder colors
    - Checkmarks indicate assigned folders
    - Assigned folder indicators shown as colored dots at bottom of thumbnail (up to 3, with +N for more)
  - **Delete on Hover**: Red trash button appears when hovering over a preset (top-right)
  - **One-Click Apply**: Click any preset thumbnail to instantly apply its configuration
  - **Empty State**: Shows message when no presets are saved
  - **Group View (Column)**: 
    - For presets that are group leaders, a **Layout Grid** button appears in the hover menu (below Folder button).
    - Clicking this opens a full-height overlay column showing the group leader and all its subordinate members.
    - Allows scrolling through subordinates and applying them directly.


- **Configuration Tab**:
  - **Preview Area**: Left side shows a placeholder/preview instruction area (Spill Editor moved to Banner)
  - **Image Scale Slider**: 0.5x to 3.0x zoom control (Right side, visible when spill enabled)
    - Value displayed centered above slider
  - **Image Position Sliders**: X and Y offset controls (-100 to +100px) with reset buttons (Right side)
    - Values and reset buttons displayed centered above each slider
  - **Save Configuration Button**: Saves current setup as a new preset
  - **Compact Layout**: All controls visible without vertical scrolling

- **Groups Tab**:
  - **Two-Column Layout**: 
    - **Left Side**: Grid of all orb presets for selecting group leader
      - Shows all presets in 4-6 column grid (64px × 64px circular previews)
      - When group leader selected, shows info banner with assigned count
      - Clicking any preset selects it as group leader and applies it
      - Selected group leader shows sky-blue border and "Leader" badge
      - Active indicator overlay appears when preset is currently applied but not the group leader
    - **Right Side**: Grid of all orb presets for assigning to group
      - Shows all presets in 4-6 column grid
      - Highlights assigned presets with purple border and checkmark badge
      - Clicking assigns/unassigns preset to currently selected group leader
      - Group leader cannot be assigned to itself
      - Active indicator overlay appears when preset is currently applied but not the group leader and not assigned
  - **Scrollable**: Max height 600px with vertical scrolling on both sides
  - **Hover Tooltips**: Preset name and status (Leader/Assigned) appears on hover
  - **Empty State**: Shows message when no presets are saved

## 2: File Manifest

**UI/Components:**
- `src/components/OrbPage.jsx`: Dedicated orb configuration page component
- `src/components/PageBanner.jsx`: Page banner with back button and compact orb controls
- `src/components/SettingsPage.jsx`: Parent component that conditionally renders OrbPage

**State Management:**
- `src/store/configStore.js`: Orb state and preset management
  - `orbFavorites`: Array of saved preset objects, each with `folderColors`, `groupLeaderId`, and `groupMembers` properties
  - `updateOrbFavoriteFolders(id, folderColors)`: Updates folder color assignments for a preset
  - `assignOrbToGroup(presetId, groupLeaderId)`: Assigns/unassigns orb preset to group leader
  - All orb configuration state is shared between SettingsPage and OrbPage

## 3: The Logic & State Chain

**Navigation Flow:**
1. SettingsPage defaults to showing OrbPage when first accessed (`showOrbPage` state is `true` by default)
2. User clicks navigation buttons at bottom of Page Banner → `navigateToPage()` function updates state
3. SettingsPage conditionally renders the selected page component (OrbPage, PagePage, AppPage, or YouPage)
4. All pages share the same sticky toolbar with Colored Prism Bar
5. "Back to Settings" button navigates to OrbPage (the default page)

**Preset Display:**
1. Each preset uses unique SVG clipPath based on saved `orbSpill` configuration
2. ClipPath includes circle base + rectangles for enabled spill quadrants
3. Image is scaled and positioned using saved `orbImageScale`, `orbImageXOffset`, `orbImageYOffset`
4. Result matches exactly how the orb appears in PlayerController

**Tab Navigation:**
- Three tabs: "Presets", "Configuration", and "Groups"
- Active tab state managed by `activeTab` (useState: 'presets', 'configuration', or 'groups')
- Tab buttons styled similar to TopNavigation with icons (Smile, Settings, Folder)

**Preset Management:**
- Save: User configures orb → Clicks "Save Current Configuration" → `addOrbFavorite()` adds to array
- Apply: User clicks preset → `applyOrbFavorite()` restores all settings → PlayerController updates
- Delete: User hovers preset → Clicks trash icon → `removeOrbFavorite()` removes from array
- **Folder Assignment**: User hovers preset → Clicks folder icon → Selects folder colors → `updateOrbFavoriteFolders()` updates assignments
- **Filtering**: User clicks prism bar color → Grid filters to show only presets assigned to that color
- **Group Leaders Toggle**: User toggles "Group Leaders Only" → Presets tab shows only presets that are group leaders with at least 1 member

**Group Management (Groups Tab):**
- Select Leader: User clicks preset on left side → Sets `selectedGroupLeaderId` and applies preset → Shows info banner with assigned count
- Assign to Group: User clicks preset on right side → `assignOrbToGroup()` assigns/unassigns preset to currently selected group leader
- Group leader stores `groupMembers` array (preset IDs)
- Assigned presets store `groupLeaderId` (preset ID)
- Visual feedback shows assigned presets with purple borders and checkmark badges
- Active indicator overlay appears on left side when preset is currently applied but not the group leader
- Active indicator overlay appears on right side when preset is currently applied but not the group leader and not assigned

**Horizontal Scrolling (Presets Tab):**
- Uses `horizontalScrollRef` (useRef) for scrollable container
- `onWheel` handler converts vertical mouse wheel to horizontal scrolling
- `useEffect` hook attaches wheel event listener (dependent on `activeTab`)
- Container styled with `overflowX: 'scroll'`, `overflowY: 'visible'` for overflow buttons
- Custom scrollbar styling: thin scrollbar with custom colors

**Source of Truth:**
- `configStore.orbFavorites`: Array of saved orb presets
- `configStore.customOrbImage`, `configStore.isSpillEnabled`, etc.: Current orb configuration
- All state persisted to `localStorage` via Zustand persist middleware

**State Dependencies:**
- When `orbFavorites` changes → Presets grid updates
- When folder filter changes → `filteredFavorites` recalculates → Grid shows filtered presets
- When group leaders toggle enabled → Grid filters to show only group leaders with members
- When group leader selected → Info banner shows → Right side highlights assigned presets
- When preset applied → All orb settings update → PlayerController reflects changes immediately

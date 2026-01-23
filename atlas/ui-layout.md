###4.0: UI Layout & Styling

The UI system provides a consistent layout shell with a side menu that displays different pages based on navigation state. The system uses a reusable Card component architecture for displaying playlists, videos, and history items in a grid layout.

**Theme**: The application uses a light sky blue background (`#e0f2fe`) with dark blue text (`#052F4A` / RGB(5, 47, 74)) for side menu content. Navigation buttons (TopNavigation, TabBar) remain white for contrast. See `THEME_CHANGES.md` in project root for detailed theme documentation.

**Related Documentation:**
- **Navigation**: See `navigation-routing.md` for page routing flows and navigation state management
- **State Management**: See `state-management.md` for `navigationStore` (page routing), `layoutStore` (view modes), and `folderStore` (folder filtering)
- **Playlists**: See `playlist&tab.md` Section 2.1 for playlist grid details
- **Videos**: See `playlist&tab.md` Section 2.2 for video grid and folder filtering
- **History**: See `history.md` for history page details
- **Pages**: See `ui-pages.md` for all page components
- **Cards**: See `ui-cards.md` for card component details
- **Modals**: See `ui-modals.md` for modal components

---

#### ### 4.0 Layout & Styling

**1: Window Architecture (Borderless)**
The application uses a modern **Borderless Window** design (`decorations: false`):
- **No Title Bar**: The native OS title bar is removed for a seamless, premium look.
- **Custom Window Controls**: A custom `WindowControls` component (Minimize, Maximize, Close) is integrated into the top-right corner of the banner.
- **Draggable Banner**: The entire Top Banner is a draggable region (`data-tauri-drag-region`), allowing users to move the window.
- **Dimensions**: Defaults to 1920x1030 (fullscreen width, taskbar-aware height) positioned at (0,0).

**2: Visual Design System**
The application employs a high-contrast, structured design with distinct borders and patterns:

- **Unified Animated Top Border**:
  - The static borders have been replaced by a single, dynamic **Top Border Separator** styling the application structure.
  - This separator runs horizontally across the screen, acting as the visual "Top Border" for both the **Video Player** and the **Side Menu**.
  - **Dynamic Patterns**: It uses the user-selected animated pattern (Diagonal, Dots, Mesh, Solid) configured in Settings -> Player Borders.
  - **Super Transparent aesthetic**: The Video Player's side and bottom borders/padding have been completely removed. The container is now transparent, relying solely on the animated Top Border Bar for structure.
  - **Visualizer Integration**: The Audio Visualizer bars naturally overlap this border bar, creating a cohesive, layered effect.

- **Top Banner ("App Banner")**:
  - Displays a custom image (`/public/banner.PNG`) spanning the full width of the controller.
  - **Infinite Scroll**: The banner image animates continuously from left to right in a 60-second seamless loop.
  - **Customizable**: Supports custom image uploads (PNG/JPG/WEBP/GIF) via Settings.
    - **Static Images**: Scroll indefinitely.
    - **GIFs**: Play natively without scrolling (to avoid motion issues).
  - **Separator**: Features a "Solid" separator line (12px) with the Light Blue Pattern, separating the banner from the app content.

- **Page Banner ("Videos Banner")**:
  - Located on the Videos, Playlists, and Colored Folders views.
  - **Height**: Fixed height of 220px ensures consistent layout and prevents resizing jitter.
  - **Dynamic Title**:
    - **Playlists Page**: Displays "All", preset name (e.g., "Gaming"), or appended tab name (e.g., "All - Favorites").
    - **Videos Page**: Displays Playlist Name or Folder Name.
  - **Top-Aligned Layout**: Content (Title, Metadata, Description) is aligned to the top-left (`items-start`) for a cleaner presentation.
  - **Visual Elements**:
    - **ASCII Avatar**: Vertically centered within the banner.
    - **Metadata Trio**: Displays Video Count (dynamic label), Year, and Author Pseudonym below the title.
    - **Description**: Truncated to 2 lines (`line-clamp-2`) with generous right padding to avoid overlap.
    - **Continue Watching**: Thumbnail positioned at the top-right (`top-12`) to align horizontally with the centered ASCII art.
  - **Dynamic Patterns**: Features selectable animated background patterns (Diagonal, Dots, Mesh, Solid).
  - **Custom Uploads**: Supports changing the background to a custom uploaded image.
    - **Sticky Toolbar**:
    - A translucent, glassmorphic toolbar (`backdrop-blur-xl`) that sits below the banner and sticks to the top of the viewport on scroll.
    - **Unified Design**: Shares the banner's background image and scroll animation for a seamless look.
    - **Structure**:
      - **Left**: Sort controls (Videos) or Tab Bar (Playlists).
      - **Right**: Action buttons (Filter, Add, etc.).
      - **Color Bar Prism (Videos)**: A unified, stretchable "prism" bar of colored folder rectangles. Displays video counts inside the colors.

- **Video Player**:
  - Wrapped in a `.layout-shell__player` container.
  - **Transparent Structure**: Features a fully transparent background with `padding: 0`. The visual "border" is provided solely by the shared Top Border Separator.
  - Scales responsively with view modes (Full/Half/Quarter).

- **Floating Metadata Bubbles**:
  - **Removed**: Video metadata (Author/View Count) and Playlist titles are now integrated directly into the Top Playlist/Video Menus for a cleaner, encapsulated look (see `advanced-player-controller.md`).

**3: Loading & Skeletons (Optimistic UI)**
To ensure immediate perceived response, the application uses **Skeleton Screens** instead of generic spinners:
- **Video Grid**: Displays a grid of `VideoCardSkeleton` items (shimmering placeholders) immediately upon navigation, masking the backend data fetch time.
- **Playlist Grid**: Displays `PlaylistCardSkeleton` items and a Banner skeleton while metadata loads.
- **Animation**: Uses a custom `shimmer` CSS animation (`@keyframes shimmer`) for a premium "native app" feel.

---

#### ### 4.1 Side Menu

**1: User-Perspective Description**

Users see a side menu panel that appears on the right side of the screen when in "half" or "quarter" view modes:

- **Top Navigation Bar**: Horizontal bar at the top of the side menu containing:
  - **Back Button**: Chevron left button (visible when history exists), navigates to previous page.
  - **Tabs**: 
    - Text-based tabs: "Playlists", "Videos".
    - Icon-only tabs: "History" (Clock), "Likes" (Heart), "Pins" (Pin), "Settings" (Gear), "Support" (Cat).
   - **Side Menu Scroll Controls**: 
     - **Location**: Integrated into the Top Navigation header, to the left of the Back button.
     - **Components**: Up Chevron, Central Dot Button (scroll-to-active), Down Chevron.
     - **Functionality**: Smoothly scrolls the active side menu page content. The central dot attempts to center the currently active item (playing video or playlist).
  - **Close Side Menu Button**: "Close Side Menu" button (X) aligned to the right. Clicking it returns to full-screen mode (hides side menu).

- **Folder Selector** (Videos page only): Below the tabs, a row of 17 colored dots:
  - **"All"** button: Gray dot, shows all videos when clicked
  - **16 Folder Color Dots**: One for each folder color (Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink)
  - Active folder highlighted with blue ring
  - Clicking a folder filters videos to show only videos in that folder

- **Page Content**: The main content area below navigation, showing:
  - **Playlists Page**: 2-column grid of playlist cards (see `ui-pages.md`)
  - **Videos Page**: 3-column grid of video cards (see `ui-pages.md`)
  - **History Page**: 3-column grid of history cards (see `ui-pages.md`)

- **Layout Modes**: Side menu visibility controlled by view mode:
  - **Full Mode**: Side menu hidden, player only
  - **Half Mode**: Side menu visible on right, player on left
  - **Quarter Mode**: Side menu visible, smaller player

**2: File Manifest**

**UI/Components:**
- `src/LayoutShell.jsx`: Main layout component that manages side menu positioning
- `src/components/TopNavigation.jsx`: Tab navigation bar component
- `src/components/FolderSelector.jsx`: Folder color selector component (Videos page only)
- `src/App.jsx`: Orchestrates page routing and side menu content

**State Management:**
- `src/store/navigationStore.js`:
  - `currentPage`: 'playlists' | 'videos' | 'history'
  - `history`: Array of previous pages
  - `setCurrentPage(page)`: Sets active page and pushes to history
  - `goBack()`: Navigates to previous page
- `src/store/layoutStore.js`:
  - `viewMode`: 'full' | 'half' | 'quarter'
  - `setViewMode(mode)`: Sets view mode
- `src/store/playlistStore.js`:
  - `showPlaylists`: Boolean (legacy, controls PlaylistList sidebar)
- `src/store/folderStore.js`:
  - `selectedFolder`: Currently selected folder color (null = all)

**API/Bridge:**
- No direct API calls - routing only

**Backend:**
- No database tables - UI state only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Tab Navigation Flow:**
   - User clicks tab → `handleTabClick(tabId)` (TopNavigation.jsx line 19)
   - Calls `setCurrentPage(tabId)` → Updates `navigationStore.currentPage`
   - If in full mode → `setViewMode('half')` → Auto-switches to half mode to show side menu
   - `App.jsx` checks `currentPage` → Renders appropriate page component:
     - `currentPage === 'playlists'` → `<PlaylistsPage />`
     - `currentPage === 'videos'` → `<VideosPage />`
     - `currentPage === 'history'` → `<HistoryPage />`

2. **Folder Selection Flow:**
   - User clicks folder color dot → `setSelectedFolder(folderColor)` (FolderSelector.jsx)
   - Updates `folderStore.selectedFolder` → VideosPage filters videos
   - If `folderColor === null` → Shows all videos
   - If `folderColor` set → Calls `getVideosInFolder(playlistId, folderColor)` → Filters grid

3. **View Mode Toggle Flow:**
   - User clicks "View All Videos" or "View All Playlists" → `setViewMode('half')`
   - Side menu becomes visible → Shows appropriate page
   - User clicks close button (X) → `setViewMode('full')` → Side menu hidden

**Source of Truth:**
- `navigationStore.currentPage` - Currently active page (Source of Truth)
- `layoutStore.viewMode` - Current view mode (Source of Truth)
- `folderStore.selectedFolder` - Currently selected folder filter (Source of Truth)

**State Dependencies:**
- When `currentPage` changes → `App.jsx` re-renders → Different page component displayed
- When `viewMode` changes → `LayoutShell` re-renders → Side menu visibility toggles
- When `selectedFolder` changes → `VideosPage` filters videos → Grid updates
- When tab clicked in full mode → Auto-switches to half mode → Side menu appears

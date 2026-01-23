###Page Banner

The Page Banner is a contextual banner component displayed at the top of content pages (Videos, Playlists, Likes, Pins, etc.). It provides rich metadata, visual identity, and seamless integration with the Sticky Toolbar system.

**Related Documentation:**
- **Pages**: See `ui-pages.md` for pages that use Page Banner (Videos, Playlists, Likes, Pins)
- **Layout**: See `ui-layout.md` for layout system details
- **App Banner**: See `app-banner.md` for the top-level application banner
- **Settings**: See `ui-pages.md` Section 4.1.8 for banner pattern and customization options

---

#### ### Page Banner Overview

**1: User-Perspective Description**

Users see a contextual banner (220px fixed height) at the top of scrollable content areas on various pages:

- **Location**: Appears on Videos Page, Playlists Page, Likes Page, Pins Page, and Colored Folder views
- **Dynamic Content**: Displays contextual information based on current view:
  - **Videos Page**: Shows playlist name, folder name (e.g., "Red Folder"), custom folder name, or "Unsorted Videos"
  - **Playlists Page**: Shows "All", preset name (e.g., "Gaming"), or tab name (e.g., "All - Favorites")
  - **Likes Page**: Shows "Liked Videos" with playlist badges and pagination badge
  - **History Page**: Shows "History" with playlist badges
  - **Pins Page**: Shows "Pinned Videos"
- **Visual Elements**:
  - **Title**: Large, bold text with dark text shadow for readability
  - **Metadata Row**: Video count, creation year, and author pseudonym
  - **Description**: Truncated to 2 lines with generous right padding (can be replaced with `customDescription` prop)
  - **Playlist Badges**: Interactive badges showing playlists (History/Likes pages)
    - **Styling**: Matches metadata row (text-white/80, font-medium, text-sm md:text-base)
    - **Left Click**: Filters page content to that playlist
    - **Right Click**: Navigates to Videos page for that playlist
    - **Limit**: 2 rows with expand button (>>>) to show all
  - **Pagination Badge**: Compact pagination controls (Likes page)
    - Format: `<< < 1/99 > >>` (First, Previous, Current/Total, Next, Last)
    - Styled to match metadata row text
  - **ASCII Avatar**: Vertically centered ASCII art (user signature)
  - **Continue Watching**: Optional thumbnail in top-right corner for recently watched videos
- **Background Options**:
  - **Color Gradients**: Vibrant gradients matching folder color (when viewing folders)
  - **Animated Patterns**: CSS-based patterns (Diagonal, Dots, Mesh, Solid) when no custom image
  - **Custom Images**: User-uploaded images via `EditPlaylistModal` (for playlists/folders)
- **Unified Banner System**: When custom image is set, the banner visually connects with the Sticky Toolbar below it using synchronized horizontal scroll animation

**2: File Manifest**

**UI/Components:**
- `src/components/PageBanner.jsx`: Main banner component with all content and styling logic
- `src/components/UnifiedBannerBackground.jsx`: GPU-accelerated background layer for custom images
- `src/components/VideosPage.jsx`: Uses PageBanner for playlist/folder context
- `src/components/PlaylistsPage.jsx`: Uses PageBanner for playlist overview
- `src/components/LikesPage.jsx`: Uses PageBanner with playlist badges and pagination badge
- `src/components/HistoryPage.jsx`: Uses PageBanner with playlist badges
- `src/components/PinsPage.jsx`: Uses PageBanner for pinned videos header
- `src/components/EditPlaylistModal.jsx`: Allows uploading custom page banner images

**State Management:**
- `src/store/configStore.js`:
  - `bannerPattern`: Selected pattern ('diagonal' | 'dots' | 'mesh' | 'solid')
  - `customPageBannerImage`: Base64 string of uploaded page banner image (null = use gradient/pattern)
  - `bannerHeight`: Current banner height (reported by PageBanner for Sticky Toolbar alignment)
  - `setBannerHeight(height)`: Updates banner height in store
  - `setBannerBgSize(size)`: Updates background size calculation
- `src/store/folderStore.js`:
  - Folder color information for gradient generation
- Database (for custom folder banners):
  - `folder_metadata.custom_ascii`: Custom ASCII art for folders
  - Custom banner images stored per playlist/folder in `folder_metadata` (future)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getFolderMetadata(playlistId, folderColor)` - Gets custom folder names and ASCII art
  - `updateFolderMetadata(playlistId, folderColor, metadata)` - Updates folder metadata including custom banners

**Backend:**
- `src-tauri/src/database.rs`:
  - `folder_metadata` table: Stores custom folder names, descriptions, and ASCII art
  - Future: May store custom banner images per folder/playlist

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Banner Rendering Flow:**
   - Page component (VideosPage, PlaylistsPage, etc.) determines banner context
   - Calculates banner props:
     - **Title**: Playlist name, folder name, or page name
     - **Description**: Playlist/folder description or default text
     - **Folder Color**: Current folder color (if viewing folder)
     - **Video Count**: Number of videos in current view
     - **Avatar**: Custom ASCII art from folder metadata or user signature
   - Passes props to `<PageBanner />` component
   - `PageBanner.jsx` renders with appropriate styling

2. **Background Selection Flow:**
   - Component checks `customPageBannerImage` from `configStore`
   - **If Custom Image Set**:
     - Uses `UnifiedBannerBackground` component for GPU-accelerated scrolling
     - Checks if image is GIF → Disables scroll animation if GIF
     - Applies custom image as background with `background-size: cover`
   - **If No Custom Image**:
     - Checks `folderColor` prop → Generates gradient from folder color
     - If `folderColor === 'unsorted'` → Uses gray gradient
     - If no folder color → Uses default blue gradient
     - Applies animated pattern overlay based on `bannerPattern` setting

3. **Custom Banner Upload Flow (Playlist/Folder):**
   - User clicks Edit button (pen icon) on banner → Opens `EditPlaylistModal`
   - User uploads custom banner image → Modal saves to `folder_metadata` table
   - On next page load → Banner fetches custom image from database
   - Updates `customPageBannerImage` in store → Banner displays custom image
   - **Note**: Currently custom page banners are scoped per playlist/folder (stored in database)

4. **Sticky Toolbar Integration:**
   - `PageBanner` measures its height via `ResizeObserver`
   - Reports height to `configStore` via `setBannerHeight(height)`
   - Sticky Toolbar uses this height for seamless visual connection
   - When custom image is set, both banner and toolbar use `UnifiedBannerBackground` with synchronized animation

5. **Continue Watching Flow:**
   - Component checks for recently watched video in current playlist/folder
   - If found → Displays "CONTINUE?" section in top-right corner
   - Shows video thumbnail with play button overlay
   - User clicks → Calls `onContinue` callback → Starts playing from last position
   - Positioned at `top-12 right-6` to align with ASCII avatar

**Source of Truth:**
- `configStore.customPageBannerImage` - Custom page banner image (global, can be overridden per playlist/folder)
- `configStore.bannerPattern` - Selected animated pattern
- Database `folder_metadata` table - Custom folder banners and ASCII art (per folder)
- Database `playlists` table - Playlist descriptions and metadata
- Props passed from parent page component - Title, description, video count, folder color, playlist badges, customDescription
- Page component state - Filtered playlist state, pagination state (for badges and pagination badge)

**State Dependencies:**
- When `customPageBannerImage` changes → Banner background updates → UnifiedBannerBackground renders
- When `bannerPattern` changes → Pattern overlay updates (only when no custom image)
- When `folderColor` changes → Gradient colors update → Banner re-renders with new colors
- When banner height changes → `setBannerHeight` called → Sticky Toolbar adjusts positioning
- When custom image uploaded → Saved to database → Banner fetches and displays on next load
- When `playlistBadges` changes → Badge list updates → Badges re-render
- When `filteredPlaylist` changes → Badge highlighting updates → Filtered badge appears brighter
- When `customDescription` provided → Description text replaced with custom content (e.g., pagination badge)

**4: Technical Implementation Details**

**Unified Banner System:**
- Uses `UnifiedBannerBackground` component for custom images
- GPU-accelerated horizontal scroll animation (60fps)
- Two side-by-side divs (200% width total) slide from 0 to -50% for seamless loop
- Ensures `background-size: 100%` corresponds to one viewport width

**Gradient Generation:**
- Folder colors mapped via `FOLDER_COLORS` utility
- Gradient formula: `linear-gradient(135deg, ${color}DD 0%, ${color} 100%)`
- Unsorted videos use slate/gray gradient: `linear-gradient(135deg, #64748b 0%, #475569 100%)`
- Default (no folder): Sky to Blue gradient

**Pattern Overlay:**
- CSS-based animated patterns when no custom image
- Patterns: Diagonal, Dots, Mesh, Solid
- Applied via `pattern-${bannerPattern}` class
- Patterns are CSS-only (no images required)

**Height Management:**
- Fixed height: `h-[220px]` (220px) for consistent layout
- `ResizeObserver` monitors actual rendered height
- Reports to `configStore` for Sticky Toolbar alignment
- Prevents layout jitter during content changes

**Content Layout:**
- **Top-Aligned**: Content uses `items-start` for top-left alignment
- **ASCII Avatar**: Vertically centered (`mt-8`) within 220px container
- **Continue Video**: Positioned at `top-12 right-6` to align horizontally with avatar
- **Text Padding**: Dynamic right padding (`pr-64`) when continue video is present

**5: Page-Specific Usage**

**Videos Page:**
- Displays playlist name or folder name as title
- Shows video count, year (2026), and author
- Edit button allows renaming and setting custom banner via `EditPlaylistModal`
- Custom banners persist in `folder_metadata` table
- Continue watching appears if playlist has recently watched video

**Playlists Page:**
- Title: "All", preset name, or "All - TabName"
- Shows total playlist count and total video count
- No edit button (playlist-level editing handled elsewhere)

**Likes Page:**
- Title: "Liked Videos"
- Playlist badges: Displays all unique playlists containing liked videos (excluding "Likes" itself)
- Pagination badge: Compact navigation controls (`<< < 1/99 > >>`) in place of description when multiple pages exist
- Badge interactions: Left-click to filter, right-click to navigate
- Filtering: When filtered, description updates to "Liked videos from '[Playlist Name]'"
- Badge limit: 2 rows with expand button (>>>) to show all playlists
- Custom description: Uses `customDescription` prop for pagination badge

**History Page:**
- Title: "History"
- Playlist badges: Displays all unique playlists containing videos from watch history
- Badge interactions: Left-click to filter, right-click to navigate
- Filtering: When filtered, description updates to "Videos from '[Playlist Name]'"
- Badge limit: 2 rows with expand button (>>>) to show all playlists

**Pins Page:**
- Title: "Pinned Videos"
- Standard metadata display
- No folder color (uses default gradient)

**6: Customization Options**

**Via EditPlaylistModal:**
- **Location**: Click pen icon (top-left, appears on hover) on Videos Page banner
- **Features**:
  - Rename playlist/folder
  - Update description
  - Upload custom page banner image
  - Custom banners saved to `folder_metadata` table
- **Not Available**: For "Unsorted Videos" view (no edit button shown)

**Via Settings:**
- **Location**: Settings → Appearance → Page Banner
- **Pattern Selection**: Toggle between Diagonal, Dots, Mesh, Solid patterns
- **Custom Upload**: Upload global custom page banner (applies when no folder-specific banner)
- **Preview**: Live preview of selected pattern or uploaded image

**Visual Customization:**
- **ASCII Art**: Set via Settings → Signature, or per-folder via `folder_metadata.custom_ascii`
- **Author Name**: Set via Settings → Signature → Pseudonym
- **Folder Colors**: Automatically generate matching gradients

**Playlist Badges:**
- **Purpose**: Display interactive badges for playlists on History and Likes pages
- **Styling**: Matches metadata row text (text-white/80, font-medium, text-sm md:text-base)
- **Limit**: 2 rows maximum with expand button (>>>) to show all playlists
- **Interactions**:
  - **Left Click**: Filters page content to show only items from that playlist
  - **Right Click**: Navigates to Videos page for that playlist in preview mode
- **Filtered State**: Badge highlights with brighter background/border when active
- **Props**: `playlistBadges` (array), `onPlaylistBadgeLeftClick`, `onPlaylistBadgeRightClick`, `filteredPlaylist`

**Pagination Badge:**
- **Purpose**: Compact pagination controls for Likes page (replaces description text)
- **Format**: `<< < 1/99 > >>` (First, Previous, Current/Total, Next, Last)
- **Styling**: Matches metadata row text styling
- **Visibility**: Only shown when `totalPages > 1`
- **Props**: `customDescription` prop accepts React node to replace description text

---

#### ### Sticky Toolbar Integration

**1: Overview**

The Sticky Toolbar is a dynamic toolbar component that sits directly below the Page Banner and sticks to the top of the viewport when scrolling. It provides contextual controls and navigation while maintaining visual continuity with the Page Banner above it.

**2: Visual States & Transparency**

**Resting State (Not Stuck):**
- **Position**: Sits directly below Page Banner with `-mt-16` negative margin for seamless connection
- **Transparency**: Fully transparent background (`bg-transparent`, `backgroundColor: 'transparent'`)
- **Backdrop Blur**: Subtle blur (`backdrop-blur-[2px]`) for slight depth
- **Borders**: Thin borders on all sides (`border-b border-x border-t border-white/10`) with 10% white opacity
- **Rounded Corners**: Rounded bottom corners (`rounded-b-2xl`) matching Page Banner
- **Margins**: Horizontal margins (`mx-8`) for visual spacing
- **Padding**: Minimal vertical padding (`pt-1 pb-0`)
- **Shadow**: Subtle shadow (`shadow-xl`)

**Stuck State (When Scrolled):**
- **Position**: Sticks to top of viewport (`sticky top-0`)
- **Transparency**: Semi-transparent dark background (`bg-slate-900/70` - 70% opacity dark slate)
- **Backdrop Blur**: Strong blur (`backdrop-blur-xl`) for glassmorphic effect
- **Borders**: Top and bottom borders only (`border-y`) with no side borders
- **Rounded Corners**: Square corners (`rounded-none`) for full-width appearance
- **Margins**: Full width (`mx-0`) when stuck
- **Padding**: Increased vertical padding (`pt-2 pb-2`)
- **Height**: Fixed height (`h-[52px]`) when stuck
- **Shadow**: Strong shadow (`shadow-2xl`) for depth

**Transition:**
- Smooth 500ms transition (`transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)`)
- All visual properties animate smoothly between states
- Z-index: `z-40` ensures toolbar stays above content

**3: Videos Page Sticky Toolbar Layout**

**Left Side - Folder Selection & Sort:**
- **Sort Dropdown**: Compact sort selector with three options:
  - "Default" (shuffle order)
  - "Date" (chronological)
  - "Progress" (by watch progress)
  - Styled with dark background (`bg-slate-800/80`), small text (`text-[10px]`), uppercase, bold
- **All/Unsorted Buttons**: Two compact buttons:
  - **"All"**: Shows all videos (selected state: `bg-sky-500`, unselected: `bg-slate-800/80`)
  - **"Unsorted"**: Shows unsorted videos (selected state: `bg-slate-500`, unselected: `bg-slate-800/80`)
- **Color Bar Prism**: A unified, stretchable horizontal bar displaying all 16 folder colors:
  - **Layout**: Flex container with `flex-1` to fill available space
  - **Structure**: Each folder color is a flex-1 button, creating equal-width segments
  - **Styling**: 
    - Black border (`border-2 border-black`) with rounded corners (`rounded-lg`)
    - Each segment uses the folder's hex color as background
    - Selected folder: Full opacity (`opacity-100`) with white ring indicator (`ring-2 ring-inset ring-white/50`)
    - Unselected folders: Reduced opacity (`opacity-60`) that increases on hover (`hover:opacity-100`)
  - **Video Count Display**:
    - **Condition**: Numbers only display when `count > 0` (folders with no videos show no number)
    - **Styling**: 
      - Text size: `text-sm` (small text)
      - Weight: `font-bold` (bold)
      - Color: `text-white/90` (90% opacity white for readability on colored backgrounds)
      - Shadow: `drop-shadow-md` (medium drop shadow for contrast)
    - **Positioning**: Centered both horizontally and vertically within each color segment using `flex items-center justify-center`
    - **Content**: Displays raw number (e.g., "5", "12", "0" - but 0 is hidden)
    - **Calculation**: Counts videos assigned to each folder from `videoFolderAssignments` data
    - **Update**: Recalculates via `useMemo` when `videoFolderAssignments` changes
  - **Tooltip**: Shows folder name and count on hover (e.g., "Red (5)") - includes count even if number not visible
  - **First/Last**: First segment has `rounded-l-md`, last segment has `rounded-r-md`
  - **Click Action**: Clicking a color segment filters videos to that folder
- **Horizontal Scroll**: Left side uses `overflow-x-auto` with `mask-gradient-right` for fade-out effect on scroll

**Right Side - Action Controls:**
- **Bulk Tag Mode Toggle**: 
  - Icon: Tag/label SVG icon
  - Active state: Blue background (`bg-blue-600`), white text, shadow
  - Inactive state: Dark background (`bg-slate-800/80`), gray text, border
  - Toggles bulk tagging mode for selecting multiple videos
- **Add Button**: 
  - Icon: Plus SVG icon
  - Styled: Sky blue (`bg-sky-500`), white text, shadow with hover effects
  - Action: Opens Playlist Uploader modal (`setShowUploader(true)`)

**4: Playlists Page Sticky Toolbar Layout**

**Left Side - Tab Bar:**
- **TabBar Component**: Full-width tab navigation
- **Horizontal Scroll**: Uses `overflow-x-auto` with `mask-gradient-right` for fade-out
- **Tab Presets**: Integrated dropdown for managing tab presets

**Right Side - Control Cluster:**
- **Border Separator**: Vertical border (`border-l border-white/10`) separates controls from tabs
- **Folder Toggle Button**:
  - Icon: Folder SVG icon
  - Active state: Sky blue (`bg-sky-600`), white text, shadow
  - Inactive state: Dark background (`bg-slate-800/80`), gray text, border
  - Toggles display of colored folders in the playlist grid
  - Tooltip: "Hide Folders" / "Show Folders"
- **Add Playlist Button**:
  - Icon: Plus SVG icon
  - Styled: Sky blue (`bg-sky-500`), white text, shadow with hover effects
  - Action: Opens Playlist Import modal (`setShowImportModal(true)`)

**5: Background Sharing (Unified Banner System)**

**Current Implementation:**
- The Sticky Toolbar uses backdrop blur and transparency effects rather than directly sharing the Page Banner's background image
- When custom page banner image is set, the toolbar's transparent/glassmorphic styling allows the banner's visual style to show through
- The toolbar's background adapts based on stuck state (transparent when resting, semi-transparent dark when stuck)

**Visual Continuity:**
- `seamlessBottom` prop on PageBanner removes bottom border/rounded corners
- Toolbar uses negative margin (`-mt-16`) to visually connect with banner
- Both components use similar glassmorphic styling for visual harmony
- When stuck, toolbar's dark background (`bg-slate-900/70`) provides contrast while maintaining transparency

**Future Enhancement:**
- Planned: Direct background sharing using `UnifiedBannerBackground` component
- Would enable synchronized horizontal scroll animation between banner and toolbar
- Would create true seamless visual connection with GPU-accelerated animation

**6: Technical Details**

**Sticky Detection:**
- Uses `IntersectionObserver` with a sentinel element (`stickySentinelRef`)
- Sentinel positioned at top of scrollable area
- When sentinel leaves viewport, `isStuck` state becomes `true`
- Triggers visual state transition in toolbar

**Z-Index Layering:**
- Toolbar: `z-40` (above content, below modals)
- Content: Default z-index
- Page Banner: Lower z-index (scrolls with content)

**Responsive Behavior:**
- Toolbar adapts height based on stuck state
- Content area adjusts padding to accommodate toolbar
- Horizontal scrolling for folder selector on smaller screens
- Mask gradient prevents hard scroll edge

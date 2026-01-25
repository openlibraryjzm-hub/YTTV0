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
  - **Media Carousel** (bottom-left): Shows continue watching, pinned videos, and/or ASCII signature
    - **Continue Video**: Thumbnail of most recently watched video (click to resume)
    - **Pinned Videos**: Thumbnail of pinned video(s) in current playlist
    - **ASCII Signature**: User's ASCII art displayed in fixed container (from Settings → Signature)
    - **Segmented Bar Navigation**: Horizontal bar with icons below content to toggle views:
      - Clock icon for Continue watching
      - Pin icon for Pinned videos
      - Sparkles icon for ASCII Signature
    - **Multi-Pin Bar**: When multiple pins exist, a vertical segmented bar appears to the right of thumbnail
    - **Fixed Width**: Container is 170px wide with 160px content area to prevent layout shifts
  - **Playlist Navigator** (Videos Page): Top-right chevron controls for browsing playlists
    - Left/right chevrons navigate between playlists in preview mode
    - Playlist name displayed with fixed width and truncation
    - Return button appears when navigated away from reset point
- **Background Options**:
  - **Color Gradients**: Vibrant gradients matching folder color (when viewing folders)
  - **Animated Patterns**: CSS-based patterns (Diagonal, Dots, Mesh, Solid) when no custom image
  - **Two-Layer Image System**: User can upload up to two images via Settings → Appearance → Page Banner:
    - **Layer 1 (Background)**: Primary image that can optionally scroll horizontally
    - **Layer 2 (Overlay)**: Secondary image rendered on top (use transparent PNGs for composite effects)
    - Each layer has independent Scale, X Position, and Y Position controls
- **Unified Banner System**: When custom image is set, the banner visually connects with the Sticky Toolbar below it using synchronized horizontal scroll animation (can be disabled via Settings)

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
  - **Layer 1 (Background Image):**
    - `customPageBannerImage`: Base64 string of uploaded Layer 1 image (null = use gradient/pattern)
    - `pageBannerImageScale`: Scale percentage (50-200%, default 100)
    - `pageBannerImageXOffset`: X position percentage (0-100%, default 50 = center)
    - `pageBannerImageYOffset`: Y position percentage (0-100%, default 50 = center)
  - **Layer 2 (Overlay Image):**
    - `customPageBannerImage2`: Base64 string of uploaded Layer 2 image (null = no overlay)
    - `pageBannerImage2Scale`: Scale percentage for Layer 2 (50-200%, default 100)
    - `pageBannerImage2XOffset`: X position percentage for Layer 2 (0-100%, default 50)
    - `pageBannerImage2YOffset`: Y position percentage for Layer 2 (0-100%, default 50)
  - **Animation:**
    - `pageBannerScrollEnabled`: Boolean to enable/disable horizontal scroll animation (default true)
  - **Unified Banner State:**
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
   - Component checks `customPageBannerImage` and `customPageBannerImage2` from `configStore`
   - **If Any Custom Image Set**:
     - Uses `UnifiedBannerBackground` component for GPU-accelerated rendering
     - **Layer 1 (Background)**: Renders first with `z-0`, applies scale/position settings
       - If `pageBannerScrollEnabled` is true and not a GIF → Animates horizontally
       - If disabled or GIF → Static image with position settings
     - **Layer 2 (Overlay)**: Renders on top with `z-[1]`, always static (no scroll animation)
     - Each layer applies its own scale (auto height%) and position (X%, Y%) settings
   - **If No Custom Images**:
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

5. **Media Carousel Flow (Continue/Pinned/ASCII):**
   - Component receives `continueVideo` and `pinnedVideos` props, gets `userAvatar` from configStore
   - **Continue Video**: Most recently watched video in current playlist (from `videoProgress`)
   - **Pinned Videos**: All pinned videos that exist in current playlist (from `pinStore`)
   - **ASCII Signature**: User's ASCII art from Settings → Signature (from `configStore.userAvatar`)
   - **State Management**:
     - `activeThumbnail`: Index into `availableOptions` array (0, 1, or 2)
     - `availableOptions`: Dynamic array of available options ('continue', 'pinned', 'ascii')
     - `activePinnedIndex`: Which pin is currently displayed (when multiple)
   - **Display Logic**:
     - If only one option exists → Shows that option, no navigation bar
     - If multiple options exist → Shows horizontal segmented bar with icons below content
     - If multiple pins → Shows vertical segmented bar to the right of thumbnail
     - ASCII option always available if `userAvatar` is set
   - **Horizontal Segmented Bar** (option navigation):
     - Fixed width (`w-[160px]`), height (`h-5`)
     - Icons: Clock (continue), Pin (pinned), Sparkles (ASCII)
     - Active segment: solid white with black icon
     - Inactive segments: semi-transparent with white icon
     - Glassmorphic styling: `bg-black/20 backdrop-blur-sm border-white/20`
   - **Vertical Pin Bar** (multi-pin navigation):
     - Fixed width (`w-3`), matches thumbnail height (`h-24`)
     - Segments split equally based on pin count (2 pins = 2 segments, 10 pins = 10 segments)
     - Active segment is solid white, inactive segments are semi-transparent
     - Clicking a segment changes `activePinnedIndex` to show that pin
   - User clicks thumbnail → Calls `onContinue` or `onPinnedClick(video)` → Starts playing
   - User clicks ASCII area → No action (display only)
   - **Positioning**: `bottom-1 left-6` with fixed-width container (170px)

**Source of Truth:**
- `configStore.customPageBannerImage` - Layer 1 image (global, can be overridden per playlist/folder)
- `configStore.customPageBannerImage2` - Layer 2 overlay image
- `configStore.pageBannerImageScale/XOffset/YOffset` - Layer 1 positioning
- `configStore.pageBannerImage2Scale/XOffset/YOffset` - Layer 2 positioning
- `configStore.pageBannerScrollEnabled` - Scroll animation toggle
- `configStore.bannerPattern` - Selected animated pattern (when no custom images)
- Database `folder_metadata` table - Custom folder banners and ASCII art (per folder)
- Database `playlists` table - Playlist descriptions and metadata
- Props passed from parent page component - Title, description, video count, folder color, playlist badges, customDescription
- Page component state - Filtered playlist state, pagination state (for badges and pagination badge)

**State Dependencies:**
- When `customPageBannerImage` or `customPageBannerImage2` changes → Banner background updates → UnifiedBannerBackground renders
- When `pageBannerImageScale/XOffset/YOffset` changes → Layer 1 position/size updates in real-time
- When `pageBannerImage2Scale/XOffset/YOffset` changes → Layer 2 position/size updates in real-time
- When `pageBannerScrollEnabled` changes → Scroll animation toggles on/off for Layer 1
- When `bannerPattern` changes → Pattern overlay updates (only when no custom images)
- When `folderColor` changes → Gradient colors update → Banner re-renders with new colors
- When banner height changes → `setBannerHeight` called → Sticky Toolbar adjusts positioning
- When custom image uploaded → Saved to database → Banner fetches and displays on next load
- When `playlistBadges` changes → Badge list updates → Badges re-render
- When `filteredPlaylist` changes → Badge highlighting updates → Filtered badge appears brighter
- When `customDescription` provided → Description text replaced with custom content (e.g., pagination badge)

**4: Technical Implementation Details**

**Unified Banner System:**
- Uses `UnifiedBannerBackground` component for custom images
- Supports two independent image layers (background + overlay)
- **Layer 1 (Background)**:
  - GPU-accelerated horizontal scroll animation (60fps) when enabled
  - Two side-by-side divs (200% width total) slide from 0 to -50% for seamless loop
  - Animation can be disabled via `pageBannerScrollEnabled` setting
  - Configurable scale (50-200%) and position (X: 0-100%, Y: 0-100%)
- **Layer 2 (Overlay)**:
  - Always static (no scroll animation)
  - Rendered with `z-[1]` to appear on top of Layer 1
  - Ideal for transparent PNGs to create composite/layered effects
  - Independent scale and position controls

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
- **Media Carousel**: Positioned at `bottom-1 left-6` (below title and metadata)
- **Fixed Container**: 170px outer width, 160px content width prevents layout shifts
- **Edit Button**: Positioned at top-right (adjusts position when `topRightContent` is present)

**Media Carousel Component State:**
- `activeThumbnail`: Index into `availableOptions` array (0, 1, or 2)
- `availableOptions`: Array of available option types ('continue', 'pinned', 'ascii')
- `currentOption`: The currently selected option type
- `activePinnedIndex`: Index of currently displayed pin (0 to pinnedVideos.length - 1)
- `hasContinue`: Boolean - continue video exists
- `hasPinned`: Boolean - at least one pinned video exists
- `hasMultiplePins`: Boolean - more than one pinned video exists
- `hasAscii`: Boolean - ASCII signature is available (from `userAvatar` or `avatar` prop)
- `hasMultipleOptions`: Boolean - more than one option exists (shows segmented bar navigation)
- `hasAnyOption`: Boolean - at least one option exists (shows the carousel)

**PageBanner Props for Thumbnail Carousel:**
- `continueVideo`: Video object for continue watching feature
- `onContinue`: Callback when continue thumbnail is clicked
- `pinnedVideos`: Array of pinned video objects in current playlist
- `onPinnedClick(video)`: Callback when pinned thumbnail is clicked (receives selected video)
- `avatar`: Optional ASCII art prop (fallback, `userAvatar` from configStore takes priority)

**5: Page-Specific Usage**

**Videos Page:**
- Displays playlist name or folder name as title
- Shows video count, year (2026), and author
- Edit button allows renaming and setting custom banner via `EditPlaylistModal`
- Custom banners persist in `folder_metadata` table
- **Thumbnail Carousel**: Shows continue watching and/or pinned videos in top-right
- **Playlist Navigator** (via `topRightContent` prop):
  - **Chevron Buttons**: Left (`<`) and right (`>`) to navigate between playlists
  - **Playlist Name**: Fixed-width display (`w-32`) with text truncation and tooltip for full name
  - **Preview Mode**: Navigation uses `setPreviewPlaylist` so player continues unaffected
  - **Reset Point Tracking**: Entering from PlaylistsPage or controller sets a "reset point"
  - **Return Button**: Amber-colored `RotateCcw` icon appears when navigated away from reset point
    - Clicking returns to the reset point playlist
    - Only visible when `resetPointId !== activePlaylistId`
  - **State**: Uses `resetPointId` state and `isChevronNavRef` ref to track navigation source

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
- **Location**: Settings → Appearance → Page Banner (first section at top of Appearance tab)
- **Two-Layer Image Controls**:
  - **Layer 1 (Background)**: Upload, remove, and adjust scale/position
  - **Layer 2 (Overlay)**: Upload, remove, and adjust scale/position (use transparent PNGs)
  - **Scale Slider**: 50% to 200% (controls image height, maintains aspect ratio)
  - **X Position Slider**: 0% (left) to 100% (right)
  - **Y Position Slider**: 0% (top) to 100% (bottom)
  - **Thumbnail Preview**: Shows uploaded image in each layer's control panel
- **Pattern Selection**: Toggle between Diagonal, Dots, Mesh, Solid patterns (only visible when no custom images uploaded)
- **Scroll Animation Toggle**: Enable/disable horizontal scrolling animation for Layer 1
- **Live Preview**: Changes apply immediately to the actual Page Banner above the settings (no separate preview panel)

**Visual Customization:**
- **ASCII Signature**: Set via Settings → Signature, displayed in right-side carousel as "SIGNATURE" option
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
- **Sort Dropdown**: Compact sort selector with four options:
  - "Default" (shuffle order)
  - "Date" (chronological)
  - "Progress" (by watch progress)
  - "Last Viewed" (by last viewed timestamp - most recently viewed first)
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
  - **Tooltip**: Shows custom folder name (if renamed) or default color name, plus count on hover (e.g., "Gaming (5)" or "Red (5)") - uses `allFolderMetadata[color.id]?.name` with fallback to `color.name`
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
- **Global Info Toggle Button**:
  - Icon: Info SVG icon (Lucide `Info`)
  - Active state: Sky blue (`bg-sky-600`), white text, shadow
  - Inactive state: Dark background (`bg-slate-800/80`), gray text, border
  - Toggles video title overlays on ALL playlist/folder card thumbnails
  - State persisted to `localStorage` (`playlistsPage_globalInfoToggle`)
  - Tooltip: "Hide all video titles" / "Show all video titles"
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

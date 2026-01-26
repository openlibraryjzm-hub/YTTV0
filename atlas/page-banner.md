
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
  - **Title**: Compact, bold text (`text-lg md:text-xl`) with dark text shadow for readability, no bottom margin (`mb-0`) - sized to fit snugly above thumbnail
  - **Description**: Hidden by default, shown when info button is clicked
    - **Position**: To the right of thumbnail area (`ml-[170px] mt-[7px]`)
    - **Lines**: Up to 6 lines (`line-clamp-6`) for long descriptions
    - **Visibility**: Controlled by `showInfo` state (toggle via info button)
  - **Playlist Badges**: Interactive badges showing playlists (History/Likes pages)
    - **Styling**: text-white/80, font-medium, text-sm md:text-base
    - **Left Click**: Filters page content to that playlist
    - **Right Click**: Navigates to Videos page for that playlist
    - **Limit**: 2 rows with expand button (>>>) to show all
  - **Pagination Badge**: Compact pagination controls (Likes page)
    - Format: `<< < 1/99 > >>` (First, Previous, Current/Total, Next, Last)
  - **Info Button**: Small circular button with dual functionality, positioned to the right of carousel buttons
    - **Styling**: White background (`bg-white`), black icon (`text-black`)
    - **Size**: 20px (`w-5 h-5`) with Info icon (12px)
    - **Position**: Right of horizontal carousel buttons (or standalone when no carousel)
    - **Left Click**: Toggles info display (description + info overlays on thumbnail)
    - **Right Click**: Opens edit modal (replaces removed edit button)
  - **Info Overlays** (on thumbnail when info button active):
    - Overlays appear on top of the thumbnail with tight backdrops (`bg-black/70 backdrop-blur-sm`)
    - **Author** (top-right): User's pseudonym
    - **Year** (middle-right): Creation year
    - **Video Count** (bottom-right): Number of videos with label
    - Vertically aligned on right side of thumbnail
  - **Title Navigation Buttons** (Videos Page): Horizontal buttons on either side of playlist title
    - **Previous Button** (left): Navigates to previous playlist - white bg, black chevron left icon
    - **Return Button** (middle, if provided): Returns to reset point playlist - white bg, grey icon (inactive) / black icon (active)
    - **Next Button** (right): Navigates to next playlist - white bg, black chevron right icon
    - **Size**: `w-6 h-6` compact buttons
    - Preview mode navigation (doesn't affect player)
  - **Media Carousel** (centered in Layer 1 area): Shows continue watching, pinned videos, and/or ASCII signature
    - **Continue Video**: Thumbnail of most recently watched video (click to resume)
    - **Pinned Videos**: Thumbnail of pinned video(s) in current playlist
    - **ASCII Signature**: User's ASCII art displayed in fixed container (from Settings → Signature)
    - **Thumbnail Size**: `h-36 w-[240px]` (144px × 240px) - uniform size across all modes
    - **Pin Type Badge** (on pinned thumbnails): Top-left badge showing pin type:
      - **Normal Pin**: White pin icon
      - **Follower Pin**: White pin icon + → arrow
      - **Priority Pin**: 👑 crown + golden pin icon
      - **Priority Follower Pin**: 👑 crown + golden pin icon + → arrow
    - **Segmented Bar Navigation**: Horizontal bar with icons below content to toggle views:
      - Clock icon for Continue watching
      - Pin icon for Pinned videos
      - Sparkles icon for ASCII Signature
      - Width: `w-[240px]` to match thumbnail width
      - Offset `ml-[10px]` to align under thumbnail
    - **Multi-Pin Bar**: When multiple pins exist (max 10 segments), a vertical segmented bar appears absolutely positioned to the right of thumbnail
      - **Position**: Absolutely positioned at `left: calc(50% + 120px + 4px)`, `bottom: 31px` (centered relative to thumbnail)
      - **Folder Colors**: Each segment colored by the pin's folder assignment
      - **Priority Crown**: Priority pin segment has crown-like clip-path and golden color (`#FFD700`)
      - **Selection Dot**: White dot indicator to the right of the bar (golden for priority pin)
      - **Size**: `h-36 w-3` (matches thumbnail height)
      - Positioned outside flex container to maintain uniform thumbnail width
    - **Positioning**: Centered horizontally within Layer 1 area (332px width) at `bottom-1`
- **Background Options**:
  - **Color Gradients**: Vibrant gradients matching folder color (when viewing folders)
  - **Animated Patterns**: CSS-based patterns (Diagonal, Dots, Mesh, Solid) when no custom image
  - **Two-Layer System**: Background color + overlay image via Settings → Appearance → Page Banner:
    - **Layer 1 (Background Color)**: Solid color that fills the banner background
    - **Layer 2 (Overlay)**: Image rendered on top (use transparent PNGs for composite effects)
    - Layer 2 has independent Scale, X Position, and Y Position controls
- **Banner Panel Borders**: Two prominent border sections that divide the banner into distinct panels
  - **Left Panel**: Covers from left edge to the thumbnail scroller border (332px width)
    - Straight edges (no rounded corners)
    - Bold black border (`4px solid rgba(0,0,0,0.8)`)
    - Inner shadow + outer shadow for depth (`inset 0 0 30px rgba(0,0,0,0.2), 0 0 15px rgba(0,0,0,0.5)`)
    - **Layer 1 only**: Background color always visible (Layer 2 does NOT cover this area)
  - **Right Panel**: Covers from left panel end (332px) to right edge
    - Straight edges (no rounded corners)
    - Same bold black border and shadow styling
    - **Layer 2 here**: Overlay image only renders in this panel area
  - Both panels use `pointer-events-none` and `z-10` for proper layering
  - Creates visual effect of two separate banner sections
- **Unified Banner System**: When custom image is set, the banner visually connects with the Sticky Toolbar below it using synchronized horizontal scroll animation (can be disabled via Settings)
  - Layer 2 images are managed via Settings → Appearance → Page Banner (no inline thumbnail strip)

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
  - **Layer 1 (Background Color):**
    - `pageBannerBgColor`: Hex color string for background (default '#1e293b' slate-800)
  - **Layer 2 (Overlay Image):**
    - `customPageBannerImage2`: Base64 string of uploaded Layer 2 image (null = no overlay)
    - `pageBannerImage2Scale`: Scale percentage for Layer 2 (50-200%, default 100)
    - `pageBannerImage2XOffset`: X position percentage for Layer 2 (0-100%, default 50)
    - `pageBannerImage2YOffset`: Y position percentage for Layer 2 (0-100%, default 50)
  - **Layer 2 Image Folders System:**
    - `layer2Folders`: Array of folder objects `{ id, name, images[], playlistIds[] }` - default folder is "Default"
      - `playlistIds`: Array of playlist IDs this folder appears on (empty = all playlists)
      - Each image in `images[]` stores: `{ id, image, scale, xOffset, yOffset, bgColor, createdAt }`
    - `selectedLayer2FolderId`: ID of currently selected folder (default: 'default')
    - `setSelectedLayer2FolderId(id)`: Sets the selected folder
    - `addLayer2Folder(name)`: Creates a new folder with optional name
    - `removeLayer2Folder(folderId)`: Deletes a folder (cannot delete 'default')
    - `renameLayer2Folder(folderId, newName)`: Renames a folder
    - `setLayer2FolderPlaylists(folderId, playlistIds)`: Sets which playlists a folder appears on (empty = all)
    - `playlistLayer2Overrides`: Object mapping `playlistId` → `{ imageId, folderId, image, scale, xOffset, yOffset, bgColor }`
      - Stores reference (imageId, folderId) to look up current values from library
      - Also stores fallback values in case image is deleted from library
    - `setPlaylistLayer2Override(playlistId, imageConfig)`: Sets the Layer 2 image override for a specific playlist
    - `clearPlaylistLayer2Override(playlistId)`: Removes the override (falls back to Default folder)
    - `addLayer2Image(folderId, image)`: Adds image with config to folder (includes bgColor from current pageBannerBgColor)
    - `removeLayer2Image(folderId, imageId)`: Removes image from folder
    - `updateLayer2Image(folderId, imageId, updates)`: Updates image config
    - `applyLayer2Image(image)`: Applies saved image as Layer 2 (sets customPageBannerImage2 + scale/offsets + loads bgColor)
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

2. **Background Rendering Flow:**
   - Component uses `pageBannerBgColor` from `configStore` as solid background color (Layer 1)
   - **Layer 2 (Overlay)**:
     - If `effectiveLayer2Image` exists, renders via `UnifiedBannerBackground` component
     - Layer 2 applies its scale (auto height%) and position (X%, Y%) settings
   - Shadow color derived from `pageBannerBgColor`

3. **Per-Playlist Layer 2 Selection Flow:**
   - User views a playlist's Videos page
   - Clicks an image in the Layer 2 thumbnail strip
   - Image is saved to `playlistLayer2Overrides[playlistId]`
   - That playlist now shows the selected Layer 2 image on future visits

4. **Sticky Toolbar Integration:**
   - `PageBanner` measures its height via `ResizeObserver`
   - Reports height to `configStore` via `setBannerHeight(height)`
   - Sticky Toolbar uses this height for seamless visual connection
   - When custom image is set, both banner and toolbar use `UnifiedBannerBackground` with synchronized animation

5. **Media Carousel Flow (Continue/Pinned/ASCII/Info):**
   - Component receives `continueVideo` and `pinnedVideos` props, gets `userAvatar` from configStore
   - **Continue Video**: Most recently watched video in current playlist (from `videoProgress`)
   - **Pinned Videos**: All pinned videos that exist in current playlist (from `pinStore`)
     - Enriched with `folder_color`, `isPriority`, `isFollower` flags from VideosPage
     - Sorted with priority pin always first
   - **ASCII Signature**: User's ASCII art from Settings → Signature (from `configStore.userAvatar`)
   - **Info Display**: Shows description and info overlays on thumbnail when info button is clicked
   - **State Management**:
     - `showInfo`: Boolean - toggles info display (description + thumbnail overlays)
     - `activeThumbnail`: Index into `availableOptions` array (0, 1, or 2)
     - `availableOptions`: Dynamic array of available options ('continue', 'pinned', 'ascii')
     - `activePinnedIndex`: Which pin is currently displayed (when multiple)
   - **Display Logic**:
     - If `showInfo` is true → Shows description text and info overlays on thumbnail
     - If only one option exists → Shows that option, no navigation bar
     - If multiple options exist → Shows horizontal segmented bar with icons below content
     - If multiple pins → Shows vertical segmented bar absolutely positioned to the right of thumbnail (max 10)
     - ASCII option always available if `userAvatar` is set
   - **Horizontal Segmented Bar** (option navigation):
    - Fixed width (`w-[240px]`), height (`h-5`), offset `ml-[10px]` (matches thumbnail width)
     - Icons: Clock (continue), Pin (pinned), Sparkles (ASCII)
     - Active segment: solid white with black icon
     - Inactive segments: semi-transparent with white icon
     - Glassmorphic styling: `bg-black/20 backdrop-blur-sm border-white/20`
   - **Vertical Pin Bar** (multi-pin navigation):
     - Fixed width (`w-3`), matches thumbnail height (`h-36`)
     - **Max 10 segments** - capped to prevent overflow
     - **Position**: Absolutely positioned to the right of thumbnail (`left: calc(50% + 120px + 4px)`, `bottom: 31px`)
     - **Folder-colored segments**: Each segment colored by pin's assigned folder (from `videoFolderAssignments`)
     - **Priority Crown**: First segment (if priority pin) has crown clip-path and golden `#FFD700` color
     - **Selection Indicator**: White dot to the right of bar (golden for priority pin)
     - Clicking a segment changes `activePinnedIndex` to show that pin
     - Positioned outside flex container to maintain uniform thumbnail width
   - **Pin Type Badge** (on pinned thumbnails):
     - Position: Top-left of thumbnail (`top-1 left-1`)
     - Background: `bg-black/60 backdrop-blur-sm`
     - Displays icons based on pin type: pin icon, crown emoji (priority), arrow (follower)
   - User clicks thumbnail → Calls `onContinue` or `onPinnedClick(video)` → Starts playing
   - User clicks ASCII area → No action (display only)
   - User left-clicks info button → Toggles `showInfo` state
   - User right-clicks info button → Opens edit modal (if `onEdit` provided)
   - **Positioning**: Centered horizontally within Layer 1 area at `bottom-1` with `left: 166px, transform: translateX(-50%)`

**Source of Truth:**
- `configStore.pageBannerBgColor` - Layer 1 background color (hex string)
- `configStore.customPageBannerImage2` - Layer 2 overlay image (for Settings page preview)
- `configStore.pageBannerImage2Scale/XOffset/YOffset` - Layer 2 positioning (for Settings page preview)
- `configStore.playlistLayer2Overrides` - Per-playlist Layer 2 image selections
- Database `folder_metadata` table - Custom folder banners and ASCII art (per folder)
- Database `playlists` table - Playlist descriptions and metadata
- Props passed from parent page component - Title, description, video count, folder color, playlist badges, customDescription
- Page component state - Filtered playlist state, pagination state (for badges and pagination badge)

**State Dependencies:**
- When `pageBannerBgColor` changes → Background color updates
- When `customPageBannerImage2` changes (Settings) → Layer 2 preview updates
- When `pageBannerImage2Scale/XOffset/YOffset` changes (Settings) → Layer 2 position/size updates in real-time
- When `playlistLayer2Overrides[playlistId]` changes → That playlist's banner Layer 2 updates
- When `folderColor` changes → Gradient colors update → Banner re-renders with new colors
- When banner height changes → `setBannerHeight` called → Sticky Toolbar adjusts positioning
- When custom image uploaded → Saved to database → Banner fetches and displays on next load
- When `playlistBadges` changes → Badge list updates → Badges re-render
- When `filteredPlaylist` changes → Badge highlighting updates → Filtered badge appears brighter
- When `customDescription` provided → Description text replaced with custom content (e.g., pagination badge)

**4: Technical Implementation Details**

**Two-Layer Banner System:**
- **Layer 1 (Background Color)**:
  - Simple solid color background from `pageBannerBgColor`
  - Configurable via color picker with preset options in Settings
- **Layer 2 (Overlay)**:
  - Uses `UnifiedBannerBackground` component for image rendering
  - Ideal for transparent PNGs to create composite effects over the background color
  - Per-playlist image selection with fallback to Default folder
  - Configurable scale (50-200%) and position (X: 0-100%, Y: 0-100%)

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
- **Title**: Compact (`text-lg md:text-xl`), no bottom margin (`mb-0`), with navigation buttons on either side (Videos Page)
- **Description**: Positioned to the right of thumbnail (`ml-[170px] mt-[7px]`), hidden until info button clicked
- **Media Carousel**: Centered horizontally within Layer 1 area (332px width), positioned at `bottom-1` with `left: 166px, transform: translateX(-50%)`
- **Thumbnail Dimensions**: Uniform `h-36 w-[240px]` (144px × 240px) across all carousel modes
- **Info Button**: Positioned to the right of horizontal carousel buttons, handles both info toggle and edit (right-click)
- **Edit Button**: Removed (functionality moved to info button right-click)

**Media Carousel Component State:**
- `showInfo`: Boolean - toggles info display (description + info overlays on thumbnail)
- `activeThumbnail`: Index into `availableOptions` array (0, 1, or 2)
- `availableOptions`: Array of available option types ('continue', 'pinned', 'ascii')
- `currentOption`: The currently selected option type
- `activePinnedIndex`: Index of currently displayed pin (0 to min(pinnedVideos.length, 10) - 1)
- `hasContinue`: Boolean - continue video exists
- `hasPinned`: Boolean - at least one pinned video exists
- `hasMultiplePins`: Boolean - more than one pinned video exists
- `hasAscii`: Boolean - ASCII signature is available (from `userAvatar` or `avatar` prop)
- `hasMultipleOptions`: Boolean - more than one option exists (shows segmented bar navigation)
- `hasAnyOption`: Boolean - at least one option exists (shows the carousel)

**Layer 2 Image Management:**
- Layer 2 images are managed exclusively via Settings → Appearance → Page Banner
- **Per-Playlist Layer 2 Selection**: Each playlist remembers its selected Layer 2 image reference
  - **Default**: First image from Default folder is shown for all playlists initially
  - **Override**: Image selection stored in `playlistLayer2Overrides` with reference IDs and fallback values
  - **Live Updates**: When viewing a playlist, the banner looks up current image values from the library (scale, position, bgColor)
  - **Paired Background Color**: Each library image stores its own background color (set via "Paired Background Color" in Settings)
  - **Persistence**: Selection stored in `playlistLayer2Overrides` with reference IDs and fallback values

**Pinned Video Data (from VideosPage):**
- `folder_color`: First folder color assigned to this video (for pin bar segment coloring)
- `isPriority`: Boolean - whether this is the priority pin (crown treatment)
- `isFollower`: Boolean - whether this is a follower pin (arrow indicator)

**PageBanner Props for Thumbnail Carousel:**
- `continueVideo`: Video object for continue watching feature
- `onContinue`: Callback when continue thumbnail is clicked
- `pinnedVideos`: Array of pinned video objects in current playlist, enriched with:
  - `folder_color`: Folder color ID for pin bar segment coloring
  - `isPriority`: Boolean for priority pin (golden crown treatment)
  - `isFollower`: Boolean for follower pin (arrow indicator)
- `onPinnedClick(video)`: Callback when pinned thumbnail is clicked (receives selected video)
- `avatar`: Optional ASCII art prop (fallback, `userAvatar` from configStore takes priority)

**PageBanner Props for Playlist Navigator (Videos Page):**
- `onNavigateNext`: Callback for up chevron (next playlist)
- `onNavigatePrev`: Callback for down chevron (previous playlist)
- `onReturn`: Callback for return button (returns to reset point playlist)
- `showReturnButton`: Boolean - when true, return button icon is black (active); when false, grey (inactive)

**5: Page-Specific Usage**

**Videos Page:**
- Displays playlist name or folder name as title (compact `text-lg md:text-xl`)
- **Title Navigation Buttons**: Horizontal buttons on either side of title for playlist navigation
  - **Previous Button** (left): Navigates to previous playlist in preview mode
  - **Return Button** (middle, if provided): Returns to reset point playlist (grey when at reset point, black when away)
  - **Next Button** (right): Navigates to next playlist in preview mode
  - **Styling**: All buttons have white background (`w-6 h-6`), black icons
  - **Preview Mode**: Navigation uses `setPreviewPlaylist` so player continues unaffected
  - **Reset Point Tracking**: Entering from PlaylistsPage or controller sets a "reset point"
  - **State**: Uses `resetPointId` state and `isChevronNavRef` ref to track navigation source
- Description shows to the right of thumbnail when info button is clicked
- Video count, year, and author shown as overlays on thumbnail when info button is clicked
- Right-click info button opens `EditPlaylistModal` for renaming and setting custom banner
- Custom banners persist in `folder_metadata` table
- **Thumbnail Carousel**: Shows continue watching, pinned videos, and/or ASCII signature
  - **Uniform Size**: All thumbnails maintain `h-36 w-[240px]` (144px × 240px) regardless of mode
  - **Centered**: Positioned horizontally centered within Layer 1 area (332px width)
- **Info Display**: When info button clicked:
  - Description appears to the right of thumbnail (`ml-[170px]`)
  - Info overlays appear on thumbnail (author top-right, year middle-right, count bottom-right)
- **Pin Type Badge**: When viewing pinned video, top-left badge shows pin type (normal/follower/priority/priority-follower)
- **Multi-Pin Bar**: Vertical bar with folder-colored segments, priority crown, and selection dot
  - **Position**: Absolutely positioned to the right of thumbnail (outside flex container)
  - **Alignment**: `bottom: 31px` to align with thumbnail area

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
- **Location**: Right-click on info button (bottom-left corner) on Videos Page banner
- **Features**:
  - Rename playlist/folder
  - Update description
  - Upload custom page banner image
  - Custom banners saved to `folder_metadata` table
- **Not Available**: For "Unsorted Videos" view (no edit functionality)

**Via Settings:**
- **Location**: Settings → Appearance → Page Banner (first section at top of Appearance tab)
- **Two-Layer Controls**:
  - **Layer 1 (Default Fallback)**: Color picker with hex input and preset color buttons
    - Used when no paired color is saved with an image
    - Presets: Slate, Dark, Zinc, Indigo, Blue, Green, Red, Amber
  - **Layer 2 (Overlay)**: Upload, remove, and adjust scale/position (use transparent PNGs)
    - **Scale Slider**: 50% to 200% (controls image height, maintains aspect ratio)
    - **X Position Slider**: 0% (left) to 100% (right)
    - **Y Position Slider**: 0% (top) to 100% (bottom)
    - **Paired Background Color**: Color picker to set the background color that will be saved WITH this image config
    - **Thumbnail Preview**: Shows uploaded image
- **Live Preview**: Changes apply immediately to the actual Page Banner above the settings (no separate preview panel)
- **Layer 2 Image Library**: Multi-folder system for organizing Layer 2 images
  - **New Folder Button**: Creates additional folders for organization
  - **Folder Cards**: Each folder shows name (click to rename), image count, delete button (hover)
  - **Image Grid**: Thumbnails of saved images in each folder
    - **Click**: Loads image into editor (also loads its paired background color)
    - **Hover**: Shows delete button
    - **Color Indicator**: Small colored dot (bottom-right) shows paired background color
  - **Add Image**: Upload new images directly to a folder
  - **Save to This Folder**: Save current Layer 2 image with its scale/position/bgColor settings to folder
  - **Workflow**: Set desired background color → adjust image settings → click "Save to This Folder" to create new entry
  - **Active Badge**: Shows which folder is currently selected in PageBanner strip

**Visual Customization:**
- **ASCII Signature**: Set via Settings → Signature, displayed in right-side carousel as "SIGNATURE" option
- **Author Name**: Set via Settings → Signature → Pseudonym
- **Folder Colors**: Automatically generate matching gradients

**Playlist Badges:**
- **Purpose**: Display interactive badges for playlists on History and Likes pages
- **Styling**: text-white/80, font-medium, text-sm md:text-base
- **Limit**: 2 rows maximum with expand button (>>>) to show all playlists
- **Interactions**:
  - **Left Click**: Filters page content to show only items from that playlist
  - **Right Click**: Navigates to Videos page for that playlist in preview mode
- **Filtered State**: Badge highlights with brighter background/border when active
- **Props**: `playlistBadges` (array), `onPlaylistBadgeLeftClick`, `onPlaylistBadgeRightClick`, `filteredPlaylist`

**Pagination Badge:**
- **Purpose**: Compact pagination controls for Likes page (replaces description text)
- **Format**: `<< < 1/99 > >>` (First, Previous, Current/Total, Next, Last)
- **Styling**: text-white/80, font-medium styling
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

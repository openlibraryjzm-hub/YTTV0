###4.1.1.1 & 4.1.2.1: UI Card Components

This document covers the reusable Card component system used throughout the application.

**Related Documentation:**
- **Pages**: See ui-pages.md for page components that use cards
- **Layout**: See ui-layout.md for layout system
- **Video/Tweet card 3-dot menu**: See video-tweet-card-three-dot-menu.md for the all-in-one menu (pins, folder grid, rating, sticky, actions) used by VideoCard and TweetCard

---

#### ### 4.1.1.1 Playlist Cards & Folder Cards

Playlist cards and Colored Folder cards share the same card schema and structure. Folder cards appear on the Playlists Page when the folder toggle is enabled.

#### ### 4.1.1.1a Playlist Cards

**1: User-Perspective Description**

Users see playlist cards built using the reusable Card component system:

- **Card Structure**:
  - **Thumbnail Area**: 16:9 aspect ratio, rounded corners, with `border-2 border-[#052F4A]` outline
    - Image: Custom cover (if set) or first video's thumbnail
    - Fallback: Gray placeholder icon if no thumbnail
    - **Hover Overlay**: Semi-transparent black (visual darkening only, no centered buttons)
    - **3-Dot Menu**: Positioned at the top-right of the thumbnail, visible on hover.
  - **Content Area**:
    - **Container**: The entire card (title + thumbnail) is wrapped in a square border (`border-2 border-slate-700/50`) with rounded corners (`rounded-xl`) and a white background (`bg-slate-100/90`).
    - **Playlist Title**: Positioned inside the container, above the thumbnail.
    - **Title Styling**: Enclosed in a separate inner rectangle with a dark blue border (`border-[#052F4A]`) and light background (`bg-slate-100/90`). Text matches border color (`#052F4A`).
    - **Hover Actions**: Play, Shuffle, and Preview buttons appear on the right side of the Title Bar on hover. (Same hover actions apply to Folder Cards).
  - **Quick Preview Strip**:
    - Located at the bottom of the card content area.
    - Displays 4 mini video thumbnails (medium quality) from the playlist.
    - Each mini thumbnail has `border-2 border-[#052F4A]` and hover play icon.
    - Clicking a mini thumbnail plays that specific video.

- **Visual States**:
  - **Default**: Transparent background, no border
  - **Hover**: Thumbnail darkens, Play/Preview buttons appear in Title Bar
  - **Selected**: Blue border (when active)

- **Interactive Elements**:
  - **Card Click**: Loads playlist and starts playing first video
  - **Hover Controls** (Title Bar): Organized into 3 segments separated by vertical dividers:
    - **Segment 1 (Preview)**: Grid3x3 icon - Opens playlist in preview mode on Videos Page
    - **Segment 2 (Thumbnail Navigation)**:
      - **Refresh Button** (conditional): RotateCcw icon - Only appears after shuffle has been clicked. Resets thumbnail to default/established playlist cover.
      - **Shuffle Button**: Shuffle icon - Changes thumbnail to random video from playlist (does NOT play). The displayed video becomes the target for the Play button.
    - **Segment 3 (Actions)**:
      - **Play Button**: Plays the video currently shown in the thumbnail (after shuffle) or first video (default)
      - **Folder Menu Button**: Tag icon - Toggles the Folder Pie Chart Menu expansion
      - **Info Button**: Info icon - Toggles video title overlay on the thumbnail. Shows the title of the currently displayed video.
  - **List View Toggle** (Bottom Left): List icon button. Opens the **Folder List View (Reel Overlay)**, displaying all folders for this playlist in a vertical scrolling column.
  - **Global Info Toggle** (Sticky Top Bar): Info icon button that toggles video title overlays for ALL playlist/folder cards. State persisted to localStorage.
  - **3-Dot Menu** (inline with title): Expand, Export, Add to Tab, Delete options

#### ### 4.1.1.1c Folder Pie Chart Menu (Playlist Card Expansion)

**1: User-Perspective Description**

When users click the tag icon button in a playlist card's hover controls, an expandable panel appears below the card showing a pie chart visualization of the playlist's colored folders.

- **Layout Structure**:
  - **Left Side**: Interactive donut pie chart (140x140px)
    - Segments sized proportionally by video count per folder
    - Center displays total tagged video count
    - Outer colored dot buttons for manual selection
  - **Right Side**: Preview panel showing selected folder details
    - Folder name with colored dot indicator
    - Mini thumbnail (16:9) from folder's first video
    - Video count and percentage stats

- **Interaction Methods**:
  - **Scroll Navigation**: Scroll wheel over the menu cycles through folder segments
    - Scroll down: Next segment (wraps to first)
    - Scroll up: Previous segment (wraps to last)
    - Page scroll is blocked while over the menu
  - **Outer Dot Buttons**: Click colored dots around pie edge to select that folder
  - **Pie Segment Click**: Click a segment to immediately play that folder's videos

- **Visual States**:
  - **Selected Segment**: Scaled up (1.05x), full opacity
  - **Unselected Segments**: Dimmed (0.4 opacity) when another is selected
  - **Selected Dot**: Larger radius (7px vs 5px), white stroke border
  - **Auto-Select**: First folder is auto-highlighted when menu opens

- **Behavior**:
  - Multiple playlist cards can have their folder menus open simultaneously
  - Menu pushes down content below (no overlapping)
  - Adjacent cards maintain their height (items-start grid alignment)
  - Selection persists when mouse leaves the menu area
  - Closing menu (via toggle or X button) cleans up state for proper re-attachment

**2: File Manifest**

**UI/Components:**
- `src/components/PlaylistsPage.jsx`: Contains all pie chart menu logic and rendering

**State Management (PlaylistsPage.jsx local state):**
- `openFolderMenuIds`: Set of playlist IDs with open folder menus
- `hoveredPieSegment`: Object mapping playlist ID to selected folder color
- `pieChartRefs`: Ref object for wheel event listener attachment
- `pieDataRef`: Ref holding latest state for wheel handler closure

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos when folder is clicked

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Menu Toggle Flow:**
   - User clicks tag icon → `openFolderMenuIds` updated (add/remove playlist ID)
   - If opening → Auto-selects first folder via `setHoveredPieSegment`
   - If closing → Cleans up `pieChartRefs` for proper re-attachment
   - Menu renders/unmounts → Content below pushed down via grid layout

2. **Scroll Navigation Flow:**
   - User scrolls over menu → Wheel event captured (passive: false)
   - `pieDataRef` provides latest folder/hover state
   - Index calculated → Next/previous with wrap-around
   - `hoveredPieSegment` updated → Pie and preview re-render

3. **Dot Button Click Flow:**
   - User clicks outer dot → `setHoveredPieSegment` updates
   - Segment highlights → Preview updates with folder details

4. **Segment Click Flow:**
   - User clicks pie segment → `getVideosInFolder()` fetched
   - `setPlaylistItems()` called → Videos loaded into player
   - `onVideoSelect()` called → First video plays

**Source of Truth:**
- `playlistFolders[playlistId]`: Array of folders with video data
- `hoveredPieSegment[playlistId]`: Currently selected folder color

**State Dependencies:**
- When `openFolderMenuIds` changes → Menu appears/disappears
- When `hoveredPieSegment` changes → Pie segment highlights, preview updates
- When `playlistFolders` changes → Pie segments recalculated

**2: File Manifest**

**UI/Components:**
- `src/components/Card.jsx`: Base card component with click handling
- `src/components/CardThumbnail.jsx`: Thumbnail with badges and overlay support
- `src/components/CardContent.jsx`: Content area for title/subtitle/metadata
- `src/components/CardActions.jsx`: Action buttons and menu wrapper
- `src/components/CardMenu.jsx`: 3-dot menu with submenu support
- `src/components/PlaylistsPage.jsx`: Uses Card components to render playlist cards

**State Management:**
- No card-specific state - cards are presentational components
- Parent component (`PlaylistsPage`) manages data and click handlers

**API/Bridge:**
- No direct API calls - cards receive data via props

**Backend:**
- No database tables - cards are UI components only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Card Rendering Flow:**
   - Parent component passes props → `Card` receives `onClick`, `children`
   - `CardThumbnail` receives `src`, `alt`, `overlay`, `badges`
   - `CardContent` receives `title`, `subtitle`, `metadata`
   - `CardActions` receives `menuOptions`, `onMenuOptionClick`
   - Components compose together → Renders complete card

2. **Click Handling Flow:**
   - User clicks card → `Card.hswck()` (Card.jsx line 20) 
   - Checks for action areas → `data-card-action`, `data-card-menu` attributes
   - If clicked in action area → Returns early, doesn't trigger card click
   - If clicked on card body → Calls `onClick` prop → Parent handles action

3. **Hover Overlay Flow:**
   - User hovers card → CSS `group-hover:bg-black/40` activates
   - Overlay becomes visible → Play/preview buttons appear
   - User clicks button → `e.stopPropagation()` prevents card click
   - Button's `onClick` handler fires → Parent handles action

4. **Menu Interaction Flow:**
   - User clicks 3-dot menu → `CardMenu` opens dropdown
   - User selects option → `onMenuOptionClick(option, context)` called
   - Parent component handles action → May call API, update state
   - Menu closes automatically after selection

**Source of Truth:**
- Parent component's state - Cards are presentational, no internal state

**State Dependencies:**
- When parent's data changes → Cards re-render with new props
- When card clicked → Parent's handler updates state → May trigger navigation or API call
- When menu option selected → Parent's handler executes → May update database, refresh grid

---

#### ### 4.1.1.1b Colored Folder Cards

**1: User-Perspective Description**

Colored Folder cards use the exact same visual structure as Playlist cards, appearing on the Playlists Page when the folder toggle is enabled. Folders are grouped by their parent playlist with section headers.

- **Card Structure** (identical to Playlist Cards):
  - **Container**: Bordered card (`border-2 border-slate-700/50 rounded-xl`) with white background (`bg-slate-100/90`) and hover highlight
  - **Title Bar**: Dark blue border with light background, contains:
    - **Colored Dot**: Circle indicator matching the folder color
    - **Folder Name**: Shows custom name if renamed, otherwise shows color name (e.g., "Gaming" or "Red")
    - **Hover Actions**: Eye (Preview), Play, Shuffle buttons appear on hover
  - **Thumbnail Area**: 16:9 aspect ratio below title bar
    - Image: First video's thumbnail from the folder
    - **Border**: `border-2 border-[#052F4A]` outline around thumbnail
    - **3-Dot Menu**: Top-right on hover with folder-specific options

- **3-Dot Menu Options**:
  - **Stick/Unstick Folder**: Pins folder to always show in playlist section
  - **Convert to Playlist**: Creates a new playlist from folder contents
    - Prompts for playlist name (default: "Playlist Name - Folder Name")
    - Copies all videos to new playlist
    - New playlist functions independently with its own folders

- **Grouping & Headers**:
  - Folders are grouped by parent playlist
  - Each group has a header showing the playlist name (uppercase, with gradient divider lines)
  - "Source Playlists" header separates folder section from regular playlists (only visible when folders are shown)

- **Interactive Elements**:
  - **Card Click**: Loads folder videos and starts playing
  - **Hover Controls** (Title Bar): Organized into 3 segments (same as Playlist Cards):
    - **Segment 1 (Preview)**: Grid3x3 icon - Opens folder in preview mode on Videos Page
    - **Segment 2 (Thumbnail Navigation)**:
      - **Refresh Button** (conditional): Only appears after shuffle. Resets to default folder thumbnail.
      - **Shuffle Button**: Changes thumbnail to random video from folder (does NOT play)
    - **Segment 3 (Actions)**:
      - **Play Button**: Plays the video currently shown in the thumbnail
      - **Info Button**: Toggles video title overlay on the thumbnail

**2: File Manifest**

**UI/Components:**

- `src/components/PlaylistsPage.jsx`: Renders folder cards inline with playlists
- `src/components/PlaylistFolderColumn.jsx`: Renders the folder reel overlay

**State Management:**
- `src/components/PlaylistsPage.jsx` (local state):
  - `folders`: Array of folder objects from `getAllFoldersWithVideos()`
  - `folderMetadata`: Map of `"playlistId:folderColor"` to `{ name, description }`
  - `stuckFolders`: Set of stuck folder keys
  - `openFolderListIds`: Set of playlist IDs with active Reel View overlay

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getAllFoldersWithVideos()` - Gets all folders with video data
  - `getFolderMetadata(playlistId, folderColor)` - Gets custom folder name/description
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in a folder
  - `toggleStuckFolder(playlistId, folderColor)` - Toggles sticky state
  - `createPlaylist()`, `addVideoToPlaylist()` - Used for Convert to Playlist

---

#### ### 4.1.1.1d Folder List View (Reel Overlay)

**1: User-Perspective Description**

User clicks the "List" icon (bottom-left of Playlist Card thumbnail) to open the Reel View for a specific playlist. This creates a focused, vertical browsing experience for that playlist's folders.

- **Visual Structure**:
  - **Overlay**: Full-screen semi-transparent black backdrop (`bg-black/60` with blur).
  - **Vertical Reel**: A centered vertical column containing the playlist's folder cards.
  - **Card Sizing**: Folder cards match the standard 500px width of playlist cards.
  - **Scroll Behavior**: The column scrolls vertically (`overflow-y-auto`), distinct from the main page's horizontal scrolling.
  - **Close Action**: Closed via top-right "X" button or by clicking the backdrop.

- **Folder Card Styling (In Reel)**:
  - **Appearance**: Identical to standard Folder Cards but arranged vertically.
  - **Left Stripe**: Colored vertical stripe on the thumbnail (`colored left-0 top-0 bottom-0 w-3`) acts as a quick visual identifier.
  - **Glow Effect**: Hovering a folder in the reel triggers a radial gradient glow behind the card matching the folder's color.

- **Interactions**:
  - **Select**: Clicking a folder loads its videos into the view.
  - **Sticky Toggle**: Users can stick/unstick folders directly from this view via the 3-dot menu.
  - **Play Folder**: Play button in the hover overlay plays the folder's videos.

**2: File Manifest**

**UI/Components:**
- `src/components/PlaylistFolderColumn.jsx`: The overlay component implementing the vertical reel.


---
#### ### 4.1.2.1 Videos Card

**1: User-Perspective Description**

Users see video cards built using the Card component system with video-specific features:

- **Card Structure**:
  - **Thumbnail Area**: 16:9 aspect ratio, **square corners** (no rounding), **no border** by default
    - Image: Video thumbnail from YouTube
    - **Border**: Only when bulk-tag selection is active, border color matches first selected folder; otherwise borderless (YouTube and Twitter style)
    - **Background**: Light sky blue (`#e0f2fe`) matching app theme (visible when image doesn't fill 16:9 ratio)
    - **Badges**:
      - **Top-left**: "Now Playing" indicator (3 animated bouncing dots in Warm Red, only when playing)
      - **Top-left**: "Watched" indicator (Green tick icon, only when watched and not playing). Displays cleanly next to hover length badge.
      - **Top-left (Hover)**: "Video Length" indicator displaying video duration format. Only visible during hover (`h:mm:ss` or `m:ss`).

      - **Top-right**: Combined controls:
        - **Pin Button**: Dual-action (click for normal, hold for priority)
        - **Quick Assign Star**: Hover/click interactions
    - **Progress Bar**: Red horizontal line at the bottom of the thumbnail indicating watch progress percentage.
    - **Currently Playing**: When video is currently playing, thumbnail displays:
      - Red ring effect (`ring-4 ring-red-500`)
      - Red glow shadow (`shadow-[0_0_40px_rgba(239,68,68,1),inset_0_0_40px_rgba(239,68,68,0.8)]`)
    - **Hover Overlay**: 
      - **Top Right**: Pin button and Star button appear
      - **Bottom Right**: 3-dot menu appears
    - **Bulk Tag Strip**: When in bulk tag mode, a 4x4 color grid appears **below the thumbnail** (between thumbnail and title), in a fixed-height strip (`h-20`), always visible—no overlay on the thumbnail. **Clicking a color instantly assigns or unassigns** that video to that folder (same as 3-dot menu or star); no Save step.
    - **Custom Folder Names**: If a folder has a custom name (different from default color name), it appears as overlay text on the square
    - **Bulk Tag Border**: In bulk tag mode, thumbnail border color matches the first **assigned** folder color (reflects current assignments, not pending selections)
    - **Star Color Picker Overlay**: When hovering over star icon for 1.2 seconds, a grid of 16 colored stars appears centered at the top of the thumbnail

- **Content Area**:
  - **Title**: Video title, dark blue text (RGB(5, 47, 74) / #052F4A), truncates. No subtitle (video ID) is shown.
  - **Metadata Hover Overlay**: When hovering over the card, the bottom half of the white content area overlaps with a black background and white text displaying video metadata: Author, Year Published (extracted from `published_at`), and abbreviated View Count (e.g., 3M, 10B). These are horizontally aligned, equally spaced, and separated by dots.

- **Visual States**:
  - **Default**: Gray border, thumbnail and title visible
  - **Selected**: Blue border (when video is selected)
  - **Playing**: **Vibrant Red Glow** (thick `ring-red-500` border + dual-layer shadow bleeding into/out of thumbnail)
  - **Bulk Tag Selected**: Colored border matching first assigned folder color (when in bulk tag mode; grid shows current assignments and each click persists immediately)
  - **Hover**: Lighter background, top-right controls (Pin/Star), bottom-right menu

- **Interactive Elements**:
  - **Card Click**: Plays video in main player. No thumbnail hover expansion (ImageHoverPreview is used for TweetCard only, not VideoCard).
  - **Card Right-Click**: Opens the all-in-one `VideoCardThreeDotMenu` exactly at the cursor's position (context menu style). Card shows a `cursor-context-menu` on hover when not in bulk tag mode.

  - **Pin Button** (top-right):
    - **Click unpinned**: Adds normal pin (filled blue icon).
    - **Click normal pin**: Adds follower modifier (double-pin icon - 2 pins stacked diagonally).
    - **Click follower pin**: Removes follower modifier (returns to single pin).
    - **Hold (>600ms)**: Sets as priority pin (filled amber icon).
    - **Double-click any pinned**: Unpins completely (returns to outline icon).
    - **Follower Pin**: When video completes (≥85%), pin auto-transfers to next video in playlist.

  - **Star Icon** (top-right): 
    - **Quick Click**: Assigns/unassigns video to quick assign folder (uses quick assign color preference)
    - **Hover (1.2s delay)**: Shows star color picker menu with 16 colored stars
      - **Left Click on Color Star**: Assigns/unassigns video to that folder color
      - **Right Click on Color Star**: Sets that color as the new quick assign default
    - **Tooltip**: Shows "Assigned to: [folder names]" with custom folder names if renamed (e.g., "Assigned to: Gaming, Watch Later")
    - Star outline color reflects the current quick assign folder color (when video has no folder assignments)

  - **3-Dot Menu / Context Menu** (bottom-right on thumbnail, or anywhere via right-click):
    - **Modern Menu**: Uses the vertical, all-in-one `VideoCardThreeDotMenu` for pins, ratings, sticky toggle, and actions.
    - **Colored Folders Popup**: Includes a bottom option to pop out the 16-color grid for folder assignment.
    - **Move to Playlist**: Opens modal to move video to another playlist (removes from current).
    - **Copy to Playlist**: Opens modal to copy video to another playlist (keeps in current).
    - **Delete**: Removes video from playlist (context-aware removal).
  - **Bulk Tag Grid** (in bulk mode): 
    - 16-color grid (4x4 pattern) in a strip **below the thumbnail** (between thumbnail and title), fixed height; does not overlay the thumbnail
    - Each square fills its grid cell completely (`w-full h-full`)
    - Custom folder names displayed as overlay text on squares (only if name differs from default)
    - Selected folders show checkmark icon
    - Currently assigned folders have higher opacity (100% vs 70%)

**2: File Manifest**

**UI/Components:**
- `src/components/VideoCard.jsx`: Video card component with all video-specific logic
- `src/components/Card.jsx`: Base card component
- `src/components/CardThumbnail.jsx`: Thumbnail with badges
- `src/components/CardContent.jsx`: Content area
- `src/components/CardActions.jsx`: Star and menu actions
- `src/components/BulkTagColorGrid.jsx`: Color grid for bulk tagging
- `src/components/StarColorPicker.jsx`: Star color picker menu (hover menu for folder assignment)
- `src/components/CardMenu.jsx`: 3-dot menu

**State Management:**
- `src/store/folderStore.js`:
  - `quickAssignFolder`: Default folder color for quick assign
  - `bulkTagMode`: Boolean for bulk tagging mode
  - Cards receive current assignments for grid display (VideosPage passes `bulkTagSelections={new Set(videoFolderAssignments[video.id] || [])}`); no batch Save—each grid click persists immediately
- `src/store/pinStore.js`:
  - `pinnedVideos`: Array of pinned videos (persisted)
  - `priorityPinIds`: Array of priority pin IDs (persisted)
  - `followerPinIds`: Array of follower pin IDs (persisted)
  - `isPinned(videoId)`: Checks if video is normal pin
  - `isPriorityPin(videoId)`: Checks if video is priority pin
  - `isFollowerPin(videoId)`: Checks if video has follower modifier
  - `togglePin(video)`: Cycles: unpinned → normal → follower → normal
  - `togglePriorityPin(video)`: Sets video as priority pin (idempotent)
  - `removePin(videoId)`: Completely unpins video
  - `handleFollowerPinCompletion(videoId, playlistItems)`: Transfers follower pin to next video
- `src/components/VideoCard.jsx` (local state):
  - `isHovered`: Boolean for bulk tag hover state
  - `isStarHovered`: Boolean for star hover menu state
  - `starHoverTimeoutRef`: Ref for managing hover hide timeout
  - `starHoverDelayRef`: Ref for managing 1.2s delay before showing menu

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `assignVideoToFolder(playlistId, itemId, folderColor)` - Assigns video to folder
  - `unassignVideoFromFolder(playlistId, itemId, folderColor)` - Removes folder assignment
  - `removeVideoFromPlaylist(playlistId, itemId)` - Removes video from playlist

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `playlist_items`: Videos
  - `video_folder_assignments`: Folder assignments

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Card Rendering Flow:**
   - Parent (`VideosPage`) passes video data → `VideoCard` receives props
   - Determines folder assignments → `videoFolders` prop from parent
   - Checks if pinned → `isPinned(video.id)` from `pinStore`
   - Checks if playing → `isCurrentlyPlaying` prop (compares with `currentVideoIndex`)

   - Builds badges array → "Now Playing", video number, pin icon
   - **Quick Assign Star**: Rendered as a hover-only badge on the top-right of the thumbnail.
   - **3-Dot Menu**: Passed to `CardContent` via `headerActions` prop, rendered inline with the title.
   - Renders card → Uses `Card`, `CardThumbnail`, `CardContent`

2. **Star Click Flow (Quick Assign):**
   - User clicks star icon → `onStarClick` handler (VideoCard.jsx)
   - Gets current folders → `videoFolderAssignments[video.id]`
   - Gets quick assign folder → `quickAssignFolder` from store
   - Checks if assigned → `currentFolders.includes(targetFolder)`
   - If assigned → `unassignVideoFromFolder()` → Removes assignment
   - If not assigned → `assignVideoToFolder()` → Adds assignment
   - Updates local state → `setVideoFolders()` updates store
   - Star icon updates → Filled if assigned, outline if not

2a. **Star Hover Menu Flow:**
   - User hovers over star icon → `onMouseEnter` triggers (VideoCard.jsx)
   - 1.2 second delay starts → `starHoverDelayRef` timeout set
   - If mouse leaves before delay → Timeout cleared, menu doesn't appear
   - After 1.2 seconds → `setIsStarHovered(true)` → `StarColorPicker` appears
   - Menu positioned: Centered horizontally, near top of thumbnail (`pt-2`)
   - Menu shows 16 colored stars in 4×4 grid:
     - Each star shows folder color as background
     - Assigned folders: White ring, filled star icon
     - Quick assign folder: Blue ring indicator with blue dot badge
     - Unassigned folders: Outline star icon
     - **Tooltips**: Display custom folder name if renamed, otherwise default color name (e.g., "Gaming" or "Red") - uses `folderMetadata[color.id]?.name` with fallback to `color.name`
   - **Left Click on Color Star:**
     - Calls `onStarColorLeftClick(video, folderColor)` → `handleStarColorLeftClick()` (VideosPage.jsx)
     - Toggles folder assignment → `assignVideoToFolder()` or `unassignVideoFromFolder()`
     - Updates `videoFolderAssignments` → Star icon updates
     - Menu closes → `setIsStarHovered(false)`
   - **Right Click on Color Star:**
     - Calls `onStarColorRightClick(folderColor)` → `handleStarColorRightClick()` (VideosPage.jsx)
     - Sets as quick assign default → `setQuickAssignFolder(folderColor)`
     - Updates localStorage → Preference persisted
     - Menu closes → `setIsStarHovered(false)`
   - If mouse moves to menu → Hover state maintained, menu stays visible
   - If mouse leaves menu area → 150ms delay, then menu closes

3. **Star Icon Color Display:**
   - Star icon outline color reflects `quickAssignFolder` when video has no folder assignments
   - If video has folder assignments → Star shows primary folder color (filled)
   - Color updates when `quickAssignFolder` changes in `folderStore`

4. **Pin Click Flow (cycles through states):**
   - User clicks pin icon → `handlePinMouseUp()` checks for double-click
   - If double-click (within 300ms) on pinned → `removePin(video.id)` → Completely unpins
   - If single click:
     - Unpinned → `togglePin(video)` → Adds normal pin (blue icon)
     - Normal pin → `togglePin(video)` → Adds follower modifier (double-pin icon)
     - Follower pin → `togglePin(video)` → Removes follower (back to single pin)
   - Pin icon updates based on state (blue=normal, double-pin=follower)

5. **Priority Pin Flow (Hold >600ms):**
   - User holds pin icon → `pinLongPressTimerRef` timeout triggers after 600ms
   - Calls `togglePriorityPin(video)` → Adds to `priorityPinIds` (idempotent)
   - Pin icon updates → Amber filled icon
   - Priority pins can also have follower modifier (amber double-pin)

6. **Follower Pin Transfer Flow (on video completion):**
   - Video reaches ≥85% → `handleFollowerPinCompletion(videoId, playlistItems)` called
   - If follower pin: Finds next video in playlist → Transfers pin with all modifiers
   - If not follower or last video: Pin is removed normally
   - Console logs transfer: `[FollowerPin] Transferred pin from "Video A" to "Video B"`

7. **Menu Option Flow:**
   - User clicks 3-dot menu → `CardMenu` opens
   - User selects option → `onMenuOptionClick(option, video)` (VideosPage.jsx line 182)
   - Handles actions:
     - **Delete**: Confirms, calls `removeVideoFromPlaylist()`, removes from grid
     - **Assign to Folder**: Opens submenu, user selects color, toggles assignment
     - **Quick Assign**: Opens submenu, user selects color, sets as quick assign preference
   - Menu closes after selection

8. **Bulk Tag Flow:**
   - User enters bulk tag mode → `bulkTagMode: true`
   - `BulkTagColorGrid` appears below the thumbnail (between thumbnail and title) in a fixed-height strip → Shows 4x4 grid (16 colors), always visible when in bulk mode
   - **Grid Layout**: `grid-cols-4 grid-rows-4` with `gap-0`, each square uses `w-full h-full` to fill cell
   - **Custom Names**: Folder metadata loaded → Custom names displayed as overlay text on squares (only if different from default)
   - **Instant assign**: User clicks color → `onBulkTagColorClick(video, folderColor)` → same handler as 3-dot menu assign/unassign (`handleStarColorLeftClick`). Persists immediately via `assignVideoToFolder()` / `unassignVideoFromFolder()`; `setVideoFolders()` updates store; checkmarks and border reflect current assignments
   - User toggles Bulk Tag off in header → Exits bulk tag mode; `clearBulkTagSelections()` on exit

**Source of Truth:**
- Database `video_folder_assignments` table - Source of Truth for folder assignments
- `pinStore.pinnedVideos` - Persisted pin state (localStorage)
- `pinStore.priorityPinIds` - Priority pin IDs (persisted)
- `pinStore.followerPinIds` - Follower pin IDs (persisted)
- `folderStore.quickAssignFolder` - Quick assign preference (persisted to localStorage)
- Parent component's state - Video data and folder assignments

**State Dependencies:**
- When `videoFolders` changes → Star icon updates → Filled if assigned, outline if not
- When `quickAssignFolder` changes → Star outline color updates (when video has no folders)
- When `isStarHovered` changes → Star color picker menu appears/disappears
- When `isPinned` changes → Pin icon updates → Blue filled if normal pin
- When `isPriorityPin` changes → Pin icon updates → Amber filled if priority
- When `isFollower` changes → Pin icon updates → Double-pin icon if follower modifier active
- When `isCurrentlyPlaying` changes → "Now Playing" badge appears/disappears
- When `bulkTagMode` changes → Color grid strip appears below thumbnail, star menu hidden
- When folder assigned → Parent updates `videoFolderAssignments` → Star icon updates, menu reflects changes
- When video pinned → `pinStore` updates → Pin icon updates (blue=normal, amber=priority, double-pin=follower)
- When follower video completes → Pin transfers to next video → Both old and new video icons update

---

#### ### 4.1.2.2 Tweet Card

**1: User-Perspective Description**

Users see high-fidelity Twitter/X cards for local content, designed to mimic the mobile app experience while integrating with the application's folder and pin systems.

- **Card Structure**:
  - **Grid Position**: Occupies a **single cell** in the 2-column video grid, sitting alongside other videos or tweets.
  - **Background**: Light sky blue (`#e0f2fe`) to match the application theme.
  - **Header Section**:
    - **Avatar**: Circular profile picture (40x40px) with fallback to colored letter icon.
    - **Author Info**: Bold display name and gray @handle (using font color `#052F4A`).
    - **Quick Menu**: 3-dot action menu (pinned/sticky/delete/move) appearing on hover.
  - **Content Area**: Clean text display (font color `#052F4A`) with `line-clamp-3` for longer tweets.
  - **Media Section**:
    - **Clarity**: Uses `medium` resolution thumbnails for grid display and `large` for hovers.
    - **Framing**: `contain` scaling within a slightly darker sky-blue frame (`bg-[#d0eafb]/50`) ensures no distortion or blurriness.
    - **Expansion**: Integrated with the 4chanX-style hover preview for high-res inspection.
  - **Interaction Badges** (Floating):
    - **Pin Button**: Dual-action pin/priority control on thumbnail.
    - **Star Button**: Folder assignment control with hover color picker.

- **Visual States**:
  - **Playing**: Red ring and glow effect consistent with video cards.
  - **Selected**: Blue border highlight.

**2: File Manifest**

**UI/Components:**
- `src/components/TweetCard.jsx`: Dedicated component for Twitter content.

**3: Logic & State Chain**

- **Content Detection**: `VideosPage.jsx` automatically switches to `TweetCard` if `video.is_local` is true or source is detected as twitter.


---

#### ### 4.1.2.3 Special Content Cards

**1: User-Perspective Description**

These cards represent non-video content integrated into the playlist view, allowing for quick application of visual themes and configurations directly from the content grid.

**4.1.2.3a Orb Card (Preset)**
- **Purpose**: Displays a saved Orb configuration as a selectable item within playlists.
- **Visuals**: Displays the custom Orb image uniformly as a perfect circle (`aspect-square` `rounded-full`) framed by a dormant audio visualizer border SVG. Unlike standard video/preset cards, the title and metadata appear only as a hover overlay. Advanced SVG masks and spilling effects are reserved for the loaded active state (Player Controller), not the card thumbnail.
- **Interactions**:
  - **Click**: Applies the saved Orb configuration to the active Player Controller.
  - **Hover**: Fades in a dark gradient overlay revealing the Orb title, assigned playlists, and action buttons.
  - **Playlist Assignment**: 
    - **Plus/Check Button**: Opens a dropdown to assign/unassign the preset to other playlists.
    - **Trash Button**: Only visible in playlist context. Removes the preset from the *current* playlist (unassigns it).

**4.1.2.3b Banner Preset Card**
- **Purpose**: Displays a saved App Banner configuration alongside videos.
- **Visuals**:
  - **Thumbnail**: 16:9 preview of the banner image.
  - **Border**: Features a solid dark border (`border-black`) aligning it with the general uniform card aesthetic.
  - **Overlay**: Gradient overlay on hover for better text readability.
  - **Header**: Shows preset name and a truncated list of assigned playlist names on hover.
- **Interactions**:
  - **Click**: Applies the saved App Banner configuration globally (image, scale, alignment, scroll settings).
  - **Playlist Assignment**: 
    - **Plus/Check Button**: Dropdown to toggle playlist assignments.
    - **Trash Button**: Removes the preset from the *current* playlist assignment.

**2: File Manifest**

**UI/Components:**
- `src/components/OrbCard.jsx`: Reusable Orb preset component with minimal/standard modes.
- `src/components/BannerPresetCard.jsx`: Banner preset card component.

**State Management:**
- `src/store/configStore.js`: Manages `orbFavorites` and `bannerPresets` arrays.
- `src/components/VideosPage.jsx`: Renders these cards via `visibleItems` logic, merging them with video content.

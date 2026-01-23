###4.1.1.1 & 4.1.2.1: UI Card Components

This document covers the reusable Card component system used throughout the application.

**Related Documentation:**
- **Pages**: See ui-pages.md for page components that use cards
- **Layout**: See ui-layout.md for layout system

---

#### ### 4.1.1.1 Playlist Cards

**1: User-Perspective Description**

Users see playlist cards built using the reusable Card component system:

- **Card Structure**:
  - **Thumbnail Area**: 16:9 aspect ratio, rounded corners
    - Image: Custom cover (if set) or first video's thumbnail
    - Fallback: Gray placeholder icon if no thumbnail
    - **Hover Overlay**: Semi-transparent black (visual darkening only, no centered buttons)
    - **3-Dot Menu**: Positioned at the top-right of the thumbnail, visible on hover.
  - **Content Area**:
    - **Container**: The entire card (title + thumbnail) is wrapped in a square border (`border-2 border-slate-700/50`) with rounded corners (`rounded-xl`) and a subtle background (`bg-slate-800/20`).
    - **Playlist Title**: Positioned inside the container, above the thumbnail.
    - **Title Styling**: Enclosed in a separate inner rectangle with a dark blue border (`border-[#052F4A]`) and light background (`bg-slate-100/90`). Text matches border color (`#052F4A`).
    - **Hover Actions**: Play, Shuffle, and Preview buttons appear on the right side of the Title Bar on hover. (Same hover actions apply to Folder Cards).

- **Visual States**:
  - **Default**: Transparent background, no border
  - **Hover**: Thumbnail darkens, Play/Preview buttons appear in Title Bar
  - **Selected**: Blue border (when active)

- **Interactive Elements**:
  - **Card Click**: Loads playlist and starts playing first video
  - **Play Button** (Title Bar hover): 
    - **Left Click**: Plays playlist from beginning
    - **Right Click**: Plays the specific video matching the card's cover image
  - **Shuffle Button** (Title Bar hover): Shuffles playlist items and plays immediately
  - **Preview Button** (Title Bar hover): Opens playlist in preview mode
  - **3-Dot Menu** (inline with title): Expand, Export, Add to Tab, Delete options

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
#### ### 4.1.2.1 Videos Card

**1: User-Perspective Description**

Users see video cards built using the Card component system with video-specific features:

- **Card Structure**:
  - **Thumbnail Area**: 16:9 aspect ratio
    - Image: Video thumbnail from YouTube
    - **Border**: `border-2 border-black` outline around thumbnail
    - **Badges**:
      - **Top-left**: "Now Playing" indicator (3 animated bouncing dots in Warm Red, only when playing)
      - **Top-left**: "Watched" indicator (Green tick icon, only when watched and not playing)

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
    - **Bulk Tag Overlay**: When in bulk tag mode, color grid appears on hover
    - **Star Color Picker Overlay**: When hovering over star icon for 1.2 seconds, a grid of 16 colored stars appears centered at the top of the thumbnail

- **Content Area**:
  - **Title**: Video title, dark blue text (RGB(5, 47, 74) / #052F4A), truncates
  - **Title**: Video title, dark blue text (RGB(5, 47, 74) / #052F4A), truncates
  - **Hidden by default (visible on hover)**:
    - **Subtitle**: Video ID, gray text

- **Visual States**:
  - **Default**: Gray border, thumbnail and title visible
  - **Selected**: Blue border (when video is selected)
  - **Playing**: **Vibrant Red Glow** (thick `ring-red-500` border + dual-layer shadow bleeding into/out of thumbnail)
  - **Hover**: Lighter background, top-right controls (Pin/Star), bottom-right menu, and subtitle appear

- **Interactive Elements**:
  - **Card Click**: Plays video in main player

  - **Pin Button** (top-right):
    - **Short Click**: Pins/unpins video (session-only, normal pin). Icon outline/filled blue.
    - **Long Click (>600ms)**: Sets video as priority pin. Icon outline/filled amber.

  - **Star Icon** (top-right): 
    - **Quick Click**: Assigns/unassigns video to quick assign folder (uses quick assign color preference)
    - **Hover (1.2s delay)**: Shows star color picker menu with 16 colored stars
      - **Left Click on Color Star**: Assigns/unassigns video to that folder color
      - **Right Click on Color Star**: Sets that color as the new quick assign default
    - Star outline color reflects the current quick assign folder color (when video has no folder assignments)

  - **3-Dot Menu** (bottom-right on thumbnail):
    - **Move to Playlist**: Opens modal to move video to another playlist (removes from current)
    - **Copy to Playlist**: Opens modal to copy video to another playlist (keeps in current)
    - **Assign to Folder**: Opens submenu to assign video to color folder
    - **Quick Assign**: Sets specific folder color as quick assign preference
    - **Delete**: Removes video from playlist
  - **Bulk Tag Grid** (hover in bulk mode): 16-color grid for bulk tagging

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
  - `bulkTagSelections`: Map of video ID to Set of folder colors
- `src/store/pinStore.js`:
  - `pinnedVideos`: Array of pinned videos (persisted)
  - `priorityPinIds`: Array of priority pin IDs
  - `isPinned(videoId)`: Checks if video is pinned
  - `isPriorityPin(videoId)`: Checks if video is priority pin
  - `togglePin(video)`: Toggles pin status (normal pin)
  - `setFirstPin(video)`: Sets video as priority pin
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

4. **Pin Click Flow (Normal Pin):**
   - User clicks pin icon → `handlePinClick()` (line 151)
   - Calls `togglePin(video)` → Updates `pinStore.pinnedVideos`
   - Pin icon updates → Amber if pinned, gray if not
   - Persisted → Normal pins persist until manually removed or video reaches ≥85% completion (auto-unpin)

5. **Priority Pin Click Flow:**
   - User clicks priority pin button in hover overlay → `handlePriorityPinClick()` (line 170)
   - Calls `setFirstPin(video)` → Updates `pinStore.priorityPinId`
   - If another priority pin exists → It's replaced (only one priority pin at a time)
   - Priority pin button icon updates → Filled if video is priority pin, outline if not
   - Priority pin appears first in pin track with larger size and amber border

6. **Menu Option Flow:**
   - User clicks 3-dot menu → `CardMenu` opens
   - User selects option → `onMenuOptionClick(option, video)` (VideosPage.jsx line 182)
   - Handles actions:
     - **Delete**: Confirms, calls `removeVideoFromPlaylist()`, removes from grid
     - **Assign to Folder**: Opens submenu, user selects color, toggles assignment
     - **Quick Assign**: Opens submenu, user selects color, sets as quick assign preference
   - Menu closes after selection

7. **Bulk Tag Flow:**
   - User enters bulk tag mode → `bulkTagMode: true`
   - User hovers video → `setIsHovered(true)` (line 247)
   - `BulkTagColorGrid` appears → Shows 16-color grid overlay
   - User clicks color → `onBulkTagColorClick(video, folderColor)` (line 287)
   - Toggles selection → `toggleBulkTagSelection(video.id, folderColor)`
   - Visual feedback → Checkmark appears on selected colors
   - User clicks "Save" → Parent handles bulk save (see VideosPage flow)

**Source of Truth:**
- Database `video_folder_assignments` table - Source of Truth for folder assignments
- `pinStore.pinnedVideos` - Session-only pin state (not persisted, priority pin always first)
- `pinStore.priorityPinId` - Priority pin ID (session-only, not persisted)
- `folderStore.quickAssignFolder` - Quick assign preference (persisted to localStorage)
- Parent component's state - Video data and folder assignments

**State Dependencies:**
- When `videoFolders` changes → Star icon updates → Filled if assigned, outline if not
- When `quickAssignFolder` changes → Star outline color updates (when video has no folders)
- When `isStarHovered` changes → Star color picker menu appears/disappears
- When `isPinned` changes → Pin icon updates → Amber if pinned, gray if not
- When `isPriorityPin` changes → Priority pin button icon updates → Filled if priority, outline if not
- When `isCurrentlyPlaying` changes → "Now Playing" badge appears/disappears
- When `bulkTagMode` changes → Hover behavior changes → Color grid appears on hover, star menu hidden
- When folder assigned → Parent updates `videoFolderAssignments` → Star icon updates, menu reflects changes
- When video pinned → `pinStore` updates → Pin icon updates
- When priority pin set → `pinStore.priorityPinId` updates → Priority pin button icon updates

---


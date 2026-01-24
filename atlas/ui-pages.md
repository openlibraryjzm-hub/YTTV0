###4.1: UI Pages

This document covers all page components in the UI system. For card components, see ui-cards.md. For modal components, see ui-modals.md.

**Related Documentation:**
- **Layout**: See `ui-layout.md` for layout system and side menu
- **Page Banner**: See `page-banner.md` for comprehensive Page Banner documentation
- **Cards**: See `ui-cards.md` for card component details
- **Modals**: See `ui-modals.md` for modal components

---

#### ### 4.1.1 Playlists Page

**1: User-Perspective Description**

Users see a 2-column grid of playlist cards. For detailed description of playlist functionality, see **Section 2.1: Playlists**. This section focuses on the UI/visual aspects:

- **Grid Layout**: 2 columns, responsive spacing, scrollable vertical list
- **Playlist Cards**: Each card displays:
  - Thumbnail (16:9 aspect ratio, first video's thumbnail)
  - Playlist name (truncated if too long)
  - Description (optional, line-clamped to 2 lines)
  - Video count (e.g., "5 videos")
  - Hover overlay with preview and play buttons
  - 3-dot menu with expand/export/add-to-tab/delete options

- **Header Actions**: Top of page shows:
- **Sticky Toolbar**: A dynamic toolbar that sits below the Page Banner and sticks to the top of the viewport when scrolling.
  - **Unified Compact Design**: Shares the same single-row architecture and unified banner background as the Videos Page toolbar.
  - **Tab Bar**: Integrated into the left side of the row (`flex-1`). Contains the **Tab Presets Dropdown** (which acts as the "All" / Master switch) and the scrollable list of tabs.
  - **Controls Cluster**: A compact group on the right side containing:
    - **Folder Toggle (Icon)**: Toggles inline folder display.
    - **Add Playlist (Icon)**: Opens playlist import/create modal.

- **Colored Folders**: When folder toggle is on, folder cards appear in grid above playlists:
  - **Grouped by Playlist**: Folders are organized under their parent playlist with section headers
  - **Playlist Headers**: Each group has an uppercase header with gradient divider lines showing the playlist name
  - **Folder Card Schema**: Folder cards use the same structure as playlist cards (bordered container, title bar with colored dot + name, hover controls, thumbnail with 3-dot menu)
  - **Custom Names**: Folders display custom names if renamed, otherwise show the color name
  - **3-Dot Menu**: Options include "Stick/Unstick Folder" and "Convert to Playlist"
  - **"Source Playlists" Header**: Separates folder section from regular playlists (only visible when folders are shown)

**2: File Manifest**

**UI/Components:**
- `src/components/PlaylistsPage.jsx`: Main playlist grid page component
- `src/components/Card.jsx`: Base card component
- `src/components/CardThumbnail.jsx`: Thumbnail display component
- `src/components/CardContent.jsx`: Content area component
- `src/components/CardMenu.jsx`: 3-dot menu component
- `src/components/TabBar.jsx`: Tab navigation bar

**State Management:**
- See Section 2.1 for full state management details
- `src/components/PlaylistsPage.jsx` (local state):
  - `playlists`: Array of playlist objects
  - `playlistThumbnails`: Map of playlist ID to thumbnail URL
  - `playlistItemCounts`: Map of playlist ID to video count
  - `folders`: Array of folder objects (from `getAllFoldersWithVideos()`)
  - `folderMetadata`: Map of `"playlistId:folderColor"` to `{ name, description }` for custom folder names
  - `stuckFolders`: Set of stuck folder keys (`"playlistId:folderColor"`)

**API/Bridge:**
- See Section 2.1 for full API details

**Backend:**
- See Section 2.1 for full backend details

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

See **Section 2.1: Playlists** for complete logic flow. The UI-specific aspects:

1. **Card Rendering Flow:**
   - Playlists loaded → `playlists` array populated
   - For each playlist → Renders `<Card>` component
   - Card uses `<CardThumbnail>` for image → 16:9 aspect ratio enforced
   - Card uses `<CardContent>` for text → Title, description, video count
   - Card uses `<CardContent>` for text → Title, description, video count, and menu
   - Card uses `<CardActions>` for menu → 3-dot menu positioned inline with title

2. **Grid Layout Flow:**
   - CSS Grid: `grid grid-cols-2 gap-4` → 2 columns, 4-unit gap
   - Responsive: Adjusts to container width
   - Scrollable: `overflow-y-auto` on container

**Source of Truth:**
- See Section 2.1

**State Dependencies:**
- See Section 2.1

---

#### ### 4.1.2 Videos Page

**1: User-Perspective Description**

Users see a 3-column grid of video cards showing videos from the current playlist:

- **Page Banner**: 
  - **Location**: Displayed at the very top of the scrollable content area.
  - **Comprehensive Documentation**: See `page-banner.md` for complete details on the Page Banner system, including Unified Banner System, Sticky Toolbar integration, customization options, and technical implementation.
  - **Quick Reference**: Shows playlist/folder title, metadata (video count, year, author), description, ASCII avatar, and thumbnail carousel. Supports custom images, animated patterns, and folder color gradients.
  - **Thumbnail Carousel** (top-right): Shows continue watching and/or pinned videos with dot navigation and multi-pin bar
  - **Playlist Navigator** (top-right): Chevron buttons to browse playlists in preview mode without affecting player
    - **Left/Right Chevrons**: Navigate to previous/next playlist
    - **Playlist Name**: Fixed-width display with truncation
    - **Return Button**: Amber icon appears when navigated away from entry point, returns to reset point

- **Sticky Toolbar**: Sits below the Page Banner and sticks to the top of the viewport when scrolling.
  - **Compact Layout**: Features a streamlined single-row design to maximize vertical screen real estate.
  - **Unified Background**: Inherits the **Custom Page Banner Image** (if set) and continues the same horizontal scroll animation, maintaining visual alignment with the top banner.
  - **Videos Page Layout**:
    - **Left**: All/Unsorted buttons + Colored Folder Prism (16-color horizontal bar).
    - **Right**: Sort Dropdown (Default/Date/Progress/Last Viewed) + Save/Cancel buttons (when in bulk tag mode) + Bulk Tag Mode toggle + Add Button.
    - **Sort Dropdown**: Compact design with reduced padding (`pl-1.5 pr-4`) and minimum width constraint for space efficiency.
    - **Bulk Tag Controls**: When bulk tag mode is active, Save (green) and Cancel (red) buttons appear between the sort dropdown and bulk tag toggle, providing clear workflow actions.
  - **Playlists Page Layout**:
    - **Left**: Tab Bar navigation.
    - **Right**: Control cluster (Tab Presets, Folder Toggle, Add Playlist).

- **Pagination Controls**: For performance, videos are paginated (50 videos per page). Previous/Next controls appear at the bottom of the grid and also via the Sticky Toolbar's logic (internal aliasing only).

- **Sticky Video Carousel**: 
  - **Purpose**: Displays important videos at the very top of the page.
  - **Behavior**:
    - **Copy vs Move**: Stickied videos are *copied* to the carousel (they remain in the regular grid properly sorted).
    - **Scoped State**: Sticky status is scoped per playlist AND per folder context. A video stickied in the "Red" folder only appears in the "Red" folder's carousel.
    - **Root Context**: Videos stickied in the main "All Videos" view only appear in the root carousel.
    - **Unsorted Exclusion**: The carousel is hidden on the "Unsorted" view.
    - **Filter Immunity**: Videos in the Sticky Carousel are immune to watch time filters (e.g., "Hide Watched"), ensuring they remain visible regardless of their watch status.
  - **Format**: 
    - 1-3 stickied videos: Displayed in a standard grid layout.
    - 4+ stickied videos: Displayed in a horizontal carousel (scrollable via side buttons, visible horizontal scrollbar, and touch-style drag-to-scroll).
  - **Controls**: Sticky status toggled via video 3-dot menu ("Sticky Video" / "Unsticky Video").
  - **Persistence**: Scoped ID sets are persisted to localStorage (`sticky-storage`).

- **Video Grid**: 3-column grid of video cards with optimized spacing for larger thumbnails (see `ui-cards.md` for video card details)
  - **Grid Layout**: `grid-cols-3` with `gap-2` (8px) for increased thumbnail size
  - **Container Padding**: `px-4` (16px) for balanced spacing

- **Folder Filtering**: When a folder is selected (via FolderSelector), only videos in that folder are shown

- **Preview Mode**: When a playlist is being previewed (not yet loaded), shows preview items with visual indicator

- **Empty States**:
  - No playlist loaded: "No playlist selected"
  - No videos: "No videos in this playlist"
  - Folder selected with no videos: Empty grid

**2: File Manifest**

**UI/Components:**
- `src/components/VideosPage.jsx`: Main videos grid page component
- `src/components/VideoCard.jsx`: Individual video card component
- `src/components/Card.jsx`: Base card component
- `src/components/CardThumbnail.jsx`: Thumbnail component
- `src/components/CardContent.jsx`: Content component
- `src/components/CardActions.jsx`: Actions component
- `src/components/BulkTagColorGrid.jsx`: Color grid overlay for bulk tagging
- `src/components/FolderSelector.jsx`: Folder filter selector
- `src/components/PlaylistSelectionModal.jsx`: Modal for selecting playlist (Move/Copy actions)
- `src/components/StickyVideoCarousel.jsx`: Sticky video grid/carousel component
- `src/components/PageBanner.jsx`: Banner component for playlist/folder titles
- `src/components/EditPlaylistModal.jsx`: Modal for editing playlist metadata


**State Management:**
- `src/store/playlistStore.js`:
  - `currentPlaylistItems`: Array of videos in current playlist
  - `previewPlaylistItems`: Array of videos in preview playlist (null when not previewing)
  - `currentPlaylistId`: Current playlist ID
  - `previewPlaylistId`: Preview playlist ID
  - `setPreviewPlaylist`: Sets preview playlist (used by playlist navigator)
- `src/store/stickyStore.js`:
  - `allStickiedVideos`: Map of scoped keys (`playlistId::folderId`) to video IDs
  - `toggleSticky(playlistId, videoId, folderId)`: Toggles sticky state
  - `isStickied(playlistId, videoId, folderId)`: Checks sticky state
- `src/store/folderStore.js`:
  - `selectedFolder`: Currently selected folder color (null = all)
  - `videoFolderAssignments`: Map of video ID to array of folder colors
  - `bulkTagMode`: Boolean for bulk tagging mode
  - `bulkTagSelections`: Map of video ID to Set of folder colors
- `src/store/shuffleStore.js`:
  - `shuffleStates`: Map of playlist ID to shuffle mapping (VideoID → Rank)
  - `getShuffleState`: Generates or retrieves consistent shuffle order for session
- `src/store/pinStore.js`:
  - `pinnedVideos`: Array of pinned video objects (used for banner thumbnail)
  - `priorityPinIds`: Array of priority pin IDs
- `src/components/VideosPage.jsx` (local state):
  - `displayedVideos`: Array of videos to show (filtered by folder)
  - `selectedVideoIndex`: Currently selected video index
  - `sortBy`: Sort option ('shuffle', 'chronological', 'progress', 'lastViewed')
  - `watchedVideoIds`: Set of video IDs with ≥85% progress
  - `videoProgress`: Map of video ID to progress data (includes `percentage`, `hasFullyWatched`, `last_updated`)
  - `allFolderMetadata`: Map of folder color ID to metadata object (`{ name, description }`) - Loaded when playlist changes for custom name display in bulk tag grid
  - `savingBulkTags`: Boolean indicating bulk tag save operation in progress
  - `resetPointId`: Playlist ID to return to when using playlist navigator return button
  - `isChevronNavRef`: Ref to track if navigation is from chevrons (prevents reset point update)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in folder
  - `getVideoFolderAssignments(playlistId, itemId)` - Gets folder assignments for video
  - `assignVideoToFolder(playlistId, itemId, folderColor)` - Assigns video to folder
  - `unassignVideoFromFolder(playlistId, itemId, folderColor)` - Removes folder assignment
  - `removeVideoFromPlaylist(playlistId, itemId)` - Removes video from playlist
  - `getWatchedVideoIds()` - Gets video IDs with ≥85% progress
  - `getAllVideoProgress()` - Gets all video progress data
  - `getFolderMetadata(playlistId, folderColor)` - Gets folder metadata (custom name, description) for custom name display in bulk tag grid

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `playlist_items`: Videos in playlists
  - `video_folder_assignments`: Folder assignments
  - `video_progress`: Video playback progress

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Load Videos Flow:**
   - Component mounts or playlist changes → `useEffect` (VideosPage.jsx line 50)
   - Checks for preview items → `previewPlaylistItems || currentPlaylistItems`
   - Sets `activePlaylistItems` → Used for display
   - Loads folder assignments → `getVideoFolderAssignments()` for each video
   - Updates `videoFolderAssignments` in store → Cards show folder indicators

2. **Folder Filtering Flow:**
   - User selects folder → `setSelectedFolder(folderColor)` (FolderSelector)
   - `useEffect` (line 304) triggers → `filterVideos()`
   - If `selectedFolder === null` → Shows all videos from `activePlaylistItems`
   - If `selectedFolder === 'unsorted'` → Filters videos with no folder assignments from `videoFolderAssignments`
   - If `selectedFolder` is a color → Calls `getVideosInFolder(playlistId, folderColor)`
   - Updates `displayedVideos` → Grid re-renders with filtered videos
   - **Dynamic Updates**: The `useEffect` depends on `videoFolderAssignments`, so when videos are assigned to folders, the unsorted view updates automatically without requiring page navigation

3. **Sorting Flow:**
   - User selects sort option → `setSortBy(option)` (line 42)
    - `useMemo` (line 707) recalculates → `sortedVideos`
    - Sort logic:
      - **Default**: Randomizes video order (Shuffle behavior). Order persists per playlist for the current session.
      - **Chronological**: Original playlist order.
      - **Watch Progress**: Sorts by progress (Unwatched/Partially Watched/Watched).
      - **Last Viewed**: Sorts by `last_updated` timestamp from `video_progress` table. Most recently viewed videos appear first. Videos that have never been viewed are placed at the end.
   - Grid re-renders with sorted videos

4. **Bulk Tag Mode Flow:**
   - User clicks "Bulk Tag Mode" → `setBulkTagMode(true)` (line 30)
   - Cards enter bulk tag mode → Hover shows color grid overlay
   - **Save/Cancel buttons appear** in toolbar → Provides clear workflow actions
   - User hovers video → `BulkTagColorGrid` appears (4x4 grid perfectly covering thumbnail)
   - **Custom folder names displayed** → If a folder has a custom name (different from default color name), it appears as overlay text on the square
   - User clicks colors → `toggleBulkTagSelection(videoId, folderColor)` (line 288)
   - Updates `bulkTagSelections` → Visual feedback (checkmarks on selected squares)
   - **Thumbnail border updates** → Border color changes to match selected folder color (first selected if multiple)
   - User clicks "Save" → `handleSaveBulkTags()` (line 571)
   - Loops through selections → `assignVideoToFolder()` / `unassignVideoFromFolder()`
   - Refreshes folder assignments → Grid updates
   - Exits bulk tag mode → `setBulkTagMode(false)`, Save/Cancel buttons hidden
   - User clicks "Cancel" → `handleCancelBulkTags()` (line 658) → Clears selections and exits mode

5. **Video Click Flow:**
   - User clicks video card → `handleVideoClick(video, index)` (line 278)
   - If bulk tag mode → Returns early, doesn't play
   - Finds original index → `activePlaylistItems.findIndex()`
   - Updates `selectedVideoIndex` → Card highlights
   - Calls `onVideoSelect(video.video_url)` → Starts playing video

6. **Progress Tracking Flow:**
   - Component mounts → `useEffect` (line 70) loads progress data
   - Calls `getWatchedVideoIds()` → Gets videos with ≥85% progress
   - Calls `getAllVideoProgress()` → Gets all progress percentages
   - Updates local state → `watchedVideoIds` Set, `videoProgress` Map
   - **Polling:** Component sets up interval to poll `getAllVideoProgress()` every 5 seconds to keep data fresh.
   - When current video changes → `useEffect` (line 92) refreshes progress (debounced 2s)
   - Sorting uses progress data → Determines watch status

7. **Playlist Navigator Flow:**
   - **Chevron Navigation**: User clicks left/right chevron → `handleNavigatePlaylist('prev'|'next')`
   - Sets `isChevronNavRef.current = true` → Prevents reset point update
   - Calculates next/previous playlist index with wrapping
   - Fetches playlist items → `getPlaylistItems(targetPlaylist.id)`
   - Sets preview playlist → `setPreviewPlaylist(items, id, null, name)` (doesn't affect player)
   - Reset flag after state update propagates
   - **Reset Point Tracking**:
     - `useEffect` watches `activePlaylistId` changes
     - If change is NOT from chevron nav → Updates `resetPointId` to current playlist
     - External entries (from PlaylistsPage, controller) set new reset point
   - **Return to Reset Point**: User clicks return button → `handleReturnToOriginal()`
     - Loads `resetPointId` playlist via `getPlaylistItems()`
     - Sets as preview playlist
   - **Show Return Button**: `showReturnButton = resetPointId && resetPointId !== activePlaylistId`

8. **Pinned Videos in Banner Flow:**
   - Component imports `usePinStore` → Gets `pinnedVideos` array
   - `pinnedVideosInPlaylist` useMemo filters pins to current playlist:
     - Creates Set of video IDs in `videosToDisplay`
     - Filters `pinnedVideos` to those matching playlist
   - Passes `pinnedVideos` array to `PageBanner` component
   - `onPinnedClick(video)` callback plays the selected pinned video

**Source of Truth:**
- Database `playlist_items` table - Source of Truth for videos
- Database `video_folder_assignments` table - Source of Truth for folder assignments
- Database `video_progress` table - Source of Truth for progress data
- `playlistStore.currentPlaylistItems` - Cached video array
- `playlistStore.previewPlaylistItems` - Preview video array (null when not previewing)
- `folderStore.selectedFolder` - Currently selected folder filter

**State Dependencies:**
- When `currentPlaylistItems` changes → Videos loaded → Grid updates
- When `previewPlaylistItems` set → Preview mode active → Shows preview items
- When `selectedFolder` changes → `displayedVideos` filtered → Grid shows only folder videos
- When `videoFolderAssignments` changes → Unsorted view dynamically updates → Assigned videos removed, next unsorted videos appear
- When `sortBy` changes → `sortedVideos` recalculated → Grid re-sorted
- When `bulkTagMode` changes → Cards enter/exit bulk mode → UI changes
- When folder assigned → `videoFolderAssignments` updated → Card star icon updates AND unsorted view refreshes automatically
- When video progress updates → `videoProgress` Map updated → Sorting may change

---

#### ### 4.1.3 History Page

**1: User-Perspective Description**

Users see a vertical list of history cards showing the last 100 watched videos:

- **Page Banner**: 
  - **Playlist Badges**: Displays badges for all unique playlists that contain videos from the watch history
  - **Badge Functionality**:
    - **Left Click**: Filters the history page to show only videos from that playlist (click again to clear filter)
    - **Right Click**: Navigates to the Videos page for that playlist in preview mode
  - **Badge Styling**: Matches metadata row styling (text-white/80, font-medium, text-sm md:text-base)
  - **Filtered State**: When a playlist is filtered, the badge is highlighted (brighter background/border) and the description updates to show "Videos from '[Playlist Name]'"
  - **Badge Limit**: Badges are limited to 2 rows with an expand button (>>>) to show all playlists

- **History Cards**: Each card displays in a horizontal layout:
  - **Card Border**: Each card has a `border-2 border-slate-700/50` that becomes `border-slate-600/70` on hover
  - **Thumbnail** (Left): Video thumbnail (16:9 aspect ratio, fixed width) with `border-2 border-black` outline matching VideosPage style
  - **Currently Playing Indicator**: When a video is currently playing, the card displays:
    - Red border (`border-red-500`)
    - Red ring effect (`ring-4 ring-red-500`)
    - Red glow shadow matching VideosPage style
  - **Content** (Right):
    - **Title**: Video title, large and bold.
    - **Pin Marker**: If the video is pinned or priority pinned, a pin icon appears in the top-right corner of the title area (amber for priority pins, sky for normal pins).
    - **Metadata Rows**: Two separate rows for badges:
      - **Top Row**: Playlist/Folder badges - One badge per playlist the video belongs to, showing:
        - **Format**: "Playlist Name - Folder Name" (or just "Playlist Name" if no folder)
        - **Coloring**: Badge uses the folder color (if folder exists) or default sky color
        - **Interactive Parts**: Badge is split into two clickable sections:
          - **Playlist Name** (left): Clicking navigates to the full playlist in preview mode
          - **Folder Name** (right): Clicking navigates to that specific folder in the playlist in preview mode
        - **Hover Effects**: 
          - Playlist name: White highlight box appears on hover
          - Folder name: Colored highlight box (using folder color) appears on hover
      - **Bottom Row**: Time since watched - Relative time (e.g., "2 hours ago") styled to match the video title (large, bold, same color with hover effect).
  - **Thumbnail**: No hover overlay effects - thumbnail displays without blur or play button on hover.

- **Deduplication**: If a video is re-watched, it is moved to the top of the list (most recent) to prevent duplicates.

- **Empty States**:
  - Loading: "Loading history..." message
  - No history: "No watch history yet" message

- **List Layout**: Vertical stack of horizontal cards.

**2: File Manifest**

**UI/Components:**
- `src/components/HistoryPage.jsx`: Main history grid page component
- `src/components/Card.jsx`: Base card component
- `src/components/CardThumbnail.jsx`: Thumbnail component
- `src/components/CardContent.jsx`: Content component

**State Management:**
- `src/components/HistoryPage.jsx` (local state):
  - `history`: Array of watch history items
  - `loading`: Boolean for loading state
  - `playlistMap`: Maps video_id to array of playlist names
  - `folderMap`: Maps video_id -> playlist_id -> [folder_colors]
  - `folderNameMap`: Maps video_id -> playlist_id -> folder_color -> folder_name
  - `allPlaylists`: All playlists for name-to-ID lookup
  - `filteredPlaylist`: Currently filtered playlist name (null = show all)
- `src/store/playlistStore.js`:
  - `currentPlaylistItems`: Array of videos in current playlist (for detecting currently playing video)
  - `currentVideoIndex`: Index of currently playing video
  - `setPlaylistItems`: Function to set playlist items and navigate
- `src/store/navigationStore.js`:
  - `setCurrentPage`: Function to navigate between pages
- `src/store/pinStore.js`:
  - `pinnedVideos`: Array of pinned videos (used to check if history entries are pinned)
  - `priorityPinIds`: Array of priority pin IDs (used to distinguish priority pins from normal pins)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getWatchHistory(limit)` - Gets watch history (last N videos)
  - `getPlaylistsForVideoIds(videoIds)` - Gets playlists that contain specified videos
  - `getAllPlaylists()` - Gets all playlists
  - `getPlaylistItems(playlistId)` - Gets videos in a playlist
  - `getVideoFolderAssignments(playlistId, itemId)` - Gets folder assignments for a video
  - `getFolderMetadata(playlistId, folderColor)` - Gets folder metadata (custom name, description)
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in a specific folder

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `watch_history`: Watch history records (id, video_url, video_id, title, thumbnail_url, watched_at)

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Load History Flow:**
   - Component mounts → `useEffect` (HistoryPage.jsx line 28)
   - Calls `loadAllData()` → Loads playlists first, then history
   - Gets all playlists → `getAllPlaylists()` → Stores in `allPlaylists` state
   - Gets watch history → `getWatchHistory(100)` → Gets last 100 videos
   - Gets playlist associations → `getPlaylistsForVideoIds(videoIds)` → Maps each video to its playlists
   - For each video in each playlist:
     - Gets playlist items → `getPlaylistItems(playlistId)` → Finds item_id for video
     - Gets folder assignments → `getVideoFolderAssignments(playlistId, itemId)` → Gets folder colors
     - Gets folder metadata → `getFolderMetadata(playlistId, folderColor)` → Gets custom folder names
   - Updates state → `history`, `playlistMap`, `folderMap`, `folderNameMap` all set
   - Sets `loading: false` → Cards render with badges

2. **Time Formatting Flow:**
   - History item has `watched_at` timestamp → `formatDate(dateString)` (line 40)
   - Calculates time difference → `now - date`
   - Formats relative time:
     - < 1 minute: "Just now"
     - < 60 minutes: "X minutes ago"
     - < 24 hours: "X hours ago"
     - < 7 days: "X days ago"
     - Older: Actual date (e.g., "Jan 15, 2024")

3. **Currently Playing Detection Flow:**
   - Component checks `currentPlaylistItems[currentVideoIndex]` from `playlistStore`
   - Compares video IDs and URLs to determine if history item matches currently playing video
   - If match found → Card displays red border, ring effect, and glow shadow
   - Updates in real-time as video changes

4. **Badge Click Flow (Playlist - Left Click/Filter):**
   - User left-clicks playlist badge → `handlePlaylistBadgeLeftClick(e, playlistName)`
   - Toggles filter state → If already filtered to this playlist, clears filter; otherwise, filters to this playlist
   - Updates `filteredPlaylist` state → History list filters to show only videos from that playlist
   - Badge highlights when filtered → Visual feedback with brighter background/border

5. **Badge Click Flow (Playlist - Right Click/Navigate):**
   - User right-clicks playlist badge → `handlePlaylistBadgeRightClick(e, playlistName)`
   - Finds playlist by name → Looks up in `allPlaylists`
   - Gets playlist items → `getPlaylistItems(playlist.id)`
   - Sets playlist items → `setPlaylistItems(items, playlist.id, null, playlist.name)`
   - Navigates to videos page → `setCurrentPage('videos')`
   - **Preview Mode**: Does NOT call `onVideoSelect`, keeping current video playing

6. **Badge Click Flow (Folder):**
   - User clicks folder name in badge → `handleFolderBadgeClick(e, playlistName, folderColor)` (line 115)
   - Finds playlist by name → Looks up in `allPlaylists`
   - Gets folder videos → `getVideosInFolder(playlist.id, folderColor)`
   - Sets playlist items with folder context → `setPlaylistItems(items, playlist.id, { playlist_id: playlist.id, folder_color: folderColor })`
   - Navigates to videos page → `setCurrentPage('videos')`
   - **Preview Mode**: Does NOT call `onVideoSelect`, keeping current video playing

7. **Video Click Flow:**
   - User clicks history card → `handleVideoClick(item)` (line 90)
   - Calls `onVideoSelect(item.video_url)` → Parent handles
   - `App.jsx` routes to main player via `handleVideoSelect()`:
     - Searches through all playlists to find containing playlist
     - When found → Loads playlist items, sets playlist context, sets video index, starts playing
   - Video starts playing → Watch history may be updated

**Source of Truth:**
- Database `watch_history` table - Source of Truth for watch history (ordered by `watched_at DESC`)

**State Dependencies:**
- When component mounts → History and playlist/folder data loaded → Cards display with badges
- When video played → New entry added to watch history → History page would update on next load
- When playlist/folder data loads → Badges appear with correct colors and names
- When badge left-clicked → Filter state toggles → History list filters/unfilters
- When badge right-clicked → Navigation occurs in preview mode (current video continues playing)
- When `filteredPlaylist` changes → `filteredHistory` recalculates → Displayed cards update

---
#### ### 4.1.4 Pins Page

**1: User-Perspective Description**

Users see a dedicated page for pinned videos, separating "Priority Pins" from "Regular Pins":

- **Priority Pins Carousel**: The top section displays priority pins (videos pinned via the yellow star/pin button).
  - Presented in a horizontal carousel (StickyVideoCarousel).
  - These pins **do not expire**.
  - Always sorted by most recently pinned first (left to right).

- **Regular Pins Grid**: The main section displays normal pins (videos pinned via the standard pin button).
  - Presented in a standard 3-column grid.
  - **Persistent**: Regular pins persist until manually removed (no expiration).
  - Sorted by **most recently pinned** (newest first).

- **Visuals**:
  - Uses the standard `PageBanner` "Pinned Videos" header.
  - `VideoCard` components are reused for both priority and regular pins.

**2: File Manifest**

**UI/Components:**
- `src/components/PinsPage.jsx`: Main pins page component
- `src/components/StickyVideoCarousel.jsx`: Carousel for priority pins
- `src/components/VideoCard.jsx`: Video card component (handles timer display)

**State Management:**
- `src/store/pinStore.js`:
  - `pinnedVideos`: Array of all pins (includes timestamp)
  - `priorityPinIds`: Array of priority pin IDs
  - `checkExpiration()`: No-op function (pins no longer expire)

**3: The Logic & State Chain**

1. **Rendering Flow:**
   - Component gets `pinnedVideos` and `priorityPinIds` from store.
   - Filters videos into `priorityVideos` and `regularVideos`.
   - Sorts `priorityVideos` by index in `priorityPinIds`.
   - Sorts `regularVideos` by `pinnedAt` descending (newest first).
   - Renders Carousel for priority, Grid for regular.

---
#### ### 4.1.6 Likes Page

**1: User-Perspective Description**

Access specific videos that have been marked as "Liked". This page aggregates all videos from the special "Likes" playlist.

- **Page Banner**: 
  - **Playlist Badges**: Displays badges for all unique playlists that contain liked videos (excluding "Likes" itself)
  - **Badge Functionality**:
    - **Left Click**: Filters the liked videos to show only videos from that playlist (click again to clear filter)
    - **Right Click**: Navigates to the Videos page for that playlist in preview mode
  - **Badge Styling**: Matches metadata row styling (text-white/80, font-medium, text-sm md:text-base)
  - **Filtered State**: When a playlist is filtered, the badge is highlighted and the description updates to show "Liked videos from '[Playlist Name]'"
  - **Badge Limit**: Badges are limited to 2 rows with an expand button (>>>) to show all playlists
  - **Pagination Badge**: Compact pagination controls (`<< < 1/99 > >>`) replace the description text when multiple pages exist
    - Format: First page (`<<`), Previous (`<`), Current/Total (`1/99`), Next (`>`), Last page (`>>`)
    - Styled to match metadata row text styling
    - Only visible when `totalPages > 1`

- **Grid View with Pagination**: 
  - Displays video cards in a **3-column grid layout** (matching VideosPage)
  - **Layout**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2` for larger cards
  - **Paginated**: Videos are displayed in pages of 24 items to improve performance and navigation
  - **Controls**: Pagination controls (Page Numbers, Prev/Next) are available at the bottom of the list
  - **Filtering**: When a playlist is filtered, only liked videos from that playlist are shown

- **Auto-Generated**: The "Likes" playlist is automatically created if it does not exist.
- **Navigation**: Accessible via the "Like" (Heart) icon in the top navigation.

**2: File Manifest**

**UI/Components:**
- `src/components/LikesPage.jsx`: Page component fetching data and managing pagination state.
- `src/components/PageBanner.jsx`: Banner component with playlist badges and pagination badge.
- `src/components/VideoCard.jsx`: Video card component for displaying liked videos.

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getPlaylistsForVideoIds(videoIds)` - New command to fetch playlist distribution for a batch of videos.

**Backend:**
- `src-tauri/src/database.rs`: 
  - `get_playlists_for_video_ids`: Optimized query to find playlist memberships for given video IDs.

**State Management:**
- `src/components/LikesPage.jsx` (local state):
  - `likesPlaylistId`: ID of the "Likes" playlist
  - `likedVideos`: Array of all liked videos
  - `loading`: Boolean for loading state
  - `currentPage`: Current page number (1-indexed)
  - `playlistMap`: Maps video_id to array of playlist names
  - `allPlaylists`: All playlists for name-to-ID lookup
  - `filteredPlaylist`: Currently filtered playlist name (null = show all)

**3: The Logic & State Chain**

**Initialization & Data Loading:**
- Component mounts → Fetches "Likes" playlist items
- Loads all playlists → `getAllPlaylists()` → Stores in `allPlaylists`
- Gets playlist associations → `getPlaylistsForVideoIds(videoIds)` for all liked videos → Maps each video to its playlists
- Extracts unique playlists → Computes `uniquePlaylists` from `playlistMap` (excluding "Likes" itself)
- Sets up pagination (24 items/page)

**Filtering Flow:**
- User left-clicks playlist badge → `handlePlaylistBadgeLeftClick(e, playlistName)`
- Toggles filter state → If already filtered to this playlist, clears filter; otherwise, filters to this playlist
- Updates `filteredPlaylist` state → `filteredLikedVideos` recalculates
- Resets to page 1 when filter changes
- Pagination uses `filteredLikedVideos` instead of `likedVideos`

**Navigation Flow:**
- User right-clicks playlist badge → `handlePlaylistBadgeRightClick(e, playlistName)`
- Finds playlist by name → Looks up in `allPlaylists`
- Gets playlist items → `getPlaylistItems(playlist.id)`
- Sets playlist items → `setPlaylistItems(items, playlist.id, null, playlist.name)`
- Navigates to videos page → `setCurrentPageNav('videos')`
- **Preview Mode**: Does NOT call `onVideoSelect`, keeping current video playing

**Pagination Flow:**
- User clicks pagination badge buttons → Updates `currentPage` state
- `currentItems` recalculates based on `filteredLikedVideos` and `currentPage`
- Grid re-renders with new page of videos

---
#### ### 4.1.7 Pins Page

**1: User-Perspective Description**

Access videos that have been temporarily pinned during the current session.

- **Session-Based**: Pins are ephemeral and cleared when the application closes (unlike Likes which are persistent).
- **Grid View**: Displays pinned video cards.
- **Pinning**: Videos can be pinned from any video card using the pin icon.
- **Navigation**: Accessible via the "Pins" (Pin) icon in the top navigation.

**2: File Manifest**

**UI/Components:**
- `src/components/PinsPage.jsx`: Page component rendering pinned videos.
- `src/store/pinStore.js`: State management for pinned videos.

**3: The Logic & State Chain**

**Source of Truth:**
- `usePinStore.pinnedVideos`: Array of video objects pinned in memory.

---
#### ### 4.1.8 Settings Page

**1: User-Perspective Description**

Users access the configuration area via the "Config" (Settings icon) button on the main Player Controller orb. The Settings Page provides a tabbed interface for application-wide customization:

- **Appearance Tab**:
  - **Color Palette**:
    - Allows selection of the global visual theme (e.g., Blue, Rose, Amber, etc.).
    - Displays preview cards for each theme.
    - Changes apply immediately to the entire application.
  - **App Banner**:
    - **Presets**: Quick toggles for mock presets (Default, Cosmic, etc.) - "Default" resets to standard.
    - **Custom Upload**: Upload button for App Banner images (supports GIF for native animation).
    - **Preview**: Live preview of the active banner image.
  - **Page Banner**:
    - **Patterns**: Toggles for CSS-based animated patterns (Diagonal, Dots, Mesh, Solid).
    - **Custom Upload**: Button to upload a custom Page Banner texture/image.
    - **Preview**: Shows the currently selected pattern or uploaded image.
  
- **Visualizer Tab**:
  - **Visualizer Style**: Selection grid for visualizer types (currently "Frequency Bars" is implemented).
  - **Visualizer Effects**:
    - **Distance-Based Transparency**: Toggle switch to enable a gradient fade on the visualizer bars. When enabled, bars are solid near the orb and fade to transparent as they extend outward.
  - **Color Mode**: Selection for visualizer coloring (Theme Match, Rainbow, Custom).

- **Signature Tab**:
  - **Pseudonym**: Text input to set the username shown on banners.
  - **Signature**:
    - **Preset ASCII Art**: Grid of predefined ASCII avatars.
    - **Custom ASCII**: Input field to paste custom multi-line ASCII art.
  - **Preview**: Live preview of how the name and avatar will appear on the Page Banner.
  - **External Resources**:
    - **ASCII Art Banner**: A large, interactive banner linking to *EmojiCombos.com* for finding or creating ASCII art. Opens in the user's default browser.

- **Orb Tab**:
  - **Custom Orb Image**:
    - **Upload**: Button to select a local image file for the central orb.
    - **Preview**: Shows the currently selected custom image.
    - **Remove**: Button to clear the custom image and revert to default.
  - **Spill Controls**:
    - **Spill Toggle**: Master switch to enable/disable image overflow (spill).
    - **Quadrant Selection**: An interactive visualizer allows users to click four quadrants (TL, TR, BL, BR) to individually enable/disable spill for that corner.
    - **Visual Feedback**: The visualizer shows the image with a circular mask and highlights selected spill areas using the actual image data.
  - **Image Scaling**:
    - **Zoom Slider**: A range slider (0.5x to 3.0x) allows users to zoom the orb image in/out within the spill boundaries.
  - **External Resources**:
    - **Background Removal Banner**: A large, interactive banner linking to *remove.bg* for easily removing backgrounds from images. This facilitates the creation of "pop-out" 3D effects when used with the Orb's spill functionality. Opens in the user's default browser.
    - **Pro Tip**: A dedicated section explaining how to handle cropped or "zoomed-in" images using generative fill.
      - Includes an example image (`tip.png`).
      - Provides a **copyable prompt** for use with AI generation tools to "zoom out" and extend artwork while maintaining style.

**2: File Manifest**

**UI/Components:**
- `src/components/SettingsPage.jsx`: Main settings container and tabs.
- `src/store/configStore.js`: centralized state for all settings.

**State Management:**
- `src/store/configStore.js`:
  - `currentThemeId`: Active theme ID.
  - `userName`: User's display name.
  - `userAvatar`: User's ASCII avatar string.
  - `customOrbImage`: Base64 string of uploaded orb image.
  - `isSpillEnabled`: Boolean master toggle for orb spill.
  - `orbSpill`: Object `{ tl: bool, tr: bool, bl: bool, br: bool }` for quadrant control.
  - `orbImageScale`: Float (0.5 - 3.0) for image zooming.
  - `visualizerGradient`: Boolean toggle for distance-based transparency.
  - All state is persisted to `localStorage` via Zustand persist middleware.

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Orb Image Upload:**
   - User selects file → `FileReader` reads as Data URL.
   - `setCustomOrbImage(dataUrl)` updates store.
   - Store persists to `localStorage`.
   - `PlayerController` detects change → Updates orb image source.

2. **Spill Configuration:**
   - User toggles quadrant → `setOrbSpill({ ...orbSpill, [q]: !val })` updates store.
   - `PlayerController` detects change → Re-renders SVG `clipPath` with/without specific `<rect>` elements for that quadrant.
   - Image overflows or clips accordingly.

3. **Image Scaling:**
    - User drags slider → `setOrbImageScale(val)` updates store.
    - `PlayerController` applies CSS transform scale to the image element.

---
#### ### 4.1.9 Support Page

**1: User-Perspective Description**

The Support Page acts as a central hub for community engagement, resources, and developer connection. It features a modern **Tabbed Split-View Interface**.

- **Tabbed Interface**:
  - **Default State**: Opens directly to the **Source Code** tab, immediately playing the spinning Github logo animation.
  - **Tabs**: Source Code, Developer, Community, Future Plans, Resources.

- **Active Content Banner**:
  - A large, animated banner displaying the active section's title, subtitle, and description.
  - The background gradient and abstract shapes animate when switching sections.

- **Split View Content**:
  - **Left Side (Dynamic Interaction)**:
    - **Social Sections** (Source Code, Developer, Community): Displays a large, **spinning 3D logo** of the respective platform (Github, X/Twitter, Discord). The animation "spins into place" on activation.
    - **Content Sections** (Future Plans, Resources): Displays a **video preview thumbnail** with a "Featured Content" overlay and play button, maintaining the classic video toggle behavior.
  - **Right Side (AI Showcase)**:
    - Displays a looped promotional GIF (Grok AI) showcasing the project's advanced capabilities.

**2: File Manifest**

**UI/Components:**
- `src/components/SupportPage.jsx`: Main hub component using Framer Motion for animations.
- `src/components/TopNavigation.jsx`: Navigation tab entry.

**State Management:**
- `src/components/SupportPage.jsx` (local state):
  - `activeItem`: Currently selected section (Code, Dev, Community, etc.).
  - `isSocial`: Boolean derived from `activeItem` to toggle between Spinning Logo and Video Preview.

**3: The Logic & State Chain**

**Interactivity Flow:**
1. **Tab Selection**:
   - User clicks a tab (e.g., "Developer").
   - `displayIndex` updates → `activeItem` changes.
   - `AnimatePresence` triggers exit/enter animations for the banner and left-side content.

2. **Dynamic Content Rendering**:
   - Component checks if `activeItem` is a social link (`code`, `twitter`, `discord`).
   - **If Social**: Renders `motion.div` with spinning logo animation (`rotate: -180` to `0`, `scale: 0.5` to `1`).
   - **If Content**: Renders `motion.div` with video thumbnail image.

3. **Navigation**:
   - **Social Links**: Clicking the banner trigger `openUrl()` to external sites.
   - **Internal Content**: Clicking "Future Plans" or "Resources" triggers `navigateToPlaylist()`, switching the view to the `VideosPage` with the target playlist loaded.
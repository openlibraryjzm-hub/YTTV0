###1: Advanced Player Controller

The Advanced Player Controller is a comprehensive UI component positioned at the top of the application layout. It provides centralized control for playlist navigation, video playback, folder management, and preview functionality through an orb-based design with surrounding menu rectangles.

**Related Documentation:**
- **App Banner**: See `app-banner.md` for the banner background that the Player Controller sits on
- **Navigation Flows**: See `navigation-routing.md` for detailed playlist/video navigation flows, preview navigation, and state preservation
- **State Management**: See `state-management.md` for `playlistStore` (current playlist/video state, preview state) and `pinStore` (pinned videos)
- **Video Player**: See `videoplayer.md` for YouTube player integration and progress tracking
- **Folder System**: See `playlist&tab.md` Section 2.2 for folder assignment details

---

#### ### 1.1 Central Orb

**Note**: For comprehensive documentation about the App Banner that the Player Controller sits on, see `app-banner.md`.

**1: User-Perspective Description**

The Central Orb is a circular element (154px diameter by default) positioned at the center of the PlayerController. Users see:
- **Audio Visualizer Border**: The static blue border has been removed. The Audio Visualizer now acts as the dynamic, reactive border for the orb, starting exactly where the image ends (Radius 77px).
- **Window Controls**: Custom Minimize/Maximize/Close buttons interactively float in the top-right corner of the banner area.
- **Orb Image**: Displays the current video's thumbnail by default, or a custom uploaded image if set. Supports **Orb Group Overrides**: If the current playlist is assigned to an Orb Group, the central orb image (and its scale/offset) will be overridden by a random image from that group or its leader. The image is clipped to a circular shape with optional "spill" effects.
- **Upload Button**: On hover, an upload icon appears at the top of the orb (12 o'clock position). Clicking opens a file picker to upload a custom image. The uploaded image is immediately displayed and persisted to localStorage.
- **Orb Buttons**: Eight buttons appear around the orb on hover, positioned in a radial pattern:
  - **Editor** (Scissors icon) - [Placeholder] Reserved for future direct pixel-editing/masking tools.
  - **Search** (Search icon) - Currently no action
  - **Menu** (Menu icon) - Currently no action
  - **Spill** (Maximize2 icon) - Toggles spill/clipping mode
  - **Channel** (Youtube icon) - Currently no action
  - **Config** (Settings icon) - [Functional] Opens the full Settings Page, which includes the **Orb Tab** for advanced customization (Image, Spill, Scale).
  - **History** (Clock icon) - Navigates to History page
  - **Clipping** (Circle/Minimize2 icon) - Toggles spill/clipping mode (same as Spill)
  - **Likes** (Heart icon) - Navigates to Likes page (Icon updated)
  - **Support** (Cat icon) - Navigates to Support page (Icon updated)
- **Spill Toggle**: When enabled, the orb image can extend beyond the circular boundary. Users can configure which quadrants allow spill via the **Settings Page > Orb** tab. The spill state is persisted to localStorage (`isSpillEnabled`).
- **Config Panel & Orb Settings**: When Config button is clicked, users are navigated to the Settings Page.
  - **Orb Tab**: A comprehensive configuration suite for the central element:
    - **Saved Orb Presets**: Save and manage multiple orb configurations (image + settings) as presets for instant switching.
    - **Image Upload**: Upload custom images (png, jpg, gif) which are automatically resized and compressed for performance.
    - **Spill Control**: An interactive 4-quadrant toggle system allows users to selectively enable/disable image spill for the Top-Left, Top-Right, Bottom-Left, and Bottom-Right corners.
    - **Image Scaling**: A slider control (0.5x to 3.0x) allows precise zooming of the orb image within the spill boundaries.
    - **Image Position**: X/Y offset sliders (-100 to +100 px) allow precise panning of the orb image.
    - **Visualizer Integration**: The spill effect works in tandem with the audio visualizer border.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1408-1450): Orb rendering, image display, upload button, orb buttons, spill/clipping logic
- `src/components/SettingsPage.jsx`: Configuration page for application themes (accessed via Config button)

**State Management:**
- `src/components/PlayerController.jsx` (local state):
  - `isEditMode` (line 241): Controls config panel visibility
  - `isAdjustingImage` (line 245): Visual indicator when image is being adjusted
- `src/store/configStore.js`:
  - `customOrbImage`: Base64 image data, persisted to localStorage
  - `isSpillEnabled`: Boolean, persisted to localStorage
  - `orbSpill`: Object with `{ tl, tr, bl, br }` boolean flags for quadrant spill, persisted to localStorage
  - `orbImageScale`, `orbImageScaleW`, `orbImageScaleH`: Float (0.5 - 3.0), controls image zoom level, persisted to localStorage
  - `orbImageXOffset`, `orbImageYOffset`: Integers (-100 to 100), control image panning via Settings Page > Orb tab, persisted to localStorage
  - `orbFavorites`: Array of saved orb preset objects (image + all settings), persisted to localStorage

**API/Bridge:**
- No Tauri commands - all state is client-side

**Backend:**
- No database tables - uses localStorage only

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Image Upload Flow:**
   - User hovers over orb → Upload button appears (opacity transition)
   - User clicks upload button → `fileInputRef.current.click()` triggers file picker
   - User selects image → `handleImageUpload` (line 1117) reads file via FileReader
   - FileReader converts to base64 → `setCustomOrbImage(imageDataUrl)` updates state
   - `useEffect` (line 260) watches `customOrbImage` → Saves to `localStorage.setItem('customOrbImage', imageDataUrl)`
   - On component mount, `useEffect` (line 248) loads from localStorage → `setCustomOrbImage(savedOrbImage)`

2. **Spill Toggle Flow:**
   - User clicks Spill/Clipping button → `setIsSpillEnabled(!isSpillEnabled)` (line 1294)
   - `useEffect` (line 1209) watches `isSpillEnabled` → Saves to `localStorage.setItem('isSpillEnabled', isSpillEnabled.toString())`
   - On mount, `useEffect` (line 1197) loads from localStorage → `setIsSpillEnabled(savedSpillState === 'true')`
   - Spill state controls CSS `clipPath` application (line 1309-1312) - when enabled, allows image to extend beyond circle

3. **Image Display Logic:**
   - Source priority: `Effective Orb` (Orb Group Override) → `customOrbImage` (Global Config) → `playlistImage` (current video thumbnail) → fallback placeholder
   - **Override Logic**: If current playlist matches a saved Orb Group favorite (via `playlistIds`), a random image is selected from that group (seeded by playlist ID so it remains consistent per playlist).
   - Image rendered with `clipPath: 'url(#orbClipPath)'` (line 1415) which applies circular clipping + spill quadrants
   - When spill enabled: Image scales by `orbSize * displayScale * orbImageScaleW/H` and translates by offsets. NOTE: Saved Orb Favorites store scale as a multiplier (e.g. 1.0), while some legacy parts might use percentages. The PlayerController normalizes this to treat stored values as multipliers.
   - When spill disabled: Image uses `objectFit: 'cover'` at 100% size

**Source of Truth:**
- `customOrbImage` state in PlayerController component (local state, persisted to localStorage)
- `isSpillEnabled` state in PlayerController component (local state, persisted to localStorage)
- `spillMap` state controls which quadrants allow spill (not persisted, resets on reload)

**State Dependencies:**
- When `customOrbImage` changes → Orb image source updates → Image re-renders
- When `isSpillEnabled` changes → ClipPath SVG updates → Image clipping behavior changes
- When `orbSpill` changes → ClipPath SVG rect elements update → Specific quadrants allow/disallow spill
- When `orbImageScale*` or `orbImageXOffset/YOffset` change → Image transform style updates → Image position/size changes

---

#### ### 1.2 Global Navigation Bar (TopNavigation)
Located immediately below the Player Controller, the Global Navigation Bar allows switching between main application views (Playlists, Videos, History, etc.).

**Visual Style:**
It mirrors the design language of the Player Controller's Video Menu toolbar:
- **Buttons**: Circular (icon-only for Support, Settings, History, Likes, Pins) or Pill-shaped (text+icon - for Playlists and Videos)
- **Active State**: White background, Sky-500 border, Sky text/icon
- **Inactive State**: White background, Slate-700 border (#334155), Slate icon

#### ### 1.3 Top Video Menu

The Top Video Menu is the right rectangle in the PlayerController, displaying video information (Title, Author, View Count) and controls for the currently playing video. Metadata is fetched from the database (populated via YouTube API during import).

**Note:** The action buttons (Star, Shuffle, Pin, Like, Menu) have been shifted right to create a cohesive cluster with the navigation controls. The 3x3 Grid button has been integrated into the navigation cluster.

##### ### 1.3.1 Pins

**1: User-Perspective Description**

Users see a centralized display of pinned videos with support for three pin types: Normal, Priority, and Follower (a modifier).

- **Pin Types:**
  - **Normal Pin**: Blue filled pin icon. Persists until manually removed or video completes.
  - **Priority Pin**: Amber filled pin icon. Displayed prominently in the Top Playlist Menu.
  - **Follower Pin** (modifier): Double-pin icon (2 pins stacked diagonally). Can be applied to normal or priority pins. When video completes, pin automatically transfers to the next video in the playlist - perfect for watching series.

- **Pin Button Interactions:**
  - **Click unpinned video** → Normal pin
  - **Click normal pin** → Normal + Follower modifier (double-pin icon)
  - **Click follower pin** → Normal pin (removes follower)
  - **Hold (>600ms)** → Priority pin
  - **Double-click any pinned** → Unpin completely

- **Follower Pin Behavior:**
  - When a follower-pinned video reaches ≥85% completion, the pin automatically transfers to the next chronological video in the playlist.
  - Priority and follower status are preserved during transfer.
  - Ideal for series: pin episode 1 as a follower, and the pin moves to episode 2, then 3, etc.
  - If video is the last in playlist, pin is simply removed.

- **Display Locations:**
  - Normal pins displayed on the Pins Page grid.
  - Priority pin displayed in the Top Playlist Menu (top-right).
  - Active pin highlighted with ring and scale effect.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx`: Pin button in video menu toolbar, priority pin display
- `src/components/VideoCard.jsx`: Pin button on video cards with click/hold/double-click handling
- `src/components/YouTubePlayer.jsx`: Calls `handleFollowerPinCompletion` on video completion
- `src/components/NativeVideoPlayer.jsx`: Same follower pin handling for native videos
- `src/components/LocalVideoPlayer.jsx`: Same follower pin handling for local videos

**State Management:**
- `src/store/pinStore.js`: Global pin state (persisted to localStorage)
  - `pinnedVideos`: Array of video objects with `pinnedAt` timestamp
  - `priorityPinIds`: Array of priority pin IDs
  - `followerPinIds`: Array of follower pin IDs (modifier, can combine with normal/priority)
  - `togglePin(video)`: Cycles unpinned → normal → follower → normal
  - `togglePriorityPin(video)`: Sets as priority (idempotent)
  - `isPinned(videoId)`: Checks if normal pin
  - `isPriorityPin(videoId)`: Checks if priority pin
  - `isFollowerPin(videoId)`: Checks if follower modifier is active
  - `removePin(videoId)`: Removes pin completely
  - `handleFollowerPinCompletion(videoId, playlistItems)`: Handles follower pin transfer
  - `clearAllPins()`: Clears all pin state
- `src/components/PlayerController.jsx` (local state):
  - `lastPinClickTimeRef`: Ref for double-click detection
  - `pinLongPressTimerRef`: Ref for hold detection
- `src/components/VideoCard.jsx` (local state):
  - `lastClickTimeRef`: Ref for double-click detection
  - `pinLongPressTimerRef`: Ref for hold detection

**API/Bridge:**
- No Tauri commands - pins stored in localStorage

**Backend:**
- No database tables - pins persisted to localStorage (`pin-storage`)

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Pin a Video (Click on unpinned):**
   - User clicks pin icon → `togglePin(video)` called
   - Video added to `pinnedVideos` with timestamp
   - Pin icon shows filled blue pin

2. **Add Follower Modifier (Click on normal/priority pin):**
   - User clicks pin icon on already-pinned video → `togglePin(video)` called
   - Video added to `followerPinIds`
   - Pin icon changes to double-pin (2 pins stacked diagonally)

3. **Remove Follower Modifier (Click on follower pin):**
   - User clicks pin icon on follower pin → `togglePin(video)` called
   - Video removed from `followerPinIds`
   - Pin icon returns to single pin

4. **Set Priority Pin (Hold >600ms):**
   - User holds pin icon → `pinLongPressTimerRef` triggers after 600ms
   - `togglePriorityPin(video)` called → Video added to `priorityPinIds`
   - Pin icon shows filled amber pin

5. **Unpin Completely (Double-click):**
   - User double-clicks pin icon → `removePin(video.id)` called
   - Video removed from `pinnedVideos`, `priorityPinIds`, and `followerPinIds`
   - Pin icon returns to unfilled state

6. **Follower Pin Transfer (on video completion):**
   - Video progress saved → `saveVideoProgress()` checks if ≥85%
   - If complete, calls `handleFollowerPinCompletion(videoId, playlistItems)`
   - If follower pin: finds next video in playlist, transfers pin with all modifiers
   - If not follower or last video: removes pin normally
   - Console logs: `[FollowerPin] Transferred pin from "Video A" to "Video B"`

**Source of Truth:**
- `pinStore.pinnedVideos` - Array of pinned video objects (persisted)
- `pinStore.priorityPinIds` - Array of priority pin IDs (persisted)
- `pinStore.followerPinIds` - Array of follower pin IDs (persisted)

**State Dependencies:**
- When `pinnedVideos` changes → Pin icons update, PinsPage re-renders
- When `priorityPinIds` changes → Priority pin styling updates (amber color)
- When `followerPinIds` changes → Double-pin icon appears
- When video completes → Follower transfer or unpin triggered

---

##### ### 1.3.2 Navigation & Action Controls

**1: User-Perspective Description**

Users see a bottom toolbar in the video menu rectangle with distinct, grouped action buttons:

- **Navigation Controls (Left-Aligned Cluster)**:
  - **Previous Video** (chevron left): Navigates to previous video (-148px offset).
  - **Grid Button** (center): Opens the Videos page grid view. Icon: **3x3 Grid of Dots** (dice face pattern). Positioned between chevrons (-120px offset).
    - **Left-Click**: Opens the Videos page grid view.
    - **Right-Click**: Navigates to the History Page. *Auto-switches to Half View if in Full View.*
  - **Next Video** (chevron right): Navigates to next video (-92px offset).
  - **Play Button (Folder Cycle)** (right of next): A centralized play/pause/reset control (-60px offset).
    - **Logic**: Cycles through colored folders within the playlist that actually contain videos.
      - **Left-Click**: Cycles forward (All -> Red -> Orange ...).
      - **Right-Click**: Cycles backward (All -> Pink -> Purple ...).
      - **Double Right-Click**: Resets to "All Videos".
    - **Visuals**:
      - **"All Videos" State**: White background, dark slate border (matches Shuffle), filled slate icon. Represents viewing the full playlist.
      - **"Colored Folder" State**: White background, colored border, colored icon. Matches the Shuffle button style. Represents the filtered folder view.
    - **Auto-Play**: If switching the filter causes the currently playing video to be hidden (not in the nex folder), it automatically starts playing the first video of the new view.

- **Action Controls (Center-Right Spread)**:
  - **Star Button** (-19px offset): A circular button with star icon for folder assignment.
    - **Filled star with colored border** = video belongs to that folder color
    - **Empty/outline** = video not in folder (Slate border #334155, Slate icon #475569)
    - **Left-click**: Assigns/unassigns video to quick assign folder
    - **Right-click**: Aligns Play button filter to Star's color (filters playlist to show only videos in the same folder as current video)
  - **Shuffle Button** (22px offset): A circular button with shuffle icon.
    - **Slate/Dark border** = shuffle from all videos
    - **Colored border** = shuffle from that folder color
    - Right-click opens color picker to set quick shuffle default
    - Left-click shuffles to random video from selected folder (or all videos)
  - **Priority Pin Button** (63px offset): A multi-function pin button.
    - **Actions**:
      - **Short Click**: Toggles **Normal Pin** (Black border, Blue filled icon).
      - **Long Click (>600ms)**: Sets **Priority Pin** (Amber border, Amber filled icon).
      - **Right-Click**: Navigates to the Pins Page. *Auto-switches to Half View if in Full View.*
    - **Visuals**:
      - **Inactive**: White background, slate border, slate hollow icon. Matches Shuffle/Play button default style.
      - **Normal Pin**: White background, black border (#000000), blue filled icon (#3b82f6).
      - **Priority Pin**: White background, amber border (#fbbf24), amber filled icon.
  - **Like Button** (104px offset): A circular button with thumbs-up icon.
    - **Filled with blue** = video is liked (in "Likes" playlist)
    - **Empty/outline** = video not liked (Slate border #334155, Slate icon #475569)
    - **Left-click** toggles like status.
    - **Right-click** navigates to the Likes Page. *Auto-switches to Half View if in Full View.*
  - **Info / Tooltip Button** (145px offset): A circular button with "info" icon.
    - **Click**: Toggles a popup Help Menu showing controls for Play, Pin, Like, Star buttons.
    - **Visuals**: Standard white circle with slate icon (#334155 border, #475569 icon).

- **Menu Controls (Far Right)**
  - **More Menu Button** (280px offset - far right): A circular button with 3 horizontal dots icon, providing access to UI visibility toggles:
    - **Hide/Show Preview Menus**: Toggles visibility of side navigation menus.
    - **Hide/Show Dev Toolbar**: Toggles visibility of floating development toolbar.

- **(Removed)** Tab Button: The toggle list/tab button has been removed from this menu.
- **(Removed)** Mode Switcher Button: The disabled "1" toggle button has been removed from the UI.

**Color Picker Modal**: When shuffle button is right-clicked, a modal appears showing:
- 16 colored circles (one per folder color) + "All" option
- Current selection highlighted with thicker black border
- Hover shows color name
- Left-click on color: Shuffles from that folder
- Right-click on color: Sets as default quick shuffle color
- Close button (X) in top-right

**Note**: Star button right-click no longer opens a color picker. Instead, it aligns the Play button's folder filter to the Star's displayed color.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1492-1639): Video menu toolbar, buttons, color picker modal
- `src/components/PlayerController.jsx` (lines 1008-1115): Star, shuffle, and like click handlers, color picker logic
- `src/components/PlayerController.jsx` (lines 1111-1117): Priority pin click handler (`handleFirstPinClick`)
- `src/components/PlayerController.jsx` (lines 1705-1714): Priority pin button rendering

**State Management:**
- `src/components/PlayerController.jsx` (local state):
  - `quickAssignColor` (line 234): Folder color ID for star button, persisted to localStorage
  - `quickShuffleColor` (line 237): Folder color ID or 'all' for shuffle button, persisted to localStorage
  - `currentVideoFolders` (line 235): Array of folder colors assigned to current video
  - `isVideoLiked` (line 240): Boolean indicating if current video is liked
  - `likesPlaylistId` (line 239): ID of special "Likes" playlist
  - `showColorPicker` (line 231): 'star' | 'shuffle' | null - controls color picker visibility
  - `hoveredColorName` (line 232): Color name shown on hover
- `src/store/pinStore.js`:
  - `setFirstPin(video)`: Sets video as priority pin
  - `isPriorityPin(videoId)`: Checks if video is priority pin
- `src/store/folderStore.js`: Folder assignment state (not used directly here, but related)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `assignVideoToFolder(playlistId, itemId, folderColor)` - Assigns video to folder
  - `unassignVideoFromFolder(playlistId, itemId, folderColor)` - Removes folder assignment
  - `getVideoFolderAssignments(playlistId, itemId)` - Gets video's folder assignments
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in a folder (for shuffle)
  - `checkIfVideoInPlaylist(playlistId, videoId)` - Checks if video is in playlist (for likes)
  - `addVideoToPlaylist(playlistId, videoUrl, videoId, title, thumbnailUrl)` - Adds video to playlist
  - `removeVideoFromPlaylist(playlistId, itemId)` - Removes video from playlist
  - `getPlaylistItems(playlistId)` - Gets all videos in playlist
  - `createPlaylist(name, description)` - Creates new playlist

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `video_folder_assignments`: Stores folder assignments (playlist_id, item_id, folder_color)
  - `playlist_items`: Stores videos in playlists
  - `playlists`: Stores playlist metadata

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Star Button (Folder Assignment) Flow:**
   - User left-clicks star → `handleStarClick()` (line 1009)
   - Gets `currentVideo` and `currentPlaylistId` → Calls `getVideoFolderAssignments` to check current folders
   - If video already assigned to `quickAssignColor` → Calls `unassignVideoFromFolder` → Updates `currentVideoFolders` state
   - If video not assigned → Calls `assignVideoToFolder` → Updates `currentVideoFolders` state
   - Star button appearance updates based on `currentVideoFolders` (line 1608-1628)
   - User right-clicks star → `handleStarAlignToPlay()` → Filters playlist to Star's folder color (see flow #6)

2. **Shuffle Button Flow:**
   - User left-clicks shuffle → `handleShuffle()` (line 668)
   - Checks `isModeLeft` to determine active player (main or second)
   - If `quickShuffleColor === 'all'` → Uses all videos from current playlist
   - If `quickShuffleColor` is a folder → Calls `getVideosInFolder(playlistId, quickShuffleColor)`
   - Picks random video from filtered list → Sets video index → Calls `onVideoSelect(video_url)`
   - User right-clicks shuffle → `setShowColorPicker('shuffle')` → Color picker appears with "All" option
   - User selects color → Similar flow to star, but sets `quickShuffleColor` and shuffles from that folder

3. **Priority Pin Button Flow:**
   - User clicks priority pin button → `handleFirstPinClick()` (line 1112)
   - Gets active video (main or second player) → `activeVideoItem || currentVideo`
   - Calls `setFirstPin(targetVideo)` → Updates `pinStore.priorityPinId`
   - If another priority pin exists → It's replaced (only one priority pin at a time)
   - Priority pin appears first in pin track with larger size and amber border

4. **Like Button Flow:**
   - On component mount → `initLikesPlaylist()` (line 362) checks if "Likes" playlist exists
   - If not exists → `createPlaylist('Likes', 'Videos you have liked')` → Stores `likesPlaylistId`
   - On video change → `checkIfLiked()` (line 383) checks if current video is in Likes playlist
   - Calls `getPlaylistItems(likesPlaylistId)` → Searches for matching `video_id` → Sets `isVideoLiked`
   - User clicks like button → `handleLikeClick()` (line 1049)
   - If video is liked → Finds item in Likes playlist → `removeVideoFromPlaylist(likesPlaylistId, itemId)`
   - If video not liked → `addVideoToPlaylist(likesPlaylistId, videoUrl, videoId, title, thumbnailUrl)`
   - Updates `isVideoLiked` state → Button appearance updates (line 1636)

5. **Quick Assign/Shuffle Color Persistence:**
   - On mount → `useEffect` (lines 271, 292) loads from localStorage → `setQuickAssignColor(saved)`, `setQuickShuffleColor(saved)`
   - On change → `useEffect` (lines 283, 304) saves to localStorage → `localStorage.setItem('quickAssignColor', quickAssignColor)`

6. **Star-to-Play Color Alignment Flow:**
   - User right-clicks Star button → `handleStarAlignToPlay()` is called
   - Gets the Star's displayed color (video's folder assignment): `currentVideoFolders[0]`
   - If video is not in any folder, does nothing
   - If video is in a folder: Calls `getVideosInFolder(currentPlaylistId, folderColor)` → `setPlaylistItems(...)` with folder filter
   - If current video is not in new view, auto-plays first video

**Source of Truth:**
- `quickAssignColor` / `quickShuffleColor`: PlayerController local state (persisted to localStorage)
- `currentVideoFolders`: PlayerController local state (refreshed from API on video change)
- `isVideoLiked`: PlayerController local state (refreshed from API on video change)
- Database: `video_folder_assignments` table (folder assignments), `playlist_items` table (likes playlist, video metadata: author, view_count)

**State Dependencies:**
- When `currentVideo` changes → `useEffect` (line 344) loads folder assignments → `setCurrentVideoFolders(folders)` → Star button appearance updates
- When `currentVideo` changes → `useEffect` (line 383) checks like status → `setIsVideoLiked(isLiked)` → Like button appearance updates
- When `quickAssignColor` changes → Star button outline color updates (line 1610)
- When `quickShuffleColor` changes → Shuffle button border color updates (line 1580-1582)
- When folder assignment changes → `currentVideoFolders` updates → Star button switches between filled/empty

---

#### ### 1.4 Top Playlist Menu

**1: User-Perspective Description**

The Top Playlist Menu is the left rectangle in the PlayerController. It has been significantly refined for compactness and accessibility:

*   **Display**: Shows the current playlist's title, centered within the menu. If the video belongs to a colored folder, a colored badge displaying the folder name appears below the title.
*   **Bottom Control Bar**: Divided into two distinct zones:
    *   **Left Side (Metadata)**: Displays the current video's author, view count, and published year with a dynamic layout system:
      - **Short Author Names (≤18 characters)**: Shows all metadata separately: `Author | Views | Year`
      - **Long Author Names (>18 characters)**: Merges view count and publish year into a single position that cycles between them every 12 seconds with smooth fade in/out animations (1200ms transition duration). Format: `Author | [Cycling Views/Year]`
      - The author always remains visible on the left, while the view count and publish year are positioned on the far right
    *   **Right Side (Controls)**: Contains only the Navigation buttons (Previous, Grid, Next). The Tab and Shuffle buttons have been moved or removed.
*   **Playlist Title Interaction**:
    *   **Left-Click**: Opens the playlists grid view
    *   **Right-Click (Mega Shuffle)**: **[NON-FUNCTIONAL]** Intended to trigger "mega shuffle" - a double shuffle that picks a random playlist and a random video from that playlist. Currently not working - right-click events are not being captured. See Known Issues section.
*   **Priority Pin Display**: The **Priority Pin** (if set) is displayed at the **top-right** of the menu.
*   **Spacing**: The gap between this menu, the central orb, and the video menu (`orbMenuGap`) is 20px.

Users see:
- **Main Display**: The playlist title text, centered and framed. Below it, colored badges appear if the video belongs to a folder.
- **Bottom Bar**: Metadata on the left, Navigation Controls on the right.
- **Priority Pin**: If active, overlaid at top-right.
- **Actions**: Bottom bar with navigation and tool buttons.



- **Preview Navigation Controls**: When in preview mode, commit/revert buttons appear to the left of the rectangle:
  - **Commit Button** (green checkmark): Applies preview changes, actually switches to previewed playlist/video
  - **Revert Button** (red X): Cancels preview, returns to original playlist/video
- **Alt Navigation Buttons**: Vertical buttons to the left of the rectangle:
  - **Up Arrow**: Previous playlist in preview mode (doesn't change actual player)
  - **Down Arrow**: Next playlist in preview mode (doesn't change actual player)

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1322-1404): Playlist menu rectangle, bottom bar controls
- `src/components/PlayerController.jsx` (lines 562-665): Playlist navigation handlers (`handleNextPlaylist`, `handlePreviousPlaylist`)
- `src/components/PlayerController.jsx` (lines 787-834): Tab/preset navigation (`navigateTabs`, `navigatePlaylist`)
- `src/components/PlayerController.jsx` (lines 1000-1006): Header mode toggle (`handleToggleHeader`)
- `src/components/PlayerController.jsx` (lines 1497-1516): Metadata cycling logic (view count/publish year cycling for long author names)
- `src/components/PlayerController.jsx` (lines 1688-1727): Dynamic metadata display (separate vs merged layout based on author name length)
- `src/components/PlayerController.jsx` (lines 791-828): Mega shuffle handler (`handleShufflePlaylist`) - functional but not accessible via right-click

**State Management:**
- `src/store/playlistStore.js`:
  - `navigationItems`: Flat array of playlists and folders for navigation
  - `currentNavigationIndex`: Current position in navigationItems
  - `currentPlaylistId`: ID of currently loaded playlist
  - `currentFolder`: `{ playlist_id, folder_color }` or null if viewing playlist
  - `allPlaylists`: Array of all playlists
  - `nextPlaylist()`, `previousPlaylist()`: Navigation functions
- `src/store/tabStore.js`:
  - `tabs`: Array of tab objects
  - `activeTabId`: Currently active tab ID
  - `setActiveTab(tabId)`: Switches active tab
- `src/store/tabPresetStore.js`:
  - `presets`: Array of preset objects
  - `activePresetId`: Currently active preset ID
  - `setActivePreset(presetId)`: Switches active preset
- `src/components/PlayerController.jsx` (local state):
  - `activeHeaderMode` (line 204): 'info' | 'tabs' | 'presets'
  - `activeLeftPin` (line 203): Currently selected tab/preset ID in header
  - `previewTabImage` (line 201): Preview image for tabs (currently unused)
  - `showViewCount` (line 284): Boolean - toggles between view count and publish year in merged cycling view
  - `metadataOpacity` (line 285): Number (0-1) - controls fade animation opacity for cycling metadata
  - `playlistTitleRef` (line 81): Ref to playlist title h1 element for event handling

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getAllPlaylists()` - Gets all playlists
  - `getPlaylistItems(playlistId)` - Gets videos in playlist
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos in folder
  - `getAllFoldersWithVideos()` - Gets all folders with video counts
  - `getAllStuckFolders()` - Gets stuck folders

**Backend:**
- `src-tauri/src/commands.rs`: Tauri command handlers
- `src-tauri/src/database.rs`: SQLite operations
- Database tables:
  - `playlists`: Playlist metadata
  - `playlist_items`: Videos in playlists
  - `stuck_folders`: Stuck folder assignments

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Playlist Navigation Flow:**
   - User clicks next/prev playlist buttons → `handleNextPlaylist()` or `handlePreviousPlaylist()` (lines 563, 615)
   - Calls `nextPlaylist()` or `previousPlaylist()` from `playlistStore` → Returns `{ type: 'playlist'|'folder', data: ... }`
   - If type is 'playlist' → `getPlaylistItems(playlist.id)` → `setPlaylistItems(items, playlist.id, null)`
   - If type is 'folder' → `getVideosInFolder(folder.playlist_id, folder.folder_color)` → `setPlaylistItems(items, playlist.id, folderInfo)`
   - Restores last video index from localStorage → `localStorage.getItem('last_video_index_${playlistId}')`
   - Calls `onPlaylistSelect(items, playlistId)` → Updates parent component
   - Calls `onVideoSelect(video_url)` with first/last viewed video

2. **Header Controls Flow:**
   - **Shuffle Playlist**: User clicks top-right shuffle icon → `handleShufflePlaylist()`
     - Picks random playlist from `allPlaylists`
     - Loads items -> `setPlaylistItems`
     - Picks random video -> starts playing
   - **Mega Shuffle (Right-Click on Playlist Title)**: **[NON-FUNCTIONAL]** Intended to trigger `handleShufflePlaylist()` via right-click on playlist title. Right-click events are not being captured despite multiple implementation attempts (React event handlers, addEventListener with capture phase). The function itself works when called programmatically.
   - **Tab Menu**: User clicks top-left list icon -> Currently no action (Placeholder).
   - **(Removed)**: Header Mode Toggle (Info/Tabs/Presets) functionality has been removed.

3. **Dynamic Metadata Display Flow:**
   - On video change → Component calculates if author name is "long" (>18 characters)
   - If long AND both view count and publish year available:
     - Uses merged cycling view: Single position cycles between view count and publish year
     - Every 12 seconds: Fades out (600ms) → Switches content → Fades in (600ms)
     - State: `showViewCount` toggles, `metadataOpacity` controls fade animation
   - If short OR only one metadata available:
     - Uses separate view: Both view count and publish year shown side by side with separators
     - No cycling, both always visible
   - Layout uses `justify-between` for merged view (pushes metadata to right), regular `gap-1` for separate view

3. **Tab/Preset Navigation Flow:**
   - User clicks left/right arrows in tabs/presets mode → `navigateTabs(dir)` (line 787)
   - Finds current tab/preset index in array → Calculates next/prev index with wrap-around
   - Sets `activeLeftPin` to new tab/preset ID
   - If in tabs mode → `setActiveTab(tabId)` → Updates `tabStore.activeTabId` → Saves to localStorage
   - If in presets mode → `setActivePreset(presetId)` → Updates `tabPresetStore.activePresetId` → Saves to localStorage

4. **Navigation Items Loading:**
   - **Initial Load**: On mount, `PlayerController` fetches `getAllPlaylists()` once to initialize the store.
   - **Reactive Build**: The navigation logic is now split into a dedicated `useEffect` that listens to `allPlaylists` from the global store.
   - **Synchronization**:
     - `PlaylistsPage` and `PlaylistList` push data to `playlistStore.setAllPlaylists()` whenever they load or modify playlists.
     - `PlayerController` automatically reacts to these store updates.
     - `buildNavigationItems(playlists, folders)` is called with the *latest* data from the store, ensuring the top navigation menu is always in sync with the playlist grid.
   - **Filtering**:
     - Respects `activeTabId`: Filters playlists to match the current tab.
     - Respects `showColoredFolders`: Interleaves folder items if enabled.
   - Sets `navigationItems` in store → used for next/prev navigation.

**Source of Truth:**
- `playlistStore.navigationItems` - Flat array of playlists and folders (Source of Truth for navigation)
- `playlistStore.currentNavigationIndex` - Current position in navigation array
- `tabStore.activeTabId` - Currently active tab (persisted to localStorage)
- `tabPresetStore.activePresetId` - Currently active preset (persisted to localStorage)

**State Dependencies:**
- When `showColoredFolders` changes → Navigation items reload → Folders added/removed from navigation array
- When `activeTabId` changes → PlaylistsPage filters playlists by tab → Only playlists in active tab shown
- When `activePresetId` changes → Tab preset system loads preset → Applies tab configuration
- When playlist navigation occurs → `currentNavigationIndex` updates → Header title updates to show current playlist/folder name
- **Title Sync**: The playlist title dynamically updates based on `currentPlaylistId` (with robust fallback logic) to ensure it stays in sync even if navigation state lags. **Crucially, it ignores `previewPlaylistId`**, ensuring the top menu always reflects the *active* playback context, not transient browsing.
- When `navigationItems` changes → Next/prev navigation uses new array → Navigation wraps around correctly
- When video changes → Metadata display recalculates author name length → Switches between merged cycling view and separate view
- When `showViewCount` toggles (in merged view) → Metadata content switches between view count and publish year
- When `metadataOpacity` changes → CSS transition animates fade in/out (1200ms duration)

---

#### ### 1.5 Previewer Menus

**1: User-Perspective Description**

Users can preview playlists and videos without interrupting current playback through dedicated preview controls:

- **Playlist Preview Controls** (left side of PlayerController):
  - **Up/Down Arrow Buttons**: Navigate through playlists/folders in preview mode. The previewed playlist name appears in the header, but the actual player doesn't change.
  - **Commit Button** (green checkmark): Appears when preview is active. Clicking commits the preview, actually switching to the previewed playlist and starting playback.
  - **Revert Button** (red X): Appears when preview is active. Clicking cancels the preview, returning to the original playlist.
- **Video Preview Controls** (right side of PlayerController):
  - **Up/Down Arrow Buttons**: Navigate through videos in the current playlist in preview mode. The previewed video title appears, but playback doesn't change.
  - **Commit Button** (green checkmark): Appears when preview is active. Clicking commits the preview, switching to the previewed video.
  - **Revert Button** (red X): Appears when preview is active. Clicking cancels the preview, returning to the original video.
- **Visual Feedback**: When in preview mode, the playlist title and video title in the menus show preview information instead of current playback information. The preview state is indicated by the presence of commit/revert buttons.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 1324-1336): Playlist preview controls (alt nav buttons, commit/revert)
- `src/components/PlayerController.jsx` (lines 1644-1657): Video preview controls (alt nav buttons, commit/revert)
- `src/components/PlayerController.jsx` (lines 836-998): Preview navigation handlers (`handleAltNav`, `handleCommit`, `handleRevert`)

**State Management:**
- `src/store/playlistStore.js`:
  - `previewPlaylistItems`: Array of videos in previewed playlist (null when not previewing)
  - `previewPlaylistId`: ID of previewed playlist (null when not previewing)
  - `previewFolderInfo`: `{ playlist_id, folder_color }` or null (for folder previews)
  - `setPreviewPlaylist(items, playlistId, folderInfo)`: Sets preview state
  - `clearPreview()`: Clears preview state
- `src/components/PlayerController.jsx` (local state):
  - `playlistCheckpoint` (line 223): Original navigation index before preview started
  - `videoCheckpoint` (line 224): Original video index before preview started
  - `previewNavigationIndex` (line 226): Previewed navigation index
  - `previewVideoIndex` (line 227): Previewed video index
  - `previewPlaylistId` (line 228): Local preview playlist ID (merged with store preview)
  - `previewFolderInfo` (line 229): Local preview folder info (merged with store preview)
  - `previewPlaylistItems` (line 230): Local preview playlist items (merged with store preview)

**API/Bridge:**
- `src/api/playlistApi.js`:
  - `getPlaylistItems(playlistId)` - Gets videos for previewed playlist
  - `getVideosInFolder(playlistId, folderColor)` - Gets videos for previewed folder

**Backend:**
- No direct database writes during preview - preview is read-only until commit

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Playlist Preview Flow:**
   - User clicks playlist alt nav up/down → `handleAltNav('up'|'down', 'playlist')` (line 837)
   - If `playlistCheckpoint === null` → Initializes checkpoint: `setPlaylistCheckpoint(currentNavigationIndex)`, `setPreviewNavigationIndex(currentNavigationIndex)`
   - Calculates next/prev index in `navigationItems` array → `setPreviewNavigationIndex(nextIndex)`
   - Gets preview item from `navigationItems[nextIndex]`
   - If item is playlist → `getPlaylistItems(item.data.id)` → `setPreviewPlaylistItems(items)`, `setPreviewPlaylistId(item.data.id)`
   - If item is folder → `getVideosInFolder(item.data.playlist_id, item.data.folder_color)` → Sets preview items and folder info
   - Playlist title in header shows preview playlist name (line 490-498)
   - User clicks commit → `handleCommit('playlist')` (line 910)
   - Loads preview playlist items → `setPlaylistItems(previewPlaylistItems, previewPlaylistId, null)`
   - Updates `currentNavigationIndex` in store to match preview
   - Calls `onPlaylistSelect` and `onVideoSelect` → Actually switches playback
   - Clears all preview state → `setPreviewNavigationIndex(null)`, etc.
   - User clicks revert → `handleRevert('playlist')` (line 893) → Clears all preview state, returns to checkpoint

2. **Video Preview Flow:**
   - User clicks video alt nav up/down → `handleAltNav('up'|'down', 'video')` (line 876)
   - If `videoCheckpoint === null` → Initializes checkpoint: `setVideoCheckpoint(currentIndex)`, `setPreviewVideoIndex(currentIndex)`
   - Calculates next/prev index in `currentPlaylistItems` → `setPreviewVideoIndex(nextIdx)`
   - Video title shows preview video (line 1254-1271 uses `displayVideoItem` which prioritizes preview)
   - User clicks commit → `handleCommit('video')` (line 984)
   - Sets `currentVideoIndex` to `previewVideoIndex` → `setCurrentVideoIndex(previewVideoIndex)`
   - Calls `onVideoSelect(video.video_url)` → Actually switches playback
   - Clears preview state
   - User clicks revert → `handleRevert('video')` (line 903) → Clears preview state

3. **Preview State Merging:**
   - Component uses both local preview state and store preview state (line 403-405)
   - `activePreviewItems = storePreviewItems || previewPlaylistItems` - Store preview takes priority
   - This allows previews to be set from other components (e.g., PlaylistsPage preview button)
   - When store preview is active, local preview is ignored

**Source of Truth:**
- `playlistStore.previewPlaylistItems`, `previewPlaylistId`, `previewFolderInfo` - Store preview state (can be set from external components)
- Local `previewNavigationIndex`, `previewVideoIndex`, etc. - Component preview state (for internal preview navigation)
- `playlistCheckpoint`, `videoCheckpoint` - Original state before preview started

**State Dependencies:**
- When `previewNavigationIndex` changes → `VideosPage` banner updates to show preview playlist name (Top Menu remains locked to active)
- When `previewVideoIndex` changes → Video title updates to show preview video name
- When preview is active → Commit/revert buttons appear → User can commit or cancel
- When preview is committed → `currentPlaylistItems`, `currentVideoIndex` update → Playback actually changes
- When preview is reverted → Preview state cleared → Display returns to original playlist/video

---

#### ### 1.6 2-Player Support on Menus (Faulty)

**1: User-Perspective Description**

[DISABLED] The PlayerController has infrastructure for dual player support, but the mode toggle is currently disabled and locked to player 1 (main player only).

- **Mode Switcher Button**: REMOVED from the UI. The button (previously displaying "1") is no longer visible. Dual player functionality is currently inaccessible via the UI.
- **Player-Specific Info**: Always shows main player's video info (mode 2 functionality hidden).
- **Player-Specific Controls**: All video controls (next/prev, shuffle, star, like) always route to the main player.

**2: File Manifest**

**UI/Components:**
- `src/components/PlayerController.jsx` (lines 98, 407-477): Dual player mode detection and video info selection (disabled, always uses main player)
- `src/components/PlayerController.jsx` (lines 512-560): Video navigation handlers (always routes to main player)
- `src/components/PlayerController.jsx` (lines 667-726): Shuffle handler (always routes to main player)
- `src/components/PlayerController.jsx` (lines 1662): Mode switcher button rendering (disabled, locked to "1")

**State Management:**
- `src/components/PlayerController.jsx` (props):
  - `activePlayer`: 1 (main) or 2 (second) - passed from parent
  - `onActivePlayerChange`: Callback to update active player in parent
  - `secondPlayerVideoUrl`: Current video URL for second player
  - `secondPlayerVideoIndex`: Index of current video in second player's playlist
  - `secondPlayerPlaylistId`: ID of playlist containing second player's video
  - `secondPlayerPlaylistItems`: Array of videos in second player's playlist
- `src/components/PlayerController.jsx` (local state):
  - `isModeLeft` (line 205): Boolean - true for player 1, false for player 2
  - Synced with `activePlayer` prop (line 208-212)

**API/Bridge:**
- No additional API calls - uses existing playlist/video APIs

**Backend:**
- No additional database tables

**3: The Logic & State Chain**

**Trigger → Action → Persistence Flow:**

1. **Mode Toggle Flow (DISABLED):**
   - Mode switcher button is disabled and cannot be clicked
   - Button always shows "1" and is locked to main player
   - All player functionality routes to main player only

2. **Video Info Selection (Faulty):**
   - Logic attempts to determine active video based on `hasSecondPlayerVideo` (line 410)
   - `hasSecondPlayerVideo = !isModeLeft && secondPlayerVideoUrl` - Checks mode 2 and video exists
   - Attempts to find video in `secondPlayerPlaylistItems` or falls back to `currentPlaylistItems`
   - **Issue**: May not correctly identify second player's video if playlist items aren't loaded
   - **Issue**: Fallback logic may show main player info when it should show second player info

3. **Control Routing (Faulty):**
   - All handlers check `isModeLeft` to route to appropriate player
   - `handleNextVideo()` (line 512): Routes to `nextVideo()` for player 1, or `onSecondPlayerVideoIndexChange` for player 2
   - `handleShuffle()` (line 668): Uses `secondPlayerPlaylistItems` when in mode 2
   - **Issue**: Routing may not correctly maintain second player's playlist context
   - **Issue**: Second player navigation may affect main player state

**Source of Truth:**
- `activePlayer` prop from parent (`App.jsx`) - Controls which player is active
- `secondPlayerVideoUrl`, `secondPlayerPlaylistId`, `secondPlayerPlaylistItems` props - Second player state from parent
- Local `isModeLeft` state - Synced with `activePlayer` prop

**State Dependencies:**
- When `activePlayer` changes → `isModeLeft` updates → Video info display switches
- When `secondPlayerVideoUrl` changes → `hasSecondPlayerVideo` recalculates → Video info may update
- When `secondPlayerPlaylistItems` changes → Video lookup uses new array → Video info may update
- **Known Issues**: State dependencies may not trigger correctly, causing incorrect video info display

### 1.7 Video Card Actions
**Note**: This section describes the actions available on the Video Card component, specifically the 3-dot menu and quick-assign star.
- **3-Dot Menu**: Located in the content area, aligned to the right of the video title. Always visible.
- **Quick-Assign Star**: Located on the top-right of the video thumbnail. Visible only on hover. Toggles the "quick assign" folder color.

### 1.8 Dev Toolbar
The Dev Toolbar is a floating control bar (positioned absolute top-left or similar) that provides quick access to layout and debug tools. Its visibility is controlled via the "More Options" menu in the PlayerController.

**Controls:**
- **View Modes**: Full, Half, Quarter buttons to switch layout modes.
- **Menu Q**: Toggles "Menu Quarter" mode (side menu docked to bottom right).
- **Debug**: Toggles visual debug bounds (blue outlines).
- **Inspect**: Toggles inspect mode (colored overlays on hover).
- **Ruler**: Toggles visual ruler overlay.
- **Menu**: Toggles the Radial Menu visibility.
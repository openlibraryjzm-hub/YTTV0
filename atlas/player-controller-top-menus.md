# Top Player Menus (Video & Playlist)

The Top Video Menu and Top Playlist Menu form the right and left control clusters of the `PlayerController`. They provide centralized control for playlist navigation, video playback, folder management, and preview functionality.

**Related Documentation:**
- **Central Orb**: See `player-controller-orb-menu.md`.
- **Navigation Flows**: See `navigation-routing.md`.
- **Video Player**: See `videoplayer.md`.

---

## 1. Split-Screen Stacked Layout Architecture

When the application is in Half or Quarter Split-Screen View, the `PlayerController` uses a responsive **CSS Grid** architecture:
- The Central Orb anchors the left side spanning two rows.
- The **Top Video Menu** and **Top Playlist Menu** neatly stack on the right side.
- Both menus slightly scale down (`scale-90`) with calculated negative margins to compress intelligently into a combined `204px` natural flex height, flawlessly fitting into the `200px` App Banner area without visual overflow.
- **See-Through Styling**: Both use a transparent background (`bg-transparent`) and no borders, allowing the App Banner to seamlessly show through. A shadow (`shadow-2xl`) defines their rounded shape.

## 2. Top Playlist Menu (Left)

Displays the current playlist's title, centered with contextual badges below it:
- **Group Carousel (Violet)**: Shows the current group carousel name, restricting navigation bounds.
- **Active Preset (Indigo) / Tab (Sky)**: Indicates currently overarching filter/preset.
- **Folder (Colored)**: Displays active folder name.

### Interactions
- **Bottom Control Bar**: Contains only Navigation buttons (Previous playlist, Grid, Next playlist). Minimalistic design devoid of metadata.
- **Title Click**: Opens the playlists grid view.
- **Priority Pin Display**: Overlaid at top-right if a priority pin is active.

## 3. Top Video Menu (Right)

Displays video information (Title) and core playback controls.

### Navigation Controls (Left-Aligned Cluster)
- **Previous/Next Video** (Chevron Left/Right).
- **Grid Button**: Left-click for Videos grid; Right-click for History page.
- **Play Button (Folder Cycle)**: Cycles through colored folders within the playlist. 
  - Left-Click cycles forward, Right-Click backward. Double Right-Click resets to "All Videos".
  - Auto-plays the first video of a new folder if current is hidden.

### Action Controls (Center-Right Spread)
- **Star Button**: Folder assignment control. Left-click assigns/unassigns to quick folder. Right-click aligns the Play button's filter to the Star's current assigned color.
- **Shuffle Button**: Left-click to shuffle from current folder/all videos. Right-click opens the 16-color picker modal to set the default shuffle pool.
- **Like Button**: Left-click to toggle like. Right-click to navigate to Likes Page.
- **Info Button**: Toggles popup Help Menu for controls.
- **Priority Pin Button**: 
  - Short Click toggles Normal Pin (Blue).
  - Long Click (>600ms) toggles Priority Pin (Amber).
  - Right-Click navigates to Pins Page.

### Pin Systems & Modifiers
- **Normal Pin**: General persistence.
- **Priority Pin**: Displays prominently.
- **Follower Pin** (Modifier - Double-pin icon): Applied by clicking an existing pin. Automatically transfers the pin to the next chronological video in the playlist when the current video completes (≥85% progress). Ideal for serializing episodes.

## 4. Preview Navigation System

Users can safely preview playlists and videos without interrupting playback via the Alt-Nav UI:
- **Alt Navigation Buttons**: Up/Down arrows appear to the left of the rectangle for preview browsing.
- **Commit Button** (Green Checkmark): Applies the preview, permanently switching playback to the previewed state.
- **Revert Button** (Red X): Cancels the preview, snapping the titles back to the actively playing state.
- **Title Syncing**: Previews temporarily overlay the actual playing title in the UI, ensuring smooth browsing.

## 5. File Manifest

**UI/Components:**
- `src/components/PlayerController.jsx`: Handles all interactive rendering for menus, pins, and previews.

**State Management:**
- `src/store/playlistStore.js`: Playlist items, navigation indexes, and preview state (`previewPlaylistItems`).
- `src/store/pinStore.js`: `pinnedVideos`, `priorityPinIds`, `followerPinIds`.
- `src/store/folderStore.js`: Folder state (`quickAssignFolder`).

**Backend (API/Bridge):**
- `assignVideoToFolder()`, `removeVideoFromPlaylist()`, `addVideoToPlaylist()` APIs.
- Handled through `src-tauri/src/commands.rs`.

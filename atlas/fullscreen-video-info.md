### Fullscreen Video Info

The Fullscreen Video Info panel is a dedicated component that appears in the right margin of the layout when the app is in **fullscreen mode**. It displays metadata for the currently playing video (thumbnail, author, view count, year) and keeps layout logic out of `LayoutShell.jsx`.

**Related Documentation:**
- **Layout**: See `ui-layout.md` for fullscreen grid and fullscreen player width
- **Video Player**: See `videoplayer.md` for main player and progress
- **Player Controller**: See `advanced-player-controller.md` for top-menu video metadata (author, view count, year)
- **State**: See `state-management.md` for `playlistStore` (current playlist items, video index)

---

#### Overview

**1: User-Perspective Description**

When the app is in fullscreen view (no side menu), users see a right-hand margin next to the video player. In that margin:

- **Thumbnail**: Current video thumbnail at the very top (16:9, rounded, shadow). Uses `thumbnail_url` or `thumbnailUrl` from the playlist item.
- **Author**: Channel/author name directly under the thumbnail (small, uppercase, slate). Truncates with full text on hover.
- **View count**: Large numeric view count with a 4-bar icon (varying heights) instead of the word "views". Full number with locale formatting (e.g. `1,234,567`), no K/M/B shortening.
- **Year**: Publication year from `published_at`, displayed very large (e.g. `text-8xl`).

Order top to bottom: thumbnail → author → view count → year. Rows for year or view count are omitted when data is missing (e.g. older imports without that metadata).

**2: File Manifest**

**UI/Components:**
- `src/components/FullscreenVideoInfo.jsx`: Self-contained component; reads `currentPlaylistItems` and `currentVideoIndex` from `playlistStore`, renders only when there is a valid current video.
- `src/LayoutShell.jsx`: Renders `<FullscreenVideoInfo />` when `viewMode === 'full'` and not in debug bounds mode. Does not contain video-info logic.
- `src/LayoutShell.css`: `.layout-shell__fullscreen-video-info` — grid placement (column 2), flex column, padding (e.g. 25px top), no top centering so content starts near the top.

**State Management:**
- `src/store/playlistStore.js`:
  - `currentPlaylistItems`: Array of playlist items for the current playlist (includes `thumbnail_url`/`thumbnailUrl`, `author`, `view_count`, `published_at`, `title`).
  - `currentVideoIndex`: Index of the currently playing video.

**API/Bridge:**
- No Tauri commands — data comes from existing playlist state (populated by normal playback and import flows).

**Backend:**
- Data originates from `playlist_items` (and related) tables; no direct DB access in this component.

**3: Logic & Data**

- **Visibility**: Shown only in fullscreen (`viewMode === 'full'`) and when debug bounds are off. Hidden in half/quarter and debug.
- **Current video**: `video = currentPlaylistItems[currentVideoIndex]` when index is in range; otherwise component returns `null`.
- **View count**: Parsed from `video.view_count` (string or number), formatted with `toLocaleString()`; 4-bar icon is presentational (four vertical bars, varying heights, same color as text).
- **Year**: `published_at` → `new Date(...).getFullYear()`; row not rendered if missing.
- **Thumbnail**: `video.thumbnail_url || video.thumbnailUrl`; thumbnail block not rendered if missing.

**Source of Truth:**
- `playlistStore.currentPlaylistItems` and `playlistStore.currentVideoIndex` — same as main player and Player Controller top menu.

**4: Styling Summary**

- Panel: Flex column, align start, padding (e.g. 25px top, 2rem sides, 1.5rem bottom). Class: `layout-shell__fullscreen-video-info`.
- Thumbnail: `aspect-video`, `object-cover`, `rounded-xl`, `shadow-md`, small margin below.
- Author: `text-sm`, uppercase, slate, truncate.
- View count: Large (e.g. `text-5xl`), number + 4-bar icon (bars: `w-1.5`, rounded, heights e.g. h-3 / h-5 / h-8 / h-4).
- Year: Very large (e.g. `text-8xl`), bold, theme color `#052F4A`.

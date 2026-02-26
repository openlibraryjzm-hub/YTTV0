### Fullscreen Video Info

The Fullscreen Video Info panel is a dedicated component that appears in the right margin of the layout when the app is in **fullscreen mode**. It displays metadata for the currently playing video (thumbnail, author, view count, year, description, tags) and keeps layout logic out of `LayoutShell.jsx`. When the user opens a splitscreen page (e.g. from PlayerController or a tab), the panel can blank instantly before the transition.

**Related Documentation:**
- **Layout**: See `ui-layout.md` for fullscreen grid, fullscreen player width, and fullscreen↔splitscreen transition
- **Video Player**: See `videoplayer.md` for main player and progress
- **Player Controller**: See `advanced-player-controller.md` for top-menu video metadata (author, view count, year)
- **State**: See `state-management.md` for `playlistStore` (current playlist items, video index), `layoutStore` (`fullscreenInfoBlanked`)

---

#### Overview

**1: User-Perspective Description**

When the app is in fullscreen view (no side menu), users see a right-hand margin next to the video player. In that margin (order top to bottom):

- **Thumbnail**: Current video thumbnail at the very top (16:9, rounded, shadow). Uses `thumbnail_url` or `thumbnailUrl` from the playlist item.
- **Author**: Channel/author name directly under the thumbnail (small, uppercase, slate). Truncates with full text on hover.
- **View count**: Large numeric view count with a 4-bar icon (varying heights) instead of the word "views". Full number with locale formatting (e.g. `1,234,567`), no K/M/B shortening.
- **Year**: Publication year from `published_at`, displayed very large (e.g. `text-8xl`).
- **Description**: Video description (when available), truncated to 4 lines with full text on hover via tooltip.
- **Tags**: Up to 12 tags as small pills; if more than 12, a "+N" indicator. Tags are stored in the database as a JSON array string and parsed for display.

**Not displayed** (data may still be in DB): Video length (duration), likes count, comment count. These are intentionally omitted from this panel.

**Instant blank on open splitscreen:** When the user clicks a control that opens the side menu (e.g. a tab or PlayerController button), `layoutStore.fullscreenInfoBlanked` is set to true so the panel content clears immediately; then on the next frame the view switches to half/quarter and the side menu appears. This reduces perceived clutter during the transition.

**2: File Manifest**

**UI/Components:**
- `src/components/FullscreenVideoInfo.jsx`: Self-contained component; reads `currentPlaylistItems` and `currentVideoIndex` from `playlistStore`, `fullscreenInfoBlanked` from `layoutStore`; renders only when there is a valid current video and not blanked.
- `src/LayoutShell.jsx`: Renders the right column with `<FullscreenVideoInfo />` when `viewMode === 'full'` and not in debug bounds mode. Does not contain video-info logic.
- `src/LayoutShell.css`: `.layout-shell__fullscreen-video-info` — grid placement (column 2), flex column, padding (e.g. 25px top), no top centering so content starts near the top.

**State Management:**
- `src/store/playlistStore.js`:
  - `currentPlaylistItems`: Array of playlist items for the current playlist (includes `thumbnail_url`/`thumbnailUrl`, `author`, `view_count`, `published_at`, `title`, `description`, `tags`).
  - `currentVideoIndex`: Index of the currently playing video.
- `src/store/layoutStore.js`:
  - `fullscreenInfoBlanked`: When true, FullscreenVideoInfo renders an empty panel (used when opening splitscreen from fullscreen).
  - `setFullscreenInfoBlanked(v)`: Set by entry points that open the side menu; cleared when returning to full mode.

**API/Bridge:**
- No Tauri commands — data comes from existing playlist state (populated by normal playback and import flows).

**Backend:**
- Data originates from `playlist_items` (and related) tables; no direct DB access in this component.

**3: Logic & Data**

- **Visibility**: Shown only in fullscreen (`viewMode === 'full'`) and when debug bounds are off. Hidden in half/quarter and debug. When `fullscreenInfoBlanked` is true, the panel wrapper is still rendered but content is empty.
- **Current video**: `video = currentPlaylistItems[currentVideoIndex]` when index is in range; otherwise component returns `null`.
- **View count**: Parsed from `video.view_count` (string or number), formatted with `toLocaleString()`; 4-bar icon is presentational (four vertical bars, varying heights, same color as text).
- **Year**: `published_at` → `new Date(...).getFullYear()`; row not rendered if missing.
- **Thumbnail**: `video.thumbnail_url || video.thumbnailUrl`; thumbnail block not rendered if missing.
- **Description**: `video.description`; trimmed and only shown when non-empty; truncated with `line-clamp-4`, full text in `title` attribute for hover.
- **Tags**: `video.tags` is a JSON array string; parsed with `JSON.parse` (safe fallback to empty array); up to 12 tags shown as pills, remainder as "+N".

**Source of Truth:**
- `playlistStore.currentPlaylistItems` and `playlistStore.currentVideoIndex` — same as main player and Player Controller top menu.

**4: Styling Summary**

- Panel: Flex column, align start, padding (e.g. 25px top, 2rem sides, 1.5rem bottom). Class: `layout-shell__fullscreen-video-info`.
- Thumbnail: `aspect-video`, `object-cover`, `rounded-xl`, `shadow-md`, small margin below.
- Author: `text-sm`, uppercase, slate, truncate.
- View count: Large (e.g. `text-5xl`), number + 4-bar icon (bars: `w-1.5`, rounded, heights e.g. h-3 / h-5 / h-8 / h-4).
- Year: Very large (e.g. `text-8xl`), bold, theme color `#052F4A`.
- Description: `text-sm`, `text-slate-600`, `line-clamp-4`, `break-words`.
- Tags: Pills with `px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-medium`; wrap with `flex flex-wrap gap-1.5`.

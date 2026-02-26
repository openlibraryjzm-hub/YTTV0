# PlaylistBar – Playlists Page Sticky Toolbar

This document describes the **Playlists page sticky toolbar** (`PlaylistBar.jsx`): the bar that sits at the top of the Playlists page content and combines **VideoSortFilters**, **Add/Refresh/Bulk tag** buttons, the **folder prism** for colored-folder (group carousel) selection, and **Back/Close** on the right. The prism drives which view is shown: All playlists grid, Unsorted grid, or a single group carousel by folder color.

---

## 1. Overview

**Location**: Rendered inside `PlaylistsPage.jsx` at the top of the page content. The bar is **sticky** (`sticky top-0`); when the user scrolls down, it sticks to the viewport and gains stronger backdrop/blur and border for visibility.

**Layout (left to right)**:

1. **VideoSortFilters** – Same component as on the Videos page: Home (default order), Funnel (sort + rating filter). Sort/rating state is local to PlaylistBar; filter UI is shared.
2. **Action buttons** – Add (opens playlist uploader via `onAddClick`), Refresh (Videos-page only; placeholder), Bulk tag (Videos-page only; placeholder). Same row, right of the filter.
3. **Folder prism** – Fills the remaining width. Segments: **All** (white), **Unsorted** (black, if any playlists are unassigned), and **one segment per folder color that has a group carousel**. Clicking a segment sets the selected folder; PlaylistsPage shows either the full grid (All/Unsorted) or the single carousel for that color.
4. **Right side** – Back (when navigation history or playlist preview exists), Close (fullscreen / close menu via `layoutStore.setViewMode('full')`).

**Data flow**: PlaylistsPage passes `groupColorIds` (array of folder color ids that have a group), `allPlaylistCount`, `unsortedCount`, `selectedFolder`, and `onFolderSelect`. The prism shows only colors that have a group in populated-only mode; right-click toggles to all 16 segments.

---

## 2. Props

| Prop | Type | Description |
|------|------|-------------|
| `onAddClick` | `function` | Called when Add is clicked (e.g. open playlist uploader). |
| `groupColorIds` | `string[]` | Array of `FOLDER_COLORS` ids that have a group carousel. Drives which prism segments appear in populated-only mode. |
| `allPlaylistCount` | `number` | Total playlist count; shown on All segment. |
| `unsortedCount` | `number` | Count of playlists not in any group; Unsorted segment only shown if ≥ 1. |
| `selectedFolder` | `string \| null` | Current selection: `null` = All, `'unsorted'` = Unsorted, or a color id (e.g. `'red'`, `'sky'`). |
| `onFolderSelect` | `function` | `(id: string \| null) => void`. Called when a prism segment is clicked. |

---

## 3. Folder Prism Behavior

### 3.1 Segment source

- **All** – Always first; `id: null`, white background, shows `allPlaylistCount`.
- **Unsorted** – Only if `unsortedCount >= 1`; black segment, shows count of playlists in no group.
- **Colors** – From `FOLDER_COLORS` (`src/utils/folderColors.js`). In **populated-only** mode, only colors whose id is in `groupColorIds` get a segment (each shows count `1`). In **all-segments** mode, all 16 colors are shown; count is `1` if that color has a group, else `0` (and the segment may show nothing when 0).

### 3.2 Right-click toggle

- **Right-click on the prism** toggles `prismOnlyPopulated` (local state).
- **Populated-only (default)**: Only All + Unsorted (if any) + segments for colors that have a group. Equal-width segments.
- **All segments**: All + Unsorted + all 16 colors in `FOLDER_COLORS` order. Same layout; segments with no group show count 0 or empty.

### 3.3 Selection and styling

- Selected segment: ring highlight (`after:ring-2 after:ring-inset`); All uses `after:ring-black/10`, Unsorted `after:ring-white/30`, colors `after:ring-white/50`.
- Segment background: All = white, Unsorted = black, each color = its `hex` from `FOLDER_COLORS`. Text on colored segments uses `text-white/90` and drop-shadow for readability.

---

## 4. Sticky Behavior and Styling

- A **sentinel** div (1px, invisible) above the bar is observed with `IntersectionObserver`. When it leaves the viewport upward (`intersectionRatio < 1` and `boundingClientRect.top < 0`), the bar is considered **stuck**.
- **Not stuck**: Lighter border/blur, transparent background, compact padding.
- **Stuck**: Stronger backdrop blur (`backdrop-blur-xl`), border-y, shadow, `bg-slate-900/70`, slightly taller row (`h-[52px]`).

---

## 5. Dependencies

- **VideoSortFilters** – Same component as Videos page; sort/rating state is local to PlaylistBar (not persisted for Playlists page).
- **FOLDER_COLORS** – `src/utils/folderColors.js` (16 colors: red, orange, amber, … pink). Same as Videos page prism and PlaylistGroupColumn.
- **Stores**: `useNavigationStore` (history, goBack, setCurrentPage), `useLayoutStore` (setViewMode), `usePlaylistStore` (previewPlaylistId, clearPreview) for Back/Close behavior.

---

## 6. Relation to PlaylistsPage and Group Carousels

- **PlaylistsPage** computes `groupColorIds = playlistGroups.map(g => g.folderColorId).filter(Boolean)` from `playlistGroupStore` and passes it to PlaylistBar.
- Selecting a **color segment** sets `selectedPrismFolder` to that color id. PlaylistsPage then uses `getGroupByColorId(selectedPrismFolder)` to get the group and renders a single **GroupPlaylistCarousel** for that group (large carousel when viewing a single folder).
- **All** and **Unsorted** show a 2-column grid of PlaylistCards (all playlists, or only playlists in no group). No carousels in those views.
- Creating a new carousel (e.g. “New carousel” button or assigning a playlist to a colored placeholder in **PlaylistGroupColumn**) adds a group with a `folderColorId`; that color then appears in the prism (in populated-only mode) and can be selected to view that carousel.

---

## 7. File Reference

| Item | Location |
|------|----------|
| Component | `src/components/PlaylistBar.jsx` |
| Prism colors | `src/utils/folderColors.js` |
| Group store | `src/store/playlistGroupStore.js` |
| Parent | `src/components/PlaylistsPage.jsx` |

---

## 8. Cross-references

- **Group carousel system**: `group-carousel.md` (colored folders, store, PlaylistGroupColumn, carousel by color).
- **Videos page toolbar**: `video-sort-filters.md` (VideoSortFilters and folder prism pattern).
- **Folder colors**: `playlist&tab.md`, `folderColors.js`.
- **State**: `state-management.md` (playlistGroupStore, navigationStore, layoutStore, playlistStore).

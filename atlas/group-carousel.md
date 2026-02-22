# Group Carousel System (Playlists Page)

The group carousel system lets users organize playlists into named, horizontal carousel rows on the Playlists page (GROUPS view). Carousels are stored in local state (Zustand + localStorage); no database tables are used. The Playlists **view switcher and actions** (tabs, Info/Folder/Add) live in the **TopNavigation** header when the Playlists page is active, freeing vertical space for carousel content.

**Related:** The **group badge** on the Player Controller’s Top Playlist Menu and **restriction of playlist navigation** (up/down) to the current group are documented in **`group-badge-player-controller.md`**.

---

## 1. User-facing behavior

### 1.1 Playlists page views (TabBar)

The Playlists page has three view modes:

| View    | Description |
|---------|-------------|
| **ALL** | Shows all playlists in a 2-column grid. No carousels. |
| **UNSORTED** | Shows only playlists that are not in any group carousel. No carousels. |
| **GROUPS** | Shows only group carousels: one horizontal carousel per group, with a “New carousel” button at the bottom. No main grid. |

- **ALL** and **UNSORTED** use the same card size and grid layout (`grid-cols-1 md:grid-cols-2 gap-10`).
- **GROUPS** shows each group in a **bounded carousel box** (see below). Each carousel has its **own display mode** (Large / Small / Bar), set via mode buttons on that carousel's top bar; modes can be mixed. TopNavigation provides a one-shot **"apply to all"** (see 1.2).
  - **Large:** Cards use a larger fixed size (`min-w-[380px]`, `w-[min(520px,calc(50vw-2rem))]`), horizontal scroll, full PlaylistCard including 4 mini preview thumbnails. Top bar: standard padding (`px-4 py-2.5`).
  - **Small:** Thumbnail-sized cards (~3 visible); PlaylistCard gets `size="small"` (injected by carousel) and hides the 4 mini preview strip. Card wrapper `min-w-[140px]`, `w-[min(180px,calc(33vw-1rem))]`; gap `gap-4`; scroll area `pt-1 pb-1`; compact top bar (`px-3 py-1`); box `mb-1.5` so carousels sit close together.
  - **Bar:** Thin bar only: Layers icon, title, inline scroll left/right, rename, delete. No thumbnails; hidden scroll strip keeps scroll position. Box `mb-3`, compact bar styling.

### 1.2 Playlists bar (TopNavigation)

When the current page is **Playlists**, the **TopNavigation** mini header (above main content) shows:

- **Apply to all (GROUPS only):** Three buttons left and above the title: Large, Small, Bar. **One-shot commands** – each click sets every carousel's mode via `playlistGroupStore.setAllGroupCarouselModes(mode)`. No persistent override; after applying, mix again with each carousel's own mode buttons.
- **Title:** “Playlists”.
- **Tabs:** `TabBar` (ALL | UNSORTED | GROUPS).
- **Actions:** Info (show/hide video titles on cards), Folder (show/hide colored folders), Add (open playlist uploader).
- **Navigation:** Back (when applicable), Close (full screen / close menu).

This bar is **not** rendered on the Playlists page content area; it lives in the shared header so the content area has more vertical space for carousels and grid.

### 1.3 Creating and managing carousels

- **New carousel (GROUPS view):** “New carousel” button below the last carousel opens a prompt for the name, then creates an empty group. Empty carousels still appear as a bounded box with a placeholder (“No playlists in this carousel”).
- **Per-carousel mode:** Each carousel's **top bar** has three mode buttons (Large / Small / Bar). The active mode is highlighted; clicking sets that carousel's mode only (`playlistGroupStore.groupCarouselModes[groupId]`). New groups default to Large.
- **Rename:** In the carousel **top bar**, a pencil icon opens a rename prompt. Only available when the carousel is rendered with `groupId` and `onRename` (i.e. on GROUPS).
- **Delete:** A trash icon in the top bar opens a confirmation: “Delete carousel “[name]”? Playlists will be unassigned from this carousel but not removed from the app.” Confirming removes the group and unassigns all playlists from it; playlists themselves are not deleted.

### 1.4 Assigning playlists to carousels

- **Assign to group (playlist card 3-dot menu):** Opens the **PlaylistGroupColumn** overlay (full-screen, scrollable list of carousel cards). Clicking a carousel card adds the current playlist to that carousel (or removes it if already in that carousel). Same UX pattern as **PlaylistFolderColumn** (folders).
- **Remove from carousel (playlist card 3-dot menu):** Shown only when the playlist is in at least one carousel. Label is “Remove from carousel” (one) or “Remove from carousels” (multiple). Removes the playlist from every carousel it’s in; playlists are not deleted.

---

## 2. File manifest

| Area | Files |
|------|--------|
| **Components** | `GroupPlaylistCarousel.jsx`, `PlaylistGroupColumn.jsx`, `PlaylistCard.jsx` (menu + remove), `PlaylistsPage.jsx` (views, carousels, column), `TabBar.jsx` (ALL / UNSORTED / GROUPS), `TopNavigation.jsx` (Playlists bar when `currentPage === 'playlists'`) |
| **State** | `playlistGroupStore.js` (Zustand, persisted: groups, groupCarouselModes, activeGroupId; setGroupCarouselMode, setAllGroupCarouselModes), `tabStore.js` (view mode), `layoutStore.js` (playlistsPageShowTitles, showPlaylistUploader for header actions) |
| **Store (view mode)** | `tabStore.js` (activeTabId: `'all' \| 'unsorted' \| 'groups'`) |

---

## 3. Data model and state

### 3.1 playlistGroupStore

- **Storage:** Zustand with `persist` middleware; key `playlist-group-storage` in localStorage.
- **State:** `groups: Array<{ id: string, name: string, playlistIds: number[] }>`, `groupCarouselModes: { [groupId]: 'large' | 'small' | 'bar' }` (defaults to `'large'` when missing), `activeGroupId: string | null`.
- **Actions:**
  - `addGroup(name)` – appends a new group, returns its `id`.
  - `removeGroup(groupId)` – removes the group (playlists are unassigned, not deleted); clears `activeGroupId` if it was this group.
  - `setGroupCarouselMode(groupId, mode)` – sets this group’s carousel display mode (`'large' | 'small' | 'bar'`). Used by each carousel’s top-bar mode buttons.
  - `setAllGroupCarouselModes(mode)` – one-shot: sets every group’s carousel mode to `mode`. Used by TopNavigation “apply to all” buttons.
  - `addPlaylistToGroup(groupId, playlistId)` – adds a playlist to a group (idempotent).
  - `removePlaylistFromGroup(groupId, playlistId)` – removes a playlist from a group.
  - `isPlaylistInGroup(playlistId, groupId)` – returns whether the playlist is in that group.
  - `getGroupIdsForPlaylist(playlistId)` – returns array of group IDs that contain the playlist.
  - `renameGroup(groupId, name)` – renames the group.
  - `setActiveGroupId(id)` – sets or clears the "entered from" group (used by Player Controller badge and playlist navigation range). Set when user opens a playlist from a carousel card; cleared when opening from the main grid.
- **Migration:** Legacy single-list format (`groupPlaylistIds`) is migrated to one group named "Featured playlists". Version 2 adds `activeGroupId` (default `null`). Version 3 adds `groupCarouselModes` (default `{}`).

### 3.2 tabStore (view mode)

- **Valid view IDs:** `'all' | 'unsorted' | 'groups'`.
- **activeTabId** is persisted; only these three values are accepted (others normalize to `'all'`).

### 3.3 layoutStore (Playlists header actions)

- **playlistsPageShowTitles** (boolean): Toggles “show video titles on all playlist cards.” Synced from localStorage on PlaylistsPage mount; persisted to localStorage when changed. Toggled from TopNavigation when on Playlists page.
- **setPlaylistsPageShowTitles(v?)**: Sets or toggles the above.
- **showPlaylistUploader** (boolean): When set to `true`, PlaylistsPage opens the playlist uploader and then clears this flag. Used by the “Add” button in TopNavigation when on Playlists page.
- **setShowPlaylistUploader(v)**: Sets the flag (e.g. `true` to open uploader).

---

## 4. Logic and UI flow

### 4.1 TopNavigation (Playlists bar)

- When `currentPage === 'playlists'` and `activeTabId === 'groups'` (from `useTabStore()`), the left side shows three “apply to all” buttons (Large / Small / Bar) above the title; each calls `setAllGroupCarouselModes(mode)` so every carousel’s stored mode is updated in one shot. No persistent override.
- When `currentPage === 'playlists'`, the right side of the header shows: TabBar, Info button (toggles `playlistsPageShowTitles`), Folder button (toggles `showColoredFolders` from folderStore), Add button (calls `setShowPlaylistUploader(true)`), then Back (if history/preview) and Close. The left side shows the title “Playlists.”

### 4.2 PlaylistsPage

- **GROUPS view:** Renders one `GroupPlaylistCarousel` per group (including empty ones). Each carousel receives `title={group.name}`, `groupId={group.id}`, `onRename={renameGroup}`, `onDelete={removeGroup}`. Playlist cards in carousels get the same props as in the grid (including `onAssignToGroupClick`). There is **no** sticky toolbar or TabBar on the page itself; the content area starts with carousels (or grid for ALL/UNSORTED) to maximize space.
- **ALL / UNSORTED view:** Renders the main grid. Filter:
  - ALL: all playlists.
  - UNSORTED: `getGroupIdsForPlaylist(playlist.id).length === 0`.
- **Assign column:** When `assignToGroupPlaylistId` is set, renders `PlaylistGroupColumn` with that playlist, `playlists`, `playlistThumbnails`, and `onClose`. Column uses the store to add/remove the playlist from groups and shows thumbnails from the first playlist in each group when available.
- **Uploader:** When `showPlaylistUploader` from layoutStore is true, a `useEffect` opens the uploader (sets local `showUploader(true)`) and then calls `setShowPlaylistUploader(false)`.

### 4.3 GroupPlaylistCarousel

- **Structure:** Each carousel is a single **bounded box**: rounded corners (`rounded-2xl`, or `rounded-xl` in bar mode), border (`border-white/10`), background (`bg-slate-800/40`), shadow. No inner component is used (structure is inlined) so re-renders do not remount the scroll container and scroll position is preserved.
- **Mode:** Effective mode is read from `playlistGroupStore.groupCarouselModes[groupId]` (default `'large'`). No global override; TopNavigation “apply to all” updates every group’s stored mode.
- **Top bar:** A fixed top bar inside the box contains: Layers icon, carousel title (truncated); when `groupId` is set, **three mode buttons** (Large / Small / Bar) that call `setGroupCarouselMode(groupId, mode)`; in bar mode, inline scroll left/right buttons; when `groupId` / `onRename` / `onDelete` are provided, rename (pencil) and delete (trash) buttons. Styling: `border-b border-white/10`, `bg-slate-800/60`. In small/bar mode the bar is compact (`px-3 py-1` or `py-1.5`, smaller icons).
- **Empty group:** Same box and top bar; body shows a placeholder: “No playlists in this carousel” (omitted in bar mode).
- **Bar mode (1+ items):** Only the top bar is visible; a hidden scroll strip (fixed-width slots) keeps scroll position so the inline left/right buttons still advance by one “slot” per click.
- **Large / Small mode (1+ items):** Horizontal scroll row:
  - Scrollable flex row with mode-dependent gap (`gap-10` large, `gap-4` small) and padding (`pt-3 pb-2` large, `pt-1 pb-1` small). Custom webkit scrollbar.
  - Card wrapper: large `w-[min(520px,calc(50vw-2rem))] min-w-[380px]`; small `w-[min(180px,calc(33vw-1rem))] min-w-[140px]`. Children receive injected `size` via `React.cloneElement`: `size="small"` when mode is small, else `"large"` (PlaylistCard uses this to hide the 4-mini-preview strip and compact header when small).
  - Left/right chevron buttons (visibility on hover) call `scrollBy({ left: ±amount, behavior: 'smooth' })`.
  - No custom drag-to-scroll or scroll-snap; native horizontal scroll only. Stable keys on mapped children for list reconciliation.

### 4.4 PlaylistCard 3-dot menu

- **Assign to group** – calls `onAssignToGroupClick()`, which opens `PlaylistGroupColumn`.
- **Remove from carousel(s)** – only if `getGroupIdsForPlaylist(playlist.id).length > 0`; calls `removePlaylistFromGroup(gid, playlist.id)` for each such group.

---

## 5. Cross-references

- **Group badge and playlist navigation (Player Controller):** `group-badge-player-controller.md` (single badge, “entered from” group, nav restricted to group).
- **Playlist cards:** `playlist-cards.md` (card UI and folder integration).
- **Playlists page layout:** `ui-pages.md`, `ui.md`.
- **TopNavigation / Mini Header:** `page-banner.md` (Mini Header section), `ui-layout.md`.
- **State:** `state-management.md` (playlistGroupStore, tabStore, layoutStore).
- **Legacy tabs:** The previous tab/preset system has been retired in favor of ALL / UNSORTED / GROUPS and group carousels; see `playlist&tab.md` for historical context only.

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
- **GROUPS** shows each group in a **bounded carousel box** (see below). Carousel cards use a **larger** fixed size than the main grid (`min-w-[380px]`, `w-[min(520px,calc(50vw-2rem))]`), with horizontal scroll for one or more items.

### 1.2 Playlists bar (TopNavigation)

When the current page is **Playlists**, the **TopNavigation** mini header (above main content) shows:

- **Title:** “Playlists”.
- **Tabs:** `TabBar` (ALL | UNSORTED | GROUPS).
- **Actions:** Info (show/hide video titles on cards), Folder (show/hide colored folders), Add (open playlist uploader).
- **Navigation:** Back (when applicable), Close (full screen / close menu).

This bar is **not** rendered on the Playlists page content area; it lives in the shared header so the content area has more vertical space for carousels and grid.

### 1.3 Creating and managing carousels

- **New carousel (GROUPS view):** “New carousel” button below the last carousel opens a prompt for the name, then creates an empty group. Empty carousels still appear as a bounded box with a placeholder (“No playlists in this carousel”).
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
| **State** | `playlistGroupStore.js` (Zustand, persisted), `tabStore.js` (view mode), `layoutStore.js` (playlistsPageShowTitles, showPlaylistUploader for header actions) |
| **Store (view mode)** | `tabStore.js` (activeTabId: `'all' \| 'unsorted' \| 'groups'`) |

---

## 3. Data model and state

### 3.1 playlistGroupStore

- **Storage:** Zustand with `persist` middleware; key `playlist-group-storage` in localStorage.
- **State:** `groups: Array<{ id: string, name: string, playlistIds: number[] }>`, `activeGroupId: string | null`.
- **Actions:**
  - `addGroup(name)` – appends a new group, returns its `id`.
  - `removeGroup(groupId)` – removes the group (playlists are unassigned, not deleted); clears `activeGroupId` if it was this group.
  - `addPlaylistToGroup(groupId, playlistId)` – adds a playlist to a group (idempotent).
  - `removePlaylistFromGroup(groupId, playlistId)` – removes a playlist from a group.
  - `isPlaylistInGroup(playlistId, groupId)` – returns whether the playlist is in that group.
  - `getGroupIdsForPlaylist(playlistId)` – returns array of group IDs that contain the playlist.
  - `renameGroup(groupId, name)` – renames the group.
  - `setActiveGroupId(id)` – sets or clears the "entered from" group (used by Player Controller badge and playlist navigation range). Set when user opens a playlist from a carousel card; cleared when opening from the main grid.
- **Migration:** Legacy single-list format (`groupPlaylistIds`) is migrated to one group named "Featured playlists". Version 2 adds `activeGroupId` (default `null`).

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

- When `currentPage === 'playlists'` (from `useNavigationStore()`), the right side of the header shows: TabBar, Info button (toggles `playlistsPageShowTitles`), Folder button (toggles `showColoredFolders` from folderStore), Add button (calls `setShowPlaylistUploader(true)`), then Back (if history/preview) and Close. The left side shows the title “Playlists.”

### 4.2 PlaylistsPage

- **GROUPS view:** Renders one `GroupPlaylistCarousel` per group (including empty ones). Each carousel receives `title={group.name}`, `groupId={group.id}`, `onRename={renameGroup}`, `onDelete={removeGroup}`. Playlist cards in carousels get the same props as in the grid (including `onAssignToGroupClick`). There is **no** sticky toolbar or TabBar on the page itself; the content area starts with carousels (or grid for ALL/UNSORTED) to maximize space.
- **ALL / UNSORTED view:** Renders the main grid. Filter:
  - ALL: all playlists.
  - UNSORTED: `getGroupIdsForPlaylist(playlist.id).length === 0`.
- **Assign column:** When `assignToGroupPlaylistId` is set, renders `PlaylistGroupColumn` with that playlist, `playlists`, `playlistThumbnails`, and `onClose`. Column uses the store to add/remove the playlist from groups and shows thumbnails from the first playlist in each group when available.
- **Uploader:** When `showPlaylistUploader` from layoutStore is true, a `useEffect` opens the uploader (sets local `showUploader(true)`) and then calls `setShowPlaylistUploader(false)`.

### 4.3 GroupPlaylistCarousel

- **Structure:** Each carousel is a single **bounded box**: rounded corners (`rounded-2xl`), border (`border-white/10`), background (`bg-slate-800/40`), shadow. No inner component is used (structure is inlined) so re-renders do not remount the scroll container and scroll position is preserved.
- **Top bar:** A fixed top bar inside the box contains: Layers icon, carousel title (truncated), and when `groupId` / `onRename` / `onDelete` are provided, rename (pencil) and delete (trash) buttons. Styling: `border-b border-white/10`, `bg-slate-800/60`.
- **Empty group:** Same box and top bar; body shows a placeholder: “No playlists in this carousel.”
- **1+ items (one or more playlists):** All use the **same horizontal scroll row**:
  - A single scrollable flex row with `overflow-x-auto`, `gap-10`, and scrollbar styling (custom webkit scrollbar, close to the bottom of the cards).
  - Each card is wrapped in a div with `w-[min(520px,calc(50vw-2rem))] min-w-[380px] max-w-full flex-shrink-0` so card size is **larger and consistent** for 1, 2, or 3+ items. Two cards sit side-by-side and the row is scrollable to reveal the full second card if needed.
  - Left/right chevron buttons (visibility on hover) call `scrollBy({ left: ±amount, behavior: 'smooth' })`.
  - **No** custom drag-to-scroll or scroll-snap; native horizontal scroll (wheel, scrollbar, touch) only, to avoid jitter and snap-back. Stable keys on mapped children (`child.key` or `carousel-item-${index}`) for list reconciliation.

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

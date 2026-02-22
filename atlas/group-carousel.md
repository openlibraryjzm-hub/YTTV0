# Group Carousel System (Playlists Page)

The group carousel system lets users organize playlists into named, horizontal carousel rows on the Playlists page. It replaces the legacy tab system as the primary way to curate and surface playlists. Carousels are stored in local state (Zustand + localStorage); no database tables are used.

**Related:** The **group badge** on the Player Controller’s Top Playlist Menu and **restriction of playlist navigation** (up/down) to the current group are documented in **`group-badge-player-controller.md`**.

---

## 1. User-facing behavior

### 1.1 Playlists page views (TabBar)

The Playlists page has three view modes (no tabs or presets):

| View    | Description |
|---------|-------------|
| **ALL** | Shows all playlists in a 2-column grid. No carousels. |
| **UNSORTED** | Shows only playlists that are not in any group carousel. No carousels. |
| **GROUPS** | Shows only group carousels: one horizontal carousel per group, with a “New carousel” button at the bottom. No main grid. |

- **ALL** and **UNSORTED** use the same card size and grid layout (`grid-cols-1 md:grid-cols-2 gap-10`).
- **GROUPS** shows each group as a row; card size in carousels matches the grid (roughly two cards visible at a time).

### 1.2 Creating and managing carousels

- **New carousel (GROUPS view):** “New carousel” button below the last carousel opens a prompt for the name, then creates an empty group. Empty carousels still appear as a row with a placeholder (“No playlists in this carousel”).
- **Rename:** On the GROUPS view, a pencil icon next to each carousel title opens a rename prompt. Only available when the carousel is rendered with `groupId` and `onRename` (i.e. on GROUPS).
- **Delete:** A trash icon next to the title opens a confirmation: “Delete carousel “[name]”? Playlists will be unassigned from this carousel but not removed from the app.” Confirming removes the group and unassigns all playlists from it; playlists themselves are not deleted.

### 1.3 Assigning playlists to carousels

- **Assign to group (playlist card 3-dot menu):** Opens the **PlaylistGroupColumn** overlay (full-screen, scrollable list of carousel cards). Clicking a carousel card adds the current playlist to that carousel (or removes it if already in that carousel). Same UX pattern as **PlaylistFolderColumn** (folders).
- **Remove from carousel (playlist card 3-dot menu):** Shown only when the playlist is in at least one carousel. Label is “Remove from carousel” (one) or “Remove from carousels” (multiple). Removes the playlist from every carousel it’s in; playlists are not deleted.

---

## 2. File manifest

| Area | Files |
|------|--------|
| **Components** | `GroupPlaylistCarousel.jsx`, `PlaylistGroupColumn.jsx`, `PlaylistCard.jsx` (menu + remove), `PlaylistsPage.jsx` (views, carousels, column), `TabBar.jsx` (ALL / UNSORTED / GROUPS) |
| **State** | `playlistGroupStore.js` (Zustand, persisted) |
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

---

## 4. Logic and UI flow

### 4.1 PlaylistsPage

- **GROUPS view:** Renders one `GroupPlaylistCarousel` per group (including empty ones). Each carousel receives `title={group.name}`, `groupId={group.id}`, `onRename={renameGroup}`, `onDelete={removeGroup}`. Playlist cards in carousels get the same props as in the grid (including `onAssignToGroupClick`).
- **ALL / UNSORTED view:** Renders the main grid. Filter:
  - ALL: all playlists.
  - UNSORTED: `getGroupIdsForPlaylist(playlist.id).length === 0`.
- **Assign column:** When `assignToGroupPlaylistId` is set, renders `PlaylistGroupColumn` with that playlist, `playlists`, `playlistThumbnails`, and `onClose`. Column uses the store to add/remove the playlist from groups and shows thumbnails from the first playlist in each group when available.

### 4.2 GroupPlaylistCarousel

- Renders a title row (Layers icon, title, optional rename and delete buttons when `groupId` + `onRename` / `onDelete` are provided).
- **Empty group:** Title + placeholder “No playlists in this carousel”.
- **1–2 items:** Same layout as main grid: `grid grid-cols-1 md:grid-cols-2 gap-10`.
- **3+ items:** Horizontal scroll row; each child wrapped in `w-[min(520px,calc(50%-20px))] min-w-[380px]` so card size matches the grid. Chevrons and drag-to-scroll.

### 4.3 PlaylistCard 3-dot menu

- **Assign to group** – calls `onAssignToGroupClick()`, which opens `PlaylistGroupColumn`.
- **Remove from carousel(s)** – only if `getGroupIdsForPlaylist(playlist.id).length > 0`; calls `removePlaylistFromGroup(gid, playlist.id)` for each such group.

---

## 5. Cross-references

- **Group badge and playlist navigation (Player Controller):** `group-badge-player-controller.md` (single badge, “entered from” group, nav restricted to group).
- **Playlist cards:** `playlist-cards.md` (card UI and folder integration).
- **Playlists page layout:** `ui-pages.md`, `ui.md`.
- **State:** `state-management.md` (playlistGroupStore, tabStore).
- **Legacy tabs:** The previous tab/preset system has been retired in favor of ALL / UNSORTED / GROUPS and group carousels; see `playlist&tab.md` for historical context only.

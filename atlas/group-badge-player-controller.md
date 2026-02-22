# Group Badge and Playlist Navigation (Player Controller)

This document describes the **group carousel badge** on the Player Controller’s Top Playlist Menu and how it **restricts playlist navigation** (up/down) to the playlists in that group. The behavior is driven by which group carousel the user last “entered from” on the Playlists page.

**Related Documentation:**
- **Group carousels:** `group-carousel.md` (Playlists page GROUPS view, carousel management)
- **Player Controller:** `advanced-player-controller.md` (Top Playlist Menu, badges, navigation)
- **State:** `state-management.md` (playlistGroupStore)

---

## 1. User-facing behavior

### 1.1 Group badge on the Top Playlist Menu

- **Location:** The left rectangle of the Player Controller (Top Playlist Menu). Below the playlist title, badges are shown in a single row.
- **Group badge:** A **single** violet-styled badge showing the name of the **current group carousel** (e.g. “Featured playlists”). It appears only when the current playlist belongs to at least one group.
- **Which group is shown:**  
  - If the user opened the current playlist by **clicking a card inside a group carousel** on the Playlists page (GROUPS tab), that carousel’s group is shown.  
  - If the user opened the playlist from the **main grid** (ALL or UNSORTED), no “entered from” group is set; the badge then shows the **first** group (in store order) that contains the playlist, or no badge if the playlist is in no groups.
- **Only one badge:** A playlist can be in multiple groups; the UI always shows exactly one group badge (the “entered from” group when applicable, otherwise the first matching group).

### 1.2 Playlist navigation restricted to the group

- **Up/down controls:** The Top Playlist Menu has **previous/next playlist** controls (and preview up/down arrows when in preview mode). These move through the **navigation list** maintained by `playlistStore` (`navigationItems`, `currentNavigationIndex`).
- **When a group is active:** If the **group badge** is showing a group (i.e. `activeGroupId` in `playlistGroupStore` is set and the current playlist is in that group), the navigation list is **restricted to**:
  - Playlists that belong to that group (and optionally their folders, as built by `buildNavigationItems`),
  - In the **same order** as in the group carousel (`group.playlistIds`).
- **When no group is active:** If the user last opened a playlist from the main grid, `activeGroupId` is cleared and the navigation list is **not** restricted (all playlists, or tab-filtered if a tab is active).
- **Result:** With a group badge visible, up/down only cycles through playlists (and their folders) in that carousel. Without a group badge, up/down use the full (or tab-filtered) list.

---

## 2. How “entered from” is set and cleared

| Action | Effect on `activeGroupId` |
|--------|---------------------------|
| User clicks a **playlist card inside a group carousel** (Playlists page, GROUPS tab) | `setActiveGroupId(group.id)` — badge and nav range use this group. |
| User clicks a **playlist card in the main grid** (ALL or UNSORTED) | `setActiveGroupId(null)` — badge falls back to first group containing the playlist (or none); nav uses full list. |
| User **deletes the active group** (trash on carousel title) | `activeGroupId` is set to `null` in `removeGroup`. |

- **Persistence:** `activeGroupId` is stored in `playlistGroupStore` (Zustand persist, key `playlist-group-storage`), so the “entered from” group survives reloads.

---

## 3. Relation to the Top Playlist Menu

- **Badges row:** The Top Playlist Menu shows, in one row: **Group carousel** (violet) → **Active Preset** (indigo) → **Active Tab** (sky) → **Folder** (colored). Only one group badge is shown; it reflects the group that both labels the context and defines the navigation range.
- **Navigation list build:** `PlayerController` builds `navigationItems` in a `useEffect` that:
  1. Starts from `allPlaylists` (optionally filtered by legacy tab).
  2. If `activeGroupId` is set, filters to playlists in that group and sorts them by `group.playlistIds` (carousel order).
  3. Builds folders (stuck + optional show-all) for the current playlist set.
  4. Calls `buildNavigationItems(playlists, foldersToInclude)` and `setNavigationItems(navItems)`.
- **Handlers:** `handleNextPlaylist` and `handlePreviousPlaylist` call `nextPlaylist()` and `previousPlaylist()` from `playlistStore`, which move within `navigationItems`. So when the list is restricted by group, up/down are restricted to that group’s range.

---

## 4. File manifest

| Area | Files |
|------|--------|
| **Components** | `PlayerController.jsx` (badge render, nav build, next/prev handlers), `PlaylistCard.jsx` (groupIdFromCarousel, onEnterFromGroup on click), `PlaylistsPage.jsx` (passes group/clear into cards) |
| **State** | `playlistGroupStore.js` (`activeGroupId`, `setActiveGroupId`, `groups`, `getGroupIdsForPlaylist`), `playlistStore.js` (`navigationItems`, `nextPlaylist`, `previousPlaylist`, `buildNavigationItems`, `setNavigationItems`) |

---

## 5. Logic summary

1. **Single group for badge:**  
   `singleGroupForBadge = (activeGroupId && current playlist in that group) ? that group : first group containing playlist`. One badge is rendered for `singleGroupForBadge` when non-null.

2. **Restricted navigation:**  
   In the nav-build effect, if `activeGroupId` is set, filter `playlists` to `group.playlistIds` and sort by that order before `buildNavigationItems`. Dependencies include `activeGroupId` and `groups` so the list updates when the user enters from a different carousel or from the grid.

3. **Entered from carousel:**  
   PlaylistCard calls `onEnterFromGroup(groupIdFromCarousel)` or `onEnterFromGroup(null)` on main card click; PlaylistsPage passes `setActiveGroupId` and, in carousels, `groupIdFromCarousel={group.id}` and in the grid `onEnterFromGroup={() => setActiveGroupId(null)}`.

---

## 6. Cross-references

- **Group carousel system:** `group-carousel.md`
- **Top Playlist Menu and other badges:** `advanced-player-controller.md` § 1.4
- **playlistStore navigation:** `state-management.md`, `navigation-routing.md`

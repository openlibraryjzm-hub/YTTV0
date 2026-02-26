# Group Badge and Playlist Navigation (Player Controller)

This document describes the **group carousel badge** on the Player Controller’s Top Playlist Menu, **left/right arrow cycling** through all group carousels, and how the selected group **restricts playlist navigation** (up/down) to that group’s playlists.

**Related Documentation:**
- **Group carousels:** `group-carousel.md` (Playlists page GROUPS view, carousel management)
- **Player Controller:** `advanced-player-controller.md` (Top Playlist Menu, badges, navigation)
- **State:** `state-management.md` (playlistGroupStore)

---

## 1. User-facing behavior

### 1.1 Group badge on the Top Playlist Menu

- **Location:** The left rectangle of the Player Controller (Top Playlist Menu). Below the playlist title, badges are shown in a single row.
- **Group badge:** A **single** violet-styled badge showing the name of the **current group carousel** (e.g. “Featured playlists”). It appears when there is at least one group carousel in the app. **Which group is shown:** the **active** group (after cycling or “entered from”), or the first group that contains the current playlist, or the first group in store order if the playlist is in no groups.
- **Cycling groups:** **Left- and right-facing arrow buttons** are always shown on either side of the group badge. They cycle through **all** group carousels (every carousel in the app), not only groups that contain the current playlist. Click **left arrow** for previous carousel, **right arrow** for next (wrap-around). Arrows are **enabled** when there are two or more group carousels; with only one carousel, arrows are visible but disabled. Playlist up/down navigation is restricted to the group currently shown in the badge.

### 1.2 Playlist navigation restricted to the group

- **Up/down controls:** The Top Playlist Menu has **previous/next playlist** controls (and preview up/down arrows when in preview mode). These move through the **navigation list** maintained by `playlistStore` (`navigationItems`, `currentNavigationIndex`).
- **When a group is active:** If the **group badge** is showing a group (i.e. `activeGroupId` in `playlistGroupStore` is set), the navigation list is **restricted to**:
  - Playlists that belong to that group (and optionally their folders, as built by `buildNavigationItems`),
  - In the **same order** as in the group carousel (`group.playlistIds`).
- **When no group is active:** If the user last opened a playlist from the main grid, `activeGroupId` is cleared and the navigation list is **not** restricted (all playlists, or tab-filtered if a tab is active).
- **Result:** With a group badge visible, up/down only cycles through playlists (and their folders) in that carousel. Without a group badge, up/down use the full (or tab-filtered) list.

---

## 2. How “entered from” is set and cleared

| Action | Effect on `activeGroupId` |
|--------|---------------------------|
| User clicks a **playlist card inside a group carousel** (Playlists page, GROUPS tab) | `setActiveGroupId(group.id)` — badge and nav range use this group. |
| User clicks a **playlist card in the main grid** (ALL or UNSORTED) | `setActiveGroupId(null)` — badge falls back to first group containing the playlist (or first group); nav uses full list. |
| User clicks **left/right arrows** on the group badge | `setActiveGroupId(previous/next group.id)` — cycles through **all** group carousels; badge and nav range update. |
| User **deletes the active group** (trash on carousel title) | `activeGroupId` is set to `null` in `removeGroup`. |

- **Persistence:** `activeGroupId` is stored in `playlistGroupStore` (Zustand persist, key `playlist-group-storage`), so the “entered from” group survives reloads.

---

## 3. Relation to the Top Playlist Menu

- **Badges row:** The Top Playlist Menu shows, in one row: **Group carousel** (violet) → **Active Preset** (indigo) → **Active Tab** (sky) → **Folder** (colored). Only one group badge is shown; it reflects the group that both labels the context and defines the navigation range.
- **Badge styling:** All badges (group, preset, tab, folder) use **no bubble or pill container**. Text is **white with a black outline** (same as playlist/video titles) for consistency; 11px font; horizontally aligned. Group badge includes left/right arrow buttons with white-outline chevron icons.
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
   `singleGroupForBadge = (activeGroupId && group exists) ? that group : (first group containing playlist || groups[0])`. The badge is shown whenever there is at least one group; it reflects the active group (from cycling or “entered from”) or a sensible default.

2. **Cycling:**  
   Arrows cycle through `groups` (all carousels). `canCycleGroups = groups.length >= 2`. `cycleGroupBadge('prev'|'next')` computes current index in `groups` from `singleGroupForBadge`, then `setActiveGroupId(groups[nextIdx].id)`. Arrows are always rendered; they are disabled when `!canCycleGroups`.

3. **Restricted navigation:**  
   In the nav-build effect, if `activeGroupId` is set, filter `playlists` to that group’s `playlistIds` and sort by carousel order before `buildNavigationItems`. Dependencies include `activeGroupId` and `groups`, so the list updates when the user cycles the badge or enters from a different carousel.

4. **Entered from carousel:**  
   PlaylistCard calls `onEnterFromGroup(groupIdFromCarousel)` or `onEnterFromGroup(null)` on main card click; PlaylistsPage passes `setActiveGroupId` and, in carousels, `groupIdFromCarousel={group.id}` and in the grid `onEnterFromGroup={() => setActiveGroupId(null)}`.

---

## 6. Cross-references

- **Group carousel system:** `group-carousel.md`
- **Top Playlist Menu and other badges:** `advanced-player-controller.md` § 1.4
- **playlistStore navigation:** `state-management.md`, `navigation-routing.md`

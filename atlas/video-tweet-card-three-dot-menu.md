# Video & Tweet Card 3-Dot Menu

The **Video Card / Tweet Card 3-Dot Menu** is a single, horizontal “all-in-one” popover used by both **VideoCard** and **TweetCard** on the Videos page. It consolidates pins, folder assignment, drumstick rating, sticky, and standard actions (delete, move, copy, set cover) into one decluttered menu opened from a 3-dot trigger.

---

## 1. User Experience

### 1.1 Trigger and Placement

- **Trigger**: A 3-dot (⋮) button that appears on hover at the **bottom-right** of the card (thumbnail area).
- **VideoCard**: Shown on both YouTube-style and Twitter-style cards when not in bulk tag mode.
- **TweetCard**: Same trigger position on the media area; header CardActions were removed in favor of this menu.
- **Opening**: Click the 3-dot to open the menu. It is positioned **above the card row**, centered on the card that was clicked, with a fixed vertical offset so it sits clearly above the grid.

### 1.2 Menu Layout (Horizontal)

The menu is a **horizontal bar** with three main sections, left to right:

1. **Actions** (vertical stack)  
   - Delete  
   - Move to Playlist  
   - Copy to Playlist  
   - Set as Playlist Cover  

2. **Pins, Rating, Sticky** (vertical stack)  
   - **Pin**: Pin / Unpin, Priority, Follower (Follower only when already pinned).  
   - **Rating**: Drumstick 1–5 (same as drumstick-rating-system).  
   - **Sticky Video**: Toggle sticky for the current playlist/folder context.  

3. **Folder**  
   - **BulkTagColorGrid**: 16-color grid (same UI as bulk tag mode). Click a color to assign/unassign the video to that folder. Assigned folders show a checkmark. Pencil icon on each color renames the folder (calls `onRenameFolder`).  
   - Replaces the previous StarColorPicker in the menu.

### 1.3 Behavior

- **Close**: Click outside or scroll; menu closes.
- **Positioning**: Menu is viewport-clamped so it does not overflow top, bottom, or sides.
- **Bulk tag mode**: When the Videos page is in bulk tag mode, the 3-dot menu is **hidden** on cards; folder assignment is done via the bulk-tag strip on the card instead.

---

## 2. File Manifest

| Area | File | Role |
|------|------|------|
| **Component** | `src/components/VideoCardThreeDotMenu.jsx` | Menu UI: horizontal layout, pin/rating/sticky/folder/actions, positioning. |
| **Component** | `src/components/BulkTagColorGrid.jsx` | 16-color folder grid used inside the menu (and on cards in bulk tag mode). |
| **Component** | `src/components/DrumstickRating.jsx` | 1–5 rating used in the “Pins, Rating, Sticky” section. |
| **Card** | `src/components/VideoCard.jsx` | Renders the 3-dot trigger and passes props (pin, folder, rating, menu options, etc.). |
| **Card** | `src/components/TweetCard.jsx` | Same: single 3-dot trigger, same menu. |
| **Page** | `src/components/VideosPage.jsx` | Provides handlers: `handleMenuOptionClick`, `handleStarColorLeftClick`, `handleRenameFolder`, etc. |
| **State** | `src/store/pinStore.js` | Pin / priority / follower state. |
| **State** | `src/store/folderStore.js` | Folder assignments, bulk tag state. |
| **API** | `src/api/playlistApi.js` | Drumstick rating and folder assignment persistence. |

---

## 3. Props (VideoCardThreeDotMenu)

The menu receives:

- **video**, **playlistId** – Context for the item.
- **Pin**: `isPinned`, `isPriority`, `isFollower`, `onTogglePin`, `onTogglePriorityPin`, `onRemovePin`.
- **Folder**: `videoFolders`, `folderMetadata`, `onStarColorLeftClick`, `onRenameFolder` (no longer `quickAssignFolder` or `onStarColorRightClick`; folder grid is assign/unassign + rename only).
- **Rating**: `drumstickRating`, `onDrumstickRate`.
- **Actions**: `menuOptions` (array of `{ label, action, icon, danger? }`), `onMenuOptionClick`.
- **Trigger**: `triggerClassName` for the 3-dot button.

`menuOptions` are built by the card and include: Sticky Video (toggleSticky), Delete, Move to Playlist, Set as Playlist Cover, Copy to Playlist. The menu splits out the `toggleSticky` option into the “Pins, Rating, Sticky” column and passes the rest as “other” actions.

---

## 4. Bulk Tag Mode on Cards

When the user enables **bulk tag mode** on the Videos page:

- **VideoCard** and **TweetCard** show a **BulkTagColorGrid** strip **below the thumbnail** (between thumbnail and title), in a fixed-height band (`h-20`), always visible when bulk tag mode is on. The strip does not overlay the thumbnail.
- **Instant folder assignment**: Clicking a color in the grid **immediately** assigns or unassigns that video to that folder (same behavior as the 3-dot menu Folder section or star left-click). No Save or Cancel step; each click persists to the database and updates the card.
- The **3-dot menu is not shown** in bulk tag mode so that the same grid is not duplicated and the UX stays focused on the strip.

This matches the “TweetCard-style” bulk experience: one consistent strip on both video and tweet cards.

---

## 5. Related Documentation

- **Drumstick rating**: `drumstick-rating-system.md`  
- **Folder colors / bulk tag**: `playlist&tab.md`, `database-schema.md`, `api-bridge.md`  
- **Cards overview**: `ui-cards.md`  
- **Videos page**: `ui-pages.md`, `ui.md`

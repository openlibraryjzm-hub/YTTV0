# Hub (Explorer Page)

**Covers**: The central Hub grid (`ExplorerPage.jsx`) for managing and navigating separate structural Playlist Pages.
**Key Topics**: Unified Square Layout, Persistent Blank Pages, Add/Delete Pages, Dynamic Grid Restructuring. 

## 1. User-Perspective Description
The Hub acts as a master visual dashboard for organizing the user's group carousels across multiple distinct pages. Instead of relying on traditional pagination dots, it represents the application's layout scale as a dynamically splitting "Unified Square".
- **Single Master Page**: By default, the application starts with one giant conceptual square representing Page 1 (which hosts the default 16 colored carousels).
- **Dynamic Fracturing**: Clicking the "New Page" button in the header perfectly cleaves the master square into smaller, equal fractions (e.g., halves, thirds, a 2x2 grid). 
- **Blank Slate Context**: When navigating into any page higher than Page 1, the "All Playlists" view is strictly limited to only display playlists that have been assigned to carousels on that exact page, offering a pristine blank slate.
- **Layout Deletion**: Hovering over any page square (except Page 1) reveals a red Trash icon. Deleting a page destroys the carousel/folder layouts on that page and automatically shifts all subsequent layout pages down by one slot, safely preserving the actual underlying playlists in the Unsorted section of Page 1.

## 2. File Manifest
- **UI/Components**: `src/components/ExplorerPage.jsx`
- **State Management**: `src/store/playlistGroupStore.js`, `src/store/navigationStore.js`
- **Integration Layer**: `src/components/PlaylistsPage.jsx`

## 3. Logic & State Chain
- **Creation Flow**: Triggers `setTotalPages(totalPages + 1)` in `usePlaylistGroupStore.js`, committing a purely structural page to `idbStorage`.
- **Navigation Flow**: Clicking a unified grid block fires `setActivePage(page.id)` and `setCurrentPage('playlists')`. `PlaylistsPage.jsx` reads this active context to determine which carousels to render.
- **Deletion Architecture**: `deletePage(id)` executes a multi-step state update:
    1. Filters out all existing carousel groups specifically bound to the deleted `pageId`.
    2. Maps over remaining groups. If `group.page > pageId`, it decrements their page numerical tracking by 1 to collapse the gap.
    3. Decrements `totalPages` and ensures `activePage` is safely bounded.

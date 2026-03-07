# Video Queue System

This document outlines the temporary session-based video queue functionality, which allows users to line up videos for immediate playback without permanently altering playlist structures.

---

## 1. User-Perspective Description
- Users can add videos to a temporary queue. The queue persists only for the current application session (i.e., it clears upon app restart).
- **Adding to Queue**: Users can add videos via two methods on the Videos Page:
  - Opening the **3-dot menu** on a video card and clicking the **"Add to Queue"** option.
  - Using a **Long Press (500ms click/hold)** on any video card.
- **Viewing the Queue**: On the top-right block of the Player Controller's playlist menu, left-clicking the "Queue" icon hides the priority pin, bookmark, and history buttons, replacing them with a horizontally scrollable list of mini-thumbnails representing the queued videos.
  - The thumbnails precisely match the styling of the active Priority Pin thumbnail.
  - Hovering a queued thumbnail displays a `Play` icon overlay and an `X` to quickly discard the item from the queue.
  - Clicking a queued thumbnail triggers immediate playback, temporarily dropping the player into the "Temporary Queue" pseudo-playlist.
- **Closing the Queue**: An 'X' icon is rendered slightly above the queue rail to collapse the queue mode and return the user to the standard top-menu action buttons.

## 2. File Manifest

### UI / Components
- **`src/components/PlayerController.jsx`**
  - Holds `isQueueModeOpen` local state to toggle between the standard navigation action buttons and the queue thumbnail viewer.
  - Subscribes to `queueStore` to map and render active queued items.
  - Handles the click action of the Queue button to flip the UI.
- **`src/components/VideosPage.jsx`**
  - Injects the `onLongClick` prop mapping to `addToQueue(video)` on rendered `VideoCard` components (for both normal grids and the stickied carousel).
  - Handles the `addToQueue` switch case from `handleMenuOptionClick`.
- **`src/components/VideoCard.jsx`**
  - Added "Add to Queue" definition to the `menuOptions` object.
  - Uses `useRef` and pointer events (`onPointerDown`, `onPointerUp`, etc., forwarded down to `Card.jsx`) to calculate a 500ms hold, triggering the programmatic `onLongClick` handler.
- **`src/components/Card.jsx`**
  - Updated to forward broad React pointer interaction events (`onPointerDown/Up/Move/Cancel/Leave`) natively to the child DOM elements for precise measurement tracking.

### State Management
- **`src/store/queueStore.js`**
  - Zustand store containing the state array (`queue`).
  - Contains exported methods: `addToQueue(video)`, `removeFromQueue(videoId)`, `clearQueue()`, and `getQueue()`.
  - Intentionally does *not* utilize `localStorage` or `IndexedDB` persistence. Data lifespan is tied directly to the React window lifecycle.

## 3. Logic & State Chain

### Flow 1: Adding a Video to the Queue
1. **Trigger**: User holds left-click for 500ms on a VideoCard OR selects "Add to Queue" from the card's 3-dot menu.
2. **Action 1 (Hold)**: `VideoCard` measures the pointer interactions. If the pointer remains within a 10px drift tolerance for 500ms, `longPressFired` sets to true and `onLongClick(video)` fires.
3. **Action 2 (Menu)**: The menu component passes the 'addToQueue' action command to `VideosPage`.
4. **State Dispatch**: `VideosPage` evaluates the action and fires `queueStore`'s `addToQueue(video)` method.
5. **State Update**: The video object is appended to the `queue` array in `queueStore`.

### Flow 2: Interacting with the Queue Viewer
1. **Trigger**: User left-clicks the Queue button on the PlayerController's top controls cluster.
2. **Layout Change**: Local layout state `isQueueModeOpen` sets to `true`, collapsing sibling navigation buttons.
3. **Render**: The `PlayerController` maps across the array from `useQueueStore().queue` into the thumbnail format.
4. **Action (Remove)**: Clicking the thumbnail's inner 'X' fires `removeFromQueue(videoId)`, updating the store dynamically.
5. **Action (Play)**: Clicking the thumbnail triggers `setPlaylistItems([video], null, null, 'Temporary Queue')`, loading the isolated queued video into the player for immediate screening, and then closes the queue mode view.

## 4. Notes
- The size of the queued video thumbnails (`52x39`) is deliberately calibrated to mirror the Priority Pin aesthetics located on the opposite horizontal flank of the top menu.
- Because it's an ephemeral process by design, the queue system has zero coupling to Rust SQL processes.

# Add Content Modal (Playlist Uploader)

The Add Content Modal (`PlaylistUploader.jsx`) is the primary interface for importing and assigning media into the app. It supports parsing raw URLs, fetching metadata from YouTube/Twitter endpoints, and delegating those items into the user's localized playlists and colored folders.

## 1. Link Bubbles (`LinkBubbleInput`)
Instead of standard textareas, the modal uses a custom tagging system (Discord-style) where pasted links or text separated by spaces/newlines immediately tokenize into interactive blocks. 
- **Recognized Formats:** 
  - `Purple`: YouTube Playlists (`youtube.com/playlist?list=`)
  - `Red`: Standard YouTube Videos (`youtube.com/watch?v=`, `youtu.be/`)
  - `Orange`: YouTube Channels (`youtube.com/channel/`, `youtube.com/@`)
  - `Blue/Indigo`: Local Playlist & Folder Integrations (`local:playlist:...`)
- **Interactivity:** Bubbles can be deleted individually via an "x" button or erased sequentially using standard `Backspace` mechanics.

## 2. Folder Prism Assignment
Right above the link input box sits a segmented "Folder Prism" modeled after the sticky sort bars found on the Videos Page. 
- **'All' Segment:** Serves as the "No Folder Assignment" default (white/black styling).
- **16 Colored Segments:** Dynamically update the context of the Link Bubble input. Clicking a red segment ensures all links pasted into the input are automatically assigned to the Red Folder upon successful addition.
- **Micro-Counters:** Tiny badges appear on the folder segments to give users a live count of how many links they have staged for each target folder.

## 3. Extraction & Import Mechanics
When the user clicks "Extract Content":
1. The app iterates through all Link Bubble inputs spanning the Folder Prism.
2. It evaluates the type of string provided (using utilities from `youtubeUtils.js`):
   - **Videos:** Fetched as a singular item.
   - **Playlists:** Retrieves 50-1000 items and automatically generates a localized "Playlist Tracker" card (to be consumed by the Subscription Manager modal later).
   - **Channels:** Resolved from `@handle` or URL into a stylized "Channel Card" representation, which acts identically to a tracker card for Subscription syncs.
3. Duplicates strictly matching against the target playlist's `video_id` are skipped.
4. Accepted items are physically added to the app database with standard metadata (thumbnail, views, dates, authors) populated into `video_folder_assignments`.

## Location
- Component: `src/components/PlaylistUploader.jsx`
- Bubble Input Component: `src/components/LinkBubbleInput.jsx`
- Parsing Utilities: `src/utils/youtubeUtils.js`

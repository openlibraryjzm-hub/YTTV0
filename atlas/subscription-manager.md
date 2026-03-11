# Subscription Manager

The Subscription Manager allows users to automatically fetch and sync videos from external sources (such as YouTube Channels and tracked Playlists) directly into their current playlist folder view.

## Core Features

1. **Context-Aware Discovery:**
   - The Subscription Manager does not use a standalone "Add Subscription" input box.
   - Instead, it dynamically scans the active playlist view for **Tracker Cards** (`ChannelCard` and `PlaylistLinkCard` items).
   - Any tracker found in the folder view automatically populates precisely the Subscription modal for targeted syncing.

2. **Granular Fetching & Syncing:**
   - Channels: Users have micro-managing power. Instead of mass-syncing, you can fetch the latest `[1]`, `[5]`, `[10]`, or `[ALL]` (capped) videos for each channel specifically.
   - Playlists: A "Refresh Latest" button retrieves up to the 100 most recent videos added to that list.

3. **Intelligent Duplication Prevention:**
   - The syncing process compares the `video_id` of returned items against the current playlist's database pool, discarding duplicates before importing.
   - Items imported manually will not cause duplication.

4. **Light Theme Makeover:**
   - The UI runs a clean, vibrant `slate-50` backdrop with shadow-lifted cards rather than standard dark-mode interfaces, making the syncing hub visually distinct from generalized settings panels.

## Tracker Cards (Source of Truth)

Because the system infers sources from actual cards embedded inside your playlist, subscriptions are treated exactly like standard videos:
- **Deletion:** Removing a Channel Card or Playlist Tracker Card successfully deletes your "subscription" to it.
- **Categorization:** You can move a Tracker Card into a colored folder. When you open the Subscription Manager while looking inside that colored folder, only the Tracker Cards assigned to that folder will display for syncing.

*Note: The legacy backend table `playlist_sources` has been phased out natively in favor of this real-world folder object inference process via `getPlaylistItems` parsing.*

## Location

- Component: `src/components/SubscriptionManagerModal.jsx`
- API calls: `src/api/playlistApi.js` (`getPlaylistItems`, `addVideoToPlaylist`)
- Extraction Helpers: `src/utils/youtubeUtils.js` (`fetchChannelUploads`, `fetchPlaylistVideos`)

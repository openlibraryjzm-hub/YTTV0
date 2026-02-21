# Subscription Manager

The Subscription Manager allows users to automatically fetch and sync videos from external sources (such as YouTube Channels) directly into their playlists.

## Core Features

1. **Channel Subscription:**
   - Add subscriptions via YouTube Channel URL or `@handle`.
   - The system automatically resolves handles to their background channel ID.
   - Users can specify a `Limit` denoting the maximum number of recent uploads to fetch per sync.

2. **Custom Naming:**
   - Users can rename imported channels directly within the manager via an inline edit field.
   - This `custom_name` provides a recognizable tag instead of remembering channel IDs.

3. **Syncing Mechanism:**
   - Fetching latest videos uses the `/videos` endpoints or equivalent parsing to pull the most recent uploads.
   - Videos are added to the playlist if they do not already exist, preventing duplicates.
   - The thumbnail resolution scaling relies on the standard `VideoCard` component scaling (`medium` resolution) so that no black bars or aspect ratio inconsistencies appear on imported thumbnails.

4. **Last Synced Timestamp:**
   - The UI displays the last time a fetch was made by evaluating the most recently updated `last_synced_at` field from the database for the active sources.

## Data Model

In the SQLite Database, subscriptions are stored in the `playlist_sources` table:

```sql
CREATE TABLE playlist_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,  -- e.g., 'channel'
    source_value TEXT NOT NULL, -- e.g., YouTube Channel ID
    created_at TEXT NOT NULL,
    video_limit INTEGER NOT NULL DEFAULT 10,
    custom_name TEXT,           -- User-defined name for the source
    last_synced_at TEXT,        -- ISO timestamp of the last successful fetch
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, source_type, source_value)
);
```

### Supported API Bridge Methods (Rust -> JS)
- `add_playlist_source(playlistId, sourceType, sourceValue, videoLimit)`
- `get_playlist_sources(playlistId)`
- `update_playlist_source_limit(id, videoLimit)`
- `update_playlist_source_name(id, customName)`
- `update_playlist_source_sync(id)`
- `remove_playlist_source(id)`

## Location
- Component: `src/components/SubscriptionManagerModal.jsx`
- API definitions: `src/api/playlistApi.js`
- Backend structure: `src-tauri/src/database.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/models.rs`

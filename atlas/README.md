# Atlas Documentation Index

This directory contains comprehensive documentation for the YouTube TV v2 (yttv2) project, organized by feature and technical domain.

---

## Overview

**yttv2** is a desktop application built with Tauri (Rust + React) for managing and playing YouTube playlists. The app provides a modern, grid-based interface for browsing playlists and videos, with full SQLite database integration for persistent storage.

## Tech Stack

### Frontend
- **React 19.1.0** - UI framework
- **Vite 7.0.4** - Build tool and dev server
- **Tailwind CSS 4.1.18** - Utility-first CSS framework
- **Zustand 5.0.9** - Lightweight state management
- **GSAP 3.14.2** - Animation library for radial menu morphing animations
- **@tauri-apps/api ^2** - Tauri frontend API bindings
- **tauri-plugin-libmpv-api ^0.3** - Native mpv player API bindings

### Backend
- **Tauri 2** - Desktop app framework (Rust + WebView)
- **Rust** - Backend language
- **SQLite (rusqlite 0.32)** - Embedded database with bundled feature
- **serde/serde_json** - Serialization for Rust-JS communication
- **chrono 0.4** - Date/time handling
- **Axum 0.7** - HTTP web framework for streaming server
- **tokio** - Async runtime for streaming server
- **tokio-util** - Async utilities for streaming
- **tower/tower-http** - HTTP middleware and CORS support
- **bytes** - Byte buffer utilities
- **futures** - Async stream utilities
- **tauri-plugin-libmpv** - Native mpv player integration

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **@vitejs/plugin-react** - React plugin for Vite

---

## Project Structure

```
yttv2/
├── src/                          # Frontend React application
│   ├── api/                      # API layer for Tauri commands
│   │   └── playlistApi.js       # All playlist/video database operations
│   ├── components/               # React components
│   │   ├── PlayerController.jsx  # Top controller (orb + rectangles UI) - Advanced version with preview navigation, colored shuffle, likes, folder badges
│   │   ├── YouTubePlayer.jsx     # YouTube iframe player component
│   │   ├── NativeVideoPlayer.jsx # Native mpv player for local videos
│   │   ├── LocalVideoPlayer.jsx  # HTML5 fallback player (browser-compatible formats)
│   │   ├── TopNavigation.jsx     # Contextual Mini Header; Dynamic floating title that tracks context (folders/playlists)
│   │   ├── PlaylistsPage.jsx     # Main playlists grid view
│   │   ├── VideosPage.jsx        # Videos grid view for current playlist
│   │   ├── VideoSortFilters.jsx  # Icon sort bar (Home/Date/Progress/Last Viewed) + hover-expand drumstick rating filter for Videos toolbar
│   │   ├── TweetPage.jsx         # Full screen tweet detail view
│   │   ├── HistoryPage.jsx       # Watch history display (last 100 videos)
│   │   ├── LikesPage.jsx         # Liked videos grid view
│   │   ├── PinsPage.jsx          # Pinned videos grid view
│   │   ├── TasksPage.jsx         # Dedicated tasks/checklist page (date-grouped, tick + 3-dot menu)
│   │   ├── PlaylistList.jsx      # Sidebar playlist list component
│   │   ├── PlaylistView.jsx      # Individual playlist video grid
│   │   ├── PlaylistUploader.jsx  # Config Playlist Modal (Unified Add/Import/JSON)
│   │   ├── PlaylistsButton.jsx   # Toggle button for sidebar
│   │   ├── Card.jsx              # Base card component
│   │   ├── CardThumbnail.jsx     # Thumbnail display component
│   │   ├── CardContent.jsx       # Card content (title, subtitle, metadata)
│   │   ├── CardActions.jsx       # Quick actions management
│   │   ├── CardMenu.jsx          # Legacy 3-dot menu
│   │   ├── ModernVideoMenu.jsx   # Floating glassmorphism menu (legacy)
│   │   ├── VideoCardThreeDotMenu.jsx # All-in-one 3-dot menu (VideoCard & TweetCard)
│   │   ├── ImageHoverPreview.jsx # High-res image expansion (used for Tweets)
│   │   ├── VideoCard.jsx         # Video card (uses VideoCardThreeDotMenu; bulk strip = BulkTagColorGrid)
│   │   ├── OrbCard.jsx           # Orb preset card component
│   │   ├── BannerPresetCard.jsx  # App banner preset card component
│   │   ├── TweetCard.jsx         # Tweet card (uses VideoCardThreeDotMenu; bulk strip = BulkTagColorGrid)
│   │   ├── FolderCard.jsx        # Colored folder card component
│   │   ├── FolderSelector.jsx    # 16-color folder selector
│   │   ├── BulkTagColorGrid.jsx  # 16-color folder grid (bulk tag strip + 3-dot menu Folder section)
│   │   ├── StarColorPicker.jsx   # Star color picker (legacy; folder assignment now via BulkTagColorGrid in menu)
│   │   ├── TabBar.jsx            # Tab navigation component
│   │   ├── AddPlaylistToTabModal.jsx  # Modal for adding playlists to tabs
│   │   ├── TabPresetsDropdown.jsx     # Tab preset selector
│   │   ├── BulkPlaylistImporter.jsx   # Bulk import modal with 17 fields
│   │   ├── PlaylistFolderSelector.jsx  # Universal playlist/folder selector
│   │   ├── PlaylistSelectionModal.jsx  # Modal for selecting playlist (Move/Copy actions)
│   │   ├── StickyVideoCarousel.jsx     # Carousel/Grid for stickied videos
│   │   ├── GroupPlaylistCarousel.jsx   # Horizontal carousel row for playlist group (GROUPS view)
│   │   ├── PlaylistGroupColumn.jsx     # Full-screen overlay to assign playlist to colored folder (carousel)
│   │   ├── PlaylistBar.jsx              # Playlists page sticky toolbar: VideoSortFilters + Add/Refresh/Bulk + folder prism + Back/Close
│   │   ├── InfiniteScrollWrapper.jsx   # Infinite/Looping horizontal scroll wrapper
│   │   ├── PageBanner.jsx              # Banner with metadata, media carousel (continue/pinned/ASCII), animated patterns
│   │   ├── EditPlaylistModal.jsx       # Modal for renaming playlists and colored folders
│   │   ├── SettingsPage.jsx            # [DEPRECATED] Legacy settings hub
│   │   ├── MainSettingsPage.jsx        # New Settings Hub (Left Square + Right Popup layout)
│   │   ├── OrbPage.jsx                 # Dedicated Orb configuration page with presets grid
│   │   ├── AssetManagerPage.jsx        # Unified Asset Manager (Orb, Page, App, Theme)
│   │   ├── PagePage.jsx                # Dedicated Page Banner and Layer 2 configuration page
│   │   ├── AppPage.jsx                 # Dedicated App Banner, Color Palette, and Player Borders configuration page
│   │   ├── YouPage.jsx                 # Dedicated Signature & Profile configuration page
│   │   ├── SupportPage.jsx             # Tabbed Support Hub (Code, Dev, Community, Resources)
│   │   ├── LikesPage.jsx               # Liked videos with distribution graph and pagination
│   │   ├── PieGraph.jsx                # Animated SVG pie chart for likes distribution
│   │   ├── DebugRuler.jsx              # Ruler overlay component (non-functional - see debug.md)
│   │   ├── FullscreenVideoInfo.jsx     # Fullscreen right-margin panel (thumbnail, author, view count, year, description, tags)
│   │   └── ScrollbarChevrons.jsx       # Scrollbar navigation controls (chevron-dot-chevron capsule)
│   ├── store/                    # Zustand state management
│   │   ├── configStore.js        # Theme and Profile configuration
│   │   ├── layoutStore.js        # View mode, menu state, debug/inspect/ruler; Playlists/Videos page UI (showUploader, subscription, bulk-tag/auto-tag)
│   │   ├── navigationStore.js    # Current page (playlists/videos/history)
│   │   ├── playlistStore.js      # Current playlist items, video index
│   │   ├── folderStore.js        # Folder state, bulk tagging, show folders
│   │   ├── tabStore.js           # View mode (ALL/UNSORTED/GROUPS) for Playlists page
│   │   ├── tabPresetStore.js     # Tab preset state management
│   │   ├── playlistGroupStore.js # Group carousels: groups, per-carousel modes (large/small/bar), assign/rename/delete (persisted)
│   │   ├── pinStore.js           # Pin state management (persisted to IndexedDB)
│   │   ├── pinsPageChecklistStore.js  # Tasks page checklist (persisted to IndexedDB)
│   │   ├── stickyStore.js        # Sticky video state management (persisted to IndexedDB)
│   │   ├── shuffleStore.js       # Shuffle state for video ordering
│   │   └── paginationStore.js    # Pagination state (shared between VideosPage and TopNav)
│   ├── utils/                    # Utility functions
│   │   ├── youtubeUtils.js       # YouTube URL parsing, thumbnails, API
│   │   ├── initDatabase.js       # Database initialization (no test data)
│   │   └── folderColors.js       # Folder color utilities
│   ├── LayoutShell.jsx           # Main layout component (grid system)
│   ├── LayoutShell.css           # Layout styles
│   ├── App.jsx                   # Root component, app orchestration
│   ├── App.css                   # App-level styles
│   └── main.jsx                  # React entry point
│
├── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs               # Entry point (calls lib.rs)
│   │   ├── lib.rs                # Tauri app setup, command registration
│   │   ├── commands.rs           # Tauri command handlers (invoke from JS)
│   │   ├── database.rs           # SQLite database operations
│   │   ├── models.rs             # Rust data structures
│   │   └── streaming_server.rs   # HTTP streaming server for local videos
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri configuration
│   └── lib/                      # mpv DLLs (Windows: libmpv-wrapper.dll, libmpv-2.dll)
│
├── atlas/                        # Comprehensive documentation
│   ├── README.md                 # This file - documentation index
│   ├── app-banner.md             # App Banner (top-level banner for Player Controller)
│   ├── page-banner.md            # Page Banner (Videos, Playlists, etc. pages)
│   ├── playlist&tab.md
│   ├── importexport.md
│   ├── ui.md                     # UI documentation index
│   ├── ui-layout.md              # Layout & Side Menu
│   ├── top-navigation.md         # Top Navigation contextual mini-header
│   ├── bottom-navigation.md      # Bottom Navigation secondary contextual bar
│   ├── player-controller-unified.md  # Unified player controller index
│   ├── player-controller-top-menus.md # Top Videos & Playlist Menus
│   ├── player-controller-orb-menu.md # Central Orb configs and spills
│   ├── page-videos.md            # Videos Page layout and UI
│   ├── page-playlists.md         # Playlists Page layout and UI
│   ├── page-history.md           # History Page layout and UI
│   ├── page-pins.md              # Pins Page layout and UI
│   ├── page-likes.md             # Likes Page layout and UI
│   ├── tasks-page.md             # Tasks page (checklist, date-grouped, 3-dot menu)
│   ├── orb-page.md               # OrbPage configuration documentation
│   ├── orb-navigation.md         # Orb Navigation System documentation
│   ├── you-page.md               # YouPage configuration documentation
│   ├── page-page.md              # PagePage configuration documentation
│   ├── asset-manager-page.md     # Asset Manager Page documentation
│   ├── app-page.md               # AppPage configuration documentation
│   ├── card-playlist.md          # Playlist & Folder card components
│   ├── card-video.md             # Video card components
│   ├── card-tweet.md             # Tweet card components
│   ├── group-carousel.md         # Group carousel system (colored folders, 16 colors, PlaylistBar prism, assign/rename/delete)
│   ├── playlist-bar.md           # PlaylistBar: Playlists page sticky toolbar and folder prism
│   ├── playlist-pagination.md    # Pagination systems for Playlists page (All/Unsorted list & Folder prism pages)
│   ├── group-badge-player-controller.md  # Group badge + arrow cycling (all carousels) + playlist nav restricted to group
│   ├── ui-modals.md              # Modal components
│   ├── drumstick-rating-system.md
│   ├── videoplayer.md
│   ├── local-videos.md
│   ├── audio-visualizer.md
│   ├── debug.md
│   ├── state-management.md
│   ├── database-schema.md
│   ├── api-bridge.md
│   ├── navigation-routing.md
│   ├── video-tweet-card-three-dot-menu.md  # All-in-one 3-dot menu (VideoCard & TweetCard)
│   ├── popout-browser.md         # Documentation for standalone webview windows (e.g. Twitter)
│   ├── fullscreen-video-info.md  # Fullscreen right-margin video metadata panel (thumbnail, author, views, year)
│   ├── video-sort-filters.md     # Videos page sticky toolbar: VideoSortFilters (sort/rating) + folder prism
│   ├── session-updates.md        # Development session logs
│   └── video-queue.md            # Temporary session-based queue system
│
├── dev-logs/                     # Development change logs
│   ├── README.md                 # Dev logs guide
│   ├── TEMPLATE.md               # Dev log template
│   └── [YYYY-MM-DD-feature-name].md  # Individual dev logs
│
├── playlists.db                  # SQLite database file (project root)
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── projectcontext.md             # Detailed project context
└── keylist.md                    # Feature documentation structure
```

## Quick Reference: Where to Find What

### By Feature Area

| Feature | Primary Document | Related Documents |
|---------|-----------------|-------------------|
| **Player Controller** | `player-controller-unified.md` | `navigation-routing.md`, `player-controller-top-menus.md`, `player-controller-orb-menu.md` |
| **Settings Hub** | `page-page.md` | `state-management.md` (configStore) |
| **Orb Configuration** | `orb-page.md` | `state-management.md` (configStore), `orb-navigation.md` |
| **Profile & Signature** | `you-page.md` | `state-management.md` (configStore) |
| **Page Banner & Layer 2** | `page-page.md` | `state-management.md` (configStore), `page-banner.md` |
| **Asset Manager** | `asset-manager-page.md` | `orb-page.md`, `page-page.md`, `state-management.md` |
| **App Banner & Borders** | `app-page.md` | `state-management.md` (configStore), `app-banner.md` |
| **Support Hub** | `ui.md` | `navigation-routing.md`, `playlistStore.js` |
| **Playlists & Tabs** | `playlist&tab.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Import/Export** | `importexport.md` | `api-bridge.md`, `database-schema.md` |
| **Twitter/X Integration** | `twitter-integration.md` | `importexport.md`, `database-schema.md`, `ui.md` |
| **UI Components** | `ui.md` | `state-management.md`, `navigation-routing.md`, `card-playlist.md`, `card-video.md` |
| **Watch History** | `page-history.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Pins** | `page-pins.md` | `state-management.md` |
| **Likes** | `page-likes.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Video Player** | `videoplayer.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Fullscreen Video Info** | `fullscreen-video-info.md` | `ui-layout.md`, `videoplayer.md`, `state-management.md` (playlistStore) |
| **Drumstick Rating** | `drumstick-rating-system.md` | `database-schema.md`, `api-bridge.md`, `card-video.md`, `video-tweet-card-three-dot-menu.md` |
| **Videos Page Sort & Folder Prism** | `video-sort-filters.md` | `page-videos.md`, `drumstick-rating-system.md`, `playlist&tab.md`, `state-management.md` |
| **Video/Tweet Card 3-Dot Menu** | `video-tweet-card-three-dot-menu.md` | `card-video.md`, `card-tweet.md`, `drumstick-rating-system.md`, `playlist&tab.md` |
| **Local Videos** | `local-videos.md` | `videoplayer.md`, `database-schema.md`, `api-bridge.md`, `importexport.md` |
| **Audio Visualizer** | `audio-visualizer.md` | `player-controller-unified.md`, `api-bridge.md` |
| **Mission Hub** | `mission-hub.md` | `state-management.md` |
| **Pop-out Browser** | `popout-browser.md` | `player-controller-unified.md` |
| **App Banner** | `app-banner.md` | `player-controller-unified.md`, `ui-layout.md`, `state-management.md` |
| **Video Queue** | `video-queue.md` | `player-controller-unified.md`, `state-management.md` |
| **Page Banner** | `page-banner.md` | `page-videos.md`, `page-playlists.md`, `ui-layout.md`, `state-management.md` |
| **Playlist Cards** | `card-playlist.md` | `playlist&tab.md`, `ui.md`, `api-bridge.md` |
| **Group Carousel (Playlists Page)** | `group-carousel.md` | `playlist-bar.md`, `card-playlist.md`, `state-management.md`, `page-playlists.md`, `page-banner.md` (TopNavigation) |
| **Playlist Pagination System** | `playlist-pagination.md` | `playlist-bar.md`, `group-carousel.md`, `page-playlists.md` |
| **PlaylistBar** | `playlist-bar.md` | `group-carousel.md`, `video-sort-filters.md`, `state-management.md` |
| **Group Badge & Playlist Nav** | `group-badge-player-controller.md` | `group-carousel.md`, `player-controller-top-menus.md` |
| **Bottom Navigation Bar** | `bottom-navigation.md` | `top-navigation.md`, `page-videos.md` |
| **Subscription Manager** | `subscription-manager.md` | `api-bridge.md`, `database-schema.md` |
| **Pokedex System** | `pokedex-system.md` | `gen1-pokemon-reference.md`, `state-management.md`, `database-schema.md` |
| **Tasks Page** | `tasks-page.md` | `page-pins.md`, `state-management.md` (pinsPageChecklistStore) |
| **Debug/Testing** | `debug.md` | `ui.md` (inspect mode, debug bounds) |

### By Technical Domain

| Domain | Document | Related Documents |
|--------|----------|-------------------|
| **State Management** | `state-management.md` | All feature docs (stores used throughout) |
| **Database** | `database-schema.md` | `api-bridge.md`, all feature docs (data persistence) |
| **API Layer** | `api-bridge.md` | `database-schema.md`, all feature docs (data operations) |
| **Navigation** | `navigation-routing.md` | `player-controller-unified.md`, `ui.md`, `state-management.md` |

## Document Descriptions

### Feature Documentation

#### `orb-navigation.md`
**Covers**: Independent Orb navigation system within the Player Controller
**Key Topics**: **Orb Context**, **Live Preview**, **Playlist Filtering**, **Direct Selection**
**Cross-References**: See `player-controller-unified.md`, `state-management.md` (`configStore`)

#### `mission-hub.md`
**Covers**: Gamified start screen, mission system, time bank productivity, tab management
**Key Topics**: **Home Hub**, mission creation/reset, time-gating, **disable time restrictions** (Settings), persistence
**Cross-References**: See `state-management.md` (missionStore)

#### `player-controller-unified.md`
**Covers**: Central orb, menu rectangles, playlist/video navigation, preview system, folder management, dual player system, likes playlist
**Key Topics**: Orb customization, **orb presets**, preview navigation, colored shuffle, quick assign, pin system
**Cross-References**: See `navigation-routing.md` for navigation flows, `state-management.md` for store usage, `orb-navigation.md` for dedicated controls

#### `playlist&tab.md`
**Covers**: Playlist management, tab system, tab presets, colored folders, sticky folders
**Key Topics**: Playlist CRUD, tab organization, folder assignments, bulk tagging
**Cross-References**: See `database-schema.md` for table structures, `api-bridge.md` for commands

#### `importexport.md`
**Covers**: YouTube import, JSON import/export, bulk import
**Key Topics**: YouTube Data API v3, JSON format, local references, folder assignments in exports
**Cross-References**: See `api-bridge.md` for import commands, `database-schema.md` for data structure

#### `ui.md`
**Covers**: Side menu, page layouts, grid systems, **Support Hub**, **Custom Player Borders**, **Custom ASCII Banners**
**Key Topics**: General overarching layout concepts. See specific page documents for page breakdown (e.g. `page-videos.md`, `page-playlists.md`).
**Cross-References**: See `state-management.md` for page routing, `navigation-routing.md` for navigation flows

#### `page-history.md`
**Covers**: Watch history tracking, history page display
**Key Topics**: Last 100 videos, deduplication, **list layout**, history cards
**Cross-References**: See `database-schema.md` for watch_history table, `api-bridge.md` for history commands

#### `tasks-page.md`
**Covers**: Dedicated Tasks page for bullet-point checklists (date-grouped, tick-to-complete, 3-dot menu: Edit, Copy, Delete). Entry from Pins page; Back to Pins; persistence via pinsPageChecklistStore (IndexedDB).
**Cross-References**: See `page-pins.md`, `state-management.md` for store pattern

#### `drumstick-rating-system.md`
**Covers**: 5-drumstick rating system, persistence, UI integration
**Key Topics**: Database schema updates, optimistic UI, card integration (VideoCard/TweetCard), event propagation protection
**Cross-References**: See `database-schema.md` for `playlist_items` table, `api-bridge.md` for rating commands, `card-video.md` for card components, `video-tweet-card-three-dot-menu.md` for menu integration

#### `video-tweet-card-three-dot-menu.md`
**Covers**: All-in-one 3-dot menu for VideoCard and TweetCard on the Videos page
**Key Topics**: Horizontal menu layout (actions, pins/rating/sticky, folder grid), BulkTagColorGrid in menu and in bulk-tag strip, positioning above row, no hover clutter
**Cross-References**: See `card-video.md` for card components, `drumstick-rating-system.md` for rating, `playlist&tab.md` for folder assignment

#### `video-sort-filters.md`
**Covers**: Videos page sticky toolbar—VideoSortFilters component (sort and rating filter) and colored folder prism
**Key Topics**: Two toolbar buttons (Home/default, Funnel); funnel dropdown with sort options (Date/Progress/Last viewed, direction cycling) and horizontal rating filter (1–5 drumsticks); folder prism modes (populated-only equal-width vs all segments); state and data flow in VideosPage
**Cross-References**: See `page-videos.md`, `drumstick-rating-system.md`, `playlist&tab.md`, `state-management.md`

#### `videoplayer.md`
**Covers**: YouTube iframe player, progress tracking, dual player system
**Key Topics**: YouTube IFrame API, progress persistence, watch status (unwatched/partially watched/watched)
**Cross-References**: See `database-schema.md` for video_progress table, `api-bridge.md` for progress commands

#### `fullscreen-video-info.md`
**Covers**: Fullscreen right-margin panel showing current video thumbnail, author, view count (with 4-bar icon), year, description (truncated), and tags (pills). Instant blank when opening splitscreen.
**Key Topics**: Fullscreen-only layout, playlistStore (currentPlaylistItems, currentVideoIndex), layoutStore (fullscreenInfoBlanked), LayoutShell grid slot
**Cross-References**: See `ui-layout.md` for fullscreen grid, player width, and fullscreen↔splitscreen transition; `videoplayer.md`, `player-controller-unified.md`

#### `local-videos.md`
**Covers**: Local video file playback, file upload, HTML5 video player
**Key Topics**: Local file paths, file selection dialog, progress tracking for local videos, player routing
**Cross-References**: See `videoplayer.md` for player architecture, `database-schema.md` for is_local field, `api-bridge.md` for file commands

#### `twitter-integration.md`
**Covers**: Twitter/X media import, display, and image hover preview system
**Key Topics**: Twitter JSON import (bookmarks/tweets), title cleaning, profile pictures, 4chanX-style image expansion, high-res preview URLs, smart positioning
**Cross-References**: See `importexport.md` for import patterns, `database-schema.md` for profile_image_url field, `card-tweet.md` for card components

#### `audio-visualizer.md`
**Covers**: System-wide audio visualization, cpal backend integration, FFT processing
**Key Topics**: Rust audio capture, thread safety, frequency mapping, performance tuning
**Cross-References**: See `player-controller-unified.md` for UI integration, `api-bridge.md` for commands

#### `app-banner.md`
**Covers**: Top-level application banner that serves as background for Player Controller
**Key Topics**: Infinite scroll animation, custom image uploads, GIF support, window controls integration, draggable region
**Cross-References**: See `player-controller-unified.md` for controller details, `ui-layout.md` for layout system

#### `page-banner.md`
**Covers**: Contextual page banners on all pages (Videos, Playlists, Likes, Pins, History, PagePage, OrbPage, YouPage, AppPage) with metadata and customization
**Key Topics**: Compact 332px transparent banner, Layer 2 image positioning, Media Carousel with hover-revealed arrow navigation (continue/pinned/ASCII), Sticky Toolbar integration, custom folder banners, animated patterns, **theme group leader system**, **smooth fade transitions**
**Cross-References**: See `page-videos.md` / `page-playlists.md` for page components, `ui-layout.md` for layout system

#### `asset-manager-page.md`
**Covers**: Unified Asset Manager hub (`AssetManagerPage.jsx`)
**Key Topics**: 4-Tab Navigation (Orb, Page, App, Theme), Content Carousels, Sub-Navigation (Folder/File), Spatial Controls
**Cross-References**: See `orb-page.md`, `page-page.md` for specific asset details

#### `group-carousel.md`
**Covers**: Group carousel system on the Playlists page with colored-folder model (16 colors, one group per color)
**Key Topics**: ALL / UNSORTED / GROUPS views; folder prism in PlaylistBar; per-carousel display mode (Large / Small / Bar); PlaylistGroupColumn “assign to colored folder” (placeholders vs group cards); playlistGroupStore; TopNavigation “apply to all”
**Cross-References**: See `playlist-bar.md`, `group-badge-player-controller.md`, `card-playlist.md`, `state-management.md`, `page-playlists.md`

#### `playlist-bar.md`
**Covers**: Playlists page sticky toolbar (PlaylistBar.jsx): VideoSortFilters, Add/Refresh/Bulk tag, folder prism, Back/Close
**Key Topics**: Props; prism segments (All, Unsorted, colors with a group); populated-only vs all-segments (right-click); relation to PlaylistsPage and group carousels
**Cross-References**: See `group-carousel.md`, `video-sort-filters.md`, `state-management.md`, `playlist&tab.md`

#### `group-badge-player-controller.md`
**Covers**: Group carousel badge on the Player Controller Top Playlist Menu, left/right arrow cycling through all group carousels, and restriction of playlist navigation (up/down) to the selected group
**Key Topics**: Single group badge, visible left/right arrows (cycle all carousels), "entered from" group (activeGroupId), playlist nav range, PlaylistCard groupIdFromCarousel/onEnterFromGroup
**Cross-References**: See `group-carousel.md`, `player-controller-top-menus.md` (Top Playlist Menu), `state-management.md`

#### `debug.md`
**Covers**: Debug bounds, inspect mode, layout debugging, ruler overlay (non-functional)
**Key Topics**: Visual debugging, element labels, layout regions, measurement tools
**Cross-References**: See `ui.md` for layout structure, `state-management.md` for debug state

### Technical Documentation

#### `state-management.md`
**Covers**: All Zustand stores, state flow patterns, persistence strategies
**Key Topics**: Store architecture, state dependencies, IndexedDB/localStorage vs database persistence
**Cross-References**: Referenced by all feature docs (stores are used throughout)

#### `database-schema.md`
**Covers**: Complete SQLite schema, all tables, relationships, indexes
**Key Topics**: Table structures, foreign keys, query patterns, data types
**Cross-References**: Referenced by all feature docs (data persistence), `api-bridge.md` (commands use schema)

#### `api-bridge.md`
**Covers**: Tauri command layer, API function organization, error handling
**Key Topics**: Command categories, parameter naming (snake_case ↔ camelCase), type conversions
**Cross-References**: Referenced by all feature docs (data operations), `database-schema.md` (commands use schema)

#### `navigation-routing.md`
**Covers**: Page navigation, playlist navigation, video navigation, preview navigation, folder filtering
**Key Topics**: Navigation flows, state preservation, entry points, navigation modes
**Cross-References**: See `player-controller-unified.md` for player navigation, `ui.md` for page routing

## Cross-Reference Guide

### When Working On...

**Videos Page Sticky Bar (Sort & Folder Prism):**
- Primary: `video-sort-filters.md` (VideoSortFilters component + folder prism behavior)
- Also: `page-videos.md` (Sticky Toolbar)
- Components: `VideoSortFilters.jsx`, `VideosPage.jsx` (toolbar row)
- State: `layoutStore` (Videos page UI triggers), `folderStore` (bulkTagMode, selectedFolder), `paginationStore`
- Rating filter: `drumstick-rating-system.md`

**Group Carousel (Playlists):**
- Primary: `group-carousel.md`
- State: `state-management.md` (playlistGroupStore, tabStore, layoutStore playlistsPageShowTitles/showPlaylistUploader)
- UI: `TopNavigation.jsx` (Playlists bar when on Playlists page), `PlaylistsPage.jsx`, `PlaylistBar.jsx` (sticky toolbar + prism), `GroupPlaylistCarousel.jsx`, `PlaylistGroupColumn.jsx`, `PlaylistCard.jsx` (menu)
- Toolbar + prism: `playlist-bar.md`

**Group Badge & Playlist Nav (Player Controller):**
- Primary: `group-badge-player-controller.md`
- State: `playlistGroupStore.js` (activeGroupId), `playlistStore.js` (navigationItems, next/previous)
- UI: `PlayerController.jsx` (badge, nav build), `PlaylistCard.jsx` (onEnterFromGroup), `PlaylistsPage.jsx` (pass group/clear)

**Folder Assignments:**
- Primary: `playlist&tab.md` (Section 2.2)
- Database: `database-schema.md` (video_folder_assignments table)
- API: `api-bridge.md` (Folder Assignment Commands)
- State: `state-management.md` (folderStore)

**Video Progress:**
- Primary: `videoplayer.md` (Section 6.2)
- Database: `database-schema.md` (video_progress table)
- API: `api-bridge.md` (Video Progress Commands)
- State: `state-management.md` (playlistStore - video index)

**Preview Navigation:**
- Primary: `player-controller-unified.md` (Preview system logic)
- Navigation: `navigation-routing.md` (Preview Navigation section)
- State: `state-management.md` (playlistStore - preview state)

**Tab System:**
- Primary: `playlist&tab.md` (Section 2.3)
- State: `state-management.md` (tabStore, tabPresetStore)
- Database: None (localStorage only)

**Import/Export:**
- Primary: `importexport.md`
- API: `api-bridge.md` (Import/Export Commands)
- Database: `database-schema.md` (playlists, playlist_items, video_folder_assignments tables)

**Card Components:**
- Primary: `card-playlist.md`, `card-tweet.md`, `card-video.md`
- Usage: All feature docs use cards (playlists, videos, history)

**Navigation Flows:**
- Primary: `navigation-routing.md`
- UI: `ui.md` (page routing)
- Controller: `player-controller-unified.md` (playlist/video navigation)

## Document Structure

Each feature document follows this structure:
1. **User-Perspective Description** - What users see and interact with
2. **File Manifest** - All responsible files (UI/Components, State Management, API/Bridge, Backend)
3. **Logic & State Chain** - Trigger → Action → Persistence flow, Source of Truth, State Dependencies

Each technical document follows this structure:
1. **Overview** - Purpose and scope
2. **Architecture** - System design and patterns
3. **Details** - Comprehensive reference
4. **Patterns** - Common usage patterns
5. **Troubleshooting** - Common issues and solutions

## Missing Documentation

The following features are mentioned in `projectcontext.md` but not yet fully documented:

- **Layout Shell**: Detailed layout system documentation (covered in `ui-layout.md` but could be expanded)

## Known Issues / Non-Functional Features

The following features exist in the codebase but are currently non-functional:
- **Ruler Overlay**: Measurement tool for main player area (see `debug.md` section 7.3)
  - Toggle button works and state management is functional
  - Component renders but ruler visualization does not appear
  - Infrastructure exists but requires debugging
- **Advanced Player Controller Layout**:
  - **Status: RESOLVED**. The top menu layout has been restored with fixed dimensions and absolute positioning.
  - Minor visual tuning may still be desired, but the critical regression is fixed.
- **Mega Shuffle (Right-Click on Playlist Title)**: 
  - **Status: NON-FUNCTIONAL**. The `handleShufflePlaylist()` function exists and works correctly when called programmatically, but right-click events on the playlist title are not being captured.
  - Multiple implementation attempts were made:
    - React `onContextMenu` and `onMouseDown` handlers
    - Direct `addEventListener` with capture phase
    - Event handlers on both container and h1 elements
  - None of these approaches successfully capture right-click events - no console logs appear when right-clicking
  - Possible causes: Overlay element blocking events, CSS `pointer-events` issues, or Tauri-specific event handling
  - The function itself is functional and can be triggered via other means (e.g., programmatic call or alternative UI trigger)

## Theme Documentation

For detailed information about the application's theme system and recent color changes, see:
- **`THEME_CHANGES.md`** (project root): Comprehensive documentation of theme changes, color palette, and implementation details

## Usage Tips

1. **Start with feature docs** for user-facing functionality
2. **Reference technical docs** when you need implementation details
3. **Use cross-references** to navigate between related topics

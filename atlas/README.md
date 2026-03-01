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
│   │   ├── VideoSortFilters.jsx # Icon sort bar (Home/Date/Progress/Last Viewed) + hover-expand drumstick rating filter for Videos toolbar
│   │   ├── TweetPage.jsx         # Full screen tweet detail view
│   │   ├── HistoryPage.jsx       # Watch history display (last 100 videos)
│   │   ├── LikesPage.jsx         # Liked videos grid view
│   │   ├── PinsPage.jsx          # Pinned videos grid view
│   │   ├── TasksPage.jsx        # Dedicated tasks/checklist page (date-grouped, tick + 3-dot menu)
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
│   ├── advanced-player-controller.md
│   ├── app-banner.md             # App Banner (top-level banner for Player Controller)
│   ├── page-banner.md            # Page Banner (Videos, Playlists, etc. pages)
│   ├── playlist&tab.md
│   ├── importexport.md
│   ├── ui.md                     # UI documentation index
│   ├── ui-layout.md              # Layout & Side Menu
│   ├── ui-pages.md               # Page components (main pages)
│   ├── top-navigation.md         # Top Navigation contextual mini-header
│   ├── bottom-navigation.md      # Bottom Navigation secondary contextual bar
│   ├── tasks-page.md             # Tasks page (checklist, date-grouped, 3-dot menu)
│   ├── orb-page.md               # OrbPage configuration documentation
   ├── orb-navigation.md         # Orb Navigation System documentation
│   ├── you-page.md               # YouPage configuration documentation
│   ├── page-page.md              # PagePage configuration documentation
│   ├── asset-manager-page.md     # Asset Manager Page documentation
│   ├── app-page.md               # AppPage configuration documentation
│   ├── ui-cards.md               # Card components
│   ├── playlist-cards.md         # Detailed documentation for Playlist Cards
│   ├── group-carousel.md         # Group carousel system (colored folders, 16 colors, PlaylistBar prism, assign/rename/delete)
│   ├── playlist-bar.md           # PlaylistBar: Playlists page sticky toolbar and folder prism
│   ├── playlist-pagination.md    # Pagination systems for Playlists page (All/Unsorted list & Folder prism pages)
│   ├── group-badge-player-controller.md  # Group badge + arrow cycling (all carousels) + playlist nav restricted to group
│   ├── ui-modals.md              # Modal components
│   ├── history.md
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
│   ├── fullscreen-video-info.md # Fullscreen right-margin video metadata panel (thumbnail, author, views, year)
│   ├── video-sort-filters.md    # Videos page sticky toolbar: VideoSortFilters (sort/rating) + folder prism
│   └── session-updates.md        # Development session logs
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
| **Player Controller** | `advanced-player-controller.md` | `navigation-routing.md`, `state-management.md` |
| **Settings Hub** | `ui-pages.md` (Section 4.1.9) | `state-management.md` (configStore) |
| **Orb Configuration** | `orb-page.md` | `state-management.md` (configStore), `orb-navigation.md` |
| **Profile & Signature** | `you-page.md` | `state-management.md` (configStore) |
| **Page Banner & Layer 2** | `page-page.md` | `state-management.md` (configStore), `page-banner.md` |
| **Asset Manager** | `asset-manager-page.md` | `orb-page.md`, `page-page.md`, `state-management.md` |
| **App Banner & Borders** | `app-page.md` | `state-management.md` (configStore), `app-banner.md` |
| **Support Hub** | `ui.md` | `navigation-routing.md`, `playlistStore.js` |
| **Playlists & Tabs** | `playlist&tab.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Import/Export** | `importexport.md` | `api-bridge.md`, `database-schema.md` |
| **Twitter/X Integration** | `twitter-integration.md` | `importexport.md`, `database-schema.md`, `ui.md` |
| **UI Components** | `ui.md` | `state-management.md`, `navigation-routing.md` |
| **Watch History** | `history.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Video Player** | `videoplayer.md` | `database-schema.md`, `api-bridge.md`, `state-management.md` |
| **Fullscreen Video Info** | `fullscreen-video-info.md` | `ui-layout.md`, `videoplayer.md`, `state-management.md` (playlistStore) |
| **Drumstick Rating** | `drumstick-rating-system.md` | `database-schema.md`, `api-bridge.md`, `ui-cards.md`, `video-tweet-card-three-dot-menu.md` |
| **Videos Page Sort & Folder Prism** | `video-sort-filters.md` | `ui-pages.md` (§4.1.2), `drumstick-rating-system.md`, `playlist&tab.md`, `state-management.md` |
| **Video/Tweet Card 3-Dot Menu** | `video-tweet-card-three-dot-menu.md` | `ui-cards.md`, `drumstick-rating-system.md`, `playlist&tab.md` |
| **Local Videos** | `local-videos.md` | `videoplayer.md`, `database-schema.md`, `api-bridge.md`, `importexport.md` |
| **Audio Visualizer** | `audio-visualizer.md` | `advanced-player-controller.md`, `api-bridge.md` |
| **Mission Hub** | `mission-hub.md` | `player-controller.md`, `state-management.md` |
| **Pop-out Browser** | `popout-browser.md` | `advanced-player-controller.md` |
| **App Banner** | `app-banner.md` | `advanced-player-controller.md`, `ui-layout.md`, `state-management.md` |
| **Page Banner** | `page-banner.md` | `ui-pages.md`, `ui-layout.md`, `state-management.md` |
| **Playlist Cards** | `playlist-cards.md` | `playlist&tab.md`, `ui.md`, `api-bridge.md` |
| **Group Carousel (Playlists Page)** | `group-carousel.md` | `playlist-bar.md`, `playlist-cards.md`, `state-management.md`, `ui-pages.md`, `page-banner.md` (TopNavigation) |
| **Playlist Pagination System** | `playlist-pagination.md` | `playlist-bar.md`, `group-carousel.md`, `ui-pages.md` |
| **PlaylistBar (Playlists toolbar + prism)** | `playlist-bar.md` | `group-carousel.md`, `video-sort-filters.md`, `state-management.md` |
| **Group Badge & Playlist Nav (Player Controller)** | `group-badge-player-controller.md` | `group-carousel.md`, `advanced-player-controller.md` |
| **Bottom Navigation Bar** | `bottom-navigation.md` | `top-navigation.md`, `ui-pages.md` |
| **Subscription Manager** | `subscription-manager.md` | `api-bridge.md`, `database-schema.md` |
| **Pokedex System** | `pokedex-system.md` | `gen1-pokemon-reference.md`, `state-management.md`, `ui-pages.md`, `database-schema.md` |
| **Tasks Page** | `tasks-page.md` | `ui-pages.md` (Pins §4.1.4, Tasks §4.1.5), `state-management.md` (pinsPageChecklistStore) |
| **Debug/Testing** | `debug.md` | `ui.md` (inspect mode, debug bounds) |

### By Technical Domain

| Domain | Document | Related Documents |
|--------|----------|-------------------|
| **State Management** | `state-management.md` | All feature docs (stores used throughout) |
| **Database** | `database-schema.md` | `api-bridge.md`, all feature docs (data persistence) |
| **API Layer** | `api-bridge.md` | `database-schema.md`, all feature docs (data operations) |
| **Navigation** | `navigation-routing.md` | `advanced-player-controller.md`, `ui.md`, `state-management.md` |

## Document Descriptions

### Feature Documentation

#### `orb-navigation.md`
**Covers**: Independent Orb navigation system within the Player Controller
**Key Topics**: **Orb Context**, **Live Preview**, **Playlist Filtering**, **Direct Selection**
**Cross-References**: See `advanced-player-controller.md`, `state-management.md` (`configStore`)

#### `mission-hub.md`
**Covers**: Gamified start screen, mission system, time bank productivity, tab management
**Key Topics**: **Home Hub**, mission creation/reset, time-gating, **disable time restrictions** (Settings), persistence
**Cross-References**: See `state-management.md` (missionStore), `ui-pages.md` (UI integration)

#### `advanced-player-controller.md`
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
**Covers**: Side menu, page layouts, card components, grid systems, star color picker menu, **Support Hub**, **Custom Player Borders**, **Custom ASCII Banners**
**Key Topics**: PlaylistsPage, VideosPage, **HistoryPage (List Layout)**, **SupportPage (Tabs & Split View)**, Card architecture, folder selector
**Cross-References**: See `state-management.md` for page routing, `navigation-routing.md` for navigation flows

#### `history.md`
**Covers**: Watch history tracking, history page display
**Key Topics**: Last 100 videos, deduplication, **list layout**, history cards
**Cross-References**: See `database-schema.md` for watch_history table, `api-bridge.md` for history commands

#### `tasks-page.md`
**Covers**: Dedicated Tasks page for bullet-point checklists (date-grouped, tick-to-complete, 3-dot menu: Edit, Copy, Delete). Entry from Pins page; Back to Pins; persistence via pinsPageChecklistStore (IndexedDB).
**Cross-References**: See `ui-pages.md` (Pins §4.1.4, Tasks §4.1.5), `state-management.md` for store pattern

#### `drumstick-rating-system.md`
**Covers**: 5-drumstick rating system, persistence, UI integration
**Key Topics**: Database schema updates, optimistic UI, card integration (VideoCard/TweetCard), event propagation protection
**Cross-References**: See `database-schema.md` for `playlist_items` table, `api-bridge.md` for rating commands, `ui-cards.md` for card components, `video-tweet-card-three-dot-menu.md` for menu integration

#### `video-tweet-card-three-dot-menu.md`
**Covers**: All-in-one 3-dot menu for VideoCard and TweetCard on the Videos page
**Key Topics**: Horizontal menu layout (actions, pins/rating/sticky, folder grid), BulkTagColorGrid in menu and in bulk-tag strip, positioning above row, no hover clutter
**Cross-References**: See `ui-cards.md` for card components, `drumstick-rating-system.md` for rating, `playlist&tab.md` for folder assignment

#### `video-sort-filters.md`
**Covers**: Videos page sticky toolbar—VideoSortFilters component (sort and rating filter) and colored folder prism
**Key Topics**: Two toolbar buttons (Home/default, Funnel); funnel dropdown with sort options (Date/Progress/Last viewed, direction cycling) and horizontal rating filter (1–5 drumsticks); folder prism modes (populated-only equal-width vs all segments); state and data flow in VideosPage
**Cross-References**: See `ui-pages.md` (§4.1.2), `drumstick-rating-system.md`, `playlist&tab.md`, `state-management.md`

#### `videoplayer.md`
**Covers**: YouTube iframe player, progress tracking, dual player system
**Key Topics**: YouTube IFrame API, progress persistence, watch status (unwatched/partially watched/watched)
**Cross-References**: See `database-schema.md` for video_progress table, `api-bridge.md` for progress commands

#### `fullscreen-video-info.md`
**Covers**: Fullscreen right-margin panel showing current video thumbnail, author, view count (with 4-bar icon), year, description (truncated), and tags (pills). Instant blank when opening splitscreen.
**Key Topics**: Fullscreen-only layout, playlistStore (currentPlaylistItems, currentVideoIndex), layoutStore (fullscreenInfoBlanked), LayoutShell grid slot
**Cross-References**: See `ui-layout.md` for fullscreen grid, player width, and fullscreen↔splitscreen transition; `videoplayer.md`, `advanced-player-controller.md`

#### `local-videos.md`
**Covers**: Local video file playback, file upload, HTML5 video player
**Key Topics**: Local file paths, file selection dialog, progress tracking for local videos, player routing
**Cross-References**: See `videoplayer.md` for player architecture, `database-schema.md` for is_local field, `api-bridge.md` for file commands

#### `twitter-integration.md`
**Covers**: Twitter/X media import, display, and image hover preview system
**Key Topics**: Twitter JSON import (bookmarks/tweets), title cleaning, profile pictures, 4chanX-style image expansion, high-res preview URLs, smart positioning
**Cross-References**: See `importexport.md` for import patterns, `database-schema.md` for profile_image_url field, `ui.md` for card components

#### `audio-visualizer.md`
**Covers**: System-wide audio visualization, cpal backend integration, FFT processing
**Key Topics**: Rust audio capture, thread safety, frequency mapping, performance tuning
**Cross-References**: See `advanced-player-controller.md` for UI integration, `api-bridge.md` for commands

#### `app-banner.md`
**Covers**: Top-level application banner that serves as background for Player Controller
**Key Topics**: Infinite scroll animation, custom image uploads, GIF support, window controls integration, draggable region
**Cross-References**: See `advanced-player-controller.md` for controller details, `ui-layout.md` for layout system

#### `page-banner.md`
**Covers**: Contextual page banners on all pages (Videos, Playlists, Likes, Pins, History, PagePage, OrbPage, YouPage, AppPage) with metadata and customization
**Key Topics**: Compact 332px transparent banner, Layer 2 image positioning, Media Carousel with hover-revealed arrow navigation (continue/pinned/ASCII), Sticky Toolbar integration, custom folder banners, animated patterns, **theme group leader system** (replaces legacy folder theme), **folder conditions (random/first)**, **image destination assignments (pages/folder colors)**, **smooth fade transitions**
**Cross-References**: See `ui-pages.md` for page components, `ui-layout.md` for layout system, `page-page.md` for configuration

#### `asset-manager-page.md`
**Covers**: Unified Asset Manager hub (`AssetManagerPage.jsx`)
**Key Topics**: 4-Tab Navigation (Orb, Page, App, Theme), Content Carousels, Sub-Navigation (Folder/File), Spatial Controls
**Cross-References**: See `orb-page.md`, `page-page.md` for specific asset details

#### `group-carousel.md`
**Covers**: Group carousel system on the Playlists page with colored-folder model (16 colors, one group per color)
**Key Topics**: ALL / UNSORTED / GROUPS views; folder prism in PlaylistBar; per-carousel display mode (Large / Small / Bar); PlaylistGroupColumn “assign to colored folder” (placeholders vs group cards); playlistGroupStore (folderColorId, getGroupByColorId, getNextAvailableColorId); TopNavigation “apply to all”
**Cross-References**: See `playlist-bar.md`, `group-badge-player-controller.md`, `playlist-cards.md`, `state-management.md` (playlistGroupStore, tabStore, layoutStore), `ui-pages.md`, `page-banner.md` (TopNavigation)

#### `playlist-bar.md`
**Covers**: Playlists page sticky toolbar (PlaylistBar.jsx): VideoSortFilters, Add/Refresh/Bulk tag, folder prism, Back/Close
**Key Topics**: Props (groupColorIds, selectedFolder, onFolderSelect, allPlaylistCount, unsortedCount); prism segments (All, Unsorted, colors with a group); populated-only vs all-segments (right-click); relation to PlaylistsPage and group carousels
**Cross-References**: See `group-carousel.md`, `video-sort-filters.md`, `state-management.md`, `playlist&tab.md`

#### `group-badge-player-controller.md`
**Covers**: Group carousel badge on the Player Controller Top Playlist Menu, left/right arrow cycling through all group carousels, and restriction of playlist navigation (up/down) to the selected group
**Key Topics**: Single group badge, visible left/right arrows (cycle all carousels), "entered from" group (activeGroupId), playlist nav range, PlaylistCard groupIdFromCarousel/onEnterFromGroup
**Cross-References**: See `group-carousel.md`, `advanced-player-controller.md` (Top Playlist Menu), `state-management.md` (playlistGroupStore, playlistStore)

#### `debug.md`
**Covers**: Debug bounds, inspect mode, layout debugging, ruler overlay (non-functional)
**Key Topics**: Visual debugging, element labels, layout regions, measurement tools
**Cross-References**: See `ui.md` for layout structure, `state-management.md` for debug state

### Technical Documentation

#### `state-management.md`
**Covers**: All 7 Zustand stores, state flow patterns, persistence strategies
**Key Topics**: Store architecture, state dependencies, IndexedDB/localStorage vs database persistence
**Cross-References**: Referenced by all feature docs (stores are used throughout)

#### `database-schema.md`
**Covers**: Complete SQLite schema, all 6 tables, relationships, indexes
**Key Topics**: Table structures, foreign keys, query patterns, data types
**Cross-References**: Referenced by all feature docs (data persistence), `api-bridge.md` (commands use schema)

#### `api-bridge.md`
**Covers**: Tauri command layer, API function organization, error handling
**Key Topics**: Command categories, parameter naming (snake_case ↔ camelCase), type conversions
**Cross-References**: Referenced by all feature docs (data operations), `database-schema.md` (commands use schema)

#### `navigation-routing.md`
**Covers**: Page navigation, playlist navigation, video navigation, preview navigation, folder filtering
**Key Topics**: Navigation flows, state preservation, entry points, navigation modes
**Cross-References**: See `advanced-player-controller.md` for player navigation, `ui.md` for page routing

## Cross-Reference Guide

### When Working On...

**Videos Page Sticky Bar (Sort & Folder Prism):**
- Primary: `video-sort-filters.md` (VideoSortFilters component + folder prism behavior)
- Also: `ui-pages.md` (Section 4.1.2, Sticky Toolbar)
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
- Primary: `advanced-player-controller.md` (Section 1.4)
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
- Primary: `ui.md` (Section 4.1.1.1, 4.1.2.1)
- Usage: All feature docs use cards (playlists, videos, history)

**Navigation Flows:**
- Primary: `navigation-routing.md`
- UI: `ui.md` (page routing)
- Controller: `advanced-player-controller.md` (playlist/video navigation)

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

- **Layout Shell**: Detailed layout system documentation (covered in `ui.md` but could be expanded)

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

### Update Log (Current Session)
- **Context Menus & Renaming Capabilities**:
  - **Prism Context Menu**: The folder prism in the Videos page sticky toolbar now features a right-click context menu offering `Expand all colored folders` and `Rename [Folder/Playlist]`.
  - **VideoCard Context Menu**: Right-clicking anywhere on a `VideoCard` directly opens the `VideoCardThreeDotMenu`, behaving like a native context menu via `forwardRef` and `useImperativeHandle(openAt)`. Card displays a `cursor-context-menu` pointer.
  - **EditPlaylistModal Consolidation**: The modal was refactored to focus solely on renaming, eliminating unused fields (description, custom ASCII, and page banner backgrounds). Its positioning was altered to a sleek floating side panel (`z-[10000]`) avoiding UI overlap.
- **Floating Title & Glow Effect**:
  - **Dynamic Title Tracking**: Built a new active floating title into `TopNavigation.jsx` using a React Portal. The title dynamically tracks hovered colored folders across the `PlaylistBar` prism, `GroupPlaylistCarousel`s, and `PlaylistGroupColumn` (assign overlays), immediately updating the display text based on the contextual folder or custom carousel name.
  - **Splattered Aura Glow**: Replaced the static box backdrop with a massive, vibrant splatter glow using stacked, offset box shadows (a diffuse wide aura at 50px blur / 70% opacity and an intense core at 30px / 85% opacity). The glow instantly translates colors from the hovered or active colored folder.
  - **Text Styling Enhancement**: Switched the title typography to a thick `font-black`, outlined aesthetic to sharply punch through the bright, colored glow layout.
  - **Documentation**: Updated `atlas/top-navigation.md` to detail the Portal floating element and spline background glow behavior.
- **Videos Page Sticky Toolbar**: See **`video-sort-filters.md`** §8 (Change log) for VideoSortFilters funnel dropdown, prism right-click toggle, toolbar layout (Add/Refresh/Bulk tag left of prism, Back/Close right), and TopNavigation removals.
- **Player Controller See-Through & Metadata**:
  - **Top Playlist Menu**: Removed video metadata (author, view count, year published) from the bottom bar; only navigation controls (Previous, Grid, Next) remain.
  - **Top Playlist & Top Video Menus**: Panels and bottom bars use transparent backgrounds (`bg-transparent`), no solid backdrop or rectangular border, so the App Banner is fully visible behind them; a soft box shadow (`shadow-2xl`) defines the rounded-rectangle shape. Implemented in `PlayerController.jsx`; documented in `advanced-player-controller.md` (§1.3, §1.4).
- **Tasks Page & Pins Checklist**:
  - **Tasks Page** (`TasksPage.jsx`): Dedicated page for task checklists—creation bar (input + Add, Enter to add), tasks grouped by date (newest first), tick button (circle/check-in-circle) to mark done, 3-dot menu per task (Edit inline, Copy to clipboard, Delete). "Back to Pins" link and global Back return to Pins. State in `pinsPageChecklistStore` (IndexedDB).
  - **Pins Page**: "Tasks" link at top navigates to Tasks page; priority pin history carousel starts expanded. Checklist UI removed from Pins in favor of the dedicated Tasks page.
  - **Documentation**: Added `atlas/tasks-page.md`; updated `ui-pages.md` (§4.1.4 Pins, new §4.1.5 Tasks) and `README.md` (structure, Quick Reference, Document Descriptions).
- **Videos Page & Video Card UX**:
  - **Sticky toolbar**: Full width (no side margins), reduced margin below (`mb-4`) so the bar spans the video page and content area gains vertical space.
  - **Pagination**: Light theme (VideoSortFilters-style); up to 5 numbered page buttons with sliding window; prev/next with 500ms long-press for first/last page and charge-up animation.
  - **VideoCard**: No thumbnail hover expansion (ImageHoverPreview removed; reserved for TweetCard). Video ID subtitle below title removed.
- **App Banner (splitscreen spill)**: Spill hover uses simple full-banner opacity (`SPILL_HOVER_OPACITY` in `LayoutShell.jsx`, default 0.2) instead of cursor-following cutout; see `app-banner.md`.
- **Videos Page Sticky Bar & Folder Prism**:
  - **VideoSortFilters** (`VideoSortFilters.jsx`): Icon bar (Home, Funnel dropdown for sort by date/progress/last viewed + horizontal rating filter 1–5). Documented in `video-sort-filters.md`, `ui-pages.md` (4.1.2), and `drumstick-rating-system.md`.
  - **Folder prism**: All and Unsorted show **item counts** (not "All"/"?"). **Right-click on prism** toggles populated-only (only segments with ≥1 item, equal width) vs all segments; default is populated-only. No separate arrow button.
  - **Videos page sticky toolbar**: **Add**, **Refresh** (subscriptions), and **Bulk tag** sit left of the prism (right of the filter); **Back** and **Close** on the far right. **TopNavigation** no longer shows Add, Subscriptions, Bulk tag, Back, or Close when on Videos page—only the mini header title and (on the right) the Twitter style toggle remain there. layoutStore flags drive modals/refresh; VideosPage reacts and clears.
  - **Mini header gradient**: Gradient spans full width in splitscreen; removed horizontal padding from `.layout-shell__mini-header` (LayoutShell.css) and from the miniHeader wrapper in App.jsx. Content inset preserved via TopNavigation `pl-8`/`pr-8`.
- **Video Card & Bulk Tag UX**:
  - **Video card thumbnails**: Removed rounded corners and black outline from VideoCard thumbnails (YouTube and Twitter style). Card base component now supports an optional `rounded={false}` prop for square corners; VideoCard uses it so the full card and thumbnail area are square.
  - **BulkTagColorGrid placement**: In bulk tag mode, the 16-color folder grid no longer overlays the bottom quarter of the thumbnail. It now appears **below the thumbnail**, between thumbnail and title (VideoCard YouTube style), or below the thumbnail within the card (VideoCard Twitter style and TweetCard), in a fixed-height strip (`h-20`) for easier use.
  - **Bulk tag instant assign**: In bulk tag mode, clicking a color in the grid **immediately** assigns or unassigns that video to that folder (same as 3-dot menu or star); no Save or Cancel—each click persists to the database and updates the card. Toolbar Save/Cancel buttons removed.
- **Twitter Import & Integration**: 
  - Implemented **JSON Import** for Twitter bookmarks, allowing bulk import of tweets as "local" videos.
  - created `TweetCard` improvements for proper rendering of MP4s and GIFs.
  - Added **High-Res Hover Previews** for Twitter media using `ImageHoverPreview` bounded maximally to 95% of the viewport width/height to avoid cutoff.
  - **Native MP4 Playback Support**: Twitter videos (`.mp4`) are now natively supported in both the hover preview expansion and the full-page tweet view, complete with autoplay, looping, and a bypass for Twitter's CDN `403 Forbidden` referrer checks (`<meta name="referrer" content="no-referrer" />`).
  - **Playlist Card Integration**: Upgraded Twitter thumbnails to high-resolution (`name=large` & `medium`) inside playlist grid cards. Applied conditional smart framing (`object-fit: contain` with light sky blue background `#e0f2fe`) and wrapped them with `ImageHoverPreview` to give users a seamlessly huge high-res popout of Twitter pictures without ever overflowing the screen.
- **Performance Optimization**: 
  - Solved major lag on the Playlists Page by implementing `get_playlist_items_preview` (Rust backend).
  - Reduced overhead by fetching only 4 preview items per playlist instead of the entire dataset.
  - **Tweet Card Layout**:
    - **Optimized Grid**: Switched VideosPage to a 2-column layout on large screens.
    - **Uniform Sizing**: Both TweetCards and VideoCards now occupy a single cell (50% width), creating a balanced, gap-free grid.
- **Bug Fixes**:
  - **Pins**: Fixed a bug where pins were being duplicated in the store. Added robust checks to remove existing pins before adding new ones.
- **Subscription & Channel Management**:
  - **Channel Import Support**: 
    - Updated `ConfigPlaylistModal` (Unified Add) to fully support **YouTube Channel URLs** (e.g., `@ChannelName`). 
    - The system now automatically resolves channels to their "Uploads" playlist and fetches all videos.
  - **Subscription UI**:
    - Aligned `SubscriptionManagerModal` cleanly at the bottom of the screen (`items-end`, `pb-12`).
    - Added inline channel editing for assigning custom names (`custom_name`).
    - Added `last_synced_at` timestamp display below the fetch button.
    - Improved standard thumbnail crops by restoring `medium` resolution logic for YouTube thumbnails within `VideoCard.jsx` and switching to an `object-fit: cover` aspect ratio fill directly on the card.
  - **Backend Foundation**:
    - Created `playlist_sources` table in SQLite to track subscription sources, their limits, names, and sync times.
    - Implemented API endpoints (`add_playlist_source`, `get_playlist_sources`, `update_playlist_source_name`, `update_playlist_source_sync`) for subscription management features.
- **Asset Manager Enhancements**:
  - **Larger Orb Carousel**: Increased Orb preset size to 200px for better visibility, matching the Orb Page design.
  - **Layout Optimization**: Removed "Folder/File" sub-navigation to maximize vertical space.
  - **Scrollable Interface**: Enabled vertical scrolling and minimum height for the carousel to prevent items from being cut off.
  - **Simplified Visualizer**: Streamlined the Orb Spill Visualizer by hiding the image preview while keeping mask controls functional.
  - **Group Leader Implementation**: 
    - **Save Options**: Added "Save as New Leader" and "Save to Group" for both Orb Presets and Page Banners.
    - **Hierarchical Viewing**: Implemented `OrbGroupColumn` and `PageGroupColumn` to view subordinate items within a group.
    -   **Filtered Carousels**: Updated main carousels to display only Group Leaders and standalone items, reducing clutter.
  - **Group Configuration UI**:
    -   **Direct Property Control**: Refactored `OrbGroupColumn` and `PageGroupColumn` to replace playlist/folder assignment UI with direct configuration sliders (Scale, X/Y Offsets, Spill).
    -   **Vertical Space Optimization**: Removed the top-level Page Banner preview from the Asset Manager to expand the main content carousel area.
  - **Page Banner Disabled**: 
    -   **Mini Header Replacement**: Replaced the complex Page Banner and old Navigation Tabs with a streamlined **Mini Header** (100px height) centrally implemented in `TopNavigation.jsx`.
    -   **Context-Aware**: Header now correctly reflects the **active browsing context** (visiting/previewing) rather than just the playing context.
    -   **Adaptive Styling**: Header background and text dynamically match the active folder's color (including "All" and "Unsorted" views), using a subtle gradient.
    -   **Code Cleanup**: Removed redundant header code from `VideosPage.jsx`, `PlaylistFolderColumn.jsx`, and `OrbConfigPlaceholderPage.jsx`.
- **Orb Configuration Overhaul**:
  - **One-at-a-time Workflow**: Replaced grid view with a focused single-orb editor.
  - **Auto-Naming**: Removed manual naming; presets are now auto-named by date.
  - **Direct Playlist Assignment**: Added inline multi-select dropdown for assigning playlists during creation.
  - **Global Interaction**: Clicking an Orb in the video grid now instantly applies its settings to the player.
  - **Advanced Crop**: Added **Canvas Scale & Scroll** to the modal for precise editing of large images.
- **Orb Crop Fixes**:
  - **Path Drawing**: Updated `OrbCropModal` to allow clicking anywhere on the canvas to add points for custom polygon masks, improving the freeform cropping experience.
  - **Crash Resolution**: Fixed a `TypeError` in `OrbCropModal` by ensuring default values for `orbAdvancedMasks` and `orbMaskRects` and correcting prop passing from `OrbConfigPlaceholderPage`.
  - **Visual Consistency**: Aligned the appearance of Orbs in `OrbCard` with (`PlayerController`) by:
    - Implementing dynamic SVG clip paths in `OrbCard` to support both rectangular and polygonal masks based on `orbMaskModes`.
    - Correcting the clip path radius to `0.5` to match the Player Controller.
    - Fixing SVG syntax errors (nested tags, closing tags) in `OrbCard`.
- **Drumstick Rating System**:
  - Implemented 5-drumstick rating system for playlist items.
  - Added `drumstick_rating` column to SQLite database and updated all SELECT/INSERT queries.
  - Developed custom `DrumstickRating` component with hover effects and stop-propagation protection.
  - Integrated ratings into both `VideoCard` (standard) and `TweetCard` (Twitter/X style).
  - Created backend Tauri commands and frontend API functions for persistence.
  - **Sticky Bar Filtering**: Added sorting options to filter videos by specific drumstick ratings (1-5) directly from the Video Page's sticky bar dropdown, using visual drumstick emojis (🍗).
  - Documented system in `atlas/drumstick-rating-system.md`.
- **Video Sorting Enhancements**:
  - Upgraded the Video Page sticky bar sorting dropdown to include explicit ascending (🔼) and descending (🔽) options for Date, Progress, and Last Viewed sorting to improve user control.
- **New Tweet View**:
  - Created a dedicated `TweetPage` component for viewing high-resolution detailed views of tweets.
  - Implemented navigation flow from `TweetCard` clicks to the new page.
  - Supports fetching high-resolution original images (`name=orig`) for better quality.
  - Added "Open on X" functionality for external validation.
  - Documented in `atlas/ui-pages.md`.
- **Video Card Modernization**:
  - **Modern Context Menu**: Replaced legacy system with `ModernVideoMenu.jsx`, featuring a floating glassmorphism design, backdrop blur, and smooth animations.
  - **Menu Actions**: 
    - Added **Delete from Playlist** functionality (removes video from current context).
    - Streamlined options by removing "Assign to Folder" and "Quick Assign" to declutter the UI (folder actions remain accessible via Star/Keyboard shortcuts).
  - **Visual Polish**: Removed `ImageHoverPreview` (thumbnail expansion) from standard Video Cards for a cleaner, more stable grid experience.
- **App Banner Enhancements**:
  - **Dual Mode Configuration**: Implemented separate banner configurations for Fullscreen and Split-screen (Half/Quarter) modes.
    - Updated `configStore.js` to store distinct `fullscreenBanner` and `splitscreenBanner` objects with migration support.
    - Added UI in `AppPage.jsx` to toggle between editing each mode with live visual feedback (`bannerPreviewMode`).
    - Updated `LayoutShell.jsx` to dynamically switch configurations based on view mode (or preview override).
  - **Independent Player Offset**: `playerControllerXOffset` is now tied to the specific banner mode, allowing different controller positions for full vs. split screen.
  - **Vertical Alignment**: Extended vertical position slider range to -200% to +200% for better flexibility.
  - **Modular Presets**: Updated `BannerPresetCard` and saving logic to allow saving **Specifically Fullscreen** or **Specifically Splitscreen** configurations (or both) into a preset.
  - **Customization**:
    - "Image Scale" slider (-200% to 200%) (allows flipping).
    - "Spill Over" feature.
    - "Crop Shape" functionality (`BannerCropModal`).
    - "Animate Scroll" toggle.
    - "Clip From Left" slider (0-100%).
    - "Clip From Left" slider (0-100%).
    - "Horizontal Offset" slider (-200% to +200%).
    - **Smart Spill Interaction**: Implemented **precision hitbox** detection (ray-casting) for spill-over areas. The spill is **click-through** and becomes **semi-transparent** (15% opacity) only when hovering the exact visible shape defined by the SVG mask, respecting Key/Fill clipping.
- **Gamification & Mission Hub**:
  - **Mission Rewards**: Added support for **Time Rewards** (minutes) and **Currency Rewards** (Credits/Coins).
  - **Reset Functionality**:
    - **Mission Reset**: Completed missions can be reset to run again (habit loop).
    - **Time Bank Reset**: Added secure button to clear accumulated time.
    - **Coin Reset**: Added secure button to discard all credits in the shop.
  - **Lootbox Economy**: 
    - Updated **Supply Depot** pricing to use Credits (Mini: 5, Standard: 15, Legendary: 60).
    - Added "Credits Available" display in shop and hub.
  - **Tab Safety**: Implemented confirmation modal for deleting mission tabs to prevent accidental data loss.
- **Visual System Redesign (Atlas Blue)**:
  - **Premium Light Theme**: Overhauled **HomeHub**, **Pokédex**, and **Lootbox** systems with a "Cool Blue" aesthetic.
  - **Aesthetics**: Replaced legacy dark backgrounds with `blue-50` gradients and `white/80` glassmorphism.
  - **Component Styling**: Updated all mission items, tabs, and reward cards with refined slate/blue text and high-contrast accents.
  - **Readability**: Optimized typography and spacing for better focus in gamified workflows.
  - **Lootbox Polish**: Refined legendary reward cards and shard visualization for the light theme.
- **Mission Hub UI Fixes**:
  - **Text Wrapping**: Removed truncation from mission descriptions, enabling multi-line support for long tasks.
  - **Layout Alignment**: Switched mission items to `items-start` for consistent alignment of controls with multi-line text.
  - **Enhanced Input**: Upgraded task creation to use a `textarea` for easier entry of detailed mission objectives.
  - **Tooltips**: Added full-text tooltips on hover for all mission items.
- **Orb Navigation System**:
  - **Independent Browsing**: Added dedicated browsing controls to `PlayerController.jsx` for navigating Orbs separately from video playlists.
  - **Live Preview**: Added "Live Preview" toggle to `OrbConfigPlaceholderPage.jsx` to test configurations directly on the main player.
  - **Direct Selection**: Clicking an Orb card in `VideosPage.jsx` now updates the global navigation state (`orbNavPlaylistId`, `orbNavOrbId`) in `configStore.js`.
  - **Split-Screen Fix**: Orb Config shortcut button now correctly switches to split-screen mode if clicked while in full-screen.
  - **Auto-Disable**: Live Preview mode automatically turns off when navigating away from the config page.
  - **Orb Spill Expansion**:
    - **Vertical Extension**: Increased bottom quadrant spill height to 150% (up from 50%) to accommodate taller character art.
    - **Horizontal Extension**: Expanded side quadrants to allow wider spill (150% width), enabling broader composition.
    - **Border Integration**:
      - **Layering Fixes**: Updated `z-index` stacking in `LayoutShell.css` to ensure both the **Orb Spill** (z-20) and **App Banner Spill** (z-15) correctly render *above* the Player Border Separator (z-10).
  - **App Banner Navigation**:
    -   **Dual-Mode Toggle**: Implemented a toggle button in `PlayerController` to switch arrow navigation between "Orb Mode" and "Banner Mode".
    -   **Unified Controls**: Arrow keys contextually navigate Orb Playlists/Orbs or Banner Playlists/Presets.
    -   **Live Preview**: Added immediate visual feedback when browsing banner presets, similar to Orb navigation.
    -   **Click-to-Browse**: Clicking a `BannerPresetCard` in `VideosPage` now sets the active navigation context, allowing seamless continuation via controller arrows.
    -   **Editor Integration**: Automatic "Preview Mode" override in `AppPage` ensures edits are visible instantly, reverting on exit.
    -   **Documentation**: Updated `atlas/orb-navigation.md` with new features.
- **Playlist Cards**:
  - **Refactoring**: Completely extracted the complex inline playlist card rendering from `PlaylistsPage.jsx` into a modular, highly-reusable `PlaylistCard.jsx` component. Localized state (such as shuffle previews and folder pie menus) inside the new component to drastically reduce parent component complexity and prepare for integration into components like `StickyVideoCarousel`.
  - **Dynamic Previews**: Implemented shuffle functionality that randomizes both the main cover thumbnail and the 4 mini preview videos. Includes a reset button to restore default states. Added **Swap** feature: right-clicking any mini preview swaps it with the main cover thumbnail. Added video title hover tooltips to all preview thumbnails.
  - **Set as Cover**: Added a hover-activated checkmark button to lock the currently displayed thumbnail as the permanent playlist cover. If the layout was shuffled, this action also persistently reorders the 4 mini preview videos to the top of the playlist for consistent previewing.
  - **Folder Shuffle Mode**: Clicking a folder card in the column view temporarily replaces the parent playlist card's previews with videos from that folder, locking shuffle to that specific color until cleared via the red 'X' button.
  - **Always Visible Counts**: Folder count icon and total video count are now permanently visible on the card, rather than requiring a hover state.
  - **Orb and Banner Support**: Playlist cards now display **Orb** and **Banner Preset** items (from configStore) when assigned to a playlist. Main cover and 4 mini slots can show orbs/banners (plain image thumbnails); count badge shows "X videos, Y orbs, Z banners" when applicable. Assignment filter matches VideosPage (only items whose `playlistIds` include the playlist). **Shuffle/Reset/Swap** support orbs and banners: shuffle pool is full playlist (all videos + assigned orbs + assigned banners) for diversity; swap works for any slot type; Set as Cover saves the image and reorders only video items in the DB. See `playlist-cards.md`.
- **Playlist Uploader Enhancements**:
  - **Empty Playlists**: Added the ability to create new, empty playlists without needing to provide initial links.
  - **Duplicate Detection**: Implemented checks against existing playlist videos and within incoming batches before adding links or importing Twitter JSON, ensuring only unique items are added.
- **Playlists Page & Group Carousel Overhaul**:
  - **Playlists bar in TopNavigation**: When on the Playlists page, the view switcher (ALL / UNSORTED / GROUPS) and actions (Info, Folder, Add) are rendered in the global TopNavigation header instead of a sticky toolbar on the page, freeing vertical space. Back and Close buttons remain in the header. layoutStore now holds `playlistsPageShowTitles` and `showPlaylistUploader`; PlaylistsPage syncs/persists the titles toggle and opens the uploader when the header Add is used.
  - **GroupPlaylistCarousel redesign**: Each carousel is a bounded box (rounded border, slate background) with a dedicated top bar for name, rename, and delete. All non-empty carousels (1, 2, or 3+ items) use the same horizontal scroll row with a consistent large card size (`min-w-[380px]`, `w-[min(520px,calc(50vw-2rem))]`); scrollbar sits close to the cards; native horizontal scroll only (no custom drag/snap) to avoid jitter and snap-back. Structure inlined (no inner component) so re-renders do not remount the scroll container. Documented in `atlas/group-carousel.md`.
- **Group carousel & playlist card restyling**:
  - **Carousel box (Small/Large)**: White background (`bg-white`), light border (`border-slate-200`), light top bar (`bg-slate-50`, dark text). Bar mode unchanged (dark). Empty state uses `bg-slate-50`.
  - **Playlist cards in carousel**: `PlaylistCard` receives `inCarousel: true` (injected by `GroupPlaylistCarousel`). When `inCarousel`: no card or thumbnail border, `bg-white` to match carousel. Small mode keeps minimal layout (thumbnail on top, title below; no title bar, no mini strip, no folder/count/set-cover overlays).
  - **Scrolling**: Horizontal scroll only via bottom scrollbar; left/right arrow buttons removed from carousel sides.
  - **Scrollbar styling**: Universal scrollbar in `App.css` (14px, rectangular, slate track/thumb, diagonal stripe pattern) applied app-wide; WebView may not honor custom appearance. See `atlas/group-carousel.md` §5.
- **Mission Hub – Disable time restrictions**: Settings button (top-right of hub) opens a panel with toggle "Disable time restrictions"; when on, launch is always allowed and the timer does not consume or auto-lock. Setting persisted in `missionStore` (`timerDisabled`). See `atlas/mission-hub.md` §2.6.
- **Pokédex – Detail popup**: Clicking a fully unlocked Pokémon opens a light-theme popup with nameplate (type badges, artwork with gender-ratio ring—blue/pink/gray dashed from `gen1PokemonPhysical.js`; image moved left for close-button space), quote-style Pokédex entry (Sun preferred, PokeAPI), optional Lore (`gen1PokemonLore.js`), and sprites table (Normal/Shiny × Gen 1–6 from Pokemon DB). Types and physical data are hardcoded; only flavor text is fetched from API. See `atlas/pokedex-system.md` §4 and Asset Handling.
- **Fullscreen ↔ Splitscreen & Video Info**:
  - **Transition**: Unified right column (`.layout-shell__right-column`) with AnimatePresence (`mode="wait"`) crossfades FullscreenVideoInfo out and side menu in; fullscreen info can blank instantly via `layoutStore.fullscreenInfoBlanked` when opening splitscreen from a control (PlayerController, PlaylistCard, etc.). Marginal improvement to transition smoothness observed.
  - **Playlist import (YouTube)**: API requests use `part=snippet,statistics,contentDetails`. Extracted and stored in `playlist_items`: **duration_seconds** (from contentDetails.duration via `parseYouTubeDuration`), **description**, **tags** (JSON string). Likes and comments are **not** extracted; `like_count`/`comment_count` columns exist but are not populated on import.
  - **FullscreenVideoInfo**: Displays thumbnail, author, view count, year, **description** (line-clamp-4, full text in title), **tags** (parsed from JSON, up to 12 pills). Does **not** show duration, likes, or comments. Blanks when `fullscreenInfoBlanked` is true (e.g. before switching to half/quarter). See `fullscreen-video-info.md`, `ui-layout.md`, `database-schema.md` (`playlist_items`), `importexport.md`.

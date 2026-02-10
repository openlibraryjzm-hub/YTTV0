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
│   │   ├── TopNavigation.jsx     # Navigation tabs + compact pagination (Videos page)
│   │   ├── PlaylistsPage.jsx     # Main playlists grid view

│   │   ├── VideosPage.jsx        # Videos grid view for current playlist
│   │   ├── HistoryPage.jsx       # Watch history display (last 100 videos)
│   │   ├── LikesPage.jsx         # Liked videos grid view
│   │   ├── PinsPage.jsx          # Pinned videos grid view
│   │   ├── PlaylistList.jsx      # Sidebar playlist list component
│   │   ├── PlaylistView.jsx      # Individual playlist video grid
│   │   ├── PlaylistUploader.jsx  # Config Playlist Modal (Unified Add/Import/JSON)
│   │   ├── PlaylistsButton.jsx   # Toggle button for sidebar
│   │   ├── Card.jsx              # Base card component
│   │   ├── CardThumbnail.jsx     # Thumbnail display component
│   │   ├── CardContent.jsx       # Card content (title, subtitle, metadata)
│   │   ├── CardActions.jsx       # Quick actions and menu management
│   │   ├── CardMenu.jsx          # Enhanced 3-dot menu with submenu support
│   │   ├── ImageHoverPreview.jsx # 4chanX-style image expansion on hover (high-res preview)
│   │   ├── VideoCard.jsx         # Video card implementation
│   │   ├── FolderCard.jsx        # Colored folder card component
│   │   ├── FolderSelector.jsx    # 16-color folder selector
│   │   ├── BulkTagColorGrid.jsx  # Bulk tagging color grid
│   │   ├── StarColorPicker.jsx   # Star color picker menu (hover menu for folder assignment)
│   │   ├── TabBar.jsx            # Tab navigation component
│   │   ├── AddPlaylistToTabModal.jsx  # Modal for adding playlists to tabs
│   │   ├── TabPresetsDropdown.jsx     # Tab preset selector
│   │   ├── BulkPlaylistImporter.jsx   # Bulk import modal with 17 fields
│   │   ├── PlaylistFolderSelector.jsx  # Universal playlist/folder selector
│   │   ├── PlaylistSelectionModal.jsx  # Modal for selecting playlist (Move/Copy actions)
│   │   ├── StickyVideoCarousel.jsx     # Carousel/Grid for stickied videos
│   │   ├── InfiniteScrollWrapper.jsx   # Infinite/Looping horizontal scroll wrapper
│   │   ├── PageBanner.jsx              # Banner with metadata, media carousel (continue/pinned/ASCII), animated patterns
│   │   ├── EditPlaylistModal.jsx       # Modal for editing playlist/folder metadata
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
│   │   └── ScrollbarChevrons.jsx       # Scrollbar navigation controls (chevron-dot-chevron capsule)
│   ├── store/                    # Zustand state management
│   │   ├── configStore.js        # Theme and Profile configuration
│   │   ├── layoutStore.js        # View mode, menu state, debug/inspect/ruler/dev toolbar toggles
│   │   ├── navigationStore.js    # Current page (playlists/videos/history)
│   │   ├── playlistStore.js      # Current playlist items, video index
│   │   ├── folderStore.js        # Folder state, bulk tagging, show folders
│   │   ├── tabStore.js           # Tab state management
│   │   ├── tabPresetStore.js     # Tab preset state management
│   │   ├── pinStore.js           # Pin state management (persisted)
│   │   ├── stickyStore.js        # Sticky video state management (persisted)
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
│   ├── orb-page.md               # OrbPage configuration documentation
│   ├── you-page.md               # YouPage configuration documentation
│   ├── page-page.md              # PagePage configuration documentation
│   ├── asset-manager-page.md     # Asset Manager Page documentation
│   ├── app-page.md               # AppPage configuration documentation
│   ├── ui-cards.md               # Card components
│   ├── ui-modals.md              # Modal components
│   ├── history.md
│   ├── videoplayer.md
│   ├── local-videos.md
│   ├── audio-visualizer.md
│   ├── debug.md
│   ├── state-management.md
│   ├── database-schema.md
│   ├── api-bridge.md
│   ├── navigation-routing.md
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
| **Orb Configuration** | `orb-page.md` | `state-management.md` (configStore) |
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
| **Local Videos** | `local-videos.md` | `videoplayer.md`, `database-schema.md`, `api-bridge.md`, `importexport.md` |
| **Audio Visualizer** | `audio-visualizer.md` | `advanced-player-controller.md`, `api-bridge.md` |
| **App Banner** | `app-banner.md` | `advanced-player-controller.md`, `ui-layout.md`, `state-management.md` |
| **Page Banner** | `page-banner.md` | `ui-pages.md`, `ui-layout.md`, `state-management.md` |
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

#### `advanced-player-controller.md`
**Covers**: Central orb, menu rectangles, playlist/video navigation, preview system, folder management, dual player system, likes playlist
**Key Topics**: Orb customization, **orb presets**, preview navigation, colored shuffle, quick assign, pin system
**Cross-References**: See `navigation-routing.md` for navigation flows, `state-management.md` for store usage

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

#### `videoplayer.md`
**Covers**: YouTube iframe player, progress tracking, dual player system
**Key Topics**: YouTube IFrame API, progress persistence, watch status (unwatched/partially watched/watched)
**Cross-References**: See `database-schema.md` for video_progress table, `api-bridge.md` for progress commands

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

#### `debug.md`
**Covers**: Debug bounds, inspect mode, layout debugging, ruler overlay (non-functional)
**Key Topics**: Visual debugging, element labels, layout regions, measurement tools
**Cross-References**: See `ui.md` for layout structure, `state-management.md` for debug state

### Technical Documentation

#### `state-management.md`
**Covers**: All 7 Zustand stores, state flow patterns, persistence strategies
**Key Topics**: Store architecture, state dependencies, localStorage vs database persistence
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
- **Twitter Import & Integration**: 
  - Implemented **JSON Import** for Twitter bookmarks, allowing bulk import of tweets as "local" videos.
  - created `TweetCard` improvements for proper rendering of MP4s and GIFs.
  - Added **High-Res Hover Previews** for Twitter media using `ImageHoverPreview`.
- **Performance Optimization**: 
  - Solved major lag on the Playlists Page by implementing `get_playlist_items_preview` (Rust backend).
  - Reduced overhead by fetching only 4 preview items per playlist instead of the entire dataset.
- **Folder Management**: 
  - Added **Folder Renaming** functionality directly to the sticky color grid.
- **Pin System Fix**: 
  - Resolved a bug causing duplicate pins in the PinStore.
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

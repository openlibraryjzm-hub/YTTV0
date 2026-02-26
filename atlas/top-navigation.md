# Top Navigation

The `TopNavigation` component (`src/components/TopNavigation.jsx`) acts as the contextual mini-header across the application, sitting just below the main `PlayerController` area. It dynamically updates its contents, layout, and styling based on the current page and active context (e.g., whether viewing the main Playlists page, a specific Playlist, or a Colored Folder).

## Visual Design & Aesthetics

The Top Navigation bar is designed to be visually engaging and context-aware:

*   **Color Themes:** When browsing a specific colored folder or a playlist, the bar applies an intense vertical linear gradient matching that specific context (defaulting to blue for playlists, gray for unsorted, and the specific 16-color hex for folders). 
*   **3D Animated Mesh Pattern:** To provide a premium and dynamic feel, a CSS-only animated geometric mesh pattern overlays the color gradient. 
    *   It uses `mixBlendMode: overlay` to ensure it looks good over any folder color.
    *   3D hardware acceleration transforms (`rotateX`, `rotateZ`, `perspective`) create a sense of depth.
    *   An infinite sliding keyframe animation gives it a continuous scrolling "fly-through" grid effect.
*   **Typography:** The context title features prominent white text with a crisp black outline (`WebkitTextStroke`) to guarantee readability against any background. (The "Unsorted" folder inverts this, using black text with a white stroke).

## Layout & Components

The Top Navigation is split into a left section (Title & Group Carousel Actions) and a right section (Tab Navigation & Context Actions).

### Left Section (Context & Carousel Controls)

*   **Playlists Page (Groups Mode):** Displays quick-action buttons to override the visual style of *all* group carousels at once (Large, Small, or Bar layouts).
*   **Title and Description:** 
    *   On the Playlists page, it simply shows "Playlists".
    *   On a specific playlist or folder, it securely truncates and displays the specific Playlist Name, optionally appending the active Folder Name (e.g., "My Playlist - Emerald"). It also displays an optional single-line description below the title.

### Right Section (Actions)

**On Playlists Page:**
*   **Tab Bar (`TabBar.jsx`):** Horizontal scrollable list allowing the user to switch between "All", "Unsorted", and custom preset tabs.
*   **Toggle Titles:** A toggle button (Info icon) to show/hide titles on all playlist cards globally.
*   **Toggle Folders:** A toggle button to show/hide the colored folder segments.
*   **Add Playlist:** A primary action button to open the `PlaylistUploader` modal.
*   **Back/Close Navigation:** Standard "Go Back" chevron (if history exists) and a red "Close" cross button that forces the app layout back to "full" view mode.

**On Videos / Other Pages:**
*   **Card Style Toggle:** A toggle button showcasing a Twitter/X icon, used to switch the global video card displays between standard layout and the alternative Twitter-style layouts.
*   **Back/Close Navigation:** Same standard navigation actions as the Playlists page.

## State Dependencies

This component heavily relies on Zustand stores to derive its display state:
*   `useNavigationStore`: Tracks history and current page to conditionally render "Back" buttons and determine if we're on the Playlists view.
*   `useLayoutStore`: Controls the view mode (full, half, etc.), video card styles, and triggers to show configuration modals.
*   `usePlaylistStore`: Determines the active playlist (or a playlist currently being "previewed" via history navigation but not yet playing).
*   `useFolderStore`: Determines which specific 16-color folder (or 'unsorted') is currently active within a playlist.
*   `usePlaylistGroupStore`: Used specifically on the Playlists page to control global carousel UI layouts.

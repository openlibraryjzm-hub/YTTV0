# Playlist Cards

Playlist cards are the primary interface for managing and interacting with playlists on the Playlists Page. They provide a dense, feature-rich overview of a playlist's contents and state while offering quick access to management tools.

## Visual Overview

Each playlist card consists of the following key visual elements:

1. **Main Cover Thumbnail:** The primary visual identifier for the playlist. This defaults to the first video in the playlist, or a randomly shuffled image if the user chooses.
2. **Mini Preview Strip:** A row of 4 small video thumbnails displayed directly below the main cover, giving a quick glimpse of the playlist's contents.
3. **Information Overlay:**
    *   **Folder Count Badge:** A folder icon overlaid with the number of folders containing content within this playlist. (Always visible)
    *   **Video Count Badge:** A badge displaying the total number of videos in the playlist. (Always visible, located next to the folder count)
4. **Interactive Controls:** Various buttons that appear on hover to manage the playlist's appearance and settings.

## Core Functionalities

### 1. Dynamic Previews (Shuffle & Reset)
Hovering over the playlist card reveals a **Shuffle** button (indicated by crossed arrows).
*   **Shuffle:** Clicking this button randomly selects a video from the playlist to display as the main cover thumbnail. Crucially, it also randomly selects a new set of 4 videos to display in the mini preview strip below. This allows you to quickly generate a unique visual identity for the playlist.
*   **Reset:** Once a playlist has been shuffled, a **Reset** button (counter-clockwise arrow) appears next to the shuffle button. Clicking this reverts both the main cover and the 4 mini preview videos back to their default, original state.

### 2. Setting a Custom Cover
When hovering over the card, a **Set as Cover** checkmark button appears in the bottom-right corner of the main thumbnail. 
*   **Persistent Customization:** Clicking this button locks the *currently displayed* main thumbnail as the permanent cover image for the playlist.
*   **Locking the Mini Previews:** If the playlist layout was generated using the Shuffle feature, clicking "Set as Cover" will also persistently save the 4 random mini videos. It does this by physically reordering those 4 specific videos to the very beginning (positions 1-4) of the playlist in the database, ensuring they always appear as the default preview.

### 3. Folder Management Integration
*   **Folder Pie Menu:** Clicking the color palette icon opens a pie menu overlay, allowing you to assign colors/folders to the playlist.
*   **Folder List View:** Clicking the folder count icon opens a detailed column view showing all active folders and their respective contents for that playlist.

### 4. Details and Metadata
*   **Video Title Overlay:** Toggling the **Info** button (or using the global info toggle) displays the title of the video currently shown as the main thumbnail.
*   **Three-Dot Menu:** Provides access to additional options like expanding/collapsing all folders within the playlist, exporting the playlist data, or adding the entire playlist to a specific Tab.

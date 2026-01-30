# PagePage

PagePage is a dedicated page for Page Banner and Layer 2 image library configuration, accessed via the "Page" button in the Settings Page navigation. It appears as a full page below the Page Banner.

**Related Documentation:**
- **Settings Page**: See `ui-pages.md` (Section 4.1.8) for Settings Page overview
- **Page Banner**: See `page-banner.md` for comprehensive Page Banner documentation
- **State Management**: See `state-management.md` for configStore details

---

## 1: User-Perspective Description

- **Page Structure**:
  - **Page Banner**: "Page Banner Configuration" title with description
  - **Back Button**: "Back to Settings" button in banner's top-right corner
  - **Navigation Buttons**: Buttons (Orb, You, etc.) positioned at bottom of Page Banner
  - **Sticky Toolbar**: Contains Colored Prism Bar with clickable filtering
    - **"All" Button**: Shows all folders (leftmost, dark background)
    - **Color Bars**: Each of 16 folder colors is clickable to filter folders by assigned folder
    - **Counts**: Shows number of folders assigned to each folder color
    - **Active Filter**: Selected color shows white ring highlight
  - **Tab Navigation**: Four tabs below the sticky toolbar
    - **Page Banner**: Banner editor and Layer 2 configuration
    - **Folders**: Horizontal scrolling carousel of all Layer 2 images (Grid View)
    - **Colors**: Dedicated interface for assigning Layer 2 images to specific folder colors
    - **Groups**: Two-column layout for group management (left: select group leader, right: assign images to group)
  - **Scrollable Content**: Tab content below the banner

- **Page Banner Tab**:
  - **Two-Column Layout**:
    - **Layer 1 - Group Leader Selector** (Left Column):
      - **Header**: "Group Leader" / "Theme Group Leader" / "All Images" with "Clear" button
      - **Theme Badge**: Purple "Theme" badge appears when a group leader is set as theme
      - **Group Leader Dropdown**: Selector with two modes:
        - **"All Images" Option**: Shows all images from all folders regardless of groups
        - **Group Leader Options**: List of group leaders with at least 1 member
      - **Images Grid**: Displays images based on selection mode
        - **All Images Mode**: Shows all images from all folders
        - **Group Leader Mode**: Shows group leader + all members
        - Click any image to apply it as Layer 2 (loads paired background color)
    - **Layer 2 - Overlay** (Right Column):
      - Image upload/thumbnail
      - Scale slider (50-200%) - updates preview live
      - X/Y position sliders (0-100%) - updates preview live
      - Paired background color picker
      - Remove button
      - **Save Adjustments Button**: Appears when editing an image from the library

- **Folders Tab**:
  - **Layout**: Horizontal scrolling carousel of Layer 2 images.
  - **Content**: Shows Layer 2 images (filtered by prism bar color if selected).
  - **Card Size**: 320px width, aspect-video (16:9) thumbnails.
  - **Functionality**:
    - Click an image to apply it as the current Layer 2 banner.
    - **Group Leaders Toggle**: "Group Leaders Only" button filters view to show only images dealing with groups.
    - Hovering an image shows its folder name.
    - Visual indicators for active image and selected folder membership.

- **Colors Tab**:
  - **Purpose**: Dedicated interface for managing "Theme Color Assignments" and **Manual Folder Organization**.
  - **Header Controls**: 
    - **Create New Folder** button: Create custom folders (e.g., "Holiday 2023").
    - **Filter Bar**: View folders by assigned color.
  - **Layout**: Vertical list of filtered Layer 2 folders.
  - **Folder Row**:
    - **Header**: 
      - Folder name (renamable).
      - **Playlist Assignment Dropdown**: Select which Playlists show this folder as their theme. (Multi-select).
      - **Pull Group Button**: Dropdown to "pull" an existing Group Leader (and all its members) from another folder into this one instantly.
      - **Delete Folder Button**.
    - **Color Assignments Section**: Horizontal row of 16 color dots (plus "All" and "Unsorted" slots) for theme mapping.
    - **Image Stream**: Horizontal scroll of images.
      - **Group Visualization**: Images are automatically organized into visual groups. "Group Leaders" appear first with a label, followed by their members. Ungrouped images follow.
      - **Move to Folder**: Every image has a "Folder" icon button in the top-right corner. Clicking it allows moving that individual image (or the entire group if it's a leader) to another folder.
  - **Interaction**:
    - **Move Logic**: Moving a Group Leader automatically moves its members and updates references. Moving a member updates the leader's reference.
    - **Assignments**: Click color dots to map specific images to folder colors.

- **Groups Tab**:
  - **Two-Column Layout**: 
    - **Left Side**: Grid of all Layer 2 images for selecting/setting a group leader.
    - **Right Side**: Grid of all Layer 2 images for assigning/unassigning members to the selected leader.
  - **Functionality**:
    - Create groups of images (members) under a leader.
    - Used for more complex theme logic where a "Group Leader" theme acts as a set of images.

## 2: File Manifest

**UI/Components:**
- `src/components/PagePage.jsx`: Active configuration page.
- `src/components/PageBanner.jsx`: Banner component used for preview.

**State Management:**
- `src/store/configStore.js`:
  - `layer2Folders`: Core data structure.
  - `colorAssignments`: Property within folder objects mapping `{ colorId: imageId }`.
  - `assignLayer2ImageToColor(folderId, colorId, imageId)`: Updates assignment.
  - `unassignLayer2ImageFromColor(folderId, colorId)`: Removes assignment.
  - `addLayer2Folder`, `addLayer2Image`, `applyLayer2Image`.
  - `themeGroupLeaderId`: App-wide theme state.

## 3: The Logic & State Chain

**Colors Tab Flow (Assignment):**
1. User clicks **Colors** tab.
2. User selects a color dot (e.g., "Red") for a specific folder.
3. UI enters "Selection Mode" (highlighting the color dot).
4. User clicks an image in the folder's image stream.
5. `assignLayer2ImageToColor` updates the store.
6. The color dot now displays the image thumbnail.
7. **Effect**: When this folder is the active theme, and the user navigates to a "Red" page (e.g., Red Playlist), this specific image will be shown on the Page Banner.

**Folders Tab Flow (Browsing):**
1. User clicks **Folders** tab.
2. (Optional) User filters by color using the Sticky Toolbar Prism.
3. User scrolls horizontally through images.
4. User clicks an image → `applyLayer2Image` sets it as the current valid banner preview (Layer 2) and loads its background color (Layer 1).


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
  - **Navigation Buttons**: Four buttons (Orb, You, Page, App) positioned at bottom of Page Banner
  - **Sticky Toolbar**: Contains Colored Prism Bar with clickable filtering
    - **"All" Button**: Shows all folders (leftmost, dark background)
    - **Color Bars**: Each of 16 folder colors is clickable to filter folders by assigned folder
    - **Counts**: Shows number of folders assigned to each folder color
    - **Active Filter**: Selected color shows white ring highlight
  - **Tab Navigation**: Four tabs below the sticky toolbar
    - **Page Banner Tab**: Banner editor and Layer 2 configuration
    - **Image Library Tab**: Folder and image management
    - **Folders Tab**: Horizontal scrolling carousel of all Layer 2 images
    - **Groups Tab**: Two-column layout for group management (left: select group leader, right: assign images to group)
  - **Scrollable Content**: Tab content below the banner

- **Page Banner Tab**:
  - **Two-Column Layout**:
    - **Layer 1 - Group Leader Selector** (Left Column):
      - **Header**: "Group Leader" / "Theme Group Leader" with "Clear" button
      - **Theme Badge**: Purple "Theme" badge appears when a group leader is set as theme
      - **Group Leader Dropdown**: Selector to choose from group leaders with at least 1 member
        - Shows thumbnail, folder name, and member count for each group leader
        - Star icon appears next to group leaders that are set as theme
        - Selecting a group leader sets it as the theme (replaces legacy folder theme system)
      - **Group Members Grid**: Displays all members of the selected group leader in a 2-3-4 column grid
        - Click any member image to apply it as Layer 2 (loads paired background color)
        - Active indicator overlay when image is currently applied
        - Paired color indicators shown on thumbnails
      - **Empty States**: 
        - "Select a group leader to view members" when no leader selected
        - "No members in this group" when leader has no members
    - **Layer 2 - Overlay** (Right Column):
      - Image upload/thumbnail
      - Scale slider (50-200%)
      - X/Y position sliders (0-100%)
      - Paired background color picker
      - Remove button
      - Layer 1 default color dropdown

- **Layer 2 Image Library Tab**:
  - **Collapse/Expand Toggle**: Button in section header to show/hide library
  - **Folder Management**:
    - Create new folders
    - Rename folders (click name)
    - Delete folders (hover to reveal)
    - Set folder as theme (app-wide) - Legacy feature, being replaced by group leader theme
    - Set selection mode (First/Random)
    - Assign folders to playlists
  - **Image Management** (per folder):
    - Upload images to folders
    - Apply images (click thumbnail)
    - Delete images (hover to reveal)
    - Assign destinations (pages/folder colors)
    - Save current Layer 2 image to folder

- **Folders Tab**:
  - **Layout**: Horizontal scrolling carousel (same format as previous folder thumbnails)
  - **Content**: Shows all Layer 2 images from all folders (not just representative thumbnails)
  - **Card Size**: 320px width, aspect-video (16:9) thumbnails
  - **Filtering**: Carousel filters based on selected folder color from prism bar
  - **Group Leaders Toggle**: Toggle button in header to show only images that are group leaders with at least 1 member
    - When enabled, only group leaders with members are displayed
    - Toggle shows "Group Leaders Only" when active, "All Images" when inactive
  - **Image Display**: Each image shows:
    - Large thumbnail with folder name below
    - Active indicator (purple checkmark) if currently applied
    - Highlighting (purple border) if from selected folder
    - Hover tooltip with folder name
  - **One-Click Apply**: Clicking an image applies it and selects its folder
  - **Wheel Scrolling**: Mouse wheel scrolls horizontally through images

- **Groups Tab**:
  - **Two-Column Layout**: 
    - **Left Side**: Grid of all Layer 2 images for selecting group leader
      - Shows all images from all folders in 4-6 column grid (64px × 64px square previews)
      - When group leader selected, shows info banner with assigned count
      - Clicking any image selects it as group leader and applies it
      - Selected group leader shows sky-blue border and "Leader" badge
      - Active indicator overlay appears when image is currently applied but not the group leader
    - **Right Side**: Grid of all Layer 2 images for assigning to group
      - Shows all images from all folders in 4-6 column grid
      - Highlights assigned images with purple border and checkmark badge
      - Clicking assigns/unassigns image to currently selected group leader
      - Group leader cannot be assigned to itself
      - Active indicator overlay appears when image is currently applied but not the group leader and not assigned
  - **Scrollable**: Max height 600px with vertical scrolling on both sides
  - **Hover Tooltips**: Folder name and status (Leader/Assigned) appears on hover
  - **Empty State**: Shows message when no images are saved

## 2: File Manifest

**UI/Components:**
- `src/components/PagePage.jsx`: Dedicated Page Banner and Layer 2 configuration page component
- `src/components/PageBanner.jsx`: Page banner with back button

**State Management:**
- `src/store/configStore.js`:
  - `pageBannerBgColor`, `setPageBannerBgColor`: Layer 1 background color
  - `customPageBannerImage2`, `setCustomPageBannerImage2`: Layer 2 overlay image
  - `pageBannerImage2Scale`, `setPageBannerImage2Scale`: Layer 2 scale
  - `pageBannerImage2XOffset`, `setPageBannerImage2XOffset`: Layer 2 X position
  - `pageBannerImage2YOffset`, `setPageBannerImage2YOffset`: Layer 2 Y position
  - `layer2Folders`: Array of folder objects, each with `folderColors` array and images with `groupLeaderId` and `groupMembers` properties
  - `updateLayer2FolderFolders(id, folderColors)`: Updates folder color assignments for a Layer 2 folder
  - `assignLayer2ToGroup(imageId, folderId, groupLeaderId, groupLeaderFolderId)`: Assigns/unassigns Layer 2 image to group leader
  - `themeGroupLeaderId`, `themeGroupLeaderFolderId`: Theme group leader state (replaces legacy folder theme)
  - `setThemeGroupLeader(imageId, folderId)`: Sets a group leader as the theme (replaces legacy `setThemeFolder`)
  - `clearThemeGroupLeader()`: Clears the theme group leader
  - `orbFavorites`: Array of orb preset objects, each with `groupLeaderId` and `groupMembers` properties
  - `assignOrbToGroup(presetId, groupLeaderId)`: Assigns/unassigns orb preset to group leader
  - All Layer 2 and orb group state persisted to localStorage

## 3: The Logic & State Chain

**Banner Configuration Flow:**
1. User uploads Layer 2 image → `setCustomPageBannerImage2()` updates store
2. User adjusts scale/position → Store updates → PageBanner reflects changes
3. User sets paired background color → Saved with image when added to library
4. User saves to folder → `addLayer2Image()` adds image with current config to selected folder

**Theme Group Leader Management Flow (Left Column - Replaces Legacy Folder Theme):**
1. User selects group leader from dropdown → `setThemeGroupLeader()` sets as theme → Group members displayed in grid
2. Theme persists across sessions → Stored in `themeGroupLeaderId` and `themeGroupLeaderFolderId`
3. User clicks member image → `applyLayer2Image()` applies image and loads paired background color
4. Theme badge appears when group leader is set as theme
5. Clear button clears both theme and local selection
6. Legacy folder theme system is replaced by group leader theme system

**Folder Management Flow:**
1. User creates folder → `addLayer2Folder()` adds to array
2. User uploads image → `addLayer2Image()` adds to folder's images array
3. User applies image → `applyLayer2Image()` sets Layer 2 and loads paired color
4. **Folder Assignment**: User hovers folder → Clicks folder icon → Selects folder colors → `updateLayer2FolderFolders()` updates assignments
5. **Filtering**: User clicks prism bar color → Carousel filters to show only images from folders assigned to that color
6. **Group Leaders Toggle**: User toggles "Group Leaders Only" → Folders tab shows only images that are group leaders with at least 1 member

**Group Management Flow (Groups Tab):**
1. User selects group leader → Clicks image on left side → Sets `selectedGroupLeaderId` and `selectedGroupLeaderFolderId` and applies image
2. User assigns images to group → Clicks images on right side → `assignLayer2ToGroup()` updates group assignments
3. Group leader stores `groupMembers` array (format: "folderId:imageId")
4. Assigned images store `groupLeaderId` (format: "folderId:imageId")
5. Visual feedback shows assigned images with purple borders and checkmark badges
6. Active indicator overlay appears on right side when image is currently applied but not the group leader and not assigned

**Source of Truth:**
- `configStore.layer2Folders`: Array of Layer 2 folders with images
- `configStore.customPageBannerImage2`: Current Layer 2 image
- `configStore.themeGroupLeaderId`, `configStore.themeGroupLeaderFolderId`: Theme group leader
- All state persisted to `localStorage` via Zustand persist middleware

**State Dependencies:**
- When `themeGroupLeaderId` changes → Group leader selector updates → Members grid displays
- When group leader selected → Members grid updates → Theme badge appears
- When folder filter changes → Folders tab carousel filters images
- When group leaders toggle enabled → Folders tab shows only group leaders with members
- When image applied → Layer 2 updates → PageBanner reflects changes immediately

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
  - **Tab Navigation**: Three tabs below the sticky toolbar
    - **Page Banner Tab**: Banner editor and Layer 2 configuration
    - **Folders Tab**: Horizontal scrolling carousel of all Layer 2 images
    - **Groups Tab**: Two-column layout for group management (left: select group leader, right: assign images to group)
  - **Scrollable Content**: Tab content below the banner

- **Page Banner Tab**:
  - **Two-Column Layout**:
    - **Layer 1 - Group Leader Selector** (Left Column):
      - **Header**: "Group Leader" / "Theme Group Leader" / "All Images" with "Clear" button
      - **Theme Badge**: Purple "Theme" badge appears when a group leader is set as theme
      - **Group Leader Dropdown**: Selector with two modes:
        - **"All Images" Option**: First option in dropdown - shows all images from all folders regardless of groups
          - Selecting "All Images" displays all images in the grid below
          - Image uploader below dropdown adds images to default folder
        - **Group Leader Options**: List of group leaders with at least 1 member
          - Shows thumbnail, folder name, and member count for each group leader
          - Star icon appears next to group leaders that are set as theme
          - Selecting a group leader sets it as the theme (replaces legacy folder theme system)
      - **Image Uploader**: Always visible below dropdown
        - Uploads images to the folder of the selected group leader (or default folder if "All Images" is selected)
      - **Images Grid**: Displays images based on selection mode
        - **All Images Mode**: Shows all images from all folders in a 2-3-4 column grid
          - Each image shows folder name badge
          - Click any image to apply it as Layer 2 (loads paired background color)
        - **Group Leader Mode**: Shows group leader + all members in a 2-3-4 column grid
          - Group leader appears first with sky-blue border and "Leader" badge
          - Members appear after leader
          - Click any image (leader or member) to apply it as Layer 2 (loads paired background color)
        - Active indicator overlay when image is currently applied
        - Paired color indicators shown on thumbnails
      - **Empty States**: 
        - "Select a group leader to view images" when no selection
        - "No images found. Upload images to get started." when in All Images mode with no images
        - "No members in this group" when leader has no members
    - **Layer 2 - Overlay** (Right Column):
      - Image upload/thumbnail
      - Scale slider (50-200%) - updates preview live
      - X/Y position sliders (0-100%) - updates preview live
      - Paired background color picker
      - Remove button
      - Layer 1 default color dropdown
      - **Save Adjustments Button**: Appears when editing an image from the library
        - Saves current scale, position, and background color to the selected image
        - Saved adjustments apply across all page banners in the app


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
1. User selects "All Images" or group leader from dropdown → If group leader, `setThemeGroupLeader()` sets as theme
2. Theme persists across sessions → Stored in `themeGroupLeaderId` and `themeGroupLeaderFolderId`
3. Images grid displays based on selection:
   - **All Images Mode**: Shows all images from all folders
   - **Group Leader Mode**: Shows group leader (first, with "Leader" badge) + all members
4. User clicks any image → `applyLayer2Image()` applies image and loads paired background color → Image appears in PageBanner preview above
5. User adjusts sliders → Live preview updates in PageBanner
6. User clicks "Save Adjustments" → `updateLayer2Image()` saves scale/position/bgColor to image → Applies across all page banners
7. Theme badge appears when group leader is set as theme
8. Clear button clears both theme and local selection (including "All Images" mode)
9. Legacy folder theme system is replaced by group leader theme system
10. **Image Upload**: User uploads image via uploader below dropdown → Added to selected group leader's folder (or default if "All Images" selected)

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
- When `themeGroupLeaderId` changes → Group leader selector updates → Images grid displays (group leader mode)
- When "All Images" selected → Images grid shows all images from all folders
- When group leader selected → Images grid shows leader + members → Theme badge appears
- When image applied → Layer 2 updates → PageBanner preview reflects changes immediately
- When sliders adjusted → PageBanner preview updates live
- When adjustments saved → Image in library updated → Changes apply across all page banners
- When folder filter changes → Folders tab carousel filters images
- When group leaders toggle enabled → Folders tab shows only group leaders with members

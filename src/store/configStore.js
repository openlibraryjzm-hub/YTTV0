import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConfigStore = create(
    persist(
        (set) => ({
            // Pin Track & Header
            pinAnchorX: 50,
            setPinAnchorX: (val) => set({ pinAnchorX: val }),
            pinAnchorY: 0,
            setPinAnchorY: (val) => set({ pinAnchorY: val }),
            plusButtonX: 100,
            setPlusButtonX: (val) => set({ plusButtonX: val }),
            plusButtonY: 0,
            setPlusButtonY: (val) => set({ plusButtonY: val }),
            pinToggleY: 0,
            setPinToggleY: (val) => set({ pinToggleY: val }),

            // Playlist Header
            playlistToggleX: 20,
            setPlaylistToggleX: (val) => set({ playlistToggleX: val }),
            playlistTabsX: 0,
            setPlaylistTabsX: (val) => set({ playlistTabsX: val }),
            playlistInfoX: 0,
            setPlaylistInfoX: (val) => set({ playlistInfoX: val }),
            playlistInfoWidth: 200,
            setPlaylistInfoWidth: (val) => set({ playlistInfoWidth: val }),

            // Playlist Capsule
            playlistCapsuleX: 0,
            setPlaylistCapsuleX: (val) => set({ playlistCapsuleX: val }),
            playlistCapsuleY: 0,
            setPlaylistCapsuleY: (val) => set({ playlistCapsuleY: val }),
            playlistCapsuleWidth: 74,
            setPlaylistCapsuleWidth: (val) => set({ playlistCapsuleWidth: val }),
            playlistCapsuleHeight: 32,
            setPlaylistCapsuleHeight: (val) => set({ playlistCapsuleHeight: val }),
            playlistChevronLeftX: 0,
            setPlaylistChevronLeftX: (val) => set({ playlistChevronLeftX: val }),
            playlistPlayCircleX: 0,
            setPlaylistPlayCircleX: (val) => set({ playlistPlayCircleX: val }),
            playlistChevronRightX: 0,
            setPlaylistChevronRightX: (val) => set({ playlistChevronRightX: val }),

            // Orb Image Tuning
            orbImageScale: 1.0,
            setOrbImageScale: (val) => set({ orbImageScale: val }),
            orbImageScaleW: 1.0,
            setOrbImageScaleW: (val) => set({ orbImageScaleW: val }),
            orbImageScaleH: 1.0,
            setOrbImageScaleH: (val) => set({ orbImageScaleH: val }),
            orbImageXOffset: 0,
            setOrbImageXOffset: (val) => set({ orbImageXOffset: val }),
            orbImageYOffset: 0,
            setOrbImageYOffset: (val) => set({ orbImageYOffset: val }),
            orbSize: 150,
            setOrbSize: (val) => set({ orbSize: val }),
            orbMenuGap: 30, // Gap between orb and menus
            setOrbMenuGap: (val) => set({ orbMenuGap: val }),

            // Global Layout
            menuWidth: 340,
            setMenuWidth: (val) => set({ menuWidth: val }),
            menuHeight: 102,
            setMenuHeight: (val) => set({ menuHeight: val }),

            // Video Menu Toolbar
            modeHandleSize: 20,
            setModeHandleSize: (val) => set({ modeHandleSize: val }),
            modeHandleInternalSize: 14,
            setModeHandleInternalSize: (val) => set({ modeHandleInternalSize: val }),

            // Center Cluster
            modeSwitcherX: -128, // Grid moved to between chevrons
            setModeSwitcherX: (val) => set({ modeSwitcherX: val }),
            videoChevronLeftX: -150, // Leftmost
            setVideoChevronLeftX: (val) => set({ videoChevronLeftX: val }),
            videoChevronRightX: -100, // Right of Play
            setVideoChevronRightX: (val) => set({ videoChevronRightX: val }),
            videoPlayButtonX: -65, // Nudged right (swapped with grid)
            setVideoPlayButtonX: (val) => set({ videoPlayButtonX: val }),

            // Right Side Group (Shifted for equal spacing)
            starButtonX: -19,
            setStarButtonX: (val) => set({ starButtonX: val }),
            shuffleButtonX: 22,
            setShuffleButtonX: (val) => set({ shuffleButtonX: val }),

            // Right Flank
            pinFirstButtonX: 63,
            setPinFirstButtonX: (val) => set({ pinFirstButtonX: val }),
            likeButtonX: 104,
            setLikeButtonX: (val) => set({ likeButtonX: val }),
            menuButtonX: 280, // Moved 100px right
            setMenuButtonX: (val) => set({ menuButtonX: val }),
            tooltipButtonX: 145,
            setTooltipButtonX: (val) => set({ tooltipButtonX: val }),

            // Custom Banner Image
            customBannerImage: null,
            setCustomBannerImage: (val) => set({ customBannerImage: val }),

            // Custom Orb Image & Spill
            customOrbImage: null,
            setCustomOrbImage: (val) => set({ customOrbImage: val }),
            isSpillEnabled: false,
            setIsSpillEnabled: (val) => set({ isSpillEnabled: val }),
            orbSpill: { tl: true, tr: true, bl: true, br: true },
            setOrbSpill: (val) => set({ orbSpill: val }),

            // Advanced Orb Masking (Custom Crops)
            orbAdvancedMasks: { tl: false, tr: false, bl: false, br: false },
            setOrbAdvancedMasks: (val) => set({ orbAdvancedMasks: val }),
            orbMaskRects: {
                tl: { x: 0, y: 0, w: 50, h: 50 },
                tr: { x: 50, y: 0, w: 50, h: 50 },
                bl: { x: 0, y: 50, w: 50, h: 50 },
                br: { x: 50, y: 50, w: 50, h: 50 }
            },
            setOrbMaskRects: (val) => set({ orbMaskRects: val }),

            // Orb Favorites - saved configurations
            orbFavorites: [],
            addOrbFavorite: (favorite) => set((state) => ({
                orbFavorites: [...state.orbFavorites, {
                    id: Date.now().toString(),
                    name: favorite.name || `Favorite ${state.orbFavorites.length + 1}`,
                    createdAt: Date.now(),
                    customOrbImage: favorite.customOrbImage,
                    isSpillEnabled: favorite.isSpillEnabled,
                    orbSpill: favorite.orbSpill,
                    orbImageScale: favorite.orbImageScale,
                    orbImageXOffset: favorite.orbImageXOffset ?? 0,
                    orbImageYOffset: favorite.orbImageYOffset ?? 0,
                    // Save advanced masks
                    orbAdvancedMasks: favorite.orbAdvancedMasks || { tl: false, tr: false, bl: false, br: false },
                    orbMaskRects: favorite.orbMaskRects || {
                        tl: { x: 0, y: 0, w: 50, h: 50 },
                        tr: { x: 50, y: 0, w: 50, h: 50 },
                        bl: { x: 0, y: 50, w: 50, h: 50 },
                        br: { x: 50, y: 50, w: 50, h: 50 }
                    },
                    folderColors: favorite.folderColors || [], // Array of folder color IDs
                }]
            })),
            removeOrbFavorite: (id) => set((state) => ({
                orbFavorites: state.orbFavorites.filter(f => f.id !== id)
            })),
            applyOrbFavorite: (favorite) => set({
                customOrbImage: favorite.customOrbImage,
                isSpillEnabled: favorite.isSpillEnabled,
                orbSpill: favorite.orbSpill,
                orbImageScale: favorite.orbImageScale,
                orbImageXOffset: favorite.orbImageXOffset ?? 0,
                orbImageYOffset: favorite.orbImageYOffset ?? 0,
                // Restore advanced masks
                orbAdvancedMasks: favorite.orbAdvancedMasks || { tl: false, tr: false, bl: false, br: false },
                orbMaskRects: favorite.orbMaskRects || {
                    tl: { x: 0, y: 0, w: 50, h: 50 },
                    tr: { x: 50, y: 0, w: 50, h: 50 },
                    bl: { x: 0, y: 50, w: 50, h: 50 },
                    br: { x: 50, y: 50, w: 50, h: 50 }
                },
            }),
            renameOrbFavorite: (id, newName) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === id ? { ...f, name: newName } : f
                )
            })),
            updateOrbFavoriteFolders: (id, folderColors) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === id ? { ...f, folderColors: folderColors || [] } : f
                )
            })),
            // Group management for orb presets
            // groupLeaderId: ID of the orb preset that is the group leader
            // groupMembers: Array of orb preset IDs that belong to this group
            setOrbGroupLeader: (leaderId, memberIds) => set((state) => ({
                orbFavorites: state.orbFavorites.map(f =>
                    f.id === leaderId
                        ? { ...f, groupMembers: memberIds || [] }
                        : memberIds && memberIds.includes(f.id)
                            ? { ...f, groupLeaderId: leaderId }
                            : f.groupLeaderId === leaderId
                                ? { ...f, groupLeaderId: null }
                                : f
                )
            })),
            assignOrbToGroup: (presetId, groupLeaderId) => set((state) => {
                const leader = state.orbFavorites.find(f => f.id === groupLeaderId);
                const currentMembers = leader?.groupMembers || [];
                const isAlreadyMember = currentMembers.includes(presetId);

                return {
                    orbFavorites: state.orbFavorites.map(f => {
                        if (f.id === groupLeaderId) {
                            // Update leader's member list
                            return {
                                ...f,
                                groupMembers: isAlreadyMember
                                    ? currentMembers.filter(id => id !== presetId)
                                    : [...currentMembers, presetId]
                            };
                        } else if (f.id === presetId) {
                            // Update preset's group leader
                            return {
                                ...f,
                                groupLeaderId: isAlreadyMember ? null : groupLeaderId
                            };
                        }
                        return f;
                    })
                };
            }),

            // Restored Missing Keys (Defaults)
            pinFirstButtonSize: 34,
            setPinFirstButtonSize: (val) => set({ pinFirstButtonSize: val }),


            dotMenuWidth: 240,
            setDotMenuWidth: (val) => set({ dotMenuWidth: val }),
            dotMenuHeight: 100,
            setDotMenuHeight: (val) => set({ dotMenuHeight: val }),
            dotMenuY: -80,
            setDotMenuY: (val) => set({ dotMenuY: val }),
            dotSize: 32,
            setDotSize: (val) => set({ dotSize: val }),

            playlistHandleSize: 26,
            setPlaylistHandleSize: (val) => set({ playlistHandleSize: val }),
            playlistPlayIconSize: 14,
            setPlaylistPlayIconSize: (val) => set({ playlistPlayIconSize: val }),
            playlistChevronIconSize: 14,
            setPlaylistChevronIconSize: (val) => set({ playlistChevronIconSize: val }),

            bottomBarHeight: 40,
            setBottomBarHeight: (val) => set({ bottomBarHeight: val }),

            titleFontSize: 16,
            setTitleFontSize: (val) => set({ titleFontSize: val }),
            metadataFontSize: 11,
            setMetadataFontSize: (val) => set({ metadataFontSize: val }),

            pinSize: 20,
            setPinSize: (val) => set({ pinSize: val }),
            pinWidth: 40,
            setPinWidth: (val) => set({ pinWidth: val }),
            pinHeight: 30,
            setPinHeight: (val) => set({ pinHeight: val }),

            bottomIconSize: 34,
            setBottomIconSize: (val) => set({ bottomIconSize: val }),
            navChevronSize: 20,
            setNavChevronSize: (val) => set({ navChevronSize: val }),

            orbButtonSpread: 35,
            setOrbButtonSpread: (val) => set({ orbButtonSpread: val }),

            // Quick Assign/Shuffle Colors
            quickAssignColor: null,
            setQuickAssignColor: (val) => set({ quickAssignColor: val }),
            quickShuffleColor: 'all',
            setQuickShuffleColor: (val) => set({ quickShuffleColor: val }),

            // User Profile
            userName: 'Boss',
            setUserName: (val) => set({ userName: val }),
            userAvatar: '( ͡° ͜ʖ ͡°)',
            setUserAvatar: (val) => set({ userAvatar: val }),

            // Visual Flair
            bannerPattern: 'diagonal',
            setBannerPattern: (val) => set({ bannerPattern: val }),
            // Layer 1 - Background Color (solid color behind Layer 2 overlay)
            pageBannerBgColor: '#1e293b', // Default slate-800
            setPageBannerBgColor: (val) => set({ pageBannerBgColor: val }),
            // Second Page Banner Image (Layer 2)
            customPageBannerImage2: null,
            setCustomPageBannerImage2: (val) => set({ customPageBannerImage2: val }),
            pageBannerImage2Scale: 100,
            setPageBannerImage2Scale: (val) => set({ pageBannerImage2Scale: val }),
            pageBannerImage2XOffset: 50,
            setPageBannerImage2XOffset: (val) => set({ pageBannerImage2XOffset: val }),
            pageBannerImage2YOffset: 50,
            setPageBannerImage2YOffset: (val) => set({ pageBannerImage2YOffset: val }),

            // Layer 2 Image Folders System
            // playlistIds: [] means show on ALL playlists, specific IDs means show only on those playlists
            // isThemeFolder: true means this folder's images apply app-wide as the theme
            // condition: 'random' means randomly select from folder images on each page entry, null means use first image
            layer2Folders: [
                { id: 'default', name: 'Default', images: [], playlistIds: [], isThemeFolder: false, condition: null, folderColors: [] }
            ],
            selectedLayer2FolderId: 'default',
            setSelectedLayer2FolderId: (val) => set({ selectedLayer2FolderId: val }),
            // Theme folder ID - the folder that applies app-wide (legacy, being replaced by group leader theme)
            themeFolderId: null,
            setThemeFolder: (folderId) => set((state) => {
                // Clear theme flag from all folders, then set it on the selected folder
                const updatedFolders = state.layer2Folders.map(f => ({
                    ...f,
                    isThemeFolder: f.id === folderId ? true : false
                }));
                return {
                    layer2Folders: updatedFolders,
                    themeFolderId: folderId || null,
                    // Clear group leader theme when setting folder theme
                    themeGroupLeaderId: null,
                    themeGroupLeaderFolderId: null
                };
            }),
            clearThemeFolder: () => set((state) => {
                // Clear theme flag from all folders
                const updatedFolders = state.layer2Folders.map(f => ({
                    ...f,
                    isThemeFolder: false
                }));
                return {
                    layer2Folders: updatedFolders,
                    themeFolderId: null,
                    // Also clear group leader theme
                    themeGroupLeaderId: null,
                    themeGroupLeaderFolderId: null
                };
            }),
            // Theme group leader - replaces legacy folder theme system
            themeGroupLeaderId: null,
            themeGroupLeaderFolderId: null,
            setThemeGroupLeader: (imageId, folderId) => set((state) => {
                return {
                    themeGroupLeaderId: imageId || null,
                    themeGroupLeaderFolderId: folderId || null,
                    // Clear legacy folder theme when setting group leader theme
                    themeFolderId: null,
                    layer2Folders: state.layer2Folders.map(f => ({
                        ...f,
                        isThemeFolder: false
                    }))
                };
            }),
            clearThemeGroupLeader: () => set((state) => ({
                themeGroupLeaderId: null,
                themeGroupLeaderFolderId: null
            })),
            addLayer2Folder: (name) => set((state) => ({
                layer2Folders: [...state.layer2Folders, {
                    id: Date.now().toString(),
                    name: name || `Folder ${state.layer2Folders.length + 1}`,
                    images: [],
                    playlistIds: [], // Empty = show on all playlists
                    isThemeFolder: false,
                    condition: null, // null = first image, 'random' = random selection
                    folderColors: [] // Array of folder color IDs
                }]
            })),
            removeLayer2Folder: (folderId) => set((state) => {
                // If deleting the theme folder, clear the theme
                const isTheme = state.themeFolderId === folderId;
                return {
                    layer2Folders: state.layer2Folders.filter(f => f.id !== folderId),
                    // Reset to default if deleted folder was selected
                    selectedLayer2FolderId: state.selectedLayer2FolderId === folderId ? 'default' : state.selectedLayer2FolderId,
                    // Clear theme if deleting theme folder
                    themeFolderId: isTheme ? null : state.themeFolderId
                };
            }),
            renameLayer2Folder: (folderId, newName) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, name: newName } : f
                )
            })),
            // Update which playlists a folder appears on (empty = all playlists)
            setLayer2FolderPlaylists: (folderId, playlistIds) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, playlistIds: playlistIds || [] } : f
                )
            })),
            // Update folder condition (null = first image, 'random' = random selection)
            setLayer2FolderCondition: (folderId, condition) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, condition: condition || null } : f
                )
            })),
            // Update folder color assignments
            updateLayer2FolderFolders: (folderId, folderColors) => set((state) => ({
                layer2Folders: state.layer2Folders.map(f =>
                    f.id === folderId ? { ...f, folderColors: folderColors || [] } : f
                )
            })),
            addLayer2Image: (folderId, image) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? {
                            ...folder,
                            images: [...folder.images, {
                                id: Date.now().toString(),
                                image: image.image,
                                scale: image.scale ?? 100,
                                xOffset: image.xOffset ?? 50,
                                yOffset: image.yOffset ?? 50,
                                bgColor: image.bgColor ?? state.pageBannerBgColor, // Save Layer 1 color with image
                                destinations: image.destinations || null, // { pages: [], folderColors: [] } or null for all
                                createdAt: Date.now()
                            }]
                        }
                        : folder
                )
            })),
            removeLayer2Image: (folderId, imageId) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? { ...folder, images: folder.images.filter(img => img.id !== imageId) }
                        : folder
                )
            })),
            updateLayer2Image: (folderId, imageId, updates) => set((state) => ({
                layer2Folders: state.layer2Folders.map(folder =>
                    folder.id === folderId
                        ? {
                            ...folder,
                            images: folder.images.map(img =>
                                img.id === imageId ? { ...img, ...updates } : img
                            )
                        }
                        : folder
                )
            })),
            applyLayer2Image: (image) => set({
                customPageBannerImage2: image.image,
                pageBannerImage2Scale: image.scale,
                pageBannerImage2XOffset: image.xOffset,
                pageBannerImage2YOffset: image.yOffset
            }),
            // Group management for Layer 2 images
            // groupLeaderId: ID of the layer2 image that is the group leader (format: "folderId:imageId")
            // groupMembers: Array of image IDs that belong to this group (format: "folderId:imageId")
            assignLayer2ToGroup: (imageId, folderId, groupLeaderId, groupLeaderFolderId) => set((state) => {
                const currentImageKey = `${folderId}:${imageId}`;
                const leaderKey = `${groupLeaderFolderId}:${groupLeaderId}`;

                // Find the leader image to get its current members
                let leaderImage = null;
                state.layer2Folders.forEach(folder => {
                    if (folder.id === groupLeaderFolderId) {
                        const img = folder.images.find(i => i.id === groupLeaderId);
                        if (img) {
                            leaderImage = { ...img, folderId: folder.id };
                        }
                    }
                });

                const currentMembers = leaderImage?.groupMembers || [];
                const isAlreadyMember = currentMembers.includes(currentImageKey);

                return {
                    layer2Folders: state.layer2Folders.map(folder => {
                        if (folder.id === groupLeaderFolderId) {
                            // Update leader image's member list
                            return {
                                ...folder,
                                images: folder.images.map(img =>
                                    img.id === groupLeaderId
                                        ? {
                                            ...img,
                                            groupMembers: isAlreadyMember
                                                ? currentMembers.filter(id => id !== currentImageKey)
                                                : [...currentMembers, currentImageKey]
                                        }
                                        : img
                                )
                            };
                        } else if (folder.id === folderId) {
                            // Update the image being assigned (only if it's not the leader itself)
                            if (imageId !== groupLeaderId || folderId !== groupLeaderFolderId) {
                                return {
                                    ...folder,
                                    images: folder.images.map(img =>
                                        img.id === imageId
                                            ? {
                                                ...img,
                                                groupLeaderId: isAlreadyMember ? null : leaderKey
                                            }
                                            : img
                                    )
                                };
                            }
                        }
                        return folder;
                    })
                };
            }),

            // Per-Playlist Layer 2 Image Overrides
            // Maps playlistId -> { image, scale, xOffset, yOffset, imageId, folderId, bgColor }
            // If a playlist has an override, it uses that image instead of the default
            // bgColor stores the Layer 1 background color at the time of selection
            playlistLayer2Overrides: {},
            setPlaylistLayer2Override: (playlistId, imageConfig) => set((state) => ({
                playlistLayer2Overrides: {
                    ...state.playlistLayer2Overrides,
                    [playlistId]: imageConfig
                }
            })),
            clearPlaylistLayer2Override: (playlistId) => set((state) => {
                const newOverrides = { ...state.playlistLayer2Overrides };
                delete newOverrides[playlistId];
                return { playlistLayer2Overrides: newOverrides };
            }),

            // Player Border Pattern
            playerBorderPattern: 'diagonal',
            setPlayerBorderPattern: (val) => set({ playerBorderPattern: val }),

            // Visualizer Gradient
            visualizerGradient: true,
            setVisualizerGradient: (val) => set({ visualizerGradient: val }),

            // Unified Banner State (Calculated)
            bannerHeight: 0,
            setBannerHeight: (val) => set({ bannerHeight: val }),
            bannerBgSize: '100% auto',
            setBannerBgSize: (val) => set({ bannerBgSize: val }),
        }), {
        name: 'config-storage-v10', // name of the item in the storage (must be unique)
    }
    )
);

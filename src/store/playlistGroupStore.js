import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storageUtils';
import { FOLDER_COLORS } from '../utils/folderColors';

const generateId = () => 'g' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

/**
 * Playlist Group Store - Group carousels each bound to a colored folder (FOLDER_COLORS).
 * Assigning a playlist to a "colored folder" creates or uses that group carousel on the Playlists page bar.
 */
export const usePlaylistGroupStore = create(
    persist(
        (set, get) => {
            // The store will now support pages of groups. `getGroupByColorId` targets a specific page.
            const getGroupByColorId = (colorId, page = 1) => get().groups.find((g) => g.folderColorId === colorId && (g.page || 1) === page);
            return {
                // Array of { id, name, playlistIds, folderColorId } — folderColorId ties group to prism color
                groups: [],

                /** Per-group carousel display mode: { [groupId]: 'large' | 'small' | 'bar' }. Defaults to 'large' when missing. */
                groupCarouselModes: {},
                setGroupCarouselMode: (groupId, mode) => {
                    if (groupId == null) return;
                    const valid = ['large', 'small', 'bar'].includes(mode) ? mode : 'large';
                    set((state) => ({
                        groupCarouselModes: { ...state.groupCarouselModes, [groupId]: valid },
                    }));
                },

                /** One-shot: set every group's carousel mode to the same value (e.g. "apply Bar to all"). */
                setAllGroupCarouselModes: (mode) => {
                    const valid = ['large', 'small', 'bar'].includes(mode) ? mode : 'large';
                    set((state) => {
                        const next = {};
                        state.groups.forEach((g) => { next[g.id] = valid; });
                        return { groupCarouselModes: { ...state.groupCarouselModes, ...next } };
                    });
                },

                /** Last group carousel the user "entered from" on GROUPS tab (used for single badge + future nav range) */
                activeGroupId: null,
                setActiveGroupId: (id) => set({ activeGroupId: id == null ? null : id }),

                /** Get the group that uses this folder color, or null. */
                getGroupByColorId,

                /** Add a new group for the given folder color. Returns the new group id. */
                addGroup: (name, folderColorId, page = 1) => {
                    const id = generateId();
                    const color = FOLDER_COLORS.find((c) => c.id === folderColorId);
                    const displayName = name || (color ? color.name : 'New group');
                    set({
                        groups: [...get().groups, { id, name: displayName, playlistIds: [], folderColorId: folderColorId || null, page }],
                    });
                    return id;
                },

                /** Get the first FOLDER_COLORS id that does not yet have a group on this page (for "New carousel" button). */
                getNextAvailableColorId: (page = 1) => {
                    const used = new Set(get().groups.filter(g => (g.page || 1) === page).map((g) => g.folderColorId).filter(Boolean));
                    const next = FOLDER_COLORS.find((c) => !used.has(c.id));
                    return next ? next.id : null;
                },

                removeGroup: (groupId) => {
                    set((state) => ({
                        groups: state.groups.filter((g) => g.id !== groupId),
                        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
                    }));
                },

                addPlaylistToGroup: (groupId, playlistId) => {
                    const pid = Number(playlistId);
                    set({
                        groups: get().groups.map((g) =>
                            g.id !== groupId
                                ? g
                                : { ...g, playlistIds: g.playlistIds.includes(pid) ? g.playlistIds : [...g.playlistIds, pid] }
                        ),
                    });
                },

                removePlaylistFromGroup: (groupId, playlistId) => {
                    const pid = Number(playlistId);
                    set({
                        groups: get().groups.map((g) =>
                            g.id !== groupId ? g : { ...g, playlistIds: g.playlistIds.filter((id) => id !== pid) }
                        ),
                    });
                },

                isPlaylistInGroup: (playlistId, groupId) => {
                    const g = get().groups.find((x) => x.id === groupId);
                    return g ? g.playlistIds.includes(Number(playlistId)) : false;
                },

                /** Group IDs that contain this playlist */
                getGroupIdsForPlaylist: (playlistId) => {
                    const pid = Number(playlistId);
                    return get().groups.filter((g) => g.playlistIds.includes(pid)).map((g) => g.id);
                },

                renameGroup: (groupId, name) => {
                    set({
                        groups: get().groups.map((g) => (g.id !== groupId ? g : { ...g, name })),
                    });
                },
            };
        },
        {
            name: 'playlist-group-storage',
            storage: createJSONStorage(() => idbStorage),
            version: 4,
            migrate: (state, version) => {
                if (!state) return { groups: [], activeGroupId: null, groupCarouselModes: {} };
                const next = {
                    groups: state.groups || [],
                    activeGroupId: state.activeGroupId ?? null,
                    groupCarouselModes: state.groupCarouselModes && typeof state.groupCarouselModes === 'object' ? state.groupCarouselModes : {},
                };
                if (!Array.isArray(next.groups)) {
                    const legacy = state.groupPlaylistIds;
                    next.groups = Array.isArray(legacy) && legacy.length > 0
                        ? [{ id: generateId(), name: 'Featured playlists', playlistIds: legacy, folderColorId: FOLDER_COLORS[0]?.id ?? null }]
                        : [];
                }
                if (version < 4) {
                    next.groups = next.groups.map((g, i) => ({
                        ...g,
                        folderColorId: g.folderColorId ?? (FOLDER_COLORS[i] ? FOLDER_COLORS[i].id : null),
                    }));
                }
                return next;
            },
        }
    )
);

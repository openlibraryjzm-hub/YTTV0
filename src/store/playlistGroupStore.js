import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () => 'g' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);

/**
 * Playlist Group Store - Multiple named group carousels on the Playlists Page.
 * Each group is one carousel row; playlists are assigned to groups via the card 3-dot menu.
 */
export const usePlaylistGroupStore = create(
    persist(
        (set, get) => ({
            // Array of { id, name, playlistIds }
            groups: [],

            addGroup: (name) => {
                const id = generateId();
                set({
                    groups: [...get().groups, { id, name: name || 'New group', playlistIds: [] }],
                });
                return id;
            },

            removeGroup: (groupId) => {
                set({
                    groups: get().groups.filter((g) => g.id !== groupId),
                });
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
        }),
        {
            name: 'playlist-group-storage',
            version: 1,
            migrate: (state) => {
                if (!state) return { groups: [] };
                if (state.groups && Array.isArray(state.groups)) return state;
                const legacy = state.groupPlaylistIds;
                if (Array.isArray(legacy) && legacy.length > 0) {
                    return { groups: [{ id: generateId(), name: 'Featured playlists', playlistIds: legacy }] };
                }
                return { groups: [] };
            },
        }
    )
);

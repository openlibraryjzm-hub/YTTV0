import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Pin Store - Persistent video pinning
 * Pins persist across sessions until manually removed
 * Supports priority pins (always first/leftmost) set via yellow pin button
 * All pins (normal and priority) persist until manually removed
 */
export const usePinStore = create(
  persist(
    (set, get) => {
      // access initial state if needed for reset, but persist middleware handles hydration
      const initialState = {
        pinnedVideos: [], // Array of video objects: { id, video_id, video_url, title, ..., pinnedAt: timestamp }
        priorityPinIds: [], // Array of priority pin IDs, order matters (most recent first)
      };

      return {
        ...initialState,

        /**
         * Helper to ensure priority pins are always first in the array
         * @param {Array} videos - Array of pinned videos
         * @param {Array} priorityIds - Array of priority pin IDs
         * @returns {Array} Sorted array with priority pins first
         */
        _sortPinsWithPriority: (videos, priorityIds) => {
          if (!priorityIds || priorityIds.length === 0) return videos;

          const priorityPins = [];
          const otherPins = [];

          videos.forEach(v => {
            if (priorityIds.includes(v.id)) {
              priorityPins.push(v);
            } else {
              otherPins.push(v);
            }
          });

          // Sort priority pins by their order in priorityIds
          priorityPins.sort((a, b) => {
            return priorityIds.indexOf(a.id) - priorityIds.indexOf(b.id);
          });

          return [...priorityPins, ...otherPins];
        },

        /**
         * Get full pin info for a video
         * @param {number} videoId 
         */
        getPinInfo: (videoId) => {
          const state = get();
          const normalPin = state.pinnedVideos.find(v => v.id === videoId && !state.priorityPinIds.includes(v.id));
          const isPriority = state.priorityPinIds.includes(videoId);

          return {
            isPinned: !!normalPin,
            isPriority: isPriority,
            pinnedAt: normalPin ? normalPin.pinnedAt : null
          };
        },

        /**
         * Toggle pin status for a video (normal pin from video card)
         * - If currently Priority: Unpin completely (remove from priority and pinned).
         * - If currently Normal: Unpin.
         * - If Not Pinned: Pin as Normal.
         * This enforces "Cannot be both" by ensuring check is exclusive and actions clear other state.
         * @param {Object} video - Video object to pin/unpin
         */
        togglePin: (video) => {
          const state = get();
          const isPriority = state.priorityPinIds.includes(video.id);
          const isNormalPin = state.pinnedVideos.some(v => v.id === video.id) && !isPriority;

          if (isPriority) {
            // Unpin completely
            const newPriorityIds = state.priorityPinIds.filter(id => id !== video.id);
            const newPins = state.pinnedVideos.filter(v => v.id !== video.id);

            set({
              pinnedVideos: newPins,
              priorityPinIds: newPriorityIds,
            });
          } else if (isNormalPin) {
            // Unpin Normal
            const newPins = state.pinnedVideos.filter(v => v.id !== video.id);
            set({ pinnedVideos: newPins });
          } else {
            // Pin as Normal
            // Remove from priority if it somehow was there (fail-safe)
            const newPriorityIds = state.priorityPinIds.filter(id => id !== video.id);

            const pinWithTimestamp = { ...video, pinnedAt: Date.now() };
            const newPins = [...state.pinnedVideos, pinWithTimestamp];

            set({
              pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
              priorityPinIds: newPriorityIds,
            });
          }
        },

        /**
         * Check if a video is pinned (NORMAL PIN ONLY)
         * @param {number} videoId - Video ID to check
         * @returns {boolean}
         */
        isPinned: (videoId) => {
          const state = get();
          // It is pinned if in pinnedVideos AND NOT in priorityPinIds
          return state.pinnedVideos.some(v => v.id === videoId) && !state.priorityPinIds.includes(videoId);
        },

        /**
         * Check if a video is a priority pin
         * @param {number} videoId - Video ID to check
         * @returns {boolean}
         */
        isPriorityPin: (videoId) => {
          const state = get();
          return state.priorityPinIds.includes(videoId);
        },

        /**
         * Remove a pin by video ID (removes from both)
         * @param {number} videoId - Video ID to unpin
         */
        removePin: (videoId) => {
          const state = get();
          const newPins = state.pinnedVideos.filter(v => v.id !== videoId);
          const newPriorityIds = state.priorityPinIds.filter(id => id !== videoId);

          set({
            pinnedVideos: newPins,
            priorityPinIds: newPriorityIds,
          });
        },

        /**
         * Remove a pin by YouTube video_id (removes from both normal and priority pins)
         * Used for auto-unpinning when videos are watched to completion
         * @param {string} videoId - YouTube video_id to unpin
         */
        removePinByVideoId: (videoId) => {
          const state = get();
          // Find the pin by video_id (YouTube ID)
          const pinToRemove = state.pinnedVideos.find(v => v.video_id === videoId);
          if (pinToRemove) {
            // Remove by database id
            const newPins = state.pinnedVideos.filter(v => v.id !== pinToRemove.id);
            const newPriorityIds = state.priorityPinIds.filter(id => id !== pinToRemove.id);
            set({
              pinnedVideos: newPins,
              priorityPinIds: newPriorityIds,
            });
          }
        },

        /**
         * Clear all pins
         */
        clearAllPins: () => {
          set({ pinnedVideos: [], priorityPinIds: [] });
        },

        /**
         * Toggle a video as a priority pin (via yellow button)
         * - If currently Priority: Unpin completely (remove from priority and pinned).
         * - If currently Normal: Promote to Priority.
         * - If Not Pinned: Pin as Priority.
         * @param {Object} video - Video object to toggle as priority pin
         */
        togglePriorityPin: (video) => {
          const state = get();
          const isPriority = state.priorityPinIds.includes(video.id);

          if (isPriority) {
            // Remove from Priority AND Pinned (Unpin completely)
            const newPriorityIds = state.priorityPinIds.filter(id => id !== video.id);
            const newPins = state.pinnedVideos.filter(v => v.id !== video.id);
            set({
              priorityPinIds: newPriorityIds,
              pinnedVideos: newPins
            });
          } else {
            // Add to Priority (Promote)
            const newPriorityIds = [video.id, ...state.priorityPinIds];

            let newPins = state.pinnedVideos;
            const existingPin = state.pinnedVideos.find(v => v.id === video.id);

            if (!existingPin) {
              // Add to pinnedVideos if not present
              newPins = [video, ...state.pinnedVideos];
            }
            // If it was already pinned, it stays in pinnedVideos.
            // But since isPriority=true, isPinned() will return false, making it exclusive.

            set({
              priorityPinIds: newPriorityIds,
              pinnedVideos: get()._sortPinsWithPriority(newPins, newPriorityIds),
            });
          }
        },

        /**
         * Check and remove expired pins
         * NOTE: Pins no longer expire - this function is kept for backward compatibility
         * but does nothing. All pins persist until manually removed.
         */
        checkExpiration: () => {
          // Pins no longer expire - function kept for backward compatibility
          // No-op: all pins persist until manually removed
        },
      };
    },
    {
      name: 'pin-storage', // localStorage key
      partialize: (state) => ({
        pinnedVideos: state.pinnedVideos,
        priorityPinIds: state.priorityPinIds
      }), // Persist both lists
    }
  )
);

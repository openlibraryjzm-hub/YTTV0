import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMissionStore = create(
    persist(
        (set, get) => ({
            // Time Bank in seconds
            timeBank: 0,

            // Access State
            isAppLocked: true,

            // Mission System
            categories: ['Daily', 'Work', 'Health'],
            missions: [
                { id: 'm1', text: 'Drink a glass of water', reward: 300, completed: false, category: 'Health' }, // 5 mins
                { id: 'm2', text: 'Do 10 pushups', reward: 600, completed: false, category: 'Health' }, // 10 mins
                { id: 'm3', text: 'Clean your desk', reward: 900, completed: false, category: 'Work' }, // 15 mins
            ],

            // Actions
            addTime: (seconds) => set((state) => ({ timeBank: state.timeBank + seconds })),

            consumeTime: (seconds) => set((state) => {
                const newTime = Math.max(0, state.timeBank - seconds);
                return {
                    timeBank: newTime,
                    isAppLocked: newTime <= 0 // Auto-lock if time runs out
                };
            }),

            addCategory: (name) => set((state) => {
                if (state.categories.includes(name)) return state;
                return { categories: [...state.categories, name] };
            }),

            removeCategory: (name) => set((state) => {
                if (state.categories.length <= 1) return state; // Prevent deleting the last category
                const remainingCategories = state.categories.filter(c => c !== name);
                const fallbackCategory = remainingCategories[0] || 'Daily';

                return {
                    categories: remainingCategories,
                    // Move missions to the first available category
                    missions: state.missions.map(m => m.category === name ? { ...m, category: fallbackCategory } : m)
                };
            }),

            addMission: (text, rewardMinutes, category = 'Daily') => set((state) => ({
                missions: [
                    ...state.missions,
                    {
                        id: Date.now().toString(),
                        text,
                        reward: rewardMinutes * 60,
                        completed: false,
                        category
                    }
                ]
            })),

            removeMission: (id) => set((state) => ({
                missions: state.missions.filter(m => m.id !== id)
            })),

            completeMission: (id) => set((state) => {
                const mission = state.missions.find(m => m.id === id);
                if (!mission || mission.completed) return state;

                return {
                    // Add reward to bank
                    timeBank: state.timeBank + mission.reward,
                    missions: state.missions.map(m =>
                        m.id === id ? { ...m, completed: true } : m
                    )
                };
            }),

            resetMission: (id) => set((state) => ({
                missions: state.missions.map(m =>
                    m.id === id ? { ...m, completed: false } : m
                )
            })),

            resetDailyMissions: () => set((state) => ({
                missions: state.missions.map(m => ({ ...m, completed: false }))
            })),

            unlockApp: () => {
                const { timeBank } = get();
                if (timeBank > 0) {
                    set({ isAppLocked: false });
                    return true;
                }
                return false;
            },

            lockApp: () => set({ isAppLocked: true })

        }),
        {
            name: 'mission-storage', // unique name
            version: 2, // version bump for migration if needed (zustand persist handles it gracefully mostly)
            migrate: (persistedState, version) => {
                if (version === 0 || !version) {
                    // migration logic if needed, e.g. add default category to old missions
                    return {
                        ...persistedState,
                        categories: ['Daily', 'Work', 'Health'],
                        missions: persistedState.missions?.map(m => ({ ...m, category: 'Daily' })) || []
                    };
                }
                return persistedState;
            },
        }
    )
);

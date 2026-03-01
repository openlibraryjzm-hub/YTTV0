import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/storageUtils';

export const useMissionStore = create(
    persist(
        (set, get) => ({
            // Time Bank in seconds
            timeBank: 0,

            // Access State
            isAppLocked: true,

            // When true, app can be used without time restrictions (no gating, no consumption)
            timerDisabled: false,
            setTimerDisabled: (value) => set({ timerDisabled: value }),

            // Mission System
            categories: ['Daily', 'Work', 'Health'],
            missions: [
                { id: 'm1', text: 'Drink a glass of water', reward: 300, completed: false, category: 'Health' }, // 5 mins
                { id: 'm2', text: 'Do 10 pushups', reward: 600, completed: false, category: 'Health' }, // 10 mins
                { id: 'm3', text: 'Clean your desk', reward: 900, completed: false, category: 'Work' }, // 15 mins
            ],

            // Actions
            addTime: (seconds) => set((state) => ({ timeBank: state.timeBank + seconds })),
            resetTimeBank: () => set({ timeBank: 0, isAppLocked: true }),

            consumeTime: (seconds) => set((state) => {
                if (state.timerDisabled) return state; // Don't consume or auto-lock when timer disabled
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
                        coinReward: rewardMinutes, // 1 coin per minute
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
                    coins: state.coins + (mission.coinReward || Math.floor(mission.reward / 60)),
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
                const { timeBank, timerDisabled } = get();
                if (timerDisabled || timeBank > 0) {
                    set({ isAppLocked: false });
                    return true;
                }
                return false;
            },

            lockApp: () => set({ isAppLocked: true }),

            // Currency
            coins: 0,
            addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
            spendCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins - amount) })),
            resetCoins: () => set({ coins: 0 }),

        }),
        {
            name: 'mission-storage', // unique name
            storage: createJSONStorage(() => idbStorage),
            version: 4, // version bump for migration
            migrate: (persistedState, version) => {
                let state = persistedState;

                if (version < 4) {
                    state = { ...state, timerDisabled: false };
                }

                if (version < 2) {
                    state = {
                        ...state,
                        categories: ['Daily', 'Work', 'Health'],
                        missions: state.missions?.map(m => ({ ...m, category: 'Daily' })) || []
                    };
                }

                if (version < 3) {
                    state = {
                        ...state,
                        coins: 0,
                        missions: state.missions.map(m => ({
                            ...m,
                            coinReward: Math.floor(m.reward / 60) // Backfill coins based on minutes
                        }))
                    };
                }

                return state;
            },
        }
    )
);

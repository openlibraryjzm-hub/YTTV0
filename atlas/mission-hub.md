# Mission Hub (Home Hub)

## 1. Overview

The **Mission Hub** (also known as "Home Hub" or "Mission Control") is a gamified productivity system that replaces the traditional start screen. It serves as the application's central gateway, requiring users to earn "time" by completing tasks (missions) before they can access the main application.

- **Purpose**: To add a layer of intentionality and productivity to the user's workflow.
- **Mechanism**: A "Time Bank" stores earned time. The main app is locked when the time bank is empty.
- **Location**: `src/components/HomeHub.jsx`

## 2. Features

### 2.1 Time Bank
- Displays the current available time in `HH:MM:SS` format.
- Time is consumed at a rate of 1 second per second when the main application is unlocked and active.
- **Auto-Lock**: When the time bank reaches `00:00:00`, the application automatically locks and returns the user to the Mission Hub.

### 2.2 Mission System
- Users can create custom missions (tasks) with specific time rewards (e.g., "Do 10 Pushups" for 10 minutes).
- **Completion**: Clicking a mission's checkbox marks it as complete and immediately adds the reward to the Time Bank.
- **Reset**: Completed missions can be individually reset (via a yellow refresh icon). This allows users to repeat a habit or task to earn more time without deleting and recreating the mission.

### 2.3 Tabbed Organization
- Missions are organized into customizable **Categories (Tabs)**.
- **Default Tabs**: The system initializes with a "Daily" tab.
- **Management**:
  - **Create**: Users can add new tabs (e.g., "Work", "Health", "Chores") using the `+` button.
  - **Delete**: Hovering over a tab reveals an `X` button to delete it.
    - *Constraint*: The last remaining tab cannot be deleted to ensure the UI always has a valid state.
    - *Logic*: Deleting the active tab automatically switches view to the first available tab.

### 2.4 Visuals
- **Background**: Uses the user's configured **App Banner** (if available) with a blur effect, creating a cohesive visual experience.
- **Animations**: Uses `framer-motion` for smooth entry/exit animations of missions, tabs, and the hub itself.

### 2.5 Daily Lootbox
- **Trigger**: "Daily Supply Drop" button (Gift icon) in the launch panel.
- **Experience**: A gamified full-screen overlay where clicking a "Supply Crate" triggers a shake-and-open animation.
- **Rewards**: reveals 4 randomized placeholder rewards (Credits, XP, etc.) to simulate a progression system.

## 3. Architecture

### 3.1 State Management (`missionStore.js`)
The entire system is powered by a persistent Zustand store.

**State Structure:**
```javascript
{
  timeBank: 0,           // (number) Seconds remaining
  isAppLocked: true,     // (boolean) Current lock state
  categories: ['Daily'], // (string[]) List of tab names
  missions: [            // (object[]) List of mission objects
    {
      id: "...",
      text: "Task Name",
      reward: 300,       // Seconds
      completed: false,
      category: "Daily"
    }
  ]
}
```

**Key Actions:**
- `addTime(seconds)` / `consumeTime(seconds)`: Manages the bank.
- `addMission` / `removeMission` / `completeMission` / `resetMission`: Manages tasks.
- `addCategory` / `removeCategory`: Manages tabs.
- `unlockApp()`: Unlocks the app *only if* `timeBank > 0`.

**Persistence:**
- Uses `persist` middleware to save state to `localStorage` under the key `mission-storage`.
- Includes versioning and migration logic to handle schema updates (e.g., adding categories to old missions).

### 3.2 Integration (`App.jsx`)
The `App.jsx` component acts as the enforcer of the Mission Hub's rules.

- **Lock Enforcement**: Conditionally renders `HomeHub` vs `LayoutShell` based on `isAppLocked`.
- **Time Consumption**:
  - Uses a `useEffect` hook to set up a 1-second interval.
  - Only runs when `!isAppLocked` and `timeBank > 0`.
  - Calls `consumeTime(1)` every tick.
  - The store's `consumeTime` action automatically sets `isAppLocked = true` when time hits 0, triggering the view switch in `App.jsx`.

## 4. User Guide

1.  **Launch**: Open the application. You will land on the Mission Hub.
2.  **Add Mission**: 
    - Select or create a Tab.
    - Click "Add Task".
    - Type a description and select a time reward (e.g., 15m).
3.  **Earn Time**: Complete the task in real life, then click the circle in the UI. Your Time Bank will increase.
4.  **Launch System**: Click the large "Launch System" button.
5.  **Use App**: Enjoy the app. The timer runs in the background.
6.  **Refill**: If you run out of time (or want to stock up), return to the hub (or wait for auto-lock) and complete more missions. You can **Reset** previously completed missions to do them again.

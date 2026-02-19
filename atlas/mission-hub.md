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
- **Reset**: A refresh button (visible only when time > 0) allows users to manually reset the Time Bank to 0 securely using a browser confirmation prompt.

### 2.2 Mission System
- Users can create custom missions (tasks) with specific time rewards (e.g., "Do 10 Pushups" for 10 minutes).
- **Rewards**: 
  - **Time**: Adds the specified minutes to the Time Bank.
  - **Credits (Coins)**: Awards 1 Credit per minute of the task (e.g., 15m task = 15 Credits).
- **Completion**: Clicking a mission's checkbox marks it as complete and immediately grants both rewards.
- **Readability**: Mission descriptions support multi-line wrapping and top-aligned layouts, ensuring "quite long" tasks are fully legible without being cut off. Hovering over a mission displays the full text as a tooltip.
- **Reset**: Completed missions can be individually reset (via a yellow refresh icon). This allows users to repeat a habit or task to earn more time and credits without deleting and recreating the mission.

### 2.3 Tabbed Organization
- Missions are organized into customizable **Categories (Tabs)**.
- **Default Tabs**: The system initializes with a "Daily" tab.
- **Management**:
  - **Create**: Users can add new tabs (e.g., "Work", "Health", "Chores") using the `+` button.
  - **Delete**: Hovering over a tab reveals an `X` button to delete it.
    - *Safety*: Deletion requires confirmation via a sleek modal warning that missions will be moved.
    - *Constraint*: The last remaining tab cannot be deleted to ensure the UI always has a valid state.
    - *Logic*: Deleted tabs move their missions to the default "Daily" tab. If the active tab is deleted, the view switches to the first available tab.

### 2.4 Currency System (Credits)
- **Earning**: Users earn "Credits" (displayed as blue/slate currency badges) by completing missions alongside Time rewards.
- **Spending**: Credits are used in the **Supply Depot** to purchase requisition packages (Lootboxes).
- **Display**: A tiered credit display in the launcher panel shows the current balance with a spinning coin animation.
- **Reset**: A "Clear Credits" option in the Supply Depot allows users to reset their balance (requires confirmation).

### 2.4 Visuals (Atlas Blue Redesign)
- **Theming**: The interface utilizes a **Cool Blue / Pastel Blue** aesthetic with heavy white accents, moving away from the legacy "Dark Mode" to a "Light/OS High-Security" feel.
- **Background**: Uses a soft `blue-50` base with a sophisticated backdrop blur layer (`backdrop-blur-xl`) for overlays.
- **Glassmorphism**: Mission logs and panels utilize semi-transparent white backgrounds (`bg-white/80`) to create depth and focus.
- **Animations**: Uses `framer-motion` for smooth spring-based entry/exit animations of missions, tabs, and reward cards.

### 2.5 Supply Drops (Lootboxes)
- **Trigger**: "Supply Depot" button in the launch panel.
- **Experience**: A full-screen requisition interface where users purchase crates (Mini, Standard, Legendary).
- **Opening Sequence**: A focused opening animation with a light-burst effect reveals high-resolution cards for puzzle shards or full entry unlocks.
- **Mechanic**: Replaces placeholder rewards with a deep integration into the **Pokédex System**.

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
    - Type a description (supports multi-line entry via textarea) and select a time reward (e.g., 15m).
3.  **Earn Time**: Complete the task in real life, then click the circle in the UI. Your Time Bank will increase.
4.  **Launch System**: Click the large "Launch System" button.
5.  **Use App**: Enjoy the app. The timer runs in the background.
6.  **Refill**: If you run out of time (or want to stock up), return to the hub (or wait for auto-lock) and complete more missions. You can **Reset** previously completed missions to do them again.

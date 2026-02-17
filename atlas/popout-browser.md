# Pop-out Browser & Window Management

This document details the standalone webview window functionality integrated into the application, specifically the Twitter/X pop-out feature launched from the Player Controller's orb menu.

## 1. Overview

The Pop-out Browser feature allows specific web applications (currently Twitter/X) to run in a separate, dedicated native window (`WebviewWindow`). This ensures:
- **Performance Isolation**: The heavy web app runs in its own process, preventing it from slowing down the main React application.
- **Independent Context**: The window can be moved, resized, and managed separately from the main app window.
- **Session Management**: The window acts as a temporary "session" with enforced time limits.

## 2. Twitter/X Integration

Launched via the **Twitter Button** (Bottom-Left) on the Advanced Player Controller's Orb Menu.

### 2.1 Window Configuration
- **URL**: `https://x.com`
- **Dimensions**: 1200x800 (default), resizable.
- **Label**: `twitter-popup` (Unique identifier).
- **Focus**: Automatically focuses on creation or if re-triggered.

### 2.2 Single Instance Enforcement
The implementation prevents multiple instances of the popup:
1. When the button is clicked, it checks `WebviewWindow.getByLabel('twitter-popup')`.
2. If the window exists, it merely brings it to the foreground (`setFocus()`).
3. If not, it creates a new instance.

## 3. Time-Limited Sessions ("Self-Destruct")

To maintain the gamified "Time Bank" economy of the application, the pop-out window enforces a strict session limit based on the user's available time.

### 3.1 Time Bank Dependency
- Upon creation, the window retrieves the **current** `timeBank` value (in seconds) from the `missionStore`.
- **Snapshotted Value**: It uses `useMissionStore.getState().timeBank` to get the instant value. It does *not* subscribe to updates.
- **Independence**: The timer runs independently of the main app. Even if the main app enters the "Locked" state (pausing its own internal timer), the pop-out window's timer continues to tick down.

### 3.2 Live Countdown Indicator
The window title provides real-time feedback on the remaining session time:
- **Format**: `X / Twitter (M:SS)`
- **Updates**: The title is updated every second via `webview.setTitle()`.
- **Behavior**:
  - As time decreases, the title counts down (e.g., "5:00" -> "4:59").
  - If the user manually closes the window, the timer loop detects the failure to set the title and cleanly terminates itself.

### 3.3 Expiration
When the timer reaches 0:
1. The `setInterval` loop clears.
2. The application forces the window to close via `webview.close()`.
3. Console logs confirm "Twitter popup time limit reached".

## 4. Technical Implementation

### 4.1 Tauri Capabilities
This feature requires specific permissions in `src-tauri/capabilities/default.json` to allow the main window to spawn and control child webviews. The `core:window:*` permissions are critical for the `.close()` and `.setTitle()` methods to function.

```json
"permissions": [
  ...,
  "core:webview:allow-create-webview-window",
  "core:window:allow-close",
  "core:window:allow-set-focus",
  "core:window:allow-set-title",
  "core:window:allow-show",
  "core:window:allow-hide",
  ...
]
```

### 4.2 State Access & Robustness
The feature bridges the React state (`missionStore`) with the Tauri window management (`WebviewWindow`) within the `PlayerController.jsx` component.

Critically, the implementation uses a "fetch-on-tick" strategy for robustness. Instead of relying on a potentially stale window handle from closure scope, the timer loop re-acquires the window handle via `WebviewWindow.getByLabel('twitter-popup')` on every second tick.

```javascript
// Logic Flow
const openTwitter = async () => {
  // 1. Check existing
  if (exists) return focus();

  // 2. Get Time
  const ttl = useMissionStore.getState().timeBank;

  // 3. Create Window
  const webview = new WebviewWindow(...);

  // 4. Start Timer Loop
  webview.once('tauri://created', () => {
    setInterval(async () => {
      // Re-fetch handle for safety
      const currentWindow = await WebviewWindow.getByLabel('twitter-popup');
      if (!currentWindow) return clearInterval(); // User closed it manually

      // Decrement Time
      // Update Title via currentWindow.setTitle()
      
      // Close on 0 via currentWindow.close()
    }, 1000);
  });
}
```

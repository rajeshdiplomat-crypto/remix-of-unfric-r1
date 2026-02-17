

## Fix: Reminders Not Firing When Logged Out

### The Problem

The notification scheduler currently requires the user to be **logged in** because:
- It fetches reminder settings from the database (which requires authentication)
- When `user` is null (logged out), the settings fetch is skipped entirely, so no reminder times are known

### The Solution

**Cache the user's reminder settings in `localStorage`** whenever they are fetched (while logged in). Then, when the user is logged out, the scheduler reads from this cache instead of the database. This way, reminders continue to fire even without an active session.

### What Changes

**File: `src/hooks/useNotifications.ts`**

1. When settings are fetched from the database (on login or realtime update), also save them to `localStorage` under a key like `unfric_reminder_settings`.

2. Remove the `if (!user) return` guard from the settings fetch effect. Instead:
   - If user is logged in: fetch from DB, cache to localStorage
   - If user is logged out: load from localStorage cache

3. Make the interval effect depend on `user` so it re-runs when auth state changes, and ensure `settingsRef` is populated from cache before the first check.

**File: `src/components/NotificationScheduler.tsx`** -- no changes needed.

**File: `src/App.tsx`** -- no changes needed (the scheduler is already mounted outside of protected routes).

### Technical Details

```text
localStorage key: "unfric_reminder_settings"
Value: JSON string of ReminderSettings object

Flow when logged in:
  1. Fetch settings from DB
  2. Store in settingsRef AND localStorage
  3. Interval checks settingsRef every 60s

Flow when logged out:
  1. Read cached settings from localStorage
  2. Store in settingsRef
  3. Interval checks settingsRef every 60s

Flow on logout:
  - Settings remain in localStorage (intentional)
  - Scheduler continues using cached values
```

### Edge Cases Handled

- **First-ever use (no cache)**: No notifications fire -- this is correct since no preferences exist yet
- **User changes settings while logged in**: Cache is updated in real-time via the realtime listener
- **Multiple users on same browser**: Cache is overwritten on each login, so only the last logged-in user's settings persist -- acceptable for a personal app
- **Tab in background**: Browser may throttle intervals but notifications will still fire when the tab becomes active within the 5-minute window


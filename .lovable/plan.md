

## Fix: Allow Re-notification After Changing Reminder Time

### Problem
Currently, each reminder fires once per day. If a user changes the reminder time to a later time after it has already fired, the notification will not fire again because the "already sent" flag in localStorage is still set.

### Solution
Clear the localStorage "sent" flag for a specific module whenever the user updates that module's reminder time. This way:
- If the new time is in the future, the notification will fire at the new time
- If the new time is in the past, it will fire on the next check (within 5 minutes) -- which is acceptable since the user just actively changed it

### Technical Details

**File: `src/pages/Settings.tsx`**

In the `saveField` function, detect when a `reminder_time_*` field is being saved and clear the corresponding localStorage key:

```text
When saving "reminder_time_diary"  -> remove "unfric_notif_sent_diary_YYYY-MM-DD"
When saving "reminder_time_habits" -> remove "unfric_notif_sent_habits_YYYY-MM-DD"
When saving "reminder_time_emotions" -> remove "unfric_notif_sent_emotions_YYYY-MM-DD"
```

This is a small addition (~10 lines) to the existing `saveField` function. No other files need changes -- the scheduler already re-checks every 60 seconds and will pick up the new time naturally.


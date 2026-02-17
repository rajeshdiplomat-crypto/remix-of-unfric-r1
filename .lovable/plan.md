

## Unified Time Picker: Single Popover Design

### What changes
Replace the current three separate dropdown boxes (Hour, Minute, AM/PM) with a single button that opens one popover containing all three selectors side by side.

### How it will look
- A single trigger button showing the current time (e.g., "08:15" or "8:15 AM")
- Clicking it opens a popover with scrollable hour and minute columns, plus an AM/PM toggle in 12h mode
- Selecting values updates in real-time; clicking outside closes the popover

### Where it applies
Since all time pickers already use `UnifiedTimePicker`, this single component change automatically updates:
- **Settings** -- Reminder Time
- **Habits** -- Activity start time
- **Manifest** -- Reminder times

### Technical Details

**File: `src/components/common/UnifiedTimePicker.tsx`** (rewrite)

- Replace the three `Select` components with a `Popover` + `PopoverTrigger` + `PopoverContent`
- Trigger button displays the formatted time using `useTimeFormat`
- Inside the popover, render two scrollable columns (hours and minutes) using simple `button` grids
- In 12h mode, add an AM/PM toggle row at the bottom of the popover
- Keep all existing props (`value`, `onChange`, `intervalMinutes`, `triggerClassName`)
- Keep the internal 24h `"HH:mm"` storage format unchanged
- Use `Popover` from `@/components/ui/popover` (already exists)

**Layout inside the popover:**
```text
+-------------------+
|  Hours  | Minutes |
| [  8 ]  | [ 00 ]  |
| [  9 ]  | [ 15 ]  |
| [ 10 ]  | [ 30 ]  |
| [ 11 ]  | [ 45 ]  |
|  ...    |  ...    |
+-------------------+
|   [AM]    [PM]    |  <-- only in 12h mode
+-------------------+
```

- Active hour/minute highlighted with accent background
- Columns scroll independently with `max-h` and `overflow-y-auto`
- Popover uses `z-[9999]` to stay above modals/drawers

No other files need changes since all modules import `UnifiedTimePicker`.

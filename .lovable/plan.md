

# Replace Kanban Columns with Quadrant Board Views

## What You Want (My Understanding)

Instead of the current 4 fixed Kanban columns (To Do, In Progress, In Review, Done), the **Board view** should show **4 selectable board modes** as sub-views:

1. **Urgent x Important** -- 4 columns: Urgent+Important, Urgent+Not Important, Not Urgent+Important, Not Urgent+Not Important
2. **Status** -- 4 columns: Overdue, Ongoing, Upcoming, Completed
3. **Date** -- 4 columns: Yesterday, Today, Tomorrow, This Week
4. **Time of Day** -- 4 columns: Morning, Afternoon, Evening, Night

A mode selector (tabs or dropdown) lets the user switch between these 4 board layouts. Each mode shows 4 columns with full task cards (drag-drop, quick-add, etc.) -- the same card style currently used in the Kanban view.

## Changes

### 1. KanbanBoardView.tsx (rewrite main columns section)

- Remove the hardcoded `KANBAN_COLUMNS` (To Do, In Progress, In Review, Done) and the `mapTaskToColumn` function
- Add a `boardMode` state defaulting to `"urgent-important"`
- Add a mode selector row (4 tab-like buttons: Urgent x Important, Status, Date, Time of Day) above the columns
- Dynamically render 4 columns based on the selected mode using `QUADRANT_MODES[boardMode].quadrants`
- Each column filters tasks using the existing logic (urgency/importance, computeTaskStatus, computeDateBucket, time_of_day)
- Each column keeps the full KanbanCard rendering, drag-drop, and quick-add functionality
- Keep the InsightsPanel + mini-boards summary row at the top (or remove the mini-boards since the main columns now ARE the boards)
- Remove the 2x2 mini quadrant grid (it's redundant now since the main view IS the quadrant board)

### 2. Task filtering on drop

- Update `handleDrop` to map column IDs to the correct task field updates based on the active board mode (e.g., dropping into "morning" column sets `time_of_day`, dropping into "overdue" sets status, etc.)
- Update `submitQuickAdd` similarly

### 3. No changes needed to

- `TasksViewTabs.tsx` -- stays the same (Lists, Board, Timeline, Files)
- `TasksHeader.tsx` -- stays the same
- `types.ts` -- already has all the quadrant mode definitions

## Technical Details

**Board mode selector** will be a row of 4 small buttons/tabs inside the Board view:
- `[Urgent x Important] [Status] [Date] [Time of Day]`

**Column rendering logic** (pseudo-code):
```text
activeQuadrants = QUADRANT_MODES[boardMode].quadrants  // 4 items
For each quadrant:
  - Filter tasks matching that quadrant's criteria
  - Render column with header (color dot + title + count)
  - Render KanbanCard for each task
  - Render quick-add at bottom
```

**Files modified:**
- `src/components/tasks/KanbanBoardView.tsx` -- replace fixed Kanban columns with dynamic quadrant-based columns, add board mode selector, remove mini-boards grid

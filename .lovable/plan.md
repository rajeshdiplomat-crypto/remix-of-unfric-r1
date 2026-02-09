

# Tasks Page Redesign

## Reference Image Analysis

The uploaded screenshot shows a project management interface with:
- A **hero banner** at the top with a scenic image and "Your Tasks" text
- A **"Top Focus" strip** below the hero
- A **toolbar row** with Search, AI button, Status filter, Sort, and a "New Task" button
- **View tabs**: Overview, Lists, Board, Timeline, Files
- A **4-column Kanban board** (To Do, In Progress, In Review, Done) with task cards
- A **right sidebar** with a clock and "Emotional Patterns" section

## Current Layout vs Target

| Area | Current | Target |
|------|---------|--------|
| Hero | Exists (PageHero) | Keep as-is |
| Top Focus Bar | Exists | Keep as-is |
| Insights Panel + Clock | 2-column panel (260px height) | Remove from main view; move clock to right sidebar |
| Header/Toolbar | View mode dropdown + search + New Task | Toolbar with Search, AI, Status, Sort + New Task |
| View Tabs | None (dropdown selector) | Tab bar: Overview, Lists, Board, Timeline, Files |
| Main Content | 2-column: AllTasksList (left) + Board/Quadrant (right) | Kanban board (full width) + optional right sidebar |
| Right Sidebar | None | Clock + Emotional Patterns panel |

## Implementation Plan

### 1. Add View Tabs Component
Create a new `TasksViewTabs` component with horizontal tab bar:
- **Overview** - shows the current Insights + summary (existing InsightsPanel)
- **Lists** - shows AllTasksList full width
- **Board** - shows Kanban-style board (default view)
- **Timeline** - shows the current day planner BoardView
- **Files** - placeholder/future feature

File: `src/components/tasks/TasksViewTabs.tsx` (new)

### 2. Redesign the Toolbar
Update `TasksHeader.tsx` to match the reference:
- Left side: Search input with icon
- Center/Right: AI button, Status dropdown filter, Sort dropdown
- Far right: "New Task" button with plus icon
- Remove the view mode dropdown (replaced by tabs)

File: `src/components/tasks/TasksHeader.tsx` (modify)

### 3. Create Kanban Board View
Create a new `KanbanBoardView` component with 4 columns:
- **To Do** (maps to "upcoming" status)
- **In Progress** (maps to "ongoing" status) 
- **In Review** (new status concept, or map from existing)
- **Done** (maps to "completed" status)

Each column has:
- Column header with count badge
- Task cards showing: title, due date, priority indicator, assignee avatar placeholder
- Quick-add at bottom of each column
- Drag and drop support

File: `src/components/tasks/KanbanBoardView.tsx` (new)

### 4. Add Right Sidebar
Create a `TasksRightSidebar` component containing:
- Clock widget (reuse existing `TasksClockWidget`)
- Emotional Patterns section (compact stats/chart)

File: `src/components/tasks/TasksRightSidebar.tsx` (new)

### 5. Restructure Tasks Page Layout
Update `src/pages/Tasks.tsx`:
- Keep PageHero at top
- Keep TopFocusBar below hero
- New toolbar row (redesigned TasksHeader)
- View tabs row
- Main content area: active tab content + right sidebar

New layout structure:
```text
+----------------------------------------------------------+
| PageHero                                                  |
+----------------------------------------------------------+
| TopFocusBar                                               |
+----------------------------------------------------------+
| [Search] [AI] [Status] [Sort]              [+ New Task]  |
+----------------------------------------------------------+
| Overview | Lists | Board | Timeline | Files               |
+----------------------------------------------------------+
| Active Tab Content                    | Right Sidebar     |
| (Board = Kanban columns)             | - Clock           |
|                                       | - Patterns        |
+----------------------------------------------------------+
```

File: `src/pages/Tasks.tsx` (modify)

### 6. Update Task Types
Add "in_review" to the Status type if needed, or map existing statuses to Kanban columns.

File: `src/components/tasks/types.ts` (minor update)

## Files to Create
- `src/components/tasks/TasksViewTabs.tsx`
- `src/components/tasks/KanbanBoardView.tsx`
- `src/components/tasks/TasksRightSidebar.tsx`

## Files to Modify
- `src/pages/Tasks.tsx` - main layout restructure
- `src/components/tasks/TasksHeader.tsx` - toolbar redesign
- `src/components/tasks/types.ts` - add status if needed

## Technical Details

- The existing `BoardView.tsx` (day planner/timeline) will be preserved and shown under the "Timeline" tab
- The existing `AllTasksList.tsx` will be shown under the "Lists" tab
- The existing `InsightsPanel.tsx` will be shown under the "Overview" tab
- The new Kanban board will be the default "Board" tab
- The right sidebar will be visible across all tabs
- All existing functionality (CRUD, drag-drop, focus mode, Supabase sync) remains intact
- The independent scrolling architecture will be maintained (sidebar scrolls independently)


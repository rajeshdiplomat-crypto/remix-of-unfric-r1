
# Tasks Page Layout Adjustments

## Changes Overview

### 1. Reorder: Move Top Focus Bar below View Tabs
Currently the order is: TopFocusBar -> TasksHeader -> ViewTabs. Per the screenshot, it should be: TasksHeader -> ViewTabs -> TopFocusBar.

**File:** `src/pages/Tasks.tsx` (lines 626-645)

### 2. Show Top Focus Bar and Insights on ALL views (Lists, Timeline, Board)
Currently the InsightsPanel only renders inside KanbanBoardView (Board tab). The TopFocusBar is already shared. Need to:
- Remove InsightsPanel from inside KanbanBoardView
- Render InsightsPanel directly in Tasks.tsx, below TopFocusBar, for Lists, Board, and Timeline tabs (not Files)

**File:** `src/pages/Tasks.tsx` -- add InsightsPanel above tab content
**File:** `src/components/tasks/KanbanBoardView.tsx` -- remove the InsightsPanel line (line 151)

### 3. Merge Status filter options into the Filter button
Currently there are TWO separate filter controls in the toolbar:
- A standalone "All Status" Select dropdown (lines 65-77 in TasksHeader)
- A "Filter" dropdown button with Priority and Date options

Per the screenshot, the status options (All Status, To Do, In Progress, Done, Overdue) should be moved INTO the Filter dropdown alongside Priority and Date options. Remove the standalone Status Select.

**File:** `src/components/tasks/TasksHeader.tsx`
- Remove the standalone `<Select>` for status filter (lines 65-77)
- Add a "Status" section inside the existing Filter `<DropdownMenu>` with checkbox items for All Status, To Do, In Progress, Done, Overdue

## Technical Details

### Tasks.tsx layout change (reorder + shared insights)
```text
<PageHero />
<div>
  <TasksHeader />          // toolbar first
  <TasksViewTabs />        // tabs second
  <TopFocusBar />          // focus bar third (below tabs)
  <InsightsPanel />        // insights shared across views
  <grid>
    <tab-content />        // Lists / Board / Timeline / Files
    <TasksRightSidebar />
  </grid>
</div>
```

### TasksHeader.tsx filter consolidation
Remove the standalone Status `<Select>` and add a Status section to the Filter `<DropdownMenu>`:
```text
Filter dropdown:
  -- Status --
  All Status / To Do / In Progress / Done / Overdue
  -- Priority --
  All / High / Medium / Low
  -- Date --
  All / Today / This Week / Overdue
```

### KanbanBoardView.tsx cleanup
Remove line 151: `<InsightsPanel tasks={tasks} compactMode={true} />` since it will now be rendered by the parent.

## Files Modified
- `src/pages/Tasks.tsx` -- reorder components, add shared InsightsPanel import and render
- `src/components/tasks/TasksHeader.tsx` -- remove Status Select, add Status section to Filter dropdown
- `src/components/tasks/KanbanBoardView.tsx` -- remove InsightsPanel render

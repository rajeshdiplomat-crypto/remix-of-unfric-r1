

# Move Task Content Left of Clock Sidebar

## Problem
Currently the main task content (Lists/Board/Timeline) renders **below** the top section (Focus Bar + Insights + Clock). The user wants the task content to sit **to the left** of the clock/sidebar, not underneath it.

## Solution
Wrap **both** the top section (Focus Bar + Insights) **and** the main tab content in a single grid with the sidebar column, so the sidebar spans the full right side while the left column contains everything stacked vertically.

## Change

**File:** `src/pages/Tasks.tsx` (lines 646-734)

Restructure so the grid wraps both the focus/insights area AND the tab content:

```text
<grid cols=[1fr_260px]>
  <left column>
    <TopFocusBar />
    <InsightsPanel (collapsible) />
    <Tab Content (Lists / Board / Timeline)>
  </left column>
  <right column (hidden on mobile)>
    <TasksRightSidebar />  (clock + emotional patterns)
  </right column>
</grid>
```

This makes the sidebar sit to the right of everything (focus bar, insights, AND the task views), rather than only alongside the top section.

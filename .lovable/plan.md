

## Move Insights Into the Red-Marked Space (Left of Clock)

The current layout stacks vertically: focus bar + clock row, then insights below both. The red-marked area shows the insights should fill the space **below the focus bar, but still to the left of the clock** -- so the clock spans the full card height on the right.

### Layout Change

```text
Current:
+--[Focus Bar]------------------+--[Clock]--+
+--[Insights (full width)]------------------+

Desired:
+--[Focus Bar]------------------+           +
|                               |  [Clock]  |
+--[Insights: KPIs + Charts]----+           +
```

### Changes

**1. `src/pages/Tasks.tsx`** (lines 650-669)
- Restructure the unified card from vertical stacking to a **two-column layout**: left column (flex-1) contains Focus Bar on top and Insights below; right column (fixed width, full height) contains the Clock widget.
- The outer container becomes `flex` with the clock column spanning the entire card height via `items-stretch`.

**2. `src/components/tasks/InsightsPanel.tsx`**
- No major structural changes needed, just ensure it fills available space without extra top borders or padding that create gaps.

### Technical Detail

```text
<div class="rounded-xl border ... flex">
  <!-- Left column -->
  <div class="flex-1 flex flex-col min-w-0">
    <div class="p-2">
      <TopFocusBar ... />
    </div>
    <InsightsPanel ... />
  </div>
  <!-- Right column: clock spans full height -->
  <div class="hidden lg:flex w-[220px] border-l border-border/30">
    <TasksClockWidget />
  </div>
</div>
```

This eliminates the empty red-marked space by placing the insights directly below the focus bar, constrained to the left of the clock column.

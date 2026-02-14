

## Move Insights Into the Red-Marked Space

The empty area between the focus bar/clock row and the current insights position needs to be filled by the insights content. The insights are already inside the same card, but there's wasted vertical space because the charts have a fixed `h-[140px]` constraint and the card doesn't expand to use the available room.

### Changes

**1. `src/components/tasks/InsightsPanel.tsx`**
- Increase the main charts row height from `h-[140px]` to `h-[180px]` to give charts more vertical space
- Reduce excess padding so the insights content sits tighter against the focus bar above

**2. `src/pages/Tasks.tsx`**
- Remove the `border-b border-border/30` from the top row divider between focus bar and insights, so they feel continuous
- Remove the extra wrapper div and padding around the insights toggle button, moving it inline with the time period selector inside InsightsPanel
- Move the "Hide Insights" toggle button into the InsightsPanel component itself (next to the time period pills) so there's no separate row creating dead space
- Remove the outer `flex flex-col` wrapper that adds vertical gaps between the focus row and insights

### Technical Details

- In `Tasks.tsx` lines 652: remove `border-b border-border/30` from the focus/clock row
- In `Tasks.tsx` lines 663-690: remove the separate insights toggle wrapper div; pass `onToggleCollapse` and `collapsed` props to InsightsPanel directly
- In `InsightsPanel.tsx` line 336: reduce padding from `py-2.5` to `py-1.5`  
- In `InsightsPanel.tsx` line 356: increase chart row height from `h-[140px]` to `h-[180px]`
- Add the "Hide Insights" toggle button inside InsightsPanel's header row (next to time period pills) via new props `onCollapse`

### Result
The focus bar, clock, and insights will flow as one seamless card with no dead space. Charts will be taller and more readable.



## Make Right Sidebar Extend to Match Dashboard Bottom

### Problem
The right sidebar (Calendar + Recent Entries) has a fixed height calculation `height: "calc(620px + 420px + 24px)"` that doesn't dynamically match the actual height of the left column content. This creates a visual mismatch where the right panel may end before or after the dashboard on the left.

### Solution
Change the layout approach to use CSS Flexbox/Grid alignment so the right sidebar naturally stretches to fill the available height within the main content grid, ensuring it always aligns with the bottom of the left column regardless of the dashboard's dynamic height.

### Implementation

**File: `src/pages/Emotions.tsx`**

1. **Remove the fixed height calculation** from the right column container:
   - Current: `style={{ height: "calc(620px + 420px + 24px)" }}`
   - Change to: Use `h-full` or `min-h-full` with proper flex container

2. **Update the grid layout** to ensure both columns stretch equally:
   - Add `items-stretch` to the grid container so both columns have equal height
   - The right column will use `flex flex-col h-full` to fill its grid cell

3. **Make Recent Entries fill remaining space**:
   - The Calendar remains `shrink-0` (fixed height based on content)
   - RecentEntriesList wrapper uses `flex-1 min-h-0` to fill remaining height
   - RecentEntriesList component already supports `h-full` with internal scrolling

### Code Changes

```tsx
// Line 434 - Update grid container to stretch items
<div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-stretch">

// Lines 531-542 - Update right column structure
{/* Right Column - Calendar (fixed) & Recent Entries (fills to match left column bottom) */}
<div className="flex flex-col gap-4 h-full">
  {/* Calendar - Non-scrollable */}
  <div className="shrink-0">
    <EmotionCalendarSidebar entries={entries} onDateClick={handleDateClick} />
  </div>

  {/* Recent Entries - Fills remaining height, scrollable */}
  <div className="flex-1 min-h-0">
    <RecentEntriesList entries={entries} onEditEntry={startEditEntry} onDeleteEntry={setDeletingEntryId} />
  </div>
</div>
```

### Technical Notes
- Using `items-stretch` on the grid ensures both columns occupy the full grid row height
- The right column uses `h-full` to fill its grid cell completely
- `flex-1 min-h-0` on RecentEntriesList wrapper allows it to grow and shrink as needed
- RecentEntriesList already has `h-full flex flex-col` with `overflow-y-auto` for internal scrolling
- This approach is responsive and adapts to any height the PatternsDashboardEnhanced takes




# Fix: Eliminate Center Section Layout Shift

## Root Cause
The center section conditionally renders a "selected habit indicator" block (habit name, date range, close button) only when a habit is selected. This injects extra content into the flow, increasing the card height. The `lg:h-[280px]` on the grid and `overflow-y-auto` on the center aren't sufficient because the grid rows auto-size to fit content.

## Solution
Always reserve space for the indicator row by rendering it unconditionally with a fixed height. When no habit is selected, the row is still present but invisible (using `invisible` or `opacity-0`), so the card height never changes.

## Changes (src/pages/Habits.tsx)

### 1. Make the indicator always rendered (lines 1286-1315)

Replace the conditional `{selectedActivityId && (() => { ... })()}` with an always-rendered wrapper that has a fixed height. When no habit is selected, render the same container but with `invisible` so it occupies space without showing content.

Before:
```tsx
{selectedActivityId && (() => {
  // ... compute dates, render indicator
  return (
    <div className="flex items-center justify-center gap-3 border-l-2 border-foreground pl-3 mb-4">
      ...
    </div>
  );
})()}
```

After:
```tsx
<div className={cn("flex items-center justify-center gap-3 border-l-2 pl-3 mb-4 h-6", 
  selectedActivityId ? "border-foreground" : "border-transparent invisible"
)}>
  {selectedActivityId && (() => {
    // ... same date computation and content
  })()}
</div>
```

This ensures:
- The row always occupies the same vertical space (`h-6 mb-4`)
- When a habit is selected, the content and left border appear
- When no habit is selected, the container is invisible but still takes up space
- The card height remains constant in both states

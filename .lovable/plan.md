

# Fix: Prevent Card Size Change When Image Loads

## Problem
When a habit is selected and its image appears in the right panel, the `<img>` tag participates in the grid layout flow, causing the entire unified card to grow in height. The placeholder states use `absolute inset-0` (so they don't affect sizing), but the actual image does not.

## Solution
Make the image absolutely positioned so it fills the right panel without affecting the card's height. The card height will be determined solely by the left and center content.

## Change (src/pages/Habits.tsx)

**Line 1367**: Wrap the image and its overlay in an `absolute inset-0` container, matching the same pattern used by the placeholder states.

Replace:
```
<>
  <img src={imgUrl} alt={selectedHabit.name} className="w-full h-full object-cover" />
  <div className="absolute inset-x-0 bottom-0 ...">
```

With:
```
<div className="absolute inset-0">
  <img src={imgUrl} alt={selectedHabit.name} className="w-full h-full object-cover" />
  <div className="absolute inset-x-0 bottom-0 ...">
```

This ensures the image never influences the card's height -- all three states (image, no-image, no-selection) use absolute positioning within the right panel.




# Fix: Independent Column Scrolling on Diary Page

## Problem
The three columns (left sidebar, center feed, right sidebar) are not scrolling independently. Instead, the entire page scrolls as one unit. This happens because the 3-column container (`flex flex-1`) doesn't establish a fixed height — `flex-1` in a flex-column parent only sets `flex-grow: 1` but doesn't constrain height. So the children's `h-full` and `overflow-y-auto` have no bounded height to work with.

## Fix

**File: `src/pages/Diary.tsx`** — One class change on the 3-column wrapper (line 465):

Change:
```
<div className="flex flex-1 w-full overflow-hidden">
```
To:
```
<div className="flex flex-1 w-full overflow-hidden min-h-0">
```

Adding `min-h-0` overrides the default `min-height: auto` on flex children, which prevents them from shrinking below their content size. With `min-h-0`, the container respects the bounded height from `flex-1` and each column's `overflow-y-auto` will kick in correctly.

This is the same pattern used across the other modules (Tasks, Manifest, Emotions, Journal) per the global scrolling architecture.

## Scope
- 1 file changed
- 1 class added (`min-h-0`)
- No other changes needed


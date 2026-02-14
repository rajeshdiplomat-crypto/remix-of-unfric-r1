
# Make Image Fill the Entire Right Panel

## Problem
The habit preview image in the right section of the unified stats card is constrained to a small square (`max-w-[120px]`) with padding, leaving empty space. The user wants the image to fill the entire right column edge-to-edge.

## Changes (single file: `src/pages/Habits.tsx`)

### 1. Remove padding from right section
Change the right panel container from `p-4 hidden lg:flex flex-col items-center justify-center border-l border-border` to `hidden lg:flex border-l border-border overflow-hidden relative` -- removing all padding so the image can stretch to edges.

### 2. Make image fill entirely
When a habit with an image is selected, render the `<img>` tag directly filling the container (`w-full h-full object-cover`) with no wrapper constraints. Overlay the habit name at the bottom using an absolute-positioned gradient overlay.

### 3. No-image and empty states
When a habit is selected but has no image, or when no habit is selected, keep a centered placeholder but with `absolute inset-0` positioning so the entire cell remains filled with a subtle background.

### Technical Detail
- Line 1360: Remove `p-4`, add `overflow-hidden relative`
- Lines 1365-1373: Replace constrained image wrapper with a full-bleed `<img>` plus a gradient overlay for the name
- Lines 1375-1398: Keep placeholder states but position them to fill the cell

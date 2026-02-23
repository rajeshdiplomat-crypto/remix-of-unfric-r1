

## Fix: Manifest Practice Page Layout - Fit to Screen

### Problem
The left column (vision board) overflows the viewport, causing the entire page to scroll. The two columns are not height-aligned -- the left extends beyond the right panel's bottom edge.

### Root Cause
The AppLayout root uses `min-h-screen` which allows content to grow beyond the viewport. The ManifestPractice page uses `flex-1` but doesn't enforce a hard height cap. The vision board images with aspect ratios push the left column taller than the screen.

### Solution

**File: `src/pages/ManifestPractice.tsx`**

1. Change the outermost wrapper from `flex-1` to `h-full` so it fills exactly the available space from AppLayout, not more.

2. Reduce the vision board image sizes so they fit better within the constrained space:
   - Reduce the hero image aspect ratio from `aspect-[4/3]` to `aspect-[16/10]`
   - Reduce the second-row images from `aspect-[3/2]` to `aspect-[2/1]`

3. Tighten vertical spacing:
   - Reduce the left column's padding from `py-6 gap-5` to `py-4 gap-3`
   - Reduce gap between vision board rows from `space-y-2.5` to `space-y-1.5`

4. Add `pt-1` to the desktop date nav area so the right column starts at the same vertical offset as the left column content.

### Technical Details

Changes in `src/pages/ManifestPractice.tsx`:

- Line 189: Change `flex-1` to `h-full` on the outer container
- Line 193: Reduce padding/gap from `gap-5 py-6` to `gap-3 py-4`
- Line 232: Reduce vision board `space-y-2.5` to `space-y-1.5`
- Line 240: Change `aspect-[4/3]` to `aspect-[16/10]`
- Line 260: Change `aspect-[3/2]` to `aspect-[2/1]`
- Line 357: Add `pt-1` to desktop date nav for alignment

These changes ensure both columns are bounded within the viewport height, with the left column scrolling internally only if content exceeds the available space, and the right panel aligns vertically with the left.


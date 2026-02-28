

## Add 3 View Modes to Realities List

Add view mode toggling to the "Your Realities" section in the Manifest page, similar to the pattern already used in `JournalRecentEntriesView`.

### Views

1. **List view** (current default) — vertical stack of `ManifestCard` components (h-24 horizontal cards)
2. **Large tiles view** — grid of larger cards showing cover image prominently (2 columns on desktop, 1 on mobile), with title, momentum, streak overlaid
3. **Single tile view** — one card at a time, full-width with large cover image, prev/next navigation buttons

### Changes

**`src/pages/Manifest.tsx`**
- Add `viewMode` state: `"list" | "tiles" | "single"`
- Add view toggle buttons (List, Grid, Square icons) in the header bar next to existing Calendar/Progress/Analytics buttons
- Add `singleIndex` state for tracking current card in single view
- Wrap the goals rendering section (lines 572-611) in conditional logic per view mode:
  - **List:** Current `ManifestCard` stack (unchanged)
  - **Tiles:** 2-column grid with taller cards showing cover image as `aspect-[4/3]` hero, title overlay, momentum/streak pills
  - **Single:** Full-width card with large cover image (`aspect-video`), all metadata visible, prev/next `ChevronLeft`/`ChevronRight` buttons on sides, dot indicators at bottom

**No new components needed** — all view rendering stays inline in `Manifest.tsx` to keep it simple. The existing `ManifestCard` is reused for list view; tiles and single views render custom layouts using the same goal data and metrics.




## Manifest Card: Horizontal Layout with Left Thumbnail

Switch the ManifestCard from a vertical (top image) layout to a horizontal (left thumbnail) layout with zero padding around the image.

### Layout Change

- Replace the current stacked layout (full-width image on top, content below) with a **horizontal flex row**
- **Left side**: Thumbnail image flush to the card edge (no padding/margin), fixed width (`w-24`), full card height, with `object-cover`
- **Right side**: Title, momentum/streak pills, weekly circles, and Practice button stacked vertically with compact padding
- The "Day X" badge stays overlaid on the thumbnail
- Action buttons (edit, delete, complete) move to the top-right of the content area

### Technical Details

**File: `src/components/manifest/ManifestCard.tsx`**

1. Change the Card's inner structure from vertical to `flex flex-row`
2. Replace the full-width image block (`w-full h-28`) with a fixed-width thumbnail (`w-24 h-full`) that bleeds edge-to-edge (no padding, rounded only on the left via `rounded-l-xl`)
3. Move the gradient overlay to be a subtle right-fade (`bg-gradient-to-r from-transparent to-background/20`) instead of bottom-fade
4. Stack the content (title, pills, weekly row, practice button) in a `flex-1 flex-col` container with small internal padding (`p-2`)
5. Ensure the card has a consistent compact height across all cards


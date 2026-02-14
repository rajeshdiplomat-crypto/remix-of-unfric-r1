
# Move Right Sidebar Cards to Left, Create Open Right Space

## Concept
Consolidate the left sidebar (Calendar) and right sidebar (Your Progress + Emotions Today) into a single left panel, then replace the right column with a spacious, editorial-style journaling space — clean whitespace with a subtle decorative element about journaling, like premium website designs.

## Layout Change

**Current**: `[Calendar 280px] [Editor 1fr] [Details 280px]`  
**New**: `[Calendar + Details 300px] [Editor 1fr] [Right: Editorial Space 280px]`

The left panel will stack: Calendar on top, then Your Progress card, then Emotions Today card — all scrollable together.

The right panel becomes a quiet, editorial space with:
- A soft decorative quote or journaling tip
- Minimal typography about the value of journaling
- Possibly a subtle word count / date display
- Lots of whitespace — the "breathing room" that defines premium design

## Technical Details

### `src/pages/Journal.tsx`
1. **Grid change** (line ~781): Update from `[280px_1fr_280px]` to `[300px_1fr_260px]`
2. **Left column** (lines 784-796): After `JournalSidebarPanel`, also render `JournalDateDetailsPanel` below it in the same left column
3. **Right column** (lines 798-800): Replace `JournalDateDetailsPanel` with a new lightweight editorial/decorative section containing:
   - A large, airy journaling quote in light serif or tracking-wide text
   - Word count displayed elegantly (e.g. "247 words written")
   - Current date in a refined format
   - A subtle decorative line or minimal icon
   - All in `text-muted-foreground/40` to keep it whisper-quiet

### `src/components/journal/JournalSidebarPanel.tsx`
- No structural changes needed — the calendar component stays as-is

### `src/components/journal/JournalDateDetailsPanel.tsx`
- No changes — it just moves to the left column

### New inline section in Journal.tsx (right column)
A simple inline JSX block — no new component file needed. It will contain:
```
- Date: "Friday, February 14"
- Word count: "247 words"
- A rotating journaling tip/quote in very light text
- Generous padding and vertical centering
```

This creates the "good website design" feel — content consolidated on the left, clean open space on the right that feels intentional and premium.

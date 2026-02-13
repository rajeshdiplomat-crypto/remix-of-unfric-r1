

# Fill Empty Dashboard Areas and Increase Graph Height

## Problem
The stats dashboard card has two empty areas flanking the progress rings (left and right, marked in red), and the Daily Progress graph row is too short.

## Changes (single file: `src/pages/Habits.tsx`)

### 1. Left Area -- Motivational Quote
Reuse the existing quote rotation logic (already in state) to display a rotating motivational quote in the left space beside the progress rings. Styled with italic text, muted color, and subtle fade animation.

### 2. Right Area -- Habit Image or Quick Summary
When a habit is selected: show its cover image (or a placeholder icon). When no habit is selected: show a compact "top streak" or "best habit" mini-card highlighting the habit with the longest current streak.

### 3. Layout Adjustment
Change the progress rings section from a centered flex row to a 3-column grid:
- Left column (~200px): Quote / info panel
- Center (flex-1): The 5 progress rings (unchanged)
- Right column (~200px): Image / streak card

### 4. Increase Graph Height
Change the Daily Progress SVG `style={{ height: 120 }}` to `style={{ height: 180 }}` and increase the viewBox height from 160 to 220, adjusting the Y-axis scale so the chart breathes more.

### 5. Monochrome Cleanup
The graph row still uses emerald/teal hardcoded colors -- these will be updated to monochrome (`hsl(var(--foreground))` for line, `hsl(var(--border))` for baseline) to match the redesigned stats card above, consistent with the plan already approved.

### Technical Detail
- Quote area uses the existing `MOTIVATIONAL_QUOTES` array and `quoteIndex`/`quoteVisible` state
- Right panel uses the existing `loadActivityImage()` helper and streak calculation already in `getHabitStats()`
- Graph viewBox changes from `0 0 N*100 160` to `0 0 N*100 220`, with Y points recalculated from `rawY = 190 - (value/100) * 160`


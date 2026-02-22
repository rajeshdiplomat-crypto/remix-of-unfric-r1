
# Fix Remaining Mobile Habits Issues

## Issues Found

1. **Ring label overlap**: The mobile header uses labels "Total Goal" and "Momentum" which are too wide for the 54px ring size in a 5-column grid with no gap. These need shorter labels.

2. **Daily Progress chart not edge-to-edge**: The chart row has an empty sticky left cell (90px wide) and a right cell (32px wide), creating visible padding. The chart SVG only spans the 7 day columns (`colSpan={7}`), but it should visually bleed edge-to-edge.

3. **Chart alignment with day columns**: The SVG uses `viewBox="0 0 700 120"` with points at `(i + 0.5) * 100`, which should align with equal-width columns. But the surrounding empty cells break the visual alignment.

---

## Plan

### 1. Shorten mobile ring labels (lines 1286-1290)
- Change "Total Goal" to "Goal"
- Change "Momentum" to "Drive"  
- These labels already use the shorter versions in the desktop center section (lines 1434-1438), so this makes them consistent

### 2. Make daily progress chart full-bleed (lines 1534-1607)
- Change the chart row to use a single `<td colSpan={9}>` (spanning all columns: habit name + 7 days + % column)
- Remove the separate empty left/right `<td>` cells
- Adjust the SVG viewBox so the chart data points still align with the 7 day columns by adding left/right padding within the SVG coordinate system to account for the habit name column width and % column width
- Use `preserveAspectRatio="none"` and calculate x-offsets so data points center over their respective day columns

### Technical Details

**Ring labels** (src/pages/Habits.tsx, ~line 1286-1290):
- Replace `label="Total Goal"` with `label="Goal"`
- Replace `label="Momentum"` with `label="Drive"`

**Chart row** (src/pages/Habits.tsx, ~lines 1534-1607):
- Merge the 3 `<td>` elements into one `<td colSpan={9}>` 
- The SVG needs to account for the habit name column (~90px) on the left and % column (~32px) on the right as proportional offsets
- Use a wider viewBox (e.g., `0 0 900 120`) where the first data point starts at x offset matching the center of the first day column, and the last point ends at the center of the last day column
- This ensures the line graph spans the full row width while data points remain centered over their day columns

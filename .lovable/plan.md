
## Fix: Daily Progress Graph Edge-to-Edge with Aligned Date Labels

### Problem
The graph currently has `padding = 20` on both sides, causing the chart line and date labels to be inset from the container edges. The graph should stretch from edge to edge of the container, with date labels directly below each corresponding data point.

### Solution
Remove the horizontal padding from the SVG chart calculations so points span the full width (x = 0 to x = 1000), and the date labels naturally stay centered under their data points.

### Technical Changes

**File: `src/pages/Habits.tsx` (lines ~1396-1513)**

1. Set `padding = 0` (remove the 20px inset) so `chartWidth = 1000`
2. Adjust x-coordinate calculation: use a small margin (e.g., half a step) so the first and last points aren't literally clipped at the SVG edge. Instead, compute x as: `x = (i + 0.5) / numDays * 1000` -- this centers each point within its "column" across the full width, similar to how a bar chart would center bars.
3. Update the baseline `<line>` to span `x1="0"` to `x2="1000"`.
4. Update the area path close to use the actual first/last point x values.

This ensures:
- The graph line stretches the full container width
- Each date number sits precisely below its data point
- No wasted whitespace on left/right edges



## Make Habit Tick Marks Larger and More Visible

The `rounded-md` class was applied, but at `w-5 h-5` (20px), the shape difference from circles is nearly invisible. The screenshot shows significantly larger, clearly square-ish checkboxes.

### Changes in `src/pages/Habits.tsx`

**Desktop table cells (around line 1147):**
- Increase button size from `w-5 h-5` to `w-7 h-7` (28px)
- Increase checkmark icon from `h-3 w-3` to `h-4 w-4`
- Keep `rounded-md`, `bg-emerald-400`, `stroke-[3]`

**Mobile cells (around line 1651):**
- Increase button size from `w-5 h-5` to `w-7 h-7`
- Increase checkmark icon from `h-2.5 w-2.5` to `h-3.5 w-3.5`
- Keep `rounded-md`, `bg-emerald-400`, `stroke-[3]`

This will make the rounded-square shape clearly visible and match the reference screenshot's proportions.

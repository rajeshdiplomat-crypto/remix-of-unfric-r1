

# World-Class Habits Page Redesign -- Full Screen

## What's Already Done
The stats dashboard (progress rings, month navigator, stats summary) was redesigned to monochrome and looks clean. This will be preserved.

## What's Missing / Needs Work

### 1. Table Section Still Uses Emerald/Green Colors
The entire table below the stats card still uses jarring emerald/green colors that clash with the monochrome stats card above:
- Today's column highlight: `bg-emerald-50`, `bg-emerald-100`
- Completion checkmarks: `bg-emerald-500`
- Selected row: `bg-emerald-50`, `ring-emerald-500`
- Progress bars: `bg-gradient-to-r from-emerald-400 to-green-400`
- Daily Progress chart: emerald gradients, teal stroke, teal circles
- Current week highlight: `bg-blue-50`

### 2. Table Header Design is Dated
- Uses `bg-slate-100` which feels flat
- Date columns lack hierarchy and readability
- Week partitions use basic borders

### 3. Daily Progress Chart Colors
- Uses hardcoded `#14b8a6` (teal) and `#5eead4` for gradient
- Missed days use `#ef4444` (red) -- too aggressive
- Should use monochrome foreground/muted tones

### 4. Habit Row Design
- Selected state uses emerald ring -- should use foreground-based subtle indicator
- Completion buttons are emerald -- should be monochrome
- Progress bar uses emerald gradient -- should use foreground color
- Streak badges use orange -- acceptable accent but could be refined

### 5. Dialog Still Uses Emerald
- Frequency day buttons: `bg-emerald-500`
- Save button: `bg-emerald-500 hover:bg-emerald-600`
- Should use `bg-foreground text-background` (monochrome primary)

### 6. No Sidebar Integration
- The `HabitSidebarPanel` component exists but isn't used on the page
- No calendar sidebar or detail panel appears when selecting a habit
- World-class habit trackers show a detail/calendar panel on the side

---

## Redesign Plan

### A. Table Color Overhaul (renderRow + thead + chart)

**Table Header:**
- Replace `bg-slate-100` with `bg-muted/50`
- Today column: `bg-foreground/5` instead of `bg-emerald-100`
- Current week: subtle `bg-muted/30` instead of `bg-blue-50`

**Habit Rows:**
- Selected row: `bg-muted ring-1 ring-foreground/20` instead of emerald
- Selected sticky cell bg: `bg-muted` instead of emerald
- Completion buttons: `bg-foreground text-background` instead of `bg-emerald-500`
- Uncompleted past: `bg-muted hover:bg-muted-foreground/20`
- Progress bar: `bg-foreground` (single solid) instead of emerald gradient
- Archived completed: `bg-muted-foreground`
- Complete Habit menu item: `text-foreground` instead of `text-emerald-600`

**Daily Progress Chart:**
- Line stroke: `hsl(var(--foreground))` with 0.7 opacity
- Area fill: `hsl(var(--foreground))` with 0.08 to 0.02 opacity gradient
- Data points: `hsl(var(--foreground))` for completed, `hsl(var(--muted-foreground))` for missed (no red)
- Future points: `hsl(var(--border))`
- Chart row background: `bg-muted/30` instead of emerald gradients

### B. Dialog Monochrome Update

- Frequency day buttons active: `bg-foreground text-background`
- Save/Create button: `bg-foreground text-background hover:bg-foreground/90`
- Remove all emerald references from the dialog

### C. Sidebar Integration (Optional Enhancement)

Add the existing `HabitSidebarPanel` to the page layout using a responsive grid:
- Desktop: `grid-cols-[1fr_260px]` with sidebar on the right
- Mobile: sidebar hidden, accessible via a toggle button
- The sidebar shows the calendar and progress insights

This mirrors the Tasks module's workspace layout pattern already used in the app.

---

## Technical Details

### File: `src/pages/Habits.tsx`

**Lines ~906-1161 (renderRow function):**
- Replace all `emerald` class references with monochrome equivalents
- Update completion button colors
- Update progress bar gradient
- Update selected row styling

**Lines ~1289-1331 (thead):**
- Replace `bg-slate-100` with `bg-muted/50`
- Replace `bg-emerald-100` today highlight with `bg-foreground/5`
- Replace `bg-blue-50` current week with `bg-muted/30`
- Replace `text-emerald-600` today text with `text-foreground font-bold`

**Lines ~1334-1432 (Daily Progress chart row):**
- Replace emerald gradient backgrounds with `bg-muted/30`
- Replace teal SVG colors with CSS variable-based monochrome colors
- Replace red missed-day indicator with muted-foreground

**Lines ~1650-1694 (Dialog):**
- Replace `bg-emerald-500` on frequency buttons with `bg-foreground text-background`
- Replace `bg-emerald-500 hover:bg-emerald-600` on save button with `bg-foreground text-background hover:bg-foreground/90`

**Lines ~1164-1170 (Layout):**
- Wrap content in responsive grid to optionally include sidebar
- Add sidebar toggle state and render `HabitSidebarPanel` on desktop

### Total: ~15-20 color replacements across the file, plus optional sidebar grid integration




# Redesign: Habits Stats Dashboard -- World-Class SaaS Aesthetic

## Overview
Redesign the top statistics section of the Habits page (month card, progress rings, and habit image panel) to align with the app's Zara-inspired monochrome design system while delivering a premium, world-class SaaS feel. The current implementation uses jarring emerald/green colors and a cluttered layout that doesn't match the editorial aesthetic of the rest of the app.

## Current Problems
- Emerald/green gradient cards clash with the monochrome Zara design system
- Progress rings feel dated (basic SVG circles with hardcoded colors)
- The 3-column layout (160px sidebar, center, 200px image) is cramped
- The month card packs too much information into a tiny space
- The motivational quote banner feels like filler
- The habit image card takes up valuable space with mostly a placeholder

## Design Direction
Inspired by premium SaaS dashboards (Linear, Notion, Vercel) -- clean, spacious, data-forward with subtle animations. Monochrome palette with a single accent color for key metrics.

## New Layout

```text
+----------------------------------------------------------------------+
| Habits Tracker                                    [+ Add Habit]       |
+----------------------------------------------------------------------+
| [< Feb 2025 >]                                                       |
|                                                                       |
|  +----------+ +----------+ +----------+ +----------+ +----------+   |
|  |          |  |          |  |          |  |          |  |          |  |
|  |   7%     |  |   58%    |  |   75%    |  |   88%    |  |   7%     |  |
|  |          |  |          |  |          |  |          |  |          |  |
|  | TOTAL    |  | MOMENTUM |  | DAILY    |  | WEEKLY   |  | OVERALL  |  |
|  +----------+ +----------+ +----------+ +----------+ +----------+   |
|                                                                       |
|  4 Active  ·  0 Done  ·  4 Total  ·  97 Pending  ·  7 Done  · 104   |
+----------------------------------------------------------------------+
| [Table with graph + habits below]                                     |
```

## Technical Changes

### 1. Redesign `ProgressRing` component (lines ~252-302)
- Replace hardcoded color map with monochrome stroke using CSS variable `hsl(var(--foreground))`
- Add a subtle track ring using `hsl(var(--border))`
- Increase size slightly (90px) for breathing room
- Use the app's font system (light weight, uppercase tracking)
- Single accent for the active/selected state only

### 2. Restructure the stats layout (lines ~1193-1427)
- Remove the 3-column grid (`grid-cols-[160px_1fr_200px]`)
- Replace with a single full-width card containing:
  - Month navigator (inline, left-aligned, minimal)
  - 5 progress rings in a centered horizontal row with generous spacing
  - A subtle inline stats bar below the rings showing habit counts
- Remove the right sidebar image card entirely from the stats section (move it into the habit detail panel or remove)
- Remove the motivational quote from the stats area (keep it as a subtle line or remove)

### 3. Selected habit indicator
- When a habit is selected, show its name and date range as a slim bar above or below the rings instead of a colored banner
- Use monochrome styling with subtle border-left accent

### 4. Month navigation
- Slim inline design: `< February 2025 >` with ghost icon buttons
- Positioned top-left of the stats card, not in a separate card

### 5. Stats summary line
- Replace the two 3x grid stat blocks (Habits + Habit Days) with a single inline text line:
  `4 Active · 0 Done · 4 Total · 97 Pending · 7 Completed · 104 Days`
- Separated by middle dots, using muted-foreground color
- Clean, scannable, minimal

### 6. Color alignment
- Remove all emerald/teal/cyan/green hardcoded colors from the stats section
- Use `foreground` for ring strokes, `muted-foreground` for labels, `border` for tracks
- The daily progress chart row in the table keeps its current styling (separate concern)

### File: `src/pages/Habits.tsx`
This is the only file that needs modification. All changes are within the stats/dashboard section (lines ~252-1427). The table, dialog, and logic below remain untouched.


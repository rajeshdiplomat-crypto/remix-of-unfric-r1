

# Redesign Diary Right Sidebar — Clean Per-Module Performance

## What Changes

Replace the current cluttered right sidebar (`DiarySidebar.tsx`) with a clean, vertically stacked module performance panel. Each module gets its own compact row with a label, a thin progress bar, and a key metric -- no charts, no Quick Actions card, no Filters card.

## New Layout (top to bottom)

```text
+----------------------------------+
|  PERFORMANCE         Today | 7d  |
+----------------------------------+
|                                  |
|  Tasks           3/8 completed   |
|  [======-------]          38%    |
|                                  |
|  Trackers        9/10 sessions   |
|  [==============-]        75%    |
|                                  |
|  Journal         2 entries       |
|  [========------]   5-day streak |
|                                  |
|  Manifest        4 check-ins     |
|  [==========----]   3 goals      |
|                                  |
|  Notes           6 created       |
|  [============--]   2 updated    |
|                                  |
|  Emotions        3 check-ins     |
|  [======--------]                |
|                                  |
+----------------------------------+
|  AI Insight (1-line tip)         |
+----------------------------------+
```

Each module row:
- Module name (left) + key stat (right) on line 1
- Thin progress bar spanning the full width on line 2
- Optional secondary stat in muted text below the bar

## What Gets Removed
- The bar chart (Recharts) and stacked color bars
- The "Quick Actions" card (already duplicated by the Create Post composer and left sidebar)
- The "Filters / Smart Views" card (already duplicated by filter tabs in the center feed)
- The time-range dropdown with "Custom Range"

## What Gets Kept
- Time range toggle (Today / 7d / Month) -- simplified to pill buttons
- Smart insight text at the bottom
- All metrics data from `useDiaryMetrics`

## Files Changed

| File | Change |
|---|---|
| `src/components/diary/DiarySidebar.tsx` | Full rewrite -- remove Recharts, Quick Actions, Filters; replace with clean vertical module rows using the Progress component |
| `src/components/diary/useDiaryMetrics.ts` | Add `emotions` metrics (count of check-ins in range) to the existing hook so the sidebar can display it |
| `src/components/diary/types.ts` | Add `emotions` field to `MetricsSnapshot` if missing |
| `src/pages/Diary.tsx` | Simplify the DiarySidebar props (remove `onQuickAction`, `filter`, `onFilterChange`) |

## Technical Details

- Each module row uses the existing `Progress` component (`src/components/ui/progress.tsx`) with `h-1.5` height and themed colors via `className`
- Emotions data will be fetched via the existing `supabase.from("emotions")` query added to `useDiaryMetrics`
- No new dependencies -- Recharts import is removed from `DiarySidebar.tsx`, reducing bundle size
- The sidebar remains independently scrollable (`overflow-y-auto`) per the global scrolling architecture
- Colors per module use CSS variables (e.g., `bg-emerald-500` for Tasks, `bg-teal-500` for Trackers, `bg-amber-500` for Journal, `bg-sky-500` for Focus, `bg-purple-500` for Manifest, `bg-rose-400` for Emotions)


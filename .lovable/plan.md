

## Consolidate Calendar & Progress into Analytics Modal + Add Consistency Insight

### Task 1: Move Calendar & Progress into Analytics Modal as tabs

**`src/components/manifest/ManifestAnalyticsModal.tsx`**
- Add a tab system with 3 tabs: **Overview** (current stats), **Calendar**, **Consistency**
- Import and render `ManifestSidebarPanel` with `section="calendar"` inside the Calendar tab
- Remove the separate Calendar and Progress icon buttons from the header in `Manifest.tsx`
- Pass additional props: `selectedDate`, `onDateSelect`, `goals` (already passed)

**`src/pages/Manifest.tsx`**
- Remove the Calendar (`showCalendarPopup`) and Progress (`showProgressPopup`) buttons and their popup Dialogs (lines 538-553 and 960-1036)
- Remove the related state: `showCalendarPopup`, `showProgressPopup`
- Keep only the Analytics (BarChart3) button which now contains everything

### Task 2: Add Consistency & Missing Practice insight tab

**`src/components/manifest/ManifestAnalyticsModal.tsx`** — new "Consistency" tab content:
- **Streak heatmap**: Last 30 days grid showing practiced vs missed days per goal (green dot = practiced, empty = missed)
- **Consistency rate**: `(practice days / total days) * 100` displayed as a percentage with a radial or bar visual
- **Missing practice list**: For each active goal, show days in the selected period where no locked practice exists — displayed as "You missed 3 days this week" with the specific dates
- **Per-goal breakdown**: Small rows per goal showing their individual consistency rate and current streak
- Accept `selectedDate` and `onDateSelect` as new props for the calendar tab

### Files changed
- `src/components/manifest/ManifestAnalyticsModal.tsx` — add tabs, calendar section, consistency section
- `src/pages/Manifest.tsx` — remove calendar/progress buttons and popups, pass extra props to analytics modal


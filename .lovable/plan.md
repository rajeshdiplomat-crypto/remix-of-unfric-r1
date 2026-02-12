

# Redesign Diary Left and Right Sidebars

## Summary
The Diary page has a three-column Facebook-style layout, but both sidebars need work: the left sidebar is an empty placeholder, and the right sidebar (Performance Snapshot, Quick Actions, Filters) has visual issues -- typos ("Entrice written", "Priote", "Dating Completed"), hardcoded fallback numbers, and all quick-action buttons use the same icon. This plan addresses both sidebars to make them functional and polished, matching the reference screenshot's clean design.

## Left Sidebar -- New Content

The left sidebar (`DiaryLeftSidebar.tsx`) is currently empty. It will be populated with navigation and context, similar to Facebook's left panel:

1. **User profile section** -- Avatar + display name + a daily motivational quote (already defined in `DAILY_QUOTES` in types.ts but unused)
2. **Navigation shortcuts** -- Quick links to each module (Journal, Tasks, Notes, Trackers, Manifest, Emotions) with appropriate icons and active-state highlighting matching the current feed filter
3. **Daily quote card** -- A small inspirational card using the existing `DAILY_QUOTES` array, rotating daily

## Right Sidebar -- Fixes and Polish

The right sidebar (`DiarySidebar.tsx`) already has the right structure matching the reference image, but needs these fixes:

### Bug Fixes
- **Typo fixes**: "Entrice written" -> "Entries written", "Priote" -> "Private", "Dating Completed" -> "Daily Completed"
- **Remove hardcoded fallbacks**: Values like `|| 14`, `|| 4`, `|| 20`, `|| 9`, `|| 10` are displaying fake data when real data is 0. These will be replaced with the actual metric values.

### Design Improvements
- **Quick Action icons**: Currently all 6 buttons use `CheckSquare`. Each will get its proper icon: `CheckSquare` for Task, `PenLine` for Journal, `FileText` for Note, `Target` for Activity, `Sparkles` for Manifest Goal, `Zap` for Focus Session.
- **Remove the "Custom Range" dropdown** from the time range toggle -- it's non-functional and adds visual noise.

## Files Changed

| File | Change |
|---|---|
| `src/components/diary/DiaryLeftSidebar.tsx` | Complete rewrite: add user profile, nav shortcuts, daily quote |
| `src/components/diary/DiarySidebar.tsx` | Fix typos, remove hardcoded fallbacks, fix quick-action icons, remove dead dropdown |

## Technical Details

- `DiaryLeftSidebar` will import navigation items with icons from `lucide-react` and use the existing `filter`/`onFilterChange` props to highlight the active module
- The daily quote will be selected using `new Date().getDate() % DAILY_QUOTES.length` for deterministic daily rotation
- No new dependencies or database changes required
- The `MetricsSnapshot` type in `types.ts` does not include `tasks.overdue`, `tasks.total`, `journal.private`, or `trackers.total` -- the hardcoded fallbacks for these will be removed, and only the fields that actually exist in the type will be displayed
- The Trackers and Focus metrics are currently mocked in `useDiaryMetrics.ts` (hardcoded 75%, 180min etc.) -- this is a separate concern and will not be addressed in this plan


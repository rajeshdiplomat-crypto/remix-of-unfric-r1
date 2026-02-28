

## Merge Consistency into Calendar with Multi-Reality Highlighting

### What changes

**`src/components/manifest/ManifestSidebarPanel.tsx`** — Enhanced calendar day cells:
- Compute a "completion ratio" per day: `practiceCount / totalActiveRealities`
- Color-code each calendar day cell based on ratio:
  - **All realities practiced** (100%): solid green/teal background
  - **Partial** (1+ but not all): amber/yellow tint
  - **None practiced** (0): subtle red/muted dot or empty
- Keep the `X/total` label but style it to match the color tier
- Below the calendar grid, add a small legend: ● All ● Partial ● Missed

**`src/components/manifest/ManifestSidebarPanel.tsx`** — Add consistency summary below calendar:
- When `section === "calendar"` (inside analytics modal), render below the calendar:
  - Overall consistency % with a slim progress bar
  - Per-goal mini rows: goal title, streak flame icon, consistency %, and missed days this week
- Reuse the same `consistencyData` computation logic currently in the analytics modal (move/share it)

**`src/components/manifest/ManifestAnalyticsModal.tsx`**:
- Remove the separate "Consistency" tab entirely (tab trigger + TabsContent)
- Pass consistency-relevant data as props to `ManifestSidebarPanel`, or compute it inside the sidebar since it already receives `goals` and `practices`
- Calendar tab now shows the enhanced calendar + consistency summary in one scrollable view
- Keep only 2 tabs: **Overview** and **Calendar**

### Calendar day cell logic (pseudo)
```text
ratio = practiceCount / totalActiveRealities
if ratio === 1   → bg-emerald-500/70 text-white (fully practiced)
if ratio > 0     → bg-amber-400/40 text-amber-700 (partial)
if ratio === 0   → default or subtle bg-red-100/30 (missed, only for past dates)
```

### Files changed
- `src/components/manifest/ManifestSidebarPanel.tsx` — enhanced day styling + consistency section below calendar
- `src/components/manifest/ManifestAnalyticsModal.tsx` — remove Consistency tab, keep 2 tabs


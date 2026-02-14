

# Journal Redesign: Two-Column Layout with Hidden Panels

## Concept

Replace the current three-column layout with a clean two-column design:

- **Left column (~320px)**: An editorial "about journaling" section with a header, a brief explanation of why journaling matters, and 3 icon buttons that toggle open the Calendar, Emotions Today, and Progress panels (as slide-out drawers or inline expandable sections).
- **Right column (1fr)**: The editor only -- greeting, quote, and the writing area. Full breathing room.

This creates a magazine-style layout where the writing space dominates, and the utility panels (calendar, emotions, progress) are accessible on demand but hidden by default.

## Layout

```text
+---------------------------+----------------------------------------+
| LEFT (~320px)             | RIGHT (1fr)                            |
|                           |                                        |
| "Journaling"              | Good afternoon, Ankit                 |
| Why it matters...         | "Quote..."                             |
|                           |                                        |
| [Calendar] [Emotions]    | +------------------------------------+ |
| [Progress]                | |                                    | |
|                           | |  Editor                            | |
| (clicking a button        | |                                    | |
|  expands its panel         | |                                    | |
|  inline below)             | |                                    | |
|                           | +------------------------------------+ |
+---------------------------+----------------------------------------+
```

## How the 3 Buttons Work

Three small icon buttons (Calendar, Sparkles/Emotions, TrendingUp/Progress) sit in a row. Clicking one toggles its corresponding panel open/closed inline below the buttons within the left column. Only one panel open at a time (accordion-style), or allow multiple -- accordion feels cleaner.

## What the Left Column Contains (top to bottom)

1. **Header**: "Journaling" in `text-lg font-semibold tracking-wide`
2. **Body text**: 2-3 short sentences about the value of journaling in `text-sm text-muted-foreground` -- e.g., "Journaling helps you process emotions, track growth, and find clarity. A few minutes each day can transform how you understand yourself."
3. **Decorative divider**: A subtle `h-px bg-border` line
4. **3 toggle buttons** in a row: Calendar, Emotions, Progress -- styled as ghost icon buttons with labels
5. **Expandable panel area**: When a button is clicked, the corresponding component renders below with a smooth transition

## Technical Details

### `src/pages/Journal.tsx`

**State**: Add `activeLeftPanel` state: `useState<"calendar" | "emotions" | "progress" | null>(null)`

**Remove**: The `leftPanelCollapsed` state and related collapse logic (simplifying to the new toggle approach)

**Grid change**: From `grid-cols-[300px_1fr_260px]` to `grid-cols-[320px_1fr]` (two columns only)

**Left column content**:
- Static editorial text about journaling
- Three buttons row
- Conditionally render:
  - `activeLeftPanel === "calendar"` --> `<JournalSidebarPanel />` (calendar only)
  - `activeLeftPanel === "emotions"` --> Emotions section from `<JournalDateDetailsPanel />` (just the emotions card)
  - `activeLeftPanel === "progress"` --> Progress section from `<JournalDateDetailsPanel />` (just the progress card)

**Right column**: Just `{editorContent}` -- the greeting, quote, and editor

**Remove**: The entire editorial right column (the quote/date/word-count decorative space) since that info moves partly to the left column and partly stays in the editor greeting

### `src/components/journal/JournalDateDetailsPanel.tsx`

Split the two cards into individually renderable sections. Either:
- Export two sub-components: `JournalProgressCard` and `JournalEmotionsCard`
- Or add a `showSection` prop (like JournalSidebarPanel already has) to show only "progress" or "emotions"

The cleanest approach: add a `section` prop (`"progress" | "emotions" | "all"`) that controls which card renders.

### `src/components/journal/JournalSidebarPanel.tsx`

No changes needed -- it already supports `showSection="calendar"` which is what we'll use.

Remove the collapse/expand logic props since they're no longer needed (the panel is toggled by the parent).

### Files Modified

1. **`src/pages/Journal.tsx`** -- Main layout restructure, new state, left column editorial content, 3 toggle buttons
2. **`src/components/journal/JournalDateDetailsPanel.tsx`** -- Add `section` prop to render progress-only or emotions-only



# Emotional Check-in 3-Zone Center-Dominant Redesign

## Executive Summary

This plan replaces the current 2-column Emotional Check-in layout with a new world-class 3-zone center-dominant design. The redesign transforms the experience into a **guided ritual** with a focused center flow, passive contextual rails, and direct access to Patterns via top navigation.

**Key principle**: Preserve all existing business logic, data bindings, APIs, state management, and analytics - only change the presentation layer.

---

## Current Architecture Analysis

### Existing Components (to preserve logic, refactor UI)
| Component | Purpose | Preserve |
|-----------|---------|----------|
| `EmotionSliderPicker` | Energy/Pleasantness sliders + emotion chips | Logic only |
| `EmotionContextFieldsEnhanced` | Context fields (who, what, sleep, activity) | Fully |
| `StrategiesPanelEnhanced` | Regulation strategies with guided visualization | Refactor for Screen 2 |
| `PatternsDashboardEnhanced` | Charts, insights, analytics | Becomes Screen 3 |
| `EmotionCalendarSidebar` | Monthly calendar | Move to right rail |
| `RecentEntriesList` | Entry history | Move to right rail (limit 3) |

### Data Flow (unchanged)
```
User Input → saveCheckIn() → Supabase emotions table → createEmotionFeedEvent() → feed_events table
                          ↳ Optional: saveToJournal() → journal_entries/answers
```

### State Variables (unchanged)
- `step: "sliders" | "details"` - current check-in phase
- `selectedQuadrant`, `selectedEmotion` - user selections
- `note`, `context` - additional context
- `entries` - fetched emotion entries
- `viewingDate`, `editingEntry` - modal states

---

## New 3-Zone Architecture

### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Fixed Header (ZaraHeader) with "Patterns" nav link                         │
├─────────────────┬───────────────────────────────────────┬──────────────────┤
│   LEFT RAIL     │           CENTER (MAIN FLOW)          │   RIGHT RAIL     │
│   (20-25%)      │              (50-60%)                 │   (20-25%)       │
│   opacity: 0.5  │          full contrast                │   opacity: 0.45  │
│   muted bg      │       ~820px max-width                │   muted bg       │
│                 │                                       │                  │
│  ┌───────────┐  │  ┌───────────────────────────────┐    │  ┌────────────┐  │
│  │ Date/Time │  │  │     "Emotional Check-in"      │    │  │  Recent 3  │  │
│  │  Quote    │  │  │ "How are you feeling now?"    │    │  │  Entries   │  │
│  │ Breathing │  │  │                               │    │  │            │  │
│  │   Icon    │  │  │  ═══════════════════════════  │    │  └────────────┘  │
│  └───────────┘  │  │  Energy:  Low ─────●───── High│    │  ┌────────────┐  │
│                 │  │                               │    │  │   Mini     │  │
│                 │  │  ═══════════════════════════  │    │  │  Calendar  │  │
│                 │  │  Pleasant: Bad ───●──── Good  │    │  │(collapsed) │  │
│                 │  │                               │    │  └────────────┘  │
│                 │  │  ┌─────────────────────────┐  │    │                  │
│                 │  │  │ Detected: High Pleasant │  │    │  ┌────────────┐  │
│                 │  │  │ Energized and positive  │  │    │  │ View full  │  │
│                 │  │  └─────────────────────────┘  │    │  │  history → │  │
│                 │  │                               │    │  └────────────┘  │
│                 │  │  [Happy] [Excited] [Joyful]  │    │                  │
│                 │  │          [Proud]              │    │                  │
│                 │  │                               │    │                  │
│                 │  │  ┌───────────────────────────┐│    │                  │
│                 │  │  │       CONTINUE            ││    │                  │
│                 │  │  └───────────────────────────┘│    │                  │
│                 │  └───────────────────────────────┘    │                  │
└─────────────────┴───────────────────────────────────────┴──────────────────┘
```

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥1280px) | 3 zones: 22% / 56% / 22% |
| Laptop (1024-1279px) | 3 zones: 20% / 60% / 20% |
| Tablet (768-1023px) | Rails collapsible, toggle buttons |
| Mobile (<768px) | Center full-width, rails → bottom drawers |

---

## Screen Definitions

### Screen 1: Emotional Check-in (Entry)

**Center Panel (`.main-flow`)**
- Title: "Emotional Check-in"
- Subtitle: "How are you feeling right now?"
- Two horizontal sliders (existing `EmotionSliderPicker` refactored):
  - Energy: Low → High
  - Pleasantness: Unpleasant → Pleasant
- Detected Zone card: soft background matching quadrant color, zone label + description
- Suggested emotion chips (max 4): outline style, filled when selected
- Primary CTA: "Continue" button (`.primary-cta`, min-height 48px)

**Left Rail (`.side-rail`)**
- Current date/time (formatted in user timezone)
- Calming quote (from existing `EMOTION_QUOTES` or new static list)
- Decorative breathing icon (animated subtle pulse)
- No interactive elements

**Right Rail (`.side-rail`)**
- Recent check-ins: last 3 only (from `RecentEntriesList`, simplified view)
- Mini calendar: collapsed by default, expandable
- Link: "View full history" → navigates to Patterns (Screen 3)

### Screen 2: Regulation / Support

**Triggered by**: Clicking "Continue" on Screen 1

**Center Panel**
- Header: "Would you like support right now?"
- Single recommended activity card (from `StrategiesPanelEnhanced`):
  - Strategy name + duration
  - Short description
  - CTA: "Try now" button
- Collapsed link: "See more strategies" → opens drawer/overlay
- Secondary actions: "Skip" / "Save for later"

**Rails**
- Same content as Screen 1 but further reduced contrast (opacity 0.35)

**Behavior**
- Starting activity → opens `GuidedVisualization` modal (existing)
- Skip → saves check-in, returns to Screen 1
- Existing `handleSliderComplete` → `step = "details"` flow maps here

### Screen 3: Patterns / Insights

**Access Methods**
1. Top nav "Patterns" link (to be added to ZaraHeader or page-level nav)
2. "View full history" link in right rail

**Layout**
- Center expands to 70-80%
- Rails collapse or become minimal

**Content** (from `PatternsDashboardEnhanced`)
- Date range selector (7D/30D/90D)
- Tab navigation: Overview | Moods | Context
- Charts: mood distribution, trends, time-of-day analysis
- Entry list with filters
- No sliders - pure reflection mode

---

## New Components to Create

### 1. `EmotionThreeZoneLayout.tsx`
Main layout wrapper implementing the 3-zone grid structure.

```tsx
interface EmotionThreeZoneLayoutProps {
  leftRail: React.ReactNode;
  center: React.ReactNode;
  rightRail: React.ReactNode;
  railsCollapsed?: boolean;
  centerExpanded?: boolean;
}
```

### 2. `EmotionLeftRail.tsx`
Left rail content: date/time, quote, breathing icon.

### 3. `EmotionRightRail.tsx`
Right rail content: recent 3 entries, collapsible calendar, history link.

### 4. `EmotionCheckInCenter.tsx`
Screen 1 center content: sliders, detected zone, chips, CTA.

### 5. `EmotionSupportCenter.tsx`
Screen 2 center content: recommended strategy, skip/save options.

### 6. `EmotionPatternsView.tsx`
Screen 3: wrapper that expands center and shows PatternsDashboardEnhanced.

---

## Files to Modify

### `src/pages/Emotions.tsx`
- Restructure to use new 3-zone layout
- Add screen state management (`"checkin" | "support" | "patterns"`)
- Preserve all existing state variables and API calls
- Remove old 2-column grid structure

### `src/components/layout/ZaraHeader.tsx` or Page-Level Nav
- Add "Patterns" navigation link for direct access

### `src/components/emotions/EmotionSliderPicker.tsx`
- Extract slider logic for reuse
- Remove card wrapper, integrate into center panel flow
- Limit chips to max 4

### `src/components/emotions/StrategiesPanelEnhanced.tsx`
- Add prop for "single recommendation" mode
- Create drawer/overlay for "See more strategies"

### `src/components/emotions/RecentEntriesList.tsx`
- Add compact mode (3 items, minimal UI)
- Preserve full mode for Patterns screen

### `src/components/emotions/EmotionCalendarSidebar.tsx`
- Add collapsed/expanded state
- Default to collapsed in right rail

---

## CSS/Styling Guidelines

### New CSS Classes

```css
/* Side rails - muted, passive */
.side-rail {
  opacity: 0.45;
  background-color: hsl(var(--muted) / 0.3);
  font-size: 0.875rem;
  /* No high-saturation accents */
}

.side-rail--dimmed {
  opacity: 0.35; /* For Screen 2 */
}

/* Main flow - dominant center */
.main-flow {
  max-width: 820px;
  margin: 0 auto;
  /* Highest contrast */
}

/* Primary CTA */
.primary-cta {
  width: 100%;
  min-height: 48px;
  font-weight: 600;
}
```

### Motion/Transitions
- Fade/slide transitions between screens (300ms ease)
- Gentle pulse on breathing icon in left rail
- Smooth slider thumb movement

### Accessibility Requirements
- All interactive elements: `aria-label` attributes
- Keyboard navigation: Tab order, Enter/Space activation
- Color contrast: ≥4.5:1 for body text, ≥3:1 for large text
- Focus indicators: visible ring on focus
- Screen reader: semantic HTML, proper heading hierarchy

---

## File Structure After Refactor

```
src/components/emotions/
├── layout/
│   ├── EmotionThreeZoneLayout.tsx    # NEW
│   ├── EmotionLeftRail.tsx           # NEW
│   └── EmotionRightRail.tsx          # NEW
├── screens/
│   ├── EmotionCheckInCenter.tsx      # NEW
│   ├── EmotionSupportCenter.tsx      # NEW
│   └── EmotionPatternsView.tsx       # NEW
├── EmotionSliderPicker.tsx           # REFACTOR
├── EmotionContextFieldsEnhanced.tsx  # KEEP AS-IS
├── StrategiesPanelEnhanced.tsx       # REFACTOR (add single mode)
├── PatternsDashboardEnhanced.tsx     # KEEP AS-IS
├── RecentEntriesList.tsx             # REFACTOR (add compact mode)
├── EmotionCalendarSidebar.tsx        # REFACTOR (add collapsed mode)
├── GuidedVisualization.tsx           # KEEP AS-IS
└── types.ts                          # KEEP AS-IS
```

---

## Implementation Steps

### Phase 1: Create Layout Foundation
1. Create `EmotionThreeZoneLayout.tsx` with 3-column grid
2. Implement responsive breakpoints
3. Add `.side-rail` and `.main-flow` CSS classes
4. Create `EmotionLeftRail.tsx` with date/quote/icon
5. Create `EmotionRightRail.tsx` with entries/calendar/link

### Phase 2: Refactor Check-in Flow (Screen 1)
6. Create `EmotionCheckInCenter.tsx` with sliders and CTA
7. Refactor `EmotionSliderPicker.tsx` to extract reusable slider logic
8. Update chip display to max 4, outline/filled styles
9. Implement detected zone card with live updates
10. Wire "Continue" to transition to Screen 2

### Phase 3: Implement Support Screen (Screen 2)
11. Create `EmotionSupportCenter.tsx`
12. Add single-recommendation mode to `StrategiesPanelEnhanced.tsx`
13. Create drawer for "See more strategies"
14. Implement Skip/Save actions
15. Preserve existing save flow and analytics

### Phase 4: Patterns Screen (Screen 3)
16. Create `EmotionPatternsView.tsx` with expanded center
17. Add "Patterns" nav link (page-level or header)
18. Wire "View full history" link
19. Ensure direct URL access works

### Phase 5: Responsive & Accessibility
20. Implement tablet collapsible rails
21. Implement mobile bottom drawers
22. Add all ARIA labels and keyboard navigation
23. Verify color contrast ratios
24. Test screen reader compatibility

### Phase 6: Cleanup & Polish
25. Remove old layout code from `Emotions.tsx`
26. Archive deprecated component files
27. Add code comments for preserved business logic
28. Motion/transition polish
29. Cross-browser testing

---

## Technical Details for Implementation

### State Management Updates in Emotions.tsx

```tsx
// New screen state (add to existing state)
type EmotionScreen = "checkin" | "support" | "patterns";
const [screen, setScreen] = useState<EmotionScreen>("checkin");

// Modified step flow
const handleSliderComplete = (quadrant: QuadrantType, emotion: string) => {
  setSelectedQuadrant(quadrant);
  setSelectedEmotion(emotion);
  setScreen("support"); // Was: setStep("details")
};

// Patterns navigation
const handleViewPatterns = () => {
  setScreen("patterns");
};
```

### Responsive Grid Implementation

```tsx
// EmotionThreeZoneLayout.tsx
<div className={cn(
  "grid gap-4 h-full px-4",
  centerExpanded 
    ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,5fr)_minmax(0,1fr)]"
    : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)_minmax(0,1fr)]"
)}>
  {/* Left Rail */}
  <aside className={cn(
    "side-rail hidden lg:flex flex-col gap-4",
    railsDimmed && "side-rail--dimmed"
  )}>
    {leftRail}
  </aside>
  
  {/* Center */}
  <main className="main-flow flex flex-col">
    {center}
  </main>
  
  {/* Right Rail */}
  <aside className={cn(
    "side-rail hidden lg:flex flex-col gap-4",
    railsDimmed && "side-rail--dimmed"
  )}>
    {rightRail}
  </aside>
</div>
```

### Preserved API Calls (DO NOT MODIFY)

```tsx
// These functions remain exactly as-is:
- fetchEntries()
- saveCheckIn()
- createEmotionFeedEvent()
- saveToJournal()
- saveEditedEntry()
- deleteEntry()
```

---

## QA Checklist

- [ ] Sliders update Detected Zone in real-time
- [ ] Chips limited to 4, outline/filled states work
- [ ] "Continue" navigates to Support screen
- [ ] Single recommended strategy displays correctly
- [ ] "Try now" opens GuidedVisualization, records event
- [ ] "See more strategies" opens drawer
- [ ] Skip/Save actions work correctly
- [ ] "Patterns" nav link accessible from header/page
- [ ] "View full history" link works from right rail
- [ ] Patterns screen shows expanded center, no sliders
- [ ] Recent entries show only last 3 in right rail
- [ ] Calendar collapsed by default, expands on click
- [ ] Keyboard navigation covers all elements
- [ ] ARIA labels present on interactive elements
- [ ] Color contrast meets WCAG requirements
- [ ] Mobile: rails → bottom drawers
- [ ] Tablet: rails collapsible
- [ ] No console errors or API failures
- [ ] All existing save/edit/delete flows work
- [ ] Chrome, Firefox, Safari, Edge compatibility

---

## Files to Delete/Archive

After implementation, the following can be archived:
- None - all existing components are being refactored in place, not deleted

Legacy layout code within `Emotions.tsx` (lines 401-514) will be replaced.

---

## Rollback Plan

If QA finds critical issues:
1. Revert the commit: `git revert <commit-hash>`
2. Old layout was 2-column grid in `Emotions.tsx`
3. No database schema changes - pure frontend refactor

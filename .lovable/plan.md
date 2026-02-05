

# Compact Context & Restructure Regulate to Match Feel Layout

## Goal
1. **Context page**: Fit all content on one screen without scrolling (same height as Feel)
2. **Regulate page**: Mirror Feel layout exactly - text on left, interactive content on right, single page with no scrolling

---

## Changes to EmotionsPageContext.tsx

### Problem
The Context page has too many cards stacked vertically, causing overflow and requiring scrolling.

### Solution
Condense the form layout to fit within viewport:

| Change | Details |
|--------|---------|
| Reduce card padding | `p-5` → `p-3` or `p-4` |
| Smaller gaps | `gap-4` → `gap-2` or `gap-3` |
| Combine Sleep + Activity | Already side-by-side, reduce size |
| Smaller textarea | `min-h-[80px]` → `min-h-[60px]` |
| Compact pill buttons | `h-10` → `h-8`, smaller padding |
| Remove Journal toggle card | Or make it inline with buttons |
| Tighten action buttons | Less padding/margins |

### Updated Layout
```text
┌────────────────────────────────────────────────────────┐
│  Left (Form - compact)    │  Right (Text)              │
│                           │                            │
│  [Back]                   │  Badge: "Add Context"      │
│  Notes (smaller)          │  Title                     │
│  Who (inline pills)       │  Description               │
│  What (inline pills)      │  Features                  │
│  Sleep │ Activity (row)   │  Selected emotion badge    │
│  [ ] Journal toggle       │                            │
│  [Skip] [Save]            │                            │
└────────────────────────────────────────────────────────┘
```

---

## Changes to EmotionsPageRegulate.tsx

### Problem
Currently has:
- Two-column hero at top
- Then full-width Recommended Strategies
- Then full-width All Strategies with filters
- Requires scrolling

### Solution
Mirror the Feel page structure exactly:
- **Left column**: Descriptive text (badge, title, description, features)
- **Right column**: Interactive content (success animation, emotion badge, action buttons)
- Remove or minimize strategies section to avoid scrolling

### New Layout (matches Feel exactly)
```text
┌────────────────────────────────────────────────────────┐
│  Left (Text)              │  Right (Interactive)       │
│                           │                            │
│  Badge: "Well Done"       │   [Checkmark Animation]    │
│  Title: "Check-in         │   "Check-in Complete"      │
│          Complete"        │   Emotion Badge            │
│  Description              │                            │
│  Features                 │   [New Check-in]           │
│                           │   [View Insights]          │
│                           │   [Try a Strategy]         │
└────────────────────────────────────────────────────────┘
```

### Strategy Access
Instead of showing all strategies on this page:
- Add a "Try a Strategy" button in the right column
- Opens a modal/drawer with strategy picker (already have Dialog component)
- Keeps the page clean and scroll-free

---

## Implementation Details

### EmotionsPageContext.tsx

**1. Compact PillButton styling (lines 84-101)**
```typescript
// Smaller pills
className="h-8 px-3 rounded-lg text-xs font-medium..."
```

**2. Reduce form card spacing (lines 120-260)**
- Cards: `p-5` → `p-3`
- Gap between cards: `gap-4` → `gap-2`
- Textarea: `min-h-[80px]` → `min-h-[50px]`
- Remove excessive margins

**3. Inline Journal toggle with action buttons (lines 210-259)**
- Move switch inline with Skip/Save buttons
- Or remove the card wrapper entirely

---

### EmotionsPageRegulate.tsx

**1. Swap column order (lines 105-217)**
- Move descriptive text to LEFT (order-1)
- Move success content to RIGHT (order-2)

**2. Remove strategies sections (lines 219-309)**
- Delete "Recommended Strategies" section
- Delete "All Strategies" section with filters
- Replace with "Explore Strategies" button that opens modal

**3. Add strategy modal trigger**
```tsx
<Button onClick={() => setShowVisualization(true)}>
  Explore Strategies
  <Sparkles className="h-4 w-4" />
</Button>
```

**4. Enhance the modal to include strategy selection**
- When no strategy selected, show strategy picker in modal
- When strategy selected, show guided visualization

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/emotions/EmotionsPageContext.tsx` | Compact all form elements to fit viewport |
| `src/components/emotions/EmotionsPageRegulate.tsx` | Swap columns, remove inline strategies, add modal trigger |

---

## Visual Consistency After Changes

All three screens will follow the same pattern:
- **Feel**: Text (left) + Wheel (right) - single page
- **Context**: Form (left) + Text (right) - single page
- **Regulate**: Text (left) + Success (right) - single page


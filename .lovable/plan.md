

# Fix Diary Page - Empty Left Panel & True Independent Scrolling

## Root Cause Analysis

The 3-column independent scrolling isn't working because of **competing scroll containers**:

```text
AppLayout (line 22)
└── overflow-auto ← PROBLEM: This scrolls the ENTIRE page
    └── Diary page (overflow-hidden) 
        ├── Left sidebar (overflow-y-auto) ← Can't scroll independently
        ├── Center feed (overflow-y-auto)  ← Can't scroll independently  
        └── Right sidebar (overflow-y-auto) ← Can't scroll independently
```

The parent `overflow-auto` in AppLayout takes control of scrolling, making the child `overflow-y-auto` ineffective.

---

## Solution

### 1. Fix AppLayout Container (Root Fix)

**File: `src/components/layout/AppLayout.tsx`**

Change line 22 from:
```tsx
<div className="flex-1 flex flex-col overflow-auto pb-4">
```

To:
```tsx
<div className="flex-1 flex flex-col overflow-hidden">
```

This ensures:
- Parent container does NOT scroll
- Each page controls its own scrolling
- Facebook-style independent column scrolling works correctly

### 2. Empty the Left Sidebar

**File: `src/components/diary/DiaryLeftSidebar.tsx`**

Replace the entire content with an empty placeholder:

```tsx
import type { SourceModule } from "./types";

interface DiaryLeftSidebarProps {
  userName: string;
  filter: SourceModule | 'all' | 'saved';
  onFilterChange: (filter: SourceModule | 'all' | 'saved') => void;
}

export function DiaryLeftSidebar({
  userName,
  filter,
  onFilterChange,
}: DiaryLeftSidebarProps) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Placeholder - content to be added later */}
    </div>
  );
}
```

---

## Visual Result After Fix

```text
┌──────────────────────────────────────────────────────────────────┐
│                      Fixed Header (ZaraHeader)                    │
├────────────────────────────────────────────────────────────────── │
│  ┌─────────┐  ┌──────────────────────────────┐  ┌──────────────┐  │
│  │ LEFT    │  │        CENTER FEED           │  │    RIGHT     │  │
│  │         │  │  ┌────────────────────────┐  │  │              │  │
│  │ (empty) │  │  │ Create Post            │  │  │  Insights    │  │
│  │         │  │  └────────────────────────┘  │  │              │  │
│  │         │  │  ┌────────────────────────┐  │  │  Stats       │  │
│  │         │  │  │ Feed Card 1            │  │  │              │  │
│  │         │  │  └────────────────────────┘  │  │  Calendar    │  │
│  │         │  │  ┌────────────────────────┐  │  │              │  │
│  │         │  │  │ Feed Card 2            │↕ │  │              │↕ │
│  │         │  │  └────────────────────────┘  │  │              │  │
│  │         │  │           ...                │  │              │  │
│  └─────────┘  └──────────────────────────────┘  └──────────────┘  │
│     Fixed              Scrolls                      Scrolls       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Change `overflow-auto` to `overflow-hidden` on line 22 |
| `src/components/diary/DiaryLeftSidebar.tsx` | Remove all content, keep empty placeholder div |

---

## Impact on Other Pages

This fix ensures ALL multi-column pages benefit from true independent scrolling:
- **Manifest**: Left/Center/Right scroll independently ✓
- **Journal**: Calendar/Editor/Details scroll independently ✓
- **Tasks**: Left/Right panels scroll independently ✓
- **Emotions**: Left/Right scroll independently ✓
- **Trackers**: Full page scrolls (single column behavior) ✓

The `overflow-hidden` on AppLayout is the **correct pattern** for Facebook-style layouts where each column manages its own scroll.


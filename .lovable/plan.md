

## Facebook-Style Layout: Fixed Hero + Independent Scrolling Columns

### Target Layout
```text
┌────────────────────────────────────────────────────┐
│  Fixed Header (ZaraHeader - 56px)                  │  ← Already fixed
├────────────────────────────────────────────────────┤
│  Fixed PageHero (~200px) - DOES NOT SCROLL         │  ← Currently 50vh, too tall
├───────────────────────┬────────────────────────────┤
│   LEFT COLUMN         │      RIGHT COLUMN          │
│   (scrolls ↕)         │      (scrolls ↕)           │
│                       │                            │
│ ┌───────────────────┐ │ ┌────────────────────────┐ │
│ │  Check-in +       │ │ │  Calendar              │ │
│ │  Strategies       │ │ │                        │ │
│ └───────────────────┘ │ └────────────────────────┘ │
│ ┌───────────────────┐ │ ┌────────────────────────┐ │
│ │  Dashboard        │ │ │  Recent Entries        │ │
│ │                   │ │ │                        │ │
│ └───────────────────┘ │ └────────────────────────┘ │
└───────────────────────┴────────────────────────────┘
```

### Current Problem
- PageHero height is `h-[calc(50vh+3.5rem)]` = ~54% of viewport
- This leaves only ~46% for the columns, not enough room to scroll
- The container structure doesn't properly constrain column heights

---

### Solution

#### Step 1: Reduce PageHero Height

**File: `src/components/common/PageHero.tsx`**

Change the hero from 50vh to a reasonable fixed height (~200px) so more space remains for the scrollable columns.

| Lines | Current | Change To |
|-------|---------|-----------|
| 270 | `h-[calc(50vh+3.5rem)]` | `h-48` (192px) |
| 280 | `h-[calc(50vh+3.5rem)]` | `h-48` (192px) |

```tsx
// Line 270 (no media placeholder)
<div className="relative w-full h-48 bg-foreground/5 flex items-end justify-start overflow-hidden">

// Line 280 (with media)
<div className="relative w-full h-48 overflow-hidden" ...>
```

#### Step 2: Add `flex-shrink-0` to PageHero Container

Ensure the PageHero doesn't shrink when flex layout calculates space.

**File: `src/pages/Emotions.tsx`**

Wrap PageHero to prevent shrinking:

| Line | Current | Change To |
|------|---------|-----------|
| 392-399 | PageHero without wrapper | Add `shrink-0` class |

```tsx
// Lines 392-399
<div className="shrink-0">
  <PageHero
    storageKey="emotion_hero_src"
    typeKey="emotion_hero_type"
    badge={PAGE_HERO_TEXT.emotions.badge}
    title={PAGE_HERO_TEXT.emotions.title}
    subtitle={PAGE_HERO_TEXT.emotions.subtitle}
  />
</div>
```

#### Step 3: Fix Content Container to Fill Remaining Height

**File: `src/pages/Emotions.tsx`**

The content wrapper needs `overflow-hidden` to contain the columns, and columns need proper height constraints.

| Line | Current | Change To |
|------|---------|-----------|
| 402 | `flex-1 px-6 lg:px-8 py-6` | `flex-1 px-6 lg:px-8 py-6 overflow-hidden min-h-0` |

```tsx
// Line 402
<div className="flex-1 px-6 lg:px-8 py-6 overflow-hidden min-h-0">
```

The `min-h-0` is critical - it allows flex children to shrink below their content size, enabling scroll.

---

### Technical Summary

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/common/PageHero.tsx` | 270 | `h-[calc(50vh+3.5rem)]` → `h-48` |
| `src/components/common/PageHero.tsx` | 280 | `h-[calc(50vh+3.5rem)]` → `h-48` |
| `src/pages/Emotions.tsx` | 392-399 | Wrap PageHero in `<div className="shrink-0">` |
| `src/pages/Emotions.tsx` | 402 | Add `overflow-hidden min-h-0` to content wrapper |

### Why This Works

1. **Smaller fixed hero** → More viewport space for columns
2. **`shrink-0` on hero** → Hero never shrinks, stays fixed height
3. **`overflow-hidden min-h-0` on content** → Creates scroll container boundary
4. **`overflow-y-auto h-full` on columns** → Each column scrolls independently

The `min-h-0` is the key CSS trick - in flexbox, items have an implicit minimum height of their content. Setting `min-h-0` overrides this, allowing the flex item to shrink and trigger overflow scrolling.




## Fix Complete Layout Scroll Chain

### Problem Identified
The current layout has `overflow-hidden` at **multiple levels** which completely blocks all scrolling:

```text
AppLayout div.h-screen.overflow-hidden
└── main.flex-1.pt-14
    └── div.flex-1.overflow-hidden      ← Blocks scrolling
        └── PageTransition.h-full
            └── Emotions.h-full.overflow-hidden  ← Also blocks
                └── PageHero h-[calc(50vh+3.5rem)]  ← Takes ~54% viewport
                └── Content.flex-1.overflow-hidden ← No scroll possible
                    └── Columns with overflow-y-auto ← Never triggers
```

The `overflow-hidden` on line 22 of AppLayout was correct to **prevent document-level scroll**, but the Emotions page content area also has `overflow-hidden` which blocks the columns from scrolling.

---

### Solution: Enable Scroll at the Content Level

**File 1: `src/components/layout/AppLayout.tsx`** (Line 22)

Keep `overflow-hidden` on this wrapper - this is correct. It prevents the whole-page scroll.

**File 2: `src/pages/Emotions.tsx`** (Line 402)

Change the content area from `overflow-hidden` to allow the columns to scroll independently:

| Line | Current | Fix |
|------|---------|-----|
| 402 | `overflow-hidden` | Remove `overflow-hidden` (keep other classes) |

```tsx
// Line 402 - Before
<div className="flex-1 px-6 lg:px-8 py-6 overflow-hidden">

// Line 402 - After  
<div className="flex-1 px-6 lg:px-8 py-6">
```

The columns (lines 405 and 503) already have `overflow-y-auto h-full`, which will now work since the parent isn't blocking overflow.

---

### Why This Works

**Before (broken):**
```text
Content wrapper: overflow-hidden → Blocks child overflow
└── Left column: overflow-y-auto → Ignored, parent blocks
└── Right column: overflow-y-auto → Ignored, parent blocks
```

**After (fixed):**
```text  
Content wrapper: (no overflow class) → Allows child overflow
└── Left column: overflow-y-auto h-full → Scrolls independently ✓
└── Right column: overflow-y-auto h-full → Scrolls independently ✓
```

The `h-full` on each column constrains them to available height, and `overflow-y-auto` enables their internal scrollbars.

---

### Additional Fix: Ensure Grid Has Full Height

The grid on line 403 should also pass height to children properly. Currently it has `h-full` which is correct.

---

### Summary

| File | Line | Change |
|------|------|--------|
| `src/pages/Emotions.tsx` | 402 | Remove `overflow-hidden` from the content wrapper |

This is a **single-line change** that unblocks the scroll chain.


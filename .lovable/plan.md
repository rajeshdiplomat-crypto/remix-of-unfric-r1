

# Implement Facebook-Style Scrolling Across All Multi-Column Pages

## Overview

This plan standardizes scrolling behavior across all pages with 2 or 3 column layouts, implementing a **Facebook-style structure** where:
- The page hero/header stays at the top
- Each column scrolls independently within a fixed container
- The main page body does NOT scroll - only individual panels do

## Pages Requiring Changes

| Page | Current Layout | Column Structure |
|------|----------------|------------------|
| **Manifest** | 3-column | Left (Realities) / Center (Practice) / Right (Progress+Calendar) |
| **Emotions** | 2-column | Left (Check-in + Dashboard) / Right (Calendar + Entries) |
| **Tasks** | 2-column | Left (All Tasks) / Right (Quadrant/Board) |
| **Journal** | 3-column | Left (Calendar) / Center (Editor) / Right (Details) |
| **Diary** | 2-column | Left (Feed) / Right (Sidebar) |
| **Trackers** | 3-column | Left (Month Card) / Center (Table) / Right (Practice Panel) |
| **Notes** | Single or Split | Overview or Editor split view |

---

## Implementation Details

### 1. **Manifest Page** (`src/pages/Manifest.tsx`)

**Current Structure:**
```
<div className="flex-1 grid gap-3 w-full px-2 sm:px-4 py-2 ...">
  <div className="hidden lg:flex flex-col h-full min-h-0"> <!-- Left -->
  <div className="flex flex-col min-w-0 min-h-0 gap-3"> <!-- Center -->
  <div className="hidden lg:flex flex-col ... h-full"> <!-- Right -->
</div>
```

**Changes:**
| Line | Component | Change |
|------|-----------|--------|
| ~451 | Grid container | Add `overflow-hidden` to prevent page scroll |
| ~590 | Center panel | Add `h-full overflow-y-auto` for independent scroll |

The left and right panels already have `h-full` - adding `overflow-hidden` to parent enables their scrolling.

---

### 2. **Emotions Page** (`src/pages/Emotions.tsx`)

**Current Structure (after recent changes):**
```
<div className="flex-1 px-6 lg:px-8 py-6 overflow-hidden">
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-full">
    <div className="flex flex-col gap-6 overflow-y-auto h-full"> <!-- Left -->
    <div className="flex flex-col gap-4 overflow-y-auto h-full"> <!-- Right -->
```

**Status:** ✅ Already updated with `h-full` and `overflow-y-auto` on both columns.

---

### 3. **Tasks Page** (`src/pages/Tasks.tsx`)

**Current Structure:**
```
<div className={`flex-1 grid grid-cols-1 ${gridCols} gap-8 min-h-0 min-w-0`}>
  <div className="min-h-0 min-w-0 h-[600px]"> <!-- Left: AllTasksList -->
  <div className="w-full min-w-0 h-[600px]"> <!-- Right: Quadrant/Board -->
</div>
```

**Current Behavior:** Uses fixed `h-[600px]` for both panels instead of filling remaining viewport.

**Changes:**
| Line | Component | Change |
|------|-----------|--------|
| ~428 | Main content wrapper | Change to `flex-1 overflow-hidden` |
| ~429 | Grid container | Add `h-full` |
| ~430 | Left panel | Change from `h-[600px]` to `h-full overflow-y-auto` |
| ~437 | Right panel | Change from `h-[600px]` to `h-full overflow-y-auto` |

---

### 4. **Journal Page** (`src/pages/Journal.tsx`)

**Current Structure:**
```
<div className={cn("flex-1 grid gap-6 w-full px-4 sm:px-6 py-4 ...")}>
  <div className="hidden lg:flex flex-col ... h-full"> <!-- Left: Calendar -->
  <div className="flex flex-col min-w-0"> <!-- Center: Editor -->
  <div className="hidden lg:block h-full"> <!-- Right: Details -->
</div>
```

**Changes:**
| Line | Component | Change |
|------|-----------|--------|
| ~741 | Grid container | Add `overflow-hidden h-full` |
| ~770 | Center panel | Add `h-full overflow-y-auto` |
| ~754 | Left panel | Add `overflow-y-auto` (already has `h-full`) |
| ~837 | Right panel | Add `overflow-y-auto` (already has `h-full`) |

---

### 5. **Diary Page** (`src/pages/Diary.tsx`)

**Current Structure:**
```
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 w-full px-6 lg:px-8 pt-6">
  <div className="min-w-0 overflow-hidden"> <!-- Left: Feed -->
    <ScrollArea className="flex-1 min-h-0">
  <aside className="hidden lg:flex flex-col h-full overflow-y-auto"> <!-- Right: Sidebar -->
</div>
```

**Changes:**
| Line | Component | Change |
|------|-----------|--------|
| ~402 | Grid container wrapper | Wrap with `flex-1 overflow-hidden`, add `h-full` to grid |
| ~404 | Left panel | Add `h-full overflow-y-auto`, remove internal `ScrollArea` wrapper approach |
| ~511 | Right panel | Already has `h-full overflow-y-auto` ✅ |

---

### 6. **Trackers Page** (`src/pages/Trackers.tsx`)

**Current Structure:**
```
<div className="px-4 py-4 space-y-4">
  <!-- Dashboard Content with cards -->
  <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_200px] gap-4">
    <!-- Month Card | Habits Table | Practice Panel -->
```

**Current Behavior:** Uses `space-y-4` with normal page scrolling. This page has a unique layout with a large horizontal table that needs horizontal scrolling.

**Changes:**
| Line | Component | Change |
|------|-----------|--------|
| ~1145 | Content container | Change to `flex-1 px-4 py-4 overflow-hidden flex flex-col` |
| ~1158 | Grid container | Add `flex-1 h-full overflow-hidden` |
| Left panel (Month Card) | Keep as-is (small, fixed height) |
| Center panel (Table) | Add `overflow-auto` for both horizontal and vertical scroll |
| Right panel (Practice) | Add `h-full overflow-y-auto` |

---

### 7. **Notes Page** (`src/pages/Notes.tsx`)

**Current Structure (Overview Mode):**
```
<div className="flex flex-col flex-1 p-6 pb-8 space-y-8 relative z-10 overflow-y-auto">
  <!-- Header, Stats, Groups -->
</div>
```

**Current Behavior:** Single-column overview with full-page scrolling. The Notes page uses a split view when editing which has its own scroll behavior.

**Changes for Overview Mode:**
The Notes overview is intentionally single-column and should scroll as one unit. No changes needed for Facebook-style since it doesn't have side-by-side panels in overview mode.

**Editor Mode (NotesSplitView):** Already handles split view scrolling internally.

---

## Summary of Changes by File

| File | Key Changes |
|------|-------------|
| `src/pages/Manifest.tsx` | Add `overflow-hidden` to grid, `h-full overflow-y-auto` to center panel |
| `src/pages/Emotions.tsx` | ✅ Already complete |
| `src/pages/Tasks.tsx` | Remove fixed `h-[600px]`, add `h-full overflow-y-auto` to both columns |
| `src/pages/Journal.tsx` | Add `overflow-hidden h-full` to grid, `overflow-y-auto` to all 3 columns |
| `src/pages/Diary.tsx` | Add `overflow-hidden` to container, `h-full` to left panel |
| `src/pages/Trackers.tsx` | Restructure to flex layout, add scroll containers to center/right panels |
| `src/pages/Notes.tsx` | No changes needed (single column overview) |

---

## Visual Result

After implementation, all multi-column pages will have this behavior:

```text
┌────────────────────────────────────────────────────────────┐
│                      Fixed Header                           │
├────────────────────────────────────────────────────────────┤
│                       Page Hero                             │
├─────────────────────┬───────────────────┬──────────────────┤
│   Left Panel        │   Center Panel    │   Right Panel    │
│   (scrolls ↕)       │   (scrolls ↕)     │   (scrolls ↕)    │
│   ┌─────────────┐   │   ┌───────────┐   │   ┌──────────┐   │
│   │             │   │   │           │   │   │          │   │
│   │  Content    │   │   │  Content  │   │   │ Content  │   │
│   │             │ ↕ │   │           │ ↕ │   │          │ ↕ │
│   │             │   │   │           │   │   │          │   │
│   └─────────────┘   │   └───────────┘   │   └──────────┘   │
└─────────────────────┴───────────────────┴──────────────────┘
              ↕                ↕                  ↕
         Independent      Independent        Independent
           Scroll           Scroll             Scroll
```

---

## Technical Notes

1. **Key CSS Pattern:**
   - Parent container: `flex-1 overflow-hidden` (prevents page scroll)
   - Grid: `h-full` (fills parent height)
   - Each column: `h-full overflow-y-auto` (independent scrolling)

2. **Mobile Behavior:**
   - On mobile (`grid-cols-1`), columns stack and each maintains its own scroll
   - May want to revisit for full-page scroll on mobile in future iteration

3. **Import Cleanup:**
   - Remove any unused `useRef`, `useCallback` imports related to height syncing logic


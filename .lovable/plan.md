
## Make Left and Right Panels Independently Scrollable

### Problem
Currently, the Emotions page uses a height-sync approach where the right column matches the left column's height. When content exceeds the viewport, the entire page scrolls. The user wants each column to scroll independently within a fixed viewport.

### Solution
Convert the layout to a fixed-height container that fills the available screen space below the hero, with each column having its own scroll container. This creates a "side-by-side panels" experience similar to email clients or Slack.

---

### Implementation

**File: `src/pages/Emotions.tsx`**

#### 1. Remove Height Sync Logic
- Delete the `leftColumnRef` and `rightColumnRef` refs
- Delete the `syncColumnHeights` callback function
- Delete the `useEffect` that syncs heights on resize

#### 2. Update Main Container to Fill Remaining Viewport
Change the main content wrapper from flexible height to fixed viewport height:

```tsx
{/* Main Content - Two Column Layout - Fixed Height */}
<div className="flex-1 px-6 lg:px-8 py-6 overflow-hidden">
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-full">
```

Key changes:
- Add `overflow-hidden` to prevent outer scrolling
- Add `h-full` to the grid so it fills the container

#### 3. Make Left Column Independently Scrollable
```tsx
{/* Left Column - Check-in row + Dashboards below */}
<div className="flex flex-col gap-6 overflow-y-auto">
```

- Remove `ref={leftColumnRef}`
- Add `overflow-y-auto` for independent scrolling

#### 4. Make Right Column Independently Scrollable
```tsx
{/* Right Column - Calendar & Recent Entries */}
<div className="flex flex-col gap-4 overflow-y-auto">
```

- Remove `ref={rightColumnRef}`
- Add `overflow-y-auto` for independent scrolling
- Calendar remains `shrink-0` (fixed height)
- RecentEntriesList wrapper can stay as `flex-1 min-h-0` since it's inside a scrollable container

---

### Visual Behavior After Changes

```text
┌─────────────────────────────────────────────────────────┐
│                      Page Hero                           │
├────────────────────────────────┬────────────────────────┤
│  Left Column (scrollable)      │  Right Column (scroll) │
│  ┌──────────┬──────────┐       │  ┌──────────────────┐  │
│  │ Check-in │ Strateg. │       │  │    Calendar      │  │
│  └──────────┴──────────┘       │  └──────────────────┘  │
│  ┌────────────────────┐        │  ┌──────────────────┐  │
│  │ Patterns Dashboard │        │  │  Recent Entries  │  │
│  │    (tabs: O|M|C)   │        │  │   (scrollable    │  │
│  │                    │  ↕     │  │    list)         │ ↕│
│  │                    │        │  │                  │  │
│  └────────────────────┘        │  └──────────────────┘  │
└────────────────────────────────┴────────────────────────┘
```

Each column scrolls independently within its fixed container.

---

### Technical Details

1. **Viewport Calculation**: The main content area uses `flex-1` within a `min-h-screen` parent, so it automatically fills remaining space below the hero

2. **Import Cleanup**: Remove unused `useRef` and `useCallback` imports since height sync logic is deleted

3. **RecentEntriesList**: Already has internal `overflow-y-auto` on its entries container, so it will work correctly within the scrollable right column

4. **Mobile Responsiveness**: On mobile (`grid-cols-1`), both columns stack vertically and each maintains its own scroll - this may need future refinement if the user prefers full-page scroll on mobile

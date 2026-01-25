

## Make Left and Right Panels Scroll Independently

### Problem
Looking at your screenshot, you want the two green-marked sections to scroll separately:
- **Left Panel**: Check-in card + Strategies + Patterns Dashboard
- **Right Panel**: Calendar + Recent Check-ins

Currently, although `overflow-y-auto` is applied to both columns, the columns don't have explicit height constraints, so the scroll doesn't activate properly - the whole page scrolls instead.

---

### Solution

**File: `src/pages/Emotions.tsx`**

Add `h-full` to both column containers so they respect the parent grid's height and enable independent scrolling:

#### Left Column (line 405)
```tsx
// Before
<div className="flex flex-col gap-6 overflow-y-auto">

// After
<div className="flex flex-col gap-6 overflow-y-auto h-full">
```

#### Right Column (line 503)
```tsx
// Before
<div className="flex flex-col gap-4 overflow-y-auto">

// After
<div className="flex flex-col gap-4 overflow-y-auto h-full">
```

---

### How It Works

```text
┌──────────────────────────────────────────────────────────────┐
│                        Page Hero                              │
├─────────────────────────────────┬────────────────────────────┤
│   Left Column (h-full + scroll) │  Right Column (h-full + ↕) │
│  ┌──────────────┬──────────────┐│  ┌────────────────────────┐│
│  │  Check-in    │  Strategies  ││  │      Calendar          ││
│  └──────────────┴──────────────┘│  └────────────────────────┘│
│  ┌─────────────────────────────┐│  ┌────────────────────────┐│
│  │                             ││  │                        ││
│  │   Patterns Dashboard        ││  │   Recent Check-ins     ││
│  │                             ↕│  │                        ↕│
│  │                             ││  │                        ││
│  └─────────────────────────────┘│  └────────────────────────┘│
└─────────────────────────────────┴────────────────────────────┘
```

Each column fills the available height and scrolls independently when content overflows.

---

### Technical Details

- The parent grid already has `h-full` which fills the `flex-1` container
- Adding `h-full` to each column ensures they respect this height constraint
- `overflow-y-auto` activates scrollbars when content exceeds the column height
- No JavaScript height syncing needed - pure CSS solution


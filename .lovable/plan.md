

# Plan: Luxurious Clock & Default Mode Selection

## Overview
Enhance the `TasksClockWidget` with a luxurious, larger clock face while keeping the same card dimensions. Also implement mode persistence so the user's preferred clock type is remembered.

---

## Part 1: KPI Clarification (No Changes Needed)

The current KPIs calculate:
- **Planned**: Tasks due today
- **Done**: Completed tasks due today  
- **Overdue**: All overdue tasks (any date)
- **Focus**: Total accumulated focus minutes across all tasks

---

## Part 2: Luxurious Clock Design

### Visual Enhancements
- **Larger clock face**: Increase from 96px to 140px (fills more vertical space)
- **Premium analog clock**:
  - Metallic gradient ring with subtle shadow
  - Refined hour markers (small circles at 12, 3, 6, 9; thin lines elsewhere)
  - Gold/rose-gold accent colors for hands
  - Elegant beveled center dot with glow
  - Optional Roman numerals for 12, 3, 6, 9 positions
- **Digital clock upgrade**:
  - Larger, more elegant typography
  - Subtle gradient text or glow effect
  - Refined date display

### File Changes
```text
src/components/tasks/TasksClockWidget.tsx
├── Increase analog clock size from w-24/h-24 to w-36/h-36
├── Add premium gradients and shadows to clock face
├── Refine hour/minute/second hands with thicker styling
├── Add subtle metallic ring around clock
└── Enhance digital display with larger fonts
```

---

## Part 3: Default Clock Mode Selection

### How User Selects Default
1. **Automatic persistence** (immediate): The widget remembers the last selected mode using `localStorage`
2. When user clicks Digital, Analog, Stopwatch, Timer, or Calendar—it becomes the new default on next visit

### Implementation
```text
src/components/tasks/TasksClockWidget.tsx
├── Add localStorage key: 'unfric-clock-widget-mode'
├── Initialize mode state from localStorage (fallback to "digital")
└── Save to localStorage whenever mode changes (useEffect)
```

### Code Pattern (from existing LuxuryClock)
```typescript
const STORAGE_KEY = 'unfric-clock-widget-mode';

const [mode, setMode] = useState<WidgetMode>(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored as WidgetMode) || 'digital';
});

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, mode);
}, [mode]);
```

---

## Technical Implementation Details

### TasksClockWidget.tsx Changes

1. **Add localStorage persistence** for mode selection
2. **Analog Clock Upgrade**:
   - Outer ring: `border-2` with gradient background
   - Hour markers: Small circles at cardinal positions, thin lines elsewhere
   - Hands: Thicker with rounded tips and subtle shadows
   - Center: Larger dot with primary color glow
   - Size: Increase from 96px to 140px

3. **Digital Clock Upgrade**:
   - Time: Increase from `text-4xl` to `text-5xl`
   - Add subtle text shadow or gradient

4. **Keep mode switcher** compact at top (no height change to card)

---

## Summary of Files to Edit

| File | Changes |
|------|---------|
| `src/components/tasks/TasksClockWidget.tsx` | Persist mode to localStorage, enlarge clock face, add luxury styling |

---

## User Experience Flow

```text
User opens Tasks page
       │
       ▼
Clock loads with last saved mode (or "digital" if first visit)
       │
       ▼
User clicks different mode (e.g., "Analog")
       │
       ▼
Mode saved to localStorage automatically
       │
       ▼
Next visit: Clock shows Analog by default
```


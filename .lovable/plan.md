

# Two-Column Split Layout for Context & Regulate Pages

## Reference Analysis

Based on the uploaded reference images, the layout should be:
- **Left half**: Interactive content (form/cards)  
- **Right half**: SaaS-style descriptive text (badge, title, description, features)

This matches the existing `EmotionsPageFeel` layout, but mirrored (Feel has text on left, wheel on right).

---

## Changes to EmotionsPageContext.tsx

### Current Layout
```text
[Full Width Header]
[Full Width Title]
[2-Column Form Grid spanning full width]
[Center Save Button]
```

### New Layout
```text
┌─────────────────────────────────────────────────────┐
│   Left Half (Form)      │   Right Half (Text)       │
│                         │                           │
│   Notes textarea        │   Badge: "Add Context"    │
│   Who are you with?     │   Title: "Capture the     │
│   What are you doing?   │          Moment"          │
│   Sleep last night      │   Description: ...        │
│   Physical activity     │   Features: ...           │
│   Journal toggle        │   Selected emotion badge  │
│                         │                           │
│   [Back] [Save] [Skip]  │                           │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

**1. Add descriptive content constant:**
```typescript
const CONTEXT_CONTENT = {
  badge: "Add Context",
  title: {
    line1: "Capture the",
    line2: "Moment"
  },
  description: "Understanding the context of your emotions helps identify patterns and triggers. This information builds your personal emotional intelligence over time.",
  features: [
    "Connect emotions to activities",
    "Track sleep and energy patterns",
    "Discover your emotional triggers"
  ]
};
```

**2. Restructure JSX to two-column grid:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 flex-1">
  {/* Left: Form Cards */}
  <div className="flex flex-col order-2 lg:order-1">
    {/* Notes, Who, What, Sleep, Activity, Journal Toggle */}
    {/* Back/Skip/Save buttons */}
  </div>
  
  {/* Right: Descriptive Text */}
  <div className="flex flex-col justify-center order-1 lg:order-2">
    {/* Badge, Title, Description, Features */}
    {/* Selected Emotion Badge */}
  </div>
</div>
```

**3. Move header buttons into form section** (Back at top, Save/Skip at bottom)

---

## Changes to EmotionsPageRegulate.tsx

### Current Layout
```text
[Centered Success Header with checkmark]
[Centered Emotion Badge]
[Recommended Strategies - 3 columns]
[All Strategies - 3 columns]
[Bottom Actions]
```

### New Layout
```text
┌─────────────────────────────────────────────────────┐
│   Left Half (Success)   │   Right Half (Text)       │
│                         │                           │
│   Checkmark animation   │   Badge: "Well Done"      │
│   "Check-in Complete"   │   Title: "Time to         │
│   Emotion badge         │          Regulate"        │
│                         │   Description: ...        │
│   [New Check-in]        │   Features: ...           │
│   [View Insights]       │                           │
└─────────────────────────────────────────────────────┘
[───────── Recommended Strategies (full width) ─────────]
[───────── All Strategies Grid (full width) ───────────]
```

### Implementation Details

**1. Add descriptive content constant:**
```typescript
const REGULATE_CONTENT = {
  badge: "Well Done",
  title: {
    line1: "Time to",
    line2: "Regulate"
  },
  description: "Great job tracking your emotion! Now explore strategies designed for your current emotional state to help you feel balanced and grounded.",
  features: [
    "Personalized recommendations",
    "Guided breathing exercises",
    "Quick mindfulness techniques"
  ]
};
```

**2. Split top section into two columns:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
  {/* Left: Success Animation & Emotion Badge */}
  <div className="flex flex-col items-center lg:items-start justify-center">
    {/* Checkmark, title, emotion badge, action buttons */}
  </div>
  
  {/* Right: Descriptive Text */}
  <div className="flex flex-col justify-center">
    {/* Badge, Title, Description, Features */}
  </div>
</div>

{/* Full Width: Strategies Sections */}
{/* Recommended Strategies */}
{/* All Strategies */}
```

---

## Mobile Responsiveness

Both pages will stack vertically on mobile (`lg:grid-cols-2` → `grid-cols-1`):
- Mobile: Text card on top, form/content below
- Desktop: Side-by-side split layout

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/emotions/EmotionsPageContext.tsx` | Two-column layout with descriptive text on right |
| `src/components/emotions/EmotionsPageRegulate.tsx` | Two-column hero section with descriptive text on right |

---

## Visual Consistency

This creates visual consistency across all Emotions pages:
- **Feel**: Text (left) + Wheel (right)
- **Context**: Form (left) + Text (right)  
- **Regulate**: Success (left) + Text (right) + Full-width strategies below


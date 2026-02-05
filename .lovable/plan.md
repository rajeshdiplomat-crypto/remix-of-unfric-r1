

# Emotions Wheel Enhancement: Quadrant-Based Highlighting & New Layout

## Overview

This plan addresses three key requirements:
1. **Quadrant-based emotion highlighting** - Only show emotions valid for the current slider position, fade/hide others
2. **Bigger wheel shifted right** - Increase wheel size and position it on the right side
3. **Remove calendar, add emotion description on left** - Replace sidebar with SaaS-style content card

---

## 1. Quadrant-Based Emotion Highlighting

### Current Behavior
All emotions on the wheel are always visible with similar opacity (0.7-1.0), regardless of slider position.

### New Behavior

**Logic:**
- Calculate current quadrant from energy + pleasantness values
- Only emotions belonging to the current quadrant are **fully visible and clickable**
- Emotions in other quadrants are **faded (opacity ~0.15)** and **not interactive**
- When an emotion is selected, it gets a **highlight ring/glow effect**

**Visual States:**
| State | Opacity | Interactivity | Visual |
|-------|---------|---------------|--------|
| Valid quadrant (not selected) | 1.0 | Clickable | Normal color |
| Valid quadrant (selected) | 1.0 | Clickable | Glow ring + scale up |
| Invalid quadrant | 0.15 | Not clickable | Faded, barely visible |

**Implementation in `EmotionCircularPicker.tsx`:**

```typescript
// Check if section belongs to current quadrant
const isSectionActive = (section) => section.quadrant === currentQuadrant;

// For wheel sections (SVG paths):
<path
  opacity={isSectionActive(section) ? (isSelected ? 1 : 0.85) : 0.12}
  className={cn(
    "transition-opacity duration-300",
    isSectionActive(section) ? "cursor-pointer" : "cursor-default pointer-events-none"
  )}
/>

// For text labels:
<button
  className={cn(
    isSectionActive(section) 
      ? "opacity-100 pointer-events-auto" 
      : "opacity-10 pointer-events-none"
  )}
/>
```

**Selected Emotion Highlight:**
When an emotion is selected, add a glowing border/ring around that wheel section:

```typescript
// Add glow filter for selected sections
{isSelected && (
  <path
    d={createArcPath(...)}
    fill="none"
    stroke="white"
    strokeWidth={3}
    className="animate-pulse"
    style={{ filter: 'drop-shadow(0 0 8px white)' }}
  />
)}
```

---

## 2. Bigger Wheel & Right-Positioned Layout

### New Layout Structure

Replace the current centered layout with a **two-column split**:

```text
+------------------------------------------------------------------+
|                                                                   |
| +---------------------------+   +-------------------------------+ |
| |                           |   |                               | |
| |   EMOTION DESCRIPTION     |   |        EMOTION WHEEL          | |
| |   (SaaS-style card)       |   |        (Bigger: 520px)        | |
| |                           |   |                               | |
| |   • Title                 |   |     [Wheel with sliders]      | |
| |   • Description           |   |                               | |
| |   • Features list         |   |                               | |
| |   • CTA button            |   |                               | |
| |                           |   |                               | |
| +---------------------------+   +-------------------------------+ |
|                                                                   |
+------------------------------------------------------------------+
```

### Wheel Size Changes

Current dimensions:
```typescript
const size = 420;
const outerRadius = 190;
const middleRadius = 140;
const innerRingRadius = 85;
const innerMostRadius = 55;
```

New dimensions (scaled up ~25%):
```typescript
const size = 520;
const outerRadius = 235;
const middleRadius = 175;
const innerRingRadius = 105;
const innerMostRadius = 70;
```

---

## 3. Left Side Content Card (Replacing Calendar)

### Design Reference
Based on the SaaS platform screenshot showing "Real-Time Analytics" style card.

### New Component Structure

**Left Content Card Layout:**
```text
+----------------------------------------+
|                                        |
|  [Pill Badge: Emotion Tracker]         |
|                                        |
|  "Understand Your                      |
|   Emotional Patterns"                  |
|   (Large title, part bold)             |
|                                        |
|  Detailed description text explaining  |
|  the 2D emotion model and benefits     |
|  of tracking emotional patterns.       |
|                                        |
|  • Energy axis: High to Low            |
|  • Pleasantness: Pleasant to Unpleasant|
|  • Quadrant insights                   |
|                                        |
|  [ Learn More → ]                      |
|                                        |
+----------------------------------------+
|                                        |
|  [Optional: Mini stats or tips]        |
|                                        |
+----------------------------------------+
```

### Content Copy:

```typescript
const EMOTION_CONTENT = {
  badge: "Emotion Tracker",
  title: {
    line1: "Understand Your",
    line2: "Emotional Patterns"  // Bold this part
  },
  description: `Track your emotional state using the energy and pleasantness 
dimensions. This science-backed approach helps you recognize patterns, 
understand triggers, and develop greater emotional intelligence over time.`,
  features: [
    "Map emotions on a 2D spectrum",
    "Identify your emotional patterns",
    "Get personalized regulation strategies"
  ],
  cta: "Learn More"
};
```

---

## Files to Modify

### 1. `EmotionCircularPicker.tsx`

**Changes:**
- Add prop for wheel size (configurable)
- Implement quadrant-based opacity/visibility logic
- Add selected emotion highlight glow
- Scale up default dimensions

**Key Code Changes:**
```typescript
interface EmotionCircularPickerProps {
  // ... existing props
  size?: number; // Allow configurable size
}

// Inside component:
const isSectionActive = useMemo(() => {
  return (section: typeof WHEEL_SECTIONS[0]) => 
    section.quadrant === currentQuadrant;
}, [currentQuadrant]);

// For each wheel section:
const sectionOpacity = isSectionActive(section) 
  ? (isSelected ? 1 : 0.85) 
  : 0.12;

const sectionInteractive = isSectionActive(section);
```

### 2. `EmotionsPageLayout.tsx`

**Changes:**
- Remove calendar sidebar completely
- Remove `showCalendar` prop
- Keep layout simple (just pass through children)

### 3. `EmotionsPageFeel.tsx`

**Changes:**
- Restructure to two-column layout (left: content, right: wheel)
- Add emotion description card on left side
- Pass larger size to circular picker
- Remove/relocate search bar

**New Layout Structure:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-300px)]">
  {/* Left: Emotion Description */}
  <div className="flex flex-col justify-center">
    <EmotionDescriptionCard />
  </div>
  
  {/* Right: Wheel */}
  <div className="flex flex-col items-center justify-center">
    <EmotionCircularPicker size={520} ... />
    {/* Continue button below */}
  </div>
</div>
```

---

## Technical Implementation Details

### Quadrant Detection Logic

```typescript
// Already exists - maps energy/pleasantness to quadrant
const currentQuadrant: QuadrantType = useMemo(() => {
  if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
  if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
  if (energy < 50 && pleasantness < 50) return "low-unpleasant";
  return "low-pleasant";
}, [energy, pleasantness]);
```

### Wheel Section Visibility

```typescript
// For each WHEEL_SECTION, check if it matches current quadrant
WHEEL_SECTIONS.map((section) => {
  const isActive = section.quadrant === currentQuadrant;
  const isSelected = selectedEmotion && 
    (section.core === selectedEmotion || 
     section.emotions.includes(selectedEmotion));
  
  return (
    <g 
      key={section.core}
      className={cn(
        "transition-all duration-300",
        !isActive && "pointer-events-none"
      )}
    >
      {/* SVG paths with conditional opacity */}
      <path opacity={isActive ? 0.85 : 0.1} ... />
      
      {/* Highlight ring when selected */}
      {isSelected && isActive && (
        <path 
          stroke="white" 
          strokeWidth={2}
          style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }}
        />
      )}
    </g>
  );
});
```

### Selected Emotion Highlight Effect

```typescript
// Add a glowing outline for selected section
{isEmotionSelected && (
  <div
    className="absolute rounded-full animate-pulse"
    style={{
      left: pos.x - 30,
      top: pos.y - 15,
      width: 60,
      height: 30,
      background: 'transparent',
      border: `2px solid ${section.color}`,
      boxShadow: `0 0 15px ${section.color}, 0 0 30px ${section.color}50`,
    }}
  />
)}
```

### Left Content Card Component

```tsx
function EmotionDescriptionCard() {
  return (
    <div className="space-y-6">
      {/* Badge */}
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        Emotion Tracker
      </span>
      
      {/* Title */}
      <h2 className="text-3xl md:text-4xl font-light leading-tight">
        Understand Your{" "}
        <span className="font-semibold">Emotional Patterns</span>
      </h2>
      
      {/* Description */}
      <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
        Track your emotional state using the energy and pleasantness dimensions. 
        This science-backed approach helps you recognize patterns, understand triggers, 
        and develop greater emotional intelligence.
      </p>
      
      {/* Features */}
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-muted-foreground">
            <Check className="h-5 w-5 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      
      {/* CTA */}
      <Button variant="outline" className="gap-2">
        Learn More
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

---

## Responsive Behavior

### Desktop (>1024px)
- Two-column layout: Left content (40%) | Right wheel (60%)
- Wheel size: 520px

### Tablet (768-1024px)
- Stacked layout: Content on top, wheel below
- Wheel size: 420px

### Mobile (<768px)
- Single column stacked
- Wheel size: 340px
- Content card simplified

---

## Animation Enhancements

### Quadrant Transition
When sliders move and quadrant changes:
- Fade out inactive sections (300ms ease-out)
- Fade in active sections (300ms ease-in)
- Smooth color transition

### Selection Highlight
When emotion is selected:
- Scale up selected section slightly (1.02)
- Add pulsing glow effect
- Bounce animation on the selected label

---

## Implementation Order

1. **Phase 1**: Update `EmotionsPageLayout.tsx` - Remove calendar, simplify layout
2. **Phase 2**: Update `EmotionCircularPicker.tsx` - Add quadrant visibility logic, size prop, selection highlight
3. **Phase 3**: Update `EmotionsPageFeel.tsx` - Two-column layout with content card on left, wheel on right
4. **Phase 4**: Polish animations and responsive behavior


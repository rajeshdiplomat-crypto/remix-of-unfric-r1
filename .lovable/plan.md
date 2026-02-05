

# Emotions Module Redesign: Circular Sliders & Enhanced Layout

## Overview
This plan addresses three key areas based on the user's requirements:
1. **Circular emotion picker sliders** (replacing horizontal sliders) with layered emotion word selection
2. **Enhanced left sidebar** with emotional context/description content (like the SaaS platform reference)
3. **Classy, well-aligned navigation buttons** at the top

---

## 1. Circular Emotion Picker Design

### Concept
Replace the current horizontal Energy and Pleasantness sliders with **two concentric circular sliders**:

```text
         +------------------------+
         |                        |
         |    +----------------+  |
         |    |   INNER RING   |  |
         |    |  (Pleasantness)|  |
         |    |                |  |
         |    +---OUTER RING---+  |
         |      (Energy)          |
         |                        |
         |   EMOTION WORDS LAYER  |
         |  (appears above rings) |
         |                        |
         +------------------------+
```

### Technical Implementation

**New Component: `EmotionCircularPicker.tsx`**
- Two SVG-based circular sliders (concentric rings)
- Outer ring: Energy (0-100)
- Inner ring: Pleasantness (0-100)
- Draggable thumb handles on each ring
- Color gradients based on position (amber for energy, emerald for pleasantness)

**Layer System (3 layers):**
1. **Layer 1 - Circular Sliders**: Two concentric rings with draggable thumbs
2. **Layer 2 - Emotion Categories**: 6 category bubbles appear ABOVE the rings based on slider position (Joy, Peace, Tension, Sadness, Energy, Fear)
3. **Layer 3 - Specific Emotions**: When category is selected, specific emotion words appear in a circular/arc pattern above

**Slider-to-Emotion Sync Logic:**
```typescript
// Calculate quadrant from ring positions
const getQuadrant = (energy: number, pleasantness: number): QuadrantType => {
  if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
  if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
  if (energy < 50 && pleasantness < 50) return "low-unpleasant";
  return "low-pleasant";
};

// Category bubbles highlight based on proximity to slider values
// When category selected → expand emotion word pills in arc above rings
```

**Animation Flow:**
1. User drags outer ring → Energy value changes → Nearby category bubbles scale up
2. User drags inner ring → Pleasantness value changes → Quadrant shifts → Bubble highlights change
3. User taps category bubble → Sliders animate to category center → Emotion words appear in circular arc above
4. User selects emotion word → Word highlights → Continue button activates

---

## 2. Left Sidebar Enhancement

### Current State
The left sidebar shows only a calendar with mood legend. User wants descriptive content similar to the "Real-Time Analytics" section in the reference image.

### New Design

Replace/enhance the left sidebar with an **Emotion Information Card**:

```text
+-----------------------------------+
|  [Icon]  Emotion Check-in         |
|  ─────────────────────────────    |
|                                   |
|  "Understanding your emotions     |
|   helps you navigate life with    |
|   greater clarity and intention." |
|                                   |
|  Track how you feel across the    |
|  energy and pleasantness spectrum.|
|  Your patterns reveal insights    |
|  about what influences your mood. |
|                                   |
|  [ Start Check-in ]               |
|                                   |
+-----------------------------------+
|                                   |
|  📅 February 2026                 |
|  [Calendar grid...]               |
|                                   |
|  MOOD LEGEND                      |
|  ● High Energy, Pleasant          |
|  ● High Energy, Unpleasant        |
|  ● Low Energy, Unpleasant         |
|  ● Low Energy, Pleasant           |
+-----------------------------------+
```

### Content Sections
1. **Header**: Icon + "Emotion Check-in" title
2. **Inspirational Quote**: Rotating quotes about emotional awareness
3. **Description**: Brief explanation of the 2D emotion model
4. **CTA Button**: "Start Check-in" (scrolls to/focuses picker)
5. **Calendar**: Existing calendar (below the info card)

---

## 3. Navigation Bar Enhancement

### Current Issues
- Buttons are cramped and not well-aligned
- Gap between left nav pills and right quick actions
- Not spanning full width elegantly

### New Design

```text
+---------------------------------------------------------------------------------+
|  ❤️ FEEL      ✨ CONTEXT      🎯 REGULATE      📊 INSIGHTS    |    👥    📅    |
+---------------------------------------------------------------------------------+
```

**Styling Changes:**
- **Full-width container** with `justify-between` for main groups
- **Larger pill buttons** with more padding (h-12, px-6)
- **Gradient background** for active state (not flat primary color)
- **Equal spacing** between navigation items using `flex-1` or `space-x-4`
- **Icons always visible** (not hidden on mobile)
- **Subtle separator line** between main nav and quick actions
- **Labels in ALL CAPS** with letter-spacing for luxury feel

**Enhanced Styling:**
```css
/* Active state */
.nav-pill-active {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8));
  box-shadow: 0 4px 12px hsl(var(--primary)/0.3);
}

/* Hover state */
.nav-pill:hover {
  background: hsl(var(--muted)/0.8);
  transform: translateY(-1px);
}
```

---

## Files to Modify

### New Files
| File | Purpose |
|------|---------|
| `src/components/emotions/EmotionCircularPicker.tsx` | Dual concentric ring slider with 3-layer emotion selection |

### Files to Update
| File | Changes |
|------|---------|
| `src/components/emotions/EmotionsPageFeel.tsx` | Replace horizontal sliders with `EmotionCircularPicker`, update layout |
| `src/components/emotions/EmotionsPageLayout.tsx` | Add emotion info card to left sidebar above calendar |
| `src/components/emotions/EmotionsNavigation.tsx` | Restyle navigation pills for full-width, classy alignment |

---

## Technical Details

### EmotionCircularPicker Component

**Props:**
```typescript
interface EmotionCircularPickerProps {
  energy: number;
  pleasantness: number;
  selectedCategory: string | null;
  selectedEmotion: string | null;
  onEnergyChange: (value: number) => void;
  onPleasantnessChange: (value: number) => void;
  onCategorySelect: (category: string, quadrant: QuadrantType) => void;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
}
```

**Implementation:**
- SVG-based circular rings with `stroke-dasharray` for track styling
- Touch/mouse drag handlers for thumb movement
- `Math.atan2` calculations for angle-to-value conversion
- CSS `transform: rotate()` for thumb positioning
- Category bubbles positioned using CSS `transform: translate()` with polar coordinates

**Circular Slider Math:**
```typescript
// Convert angle to value (0-100)
const angleToValue = (angle: number): number => {
  // Normalize angle from -PI to PI → 0 to 100
  const normalized = ((angle + Math.PI) / (2 * Math.PI)) * 100;
  return Math.round(normalized);
};

// Convert value to angle for thumb position
const valueToAngle = (value: number): number => {
  return ((value / 100) * 2 * Math.PI) - Math.PI;
};

// Get position on ring
const getThumbPosition = (value: number, radius: number) => {
  const angle = valueToAngle(value);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
};
```

### Left Sidebar Info Card

**Content Configuration:**
```typescript
const EMOTION_INFO = {
  title: "Emotion Check-in",
  tagline: "Clarity Through Awareness",
  quote: "Understanding your emotions helps you navigate life with greater intention.",
  description: "Track how you feel across the energy and pleasantness spectrum. Your patterns reveal insights about what influences your mood.",
  ctaText: "Start Check-in"
};
```

### Navigation Styling

**Layout Structure:**
```tsx
<nav className="flex items-center justify-between w-full px-6 py-3">
  {/* Main Nav Pills - Stretched */}
  <div className="flex items-center gap-2 flex-1 max-w-2xl">
    {navItems.map(item => (
      <Button className="flex-1 h-12 uppercase tracking-wider text-xs font-semibold">
        <Icon /> {item.label}
      </Button>
    ))}
  </div>
  
  {/* Separator */}
  <div className="w-px h-8 bg-border/50 mx-4" />
  
  {/* Quick Actions */}
  <div className="flex items-center gap-2">
    <Button size="icon" className="h-10 w-10" />
    <Button size="icon" className="h-10 w-10" />
  </div>
</nav>
```

---

## Implementation Order

1. **Phase 1**: Create `EmotionCircularPicker.tsx` with dual ring sliders
2. **Phase 2**: Add layer system for category bubbles and emotion words
3. **Phase 3**: Integrate circular picker into `EmotionsPageFeel.tsx`
4. **Phase 4**: Enhance left sidebar in `EmotionsPageLayout.tsx` with info card
5. **Phase 5**: Restyle `EmotionsNavigation.tsx` for full-width classy alignment
6. **Phase 6**: Polish animations and transitions

---

## Expected Visual Result

```text
+-----------------------------------------------------------------------------------+
|  ❤️ FEEL         ✨ CONTEXT         🎯 REGULATE         📊 INSIGHTS  |  👥   📅  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
| +------------------+   +-----------------------------------------------+          |
| | Emotion Check-in |   |                                               |          |
| | "Clarity Through |   |              +-----------+                    |          |
| | Awareness"       |   |          +---|  JOY  |---+                    |          |
| |                  |   |      PEACE   +-----------+  TENSION           |          |
| | Track how you    |   |          +-------( )-------+                  |          |
| | feel across the  |   |          |   +---------+   |                  |          |
| | energy spectrum. |   |          |   | Inner   |   |  ← Pleasantness  |          |
| |                  |   |          |   | Ring    |   |                  |          |
| | [Start Check-in] |   |          |   +---------+   |                  |          |
| +------------------+   |          +-------( )-------+  ← Energy        |          |
| |                  |   |      SADNESS +---+---+ FEAR                   |          |
| | 📅 February 2026 |   |              |ENERGY|                         |          |
| | [Calendar grid]  |   |              +-------+                        |          |
| |                  |   |                                               |          |
| | MOOD LEGEND      |   |     [Excited] [Joyful] [Inspired] [Thrilled]  |          |
| | ● High Pleasant  |   |              ↑ Emotion words layer            |          |
| | ● High Unpleasant|   |                                               |          |
| | ● Low Unpleasant |   |                      [ Continue → ]           |          |
| | ● Low Pleasant   |   +-----------------------------------------------+          |
+------------------+                                                                |
+-----------------------------------------------------------------------------------+
```


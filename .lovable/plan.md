

# Emotions Module Redesign: Spacious, Airy & Luxurious

## Design Philosophy

The redesigned Emotions module embraces a **luxurious spa-like aesthetic** with generous white space, naturally-fitting typography, and a calm, airy atmosphere. Each page will breathe, with content centered and comfortable margins that make the experience feel premium.

---

## New 4-Page Architecture

### Current Structure (3 views + popups):
- Checkin (combined sliders, bubbles, context, completion)
- Analytics (full page)
- Strategies (full page)
- Calendar (popup)
- Recent Entries (popup)

### New Structure (4 dedicated pages):

```text
Page 1: FEEL         - Emotion sliders + emotion picking
Page 2: CONTEXT      - Context selection (who, what, sleep, activity)  
Page 3: REGULATE     - Regulation strategies (after save)
Page 4: INSIGHTS     - All dashboards & patterns
```

With **Calendar as a persistent sidebar** (left or right, collapsible)

---

## Page Layouts

### Global Layout Container
```text
+------------------------------------------------------------------+
|  [Hero - reduced 20%]                                            |
+------------------------------------------------------------------+
|  [Nav Pills: Feel | Context | Regulate | Insights]   [Calendar]  |
+------------------------------------------------------------------+
|                                                                   |
|  +-----+    +----------------------------------------+   +-----+ |
|  |     |    |                                        |   |     | |
|  | CAL |    |         MAIN CONTENT AREA              |   |     | |
|  | END |    |         (80% max-width)                |   |     | |
|  | AR  |    |         Centered, generous padding     |   |     | |
|  |     |    |                                        |   |     | |
|  +-----+    +----------------------------------------+   +-----+ |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Page 1: FEEL (Emotion Selection)

**Purpose**: Select emotion using sliders and emotion bubbles

**Layout**: 
- Centered content with max-width 800px
- Large typography: "How are you feeling?" in 40px light weight
- Generous vertical spacing between sections

```text
+------------------------------------------------------------------+
|                                                                   |
|                    "How are you feeling?"                         |
|                    (40px, font-light, centered)                   |
|                                                                   |
|        +-------------------------------------------+              |
|        |                                           |              |
|        |   ENERGY SLIDER (full width, subtle)      |              |
|        |                                           |              |
|        +-------------------------------------------+              |
|                                                                   |
|        +-------------------------------------------+              |
|        |                                           |              |
|        |   PLEASANTNESS SLIDER (full width)        |              |
|        |                                           |              |
|        +-------------------------------------------+              |
|                                                                   |
|                                                                   |
|     [Joy]    [Peace]    [Tension]    [Sadness]    [Fear]         |
|     (floating bubbles with generous spacing)                      |
|                                                                   |
|        +-------------------------------------------+              |
|        |   Emotion Pills Grid (when category selected)  |         |
|        |   [Excited] [Joyful] [Inspired] [Thrilled]     |         |
|        +-------------------------------------------+              |
|                                                                   |
|                                                                   |
|                    [ Continue → ]                                 |
|                    (centered, prominent CTA)                      |
|                                                                   |
+------------------------------------------------------------------+
```

**Styling**:
- Sliders: Minimal track (2px height), large thumb (28px)
- Bubbles: Orbit in gentle arc, 70-90px size
- Emotion pills: Glassmorphism with hover lift
- Continue button: Gradient with glow, 180px wide centered

---

## Page 2: CONTEXT (Context Selection)

**Purpose**: Add optional context after emotion selection

**Layout**:
- Display selected emotion at top with subtle badge
- Grid of context cards with pill selectors
- Full width note area

```text
+------------------------------------------------------------------+
|                                                                   |
|     ← Back              [😊 Excited]            Skip →            |
|                         High Energy                               |
|                                                                   |
|           "Tell us more about this moment"                        |
|           (24px, font-light, muted)                               |
|                                                                   |
|  +------------------------------+   +----------------------------+|
|  |  📝 Notes                    |   |  👥 Who are you with?      ||
|  |  [Large textarea            ]|   |  (Alone) (Friend) (Family) ||
|  |  [                          ]|   |  (Partner) (Team)          ||
|  +------------------------------+   +----------------------------+|
|                                                                   |
|  +------------------------------+   +----------------------------+|
|  |  🏃 What are you doing?      |   |  😴 Sleep last night       ||
|  |  (Work) (Eating) (Resting)   |   |  (<4hrs) (4-6) (6-8) (>8)  ||
|  +------------------------------+   +----------------------------+|
|                                                                   |
|  +------------------------------+   +----------------------------+|
|  |  💪 Physical Activity        |   |  📓 Send to Journal        ||
|  |  (None) (Walk) (Gym) (Yoga)  |   |  [Toggle switch]           ||
|  +------------------------------+   +----------------------------+|
|                                                                   |
|                                                                   |
|                    [ Save Check-in ✓ ]                            |
|                    (centered, gradient button)                    |
|                                                                   |
+------------------------------------------------------------------+
```

**Styling**:
- Context cards: Subtle borders, generous padding (24px)
- Pills: Large touch targets (44px height), rounded-full
- Selected pills: Gradient background with shadow
- 2-column grid on desktop, 1-column on mobile

---

## Page 3: REGULATE (Strategies)

**Purpose**: Post-save regulation strategies tailored to quadrant

**Layout**:
- Celebration moment with confetti
- Recommended strategies prominently displayed
- All strategies grid below

```text
+------------------------------------------------------------------+
|                                                                   |
|                         ✓                                         |
|                    (animated checkmark)                           |
|                                                                   |
|                "Check-in Complete"                                |
|                Feeling: Excited                                   |
|                                                                   |
|                                                                   |
|     ━━━━━━━━━━━ RECOMMENDED FOR YOU ━━━━━━━━━━━━━━               |
|                                                                   |
|  +-------------------+  +-------------------+  +----------------+ |
|  |  🌬️ Box Breathing |  |  🧘 Body Scan     |  |  ✨ Savoring   | |
|  |  2-3 min          |  |  5 min            |  |  2-3 min       | |
|  |  [Start]          |  |  [Start]          |  |  [Start]       | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                   |
|                                                                   |
|     ━━━━━━━━━━━━━━ ALL STRATEGIES ━━━━━━━━━━━━━━━━━━             |
|                                                                   |
|  [Breathing] [Grounding] [Cognitive] [Movement] [Mindfulness]    |
|                                                                   |
|  +------+  +------+  +------+  +------+  +------+  +------+      |
|  | Card |  | Card |  | Card |  | Card |  | Card |  | Card |      |
|  +------+  +------+  +------+  +------+  +------+  +------+      |
|                                                                   |
|                    [ New Check-in ]                               |
|                                                                   |
+------------------------------------------------------------------+
```

**Styling**:
- Strategy cards: Large (280px width), glass background
- Hover: 3D tilt effect, shadow elevation
- Filter pills: Pill-style with gradient active state

---

## Page 4: INSIGHTS (Dashboard)

**Purpose**: All analytics, patterns, and history

**Layout**:
- Summary stats at top
- Tabbed interface for different views
- Charts and insights

```text
+------------------------------------------------------------------+
|                                                                   |
|                    "Your Patterns"                                |
|                    (32px, font-light)                             |
|                                                                   |
|  +----------+  +----------+  +----------+  +----------+           |
|  | 24       |  | 7 days   |  | Happy    |  | Excited  |          |
|  | check-ins|  | streak   |  | zone     |  | top feel |          |
|  +----------+  +----------+  +----------+  +----------+           |
|                                                                   |
|  [Overview]  [Moods]  [Context]  [History]                        |
|  ─────────────────────────────────────────                        |
|                                                                   |
|  +----------------------------------------------------------+    |
|  |                                                          |    |
|  |              CHARTS & VISUALIZATIONS                     |    |
|  |              (Mood distribution, time patterns,          |    |
|  |               context insights)                          |    |
|  |                                                          |    |
|  +----------------------------------------------------------+    |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Calendar Sidebar

**Position**: Left side, collapsible
**Width**: 280px expanded, 48px collapsed (icon only)

```text
+--------+
| 📅 Feb |  ← Collapse toggle
|--------|
| Su Mo..|
|  1  2 3|  ← Color-coded by dominant quadrant
|  4  5 6|
| ...    |
|--------|
| Legend |
| ● Joy  |
| ● Calm |
+--------+
```

**Features**:
- Sticky position alongside main content
- Click date to view entries for that day
- Smooth collapse/expand animation
- Mobile: Bottom sheet or hidden with toggle

---

## Typography & Spacing

### Font Sizes (naturally fitting)
| Element | Size | Weight |
|---------|------|--------|
| Page titles | 40px | 200 (thin) |
| Section headers | 24px | 300 (light) |
| Body text | 16px | 400 (normal) |
| Labels | 12px | 500 (medium) |
| Buttons | 14px | 600 (semibold) |

### Spacing Scale
| Use | Value |
|-----|-------|
| Section gap | 64px |
| Card padding | 32px |
| Element gap | 16px |
| Inline gap | 8px |

---

## Animation System

### Page Transitions
- Fade + slide from direction of navigation
- Duration: 400ms ease-out

### Micro-interactions
- Button hover: Scale 1.02, shadow lift
- Pill selection: Scale 0.95 → 1.0 bounce
- Bubble proximity: Smooth scale interpolation
- Slider thumb: Glow pulse on drag

### Celebration (Page 3)
- Confetti burst from center
- Checkmark draw animation (SVG path)
- Strategy cards stagger in from bottom

---

## Files to Modify

### New Files to Create
| File | Purpose |
|------|---------|
| `EmotionsPageFeel.tsx` | Page 1: Emotion selection |
| `EmotionsPageContext.tsx` | Page 2: Context input |
| `EmotionsPageRegulate.tsx` | Page 3: Strategies after save |
| `EmotionsPageInsights.tsx` | Page 4: Dashboard |
| `EmotionsCalendarPanel.tsx` | Collapsible calendar sidebar |
| `EmotionsPageLayout.tsx` | Shared layout wrapper |

### Files to Update
| File | Changes |
|------|---------|
| `Emotions.tsx` | New 4-page routing, calendar sidebar integration |
| `EmotionsQuickActionsV2.tsx` | 4-tab navigation (Feel, Context, Regulate, Insights) |
| `EmotionBubbleViz.tsx` | Larger bubbles, more spacing, smoother animations |
| `EmotionSliderPicker.tsx` | Minimal track, larger thumb, better slider sync |

### Files to Remove (consolidated)
| File | Reason |
|------|--------|
| `EmotionCheckinFlowV2.tsx` | Split into 3 separate page components |
| `EmotionsStrategiesPageV2.tsx` | Replaced by `EmotionsPageRegulate.tsx` |
| `EmotionsAnalyticsPageV2.tsx` | Replaced by `EmotionsPageInsights.tsx` |

---

## State Management

### Page Flow State
```typescript
type EmotionPageState = {
  currentPage: 'feel' | 'context' | 'regulate' | 'insights';
  
  // Selection state (persisted across pages)
  energy: number;
  pleasantness: number;
  selectedQuadrant: QuadrantType | null;
  selectedEmotion: string | null;
  
  // Context state
  note: string;
  context: { who?; what?; sleep?; activity? };
  sendToJournal: boolean;
  
  // UI state
  calendarExpanded: boolean;
  calendarSelectedDate: string | null;
};
```

### Navigation Flow
```text
Feel → Context → Regulate (after save) ←→ Insights
         ↑___________________________↗
         (can jump to Insights anytime)
```

---

## Responsive Behavior

### Desktop (>1024px)
- Calendar sidebar visible by default
- 2-column context grid
- Large bubbles (90px)

### Tablet (768-1024px)
- Calendar collapsed by default
- 2-column context grid
- Medium bubbles (70px)

### Mobile (<768px)
- Calendar as bottom sheet
- 1-column layout
- Smaller bubbles (60px)
- Full-width sliders

---

## Implementation Order

1. **Phase 1**: Create `EmotionsPageLayout.tsx` with calendar sidebar
2. **Phase 2**: Build `EmotionsPageFeel.tsx` with spacious slider/bubble design
3. **Phase 3**: Build `EmotionsPageContext.tsx` with card grid layout
4. **Phase 4**: Build `EmotionsPageRegulate.tsx` with celebration + strategies
5. **Phase 5**: Build `EmotionsPageInsights.tsx` from existing analytics
6. **Phase 6**: Update `Emotions.tsx` to orchestrate all pages
7. **Phase 7**: Polish animations and transitions


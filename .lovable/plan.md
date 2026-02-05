

# Navigation Buttons Redesign: Repositioning & Cleanup

## Overview

This plan addresses three requirements:
1. Remove the "Context" navigation button
2. Reposition filter buttons to the bottom of the hero section (like in the reference image)
3. Make button sizes appropriate and well-aligned to screen width

---

## Reference Analysis

The reference image shows:
- Navigation pills positioned at the **bottom edge of the hero area**
- Clean pill-style buttons in a single container with rounded corners
- Buttons are evenly spaced and appropriately sized
- Quick action icons (comments, profile) positioned to the right
- Overall layout spans most of the width with generous padding

---

## Changes Required

### 1. Remove Context Button

Remove "context" from navigation items:

**Before:**
```typescript
const navItems = [
  { id: "feel", label: "Feel", icon: Heart },
  { id: "context", label: "Context", icon: Sparkles },  // REMOVE
  { id: "regulate", label: "Regulate", icon: Target },
  { id: "insights", label: "Insights", icon: BarChart3 },
];
```

**After:**
```typescript
const navItems = [
  { id: "feel", label: "Feel", icon: Heart },
  { id: "regulate", label: "Regulate", icon: Target },
  { id: "insights", label: "Insights", icon: BarChart3 },
];
```

Also update the `EmotionsView` type to remove "context" option.

### 2. Reposition Navigation to Bottom of Hero

**Current Layout:**
```text
+------------------------------------------+
|  HERO SECTION                            |
+------------------------------------------+
|  [NAVIGATION BAR - sticky below hero]    |
+------------------------------------------+
|  CONTENT                                 |
+------------------------------------------+
```

**New Layout (matching reference):**
```text
+------------------------------------------+
|  HERO SECTION                            |
|                                          |
|  [FEEL] [REGULATE] [INSIGHTS]   [📅][👥] |  ← Bottom of hero
+------------------------------------------+
|  CONTENT                                 |
+------------------------------------------+
```

Move the navigation component INTO the PageHero component or position it absolutely at the bottom of the hero.

### 3. Button Sizing & Styling

Based on reference image:

| Element | Current | New |
|---------|---------|-----|
| Button height | h-12 | h-9 or h-10 |
| Button padding | px-4 lg:px-6 | px-5 |
| Font size | text-xs | text-sm |
| Container | rounded-2xl | rounded-full |
| Background | bg-muted/50 | bg-background/60 backdrop-blur |
| Active style | gradient | solid background |

**New Button Styling:**
```typescript
// Container
"flex items-center gap-1 px-2 py-1.5 bg-background/60 backdrop-blur-lg rounded-full border border-border/30"

// Button (inactive)
"h-9 px-5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-all"

// Button (active)
"h-9 px-5 rounded-full text-sm font-medium bg-muted text-foreground"
```

---

## Implementation Details

### File: `EmotionsNavigation.tsx`

**Changes:**
1. Remove "context" from navItems array
2. Update EmotionsView type to `"feel" | "regulate" | "insights"`
3. Remove `canNavigate.context` from props interface
4. Update button styling for cleaner, more proportional look
5. Make icons always visible (not hidden on mobile)

**New Component Structure:**
```tsx
export type EmotionsView = "feel" | "regulate" | "insights";

interface EmotionsNavigationProps {
  activeView: EmotionsView;
  canNavigate: {
    regulate: boolean;  // context removed
  };
  onViewChange: (view: EmotionsView) => void;
  onOpenRecentEntries: () => void;
  onOpenCalendar: () => void;
}

// Navigation items - Context removed
const navItems = [
  { id: "feel" as const, label: "Feel", icon: Heart, enabled: true },
  { id: "regulate" as const, label: "Regulate", icon: Target, enabled: canNavigate.regulate },
  { id: "insights" as const, label: "Insights", icon: BarChart3, enabled: true },
];
```

### File: `Emotions.tsx`

**Changes:**
1. Update the navigation position - move it into/below the PageHero section with absolute positioning
2. Remove any "context" view logic if directly navigating there
3. Update flow: Feel → (auto-save or skip context) → Regulate → Insights
4. Adjust layout to have navigation at bottom of hero area

**New Layout Structure:**
```tsx
<div className="relative">
  {/* Page Hero */}
  <PageHero ... />
  
  {/* Navigation - positioned at bottom of hero */}
  <div className="absolute bottom-4 left-0 right-0 z-20 px-4 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <EmotionsNavigation ... />
    </div>
  </div>
</div>
```

### Flow Update (Context Removal)

Since Context button is removed, the flow needs adjustment:
- **Feel page**: After selecting emotion, "Continue" goes directly to save and then Regulate
- **Context fields**: Could be integrated into Feel page as an optional section, or removed entirely

---

## Visual Comparison

**Current:**
```text
+----------------------------------------------------------+
| [❤️ FEEL] [✨ CONTEXT] [🎯 REGULATE] [📊 INSIGHTS] | [👥][📅] |
+----------------------------------------------------------+
```

**New (matching reference):**
```text
+----------------------------------------------------+
|  [Feel]  [Regulate]  [Insights]           [📅] [👥] |
+----------------------------------------------------+
```

- Cleaner, smaller buttons
- No Context button
- Pill-style container with subtle background
- Positioned at bottom edge of hero

---

## Files to Modify

| File | Changes |
|------|---------|
| `EmotionsNavigation.tsx` | Remove Context button, update types, restyle buttons |
| `Emotions.tsx` | Reposition navigation to bottom of hero, update flow logic, remove context-related navigation |

---

## Technical Details

### Button Styling (Reference-Matching)

```tsx
// Container styling
<div className="flex items-center justify-between gap-4 w-full">
  {/* Main Navigation Pills */}
  <div className="flex items-center gap-1 p-1.5 bg-background/70 backdrop-blur-xl rounded-full border border-border/40 shadow-lg">
    {navItems.map((item) => (
      <Button
        key={item.id}
        variant="ghost"
        onClick={() => onViewChange(item.id)}
        disabled={!item.enabled}
        className={cn(
          "h-9 px-5 rounded-full transition-all duration-200 text-sm font-medium",
          isActive
            ? "bg-muted text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          !item.enabled && "opacity-40 cursor-not-allowed"
        )}
      >
        {item.label}
      </Button>
    ))}
  </div>
  
  {/* Quick Actions */}
  <div className="flex items-center gap-1 p-1.5 bg-background/70 backdrop-blur-xl rounded-full border border-border/40">
    <Button size="icon" className="h-8 w-8 rounded-full" onClick={onOpenCalendar}>
      <Calendar className="h-4 w-4" />
    </Button>
    <Button size="icon" className="h-8 w-8 rounded-full" onClick={onOpenRecentEntries}>
      <Users className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### Positioning at Hero Bottom

```tsx
// In Emotions.tsx
<div className="relative">
  <PageHero ... />
  
  {/* Navigation overlay at bottom of hero */}
  <div className="absolute bottom-6 left-0 right-0 z-20 px-6 lg:px-12">
    <EmotionsNavigation ... />
  </div>
</div>

{/* Rest of content - remove the separate sticky navigation bar */}
<EmotionsPageLayout>
  {/* ... content ... */}
</EmotionsPageLayout>
```

---

## Implementation Order

1. **Phase 1**: Update `EmotionsNavigation.tsx` - Remove Context, update types, restyle buttons
2. **Phase 2**: Update `Emotions.tsx` - Reposition navigation to hero bottom, remove sticky bar, adjust flow
3. **Phase 3**: Polish and test responsive behavior


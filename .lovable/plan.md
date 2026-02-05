
# Show Recommended Strategies Section + All Strategies

## Goal
Display a clear "Recommended for you" section with 3 strategies, followed by an "All Strategies" section below, with slightly larger cards for better readability.

---

## Changes to EmotionsPageRegulate.tsx

### New Layout for Right Column

```text
┌─────────────────────────────────────────────┐
│   [Checkmark] Check-in Complete             │
│   [Emotion Badge: "Valued"]                 │
│                                             │
│   ─── Recommended for you ───               │
│   [Card 1] [Card 2] [Card 3]  (3 cols)      │
│                                             │
│   ─── All Strategies ───                    │
│   [Card] [Card] [Card] [Card]  (4 cols)     │
│   [Card] [Card] [Card] [Card]               │
│                                             │
│   [New Check-in] [Insights]                 │
└─────────────────────────────────────────────┘
```

### Implementation Details

**1. Split strategies into two sections:**
- "Recommended for you" - 3 cards in a 3-column grid
- "All Strategies" - remaining strategies in a 4-column grid

**2. Make cards slightly larger:**
- Icon: `w-6 h-6` → `w-7 h-7`
- Icon inner: `h-3 w-3` → `h-3.5 w-3.5`
- Padding: `p-2` → `p-2.5`
- Show first two words of title instead of one

**3. Add section headers:**
- "Recommended for you" with amber sparkle icon
- "All Strategies" label

**4. Adjust spacing:**
- Use `mb-3` between sections
- Use `gap-2` for strategy grids

---

## Code Changes

### Lines 189-210 - Replace single grid with two sections:
```tsx
{/* Recommended Strategies */}
{recommendedStrategies.length > 0 && (
  <div className="w-full max-w-md mb-3">
    <p className="text-[10px] text-muted-foreground mb-2 text-center flex items-center justify-center gap-1">
      <Sparkles className="h-3 w-3 text-amber-500" />
      Recommended for you
    </p>
    <div className="grid grid-cols-3 gap-2">
      {recommendedStrategies.map((strategy) => (
        <MiniStrategyCard key={strategy.id} strategy={strategy} isRecommended onStart={...} />
      ))}
    </div>
  </div>
)}

{/* All Strategies */}
<div className="w-full max-w-md mb-4">
  <p className="text-[10px] text-muted-foreground mb-2 text-center">
    All Strategies
  </p>
  <div className="grid grid-cols-4 gap-1.5">
    {STRATEGIES.filter(s => !recommendedStrategies.some(r => r.id === s.id)).map((strategy) => (
      <MiniStrategyCard key={strategy.id} strategy={strategy} onStart={...} />
    ))}
  </div>
</div>
```

### Lines 39-45 - Slightly larger icons:
```tsx
const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="h-3.5 w-3.5" />,
  grounding: <Activity className="h-3.5 w-3.5" />,
  cognitive: <Sparkles className="h-3.5 w-3.5" />,
  movement: <Zap className="h-3.5 w-3.5" />,
  mindfulness: <Heart className="h-3.5 w-3.5" />,
};
```

### Lines 278-300 - Slightly larger MiniStrategyCard:
```tsx
<button className={cn(
  "group p-2.5 rounded-lg border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 text-center",
  isRecommended ? "ring-1 ring-amber-400/50 border-amber-400/30" : "border-border"
)}>
  <div className="w-7 h-7 mx-auto mb-1 rounded-md flex items-center justify-center text-white shadow-sm">
    {typeIcons[strategy.type]}
  </div>
  <p className="text-[10px] font-medium text-foreground truncate leading-tight">
    {strategy.title.split(' ').slice(0, 2).join(' ')}
  </p>
  <p className="text-[8px] text-muted-foreground">
    {strategy.duration}
  </p>
</button>
```

---

## Summary

| Section | Layout | Styling |
|---------|--------|---------|
| Recommended | 3 columns | Amber ring highlight, larger cards |
| All Strategies | 4 columns | Standard styling, remaining strategies |
| Cards | Slightly larger | `p-2.5`, `w-7` icons, 2-word titles |

---

## File to Modify
`src/components/emotions/EmotionsPageRegulate.tsx`

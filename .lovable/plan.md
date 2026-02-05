
# Increase Emotion Sector Radial Width

## Problem
The emotion text labels are flowing outside their radial sector boundaries because the sectors are too narrow (~52px radial width).

## Current Dimensions (at size=520)
| Element | Current Value | Calculated |
|---------|---------------|------------|
| outerRadius | `size * 0.45` | ~234px |
| middleRadius | `size * 0.34` | ~177px |
| innerRingRadius | `size * 0.20` | ~104px |
| innerMostRadius | `size * 0.135` | ~70px |

**Current sector radial widths:**
- Outer ring (specific emotions): 52px
- Inner ring (core emotions): 53px

## Solution
Increase the radial width by adjusting the multipliers to create more space for text:

### New Dimensions
| Element | New Value | Calculated | Change |
|---------|-----------|------------|--------|
| outerRadius | `size * 0.47` | ~244px | +10px |
| middleRadius | `size * 0.30` | ~156px | -21px |
| innerRingRadius | `size * 0.16` | ~83px | -21px |
| innerMostRadius | `size * 0.10` | ~52px | -18px |

**New sector radial widths:**
- Outer ring (specific emotions): ~83px (was 52px) → **+60% more space**
- Inner ring (core emotions): ~68px (was 53px) → **+28% more space**

### Additional Adjustments

1. **Text positioning** - Update label positions to center within new wider sectors:
   - Core emotions: `middleRadius - 15` (was -20)
   - Outer emotions: `outerRadius - 40` (was -25)

2. **Arc path adjustments** - Update the offset values in `createArcPath` calls:
   - Outer section: `middleRadius + 5` stays as is
   - Inner section: `innerRingRadius + 15` (was +20) to match new proportions

3. **Center background circle** - Adjust to match new `innerRingRadius`:
   - Change from `innerRingRadius + 15` to `innerRingRadius + 12`

4. **Selection highlight ring** - Update to match new dimensions

---

## File to Modify
`src/components/emotions/EmotionCircularPicker.tsx`

### Changes at Lines 103-110 (Ring dimensions)
```typescript
// Before
const outerRadius = size * 0.45;
const middleRadius = size * 0.34;
const innerRingRadius = size * 0.20;
const innerMostRadius = size * 0.135;

// After - Wider sectors for text
const outerRadius = size * 0.47;
const middleRadius = size * 0.30;
const innerRingRadius = size * 0.16;
const innerMostRadius = size * 0.10;
```

### Changes at Line 296 (Inner section path)
```typescript
// Before
d={createArcPath(section.startAngle, section.endAngle, innerRingRadius + 20, middleRadius)}

// After
d={createArcPath(section.startAngle, section.endAngle, innerRingRadius + 15, middleRadius)}
```

### Changes at Line 311 (Selection highlight)
```typescript
// Before
d={createArcPath(section.startAngle, section.endAngle, innerRingRadius + 18, outerRadius + 2)}

// After
d={createArcPath(section.startAngle, section.endAngle, innerRingRadius + 13, outerRadius + 2)}
```

### Changes at Line 328 (Center background)
```typescript
// Before
r={innerRingRadius + 15}

// After
r={innerRingRadius + 12}
```

### Changes at Line 402 (Core emotion label position)
```typescript
// Before
const corePos = getTextPosition(midAngle, middleRadius - 20);

// After - Center in wider sector
const corePos = getTextPosition(midAngle, middleRadius - 15);
```

### Changes at Line 433 (Outer emotion label position)
```typescript
// Before
const pos = getTextPosition(emotionAngle, outerRadius - 25);

// After - Better centered in wider sector
const pos = getTextPosition(emotionAngle, outerRadius - 40);
```

---

## Visual Result

```text
BEFORE:                          AFTER:
┌─────────────┐                 ┌─────────────────┐
│   52px      │                 │      83px       │
│  Outer Ring │                 │   Outer Ring    │
├─────────────┤                 │  (more space)   │
│   53px      │                 ├─────────────────┤
│ Inner Ring  │                 │      68px       │
├─────────────┤                 │   Inner Ring    │
│  Sliders    │                 ├─────────────────┤
└─────────────┘                 │    Sliders      │
                                └─────────────────┘
```

Text labels will now have ~60% more radial space, preventing overflow outside sector boundaries.

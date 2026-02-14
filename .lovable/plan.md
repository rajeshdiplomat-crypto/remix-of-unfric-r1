

# Merge 3 Dashboard Cards into One Wide Card

## Problem
The stats dashboard currently uses 3 separate cards (left stats sidebar, center rings, right habit preview) which looks fragmented. The user wants them combined into a single wide card, with "Top Habits" moved to the center area to reduce overall card height.

## New Layout (Single Card)

```text
+---------------------------------------------------------------------------------+
| < Feb-26 >  |  "Quote text here..."                          | SELECT A HABIT   |
|             |  -- AUTHOR                                     | [preview/target] |
| HABITS      |                                                |                  |
| [4][0][4]   |  (o) (o) (o) (o) (o)  <- progress rings       |                  |
|             |  TG  MO  DA  WE  OV                            |                  |
| HABIT DAYS  |                                                |                  |
| [96][8][104]|  TOP HABITS                                    |                  |
|             |  hello 3 · dfghjkl 2 · jkasd 2                 |                  |
+---------------------------------------------------------------------------------+
```

## Changes (single file: `src/pages/Habits.tsx`)

### 1. Wrap everything in one Card
Replace the `grid-cols-[200px_1fr_200px]` with a single `Card` that uses an internal grid/flex layout with 3 sections separated by borders (not separate cards).

### 2. Move Top Habits to center
Remove "Top Habits" from the left sidebar area and place it below the progress rings in the center section, displayed as an inline horizontal list to save vertical space.

### 3. Internal structure
- Left section (200px, border-right): Month nav, Habits stats, Habit Days stats
- Center section (flex-1): Quote, progress rings, top habits inline row
- Right section (200px, border-left): Habit preview or placeholder

### 4. Dividers
Use `border-r border-border` and `border-l border-border` on the internal sections instead of card gaps, creating a seamless single-card appearance.


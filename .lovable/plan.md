

## Diary Page -- Match Screenshot Card and Background Styling

Comparing the uploaded screenshot against the current implementation, here are the specific differences:

### 1. Profile Card (`DiaryProfileCard.tsx`) -- Remove glassmorphism, clean card style
- **Current**: `bg-card/60 backdrop-blur-xl` with complex inset shadow
- **Screenshot**: Clean solid `bg-card` with standard border/shadow, no blur or transparency
- Change time filter button labels from "7d" to "Today" and keep "Month" as "Total" to match screenshot
- Rename "Overall" to "Overall Progress"

### 2. Right Sidebar Background (`Diary.tsx`)
- **Current**: `bg-background/50` (semi-transparent)
- **Screenshot**: Clean solid `bg-background` -- no tinted/transparent overlay

### 3. Left Sidebar Module Descriptions (`DiaryLeftSidebar.tsx`)
- Update descriptions to match screenshot:
  - Manifest: "Set & track goals" (currently "Visualize your goals")
  - Emotions: "Log feelings & moods" (currently "Understand how you feel")

### 4. Feed Card Spacing (`Diary.tsx`)
- Feed cards container currently uses `space-y-4` -- screenshot shows slightly tighter card gaps matching current spacing, no change needed
- The `rounded-2xl` on the center feed `bg-muted/20` is correct

### Technical Summary

| File | Change |
|---|---|
| `DiaryProfileCard.tsx` | Replace `bg-card/60 backdrop-blur-xl` with `bg-card`. Update time labels: "7d" -> "Today", "Month" -> "Total". Rename "Overall" -> "Overall Progress" |
| `DiaryLeftSidebar.tsx` | Manifest desc -> "Set & track goals", Emotions desc -> "Log feelings & moods" |
| `Diary.tsx` | Right sidebar: `bg-background/50` -> `bg-background` |

### What stays the same
- 3-column layout, PageHero, feed cards, search bar, filter tabs
- All card rounded corners, shadows, and border styles
- Avatar, name, email, progress bars in profile card
- "View My Journey" button at bottom of profile card
- Module list icons and names in left sidebar

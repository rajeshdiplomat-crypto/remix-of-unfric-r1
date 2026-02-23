

## Diary Page -- Match Screenshot Exactly

The current Diary page is very close to the screenshot reference. After comparing the live app against the screenshot, here are the specific gaps to close:

### Changes Required

**1. Left Sidebar (`DiaryLeftSidebar.tsx`) -- Add missing elements**
- Add a clickable "Your Timeline" row with a chevron-right icon (`>`) below the module list, styled as a navigation-like row
- Add a "Get Started" button at the bottom of the sidebar with a calendar/sparkle icon, matching the screenshot's teal/primary styled button

**2. Profile Card (`DiaryProfileCard.tsx`) -- Add "View My Journey" button**
- Add a prominent "View My Journey" call-to-action button at the bottom of the card, below the Overall score row
- Style it as a full-width rounded button with `bg-primary text-primary-foreground` to match the screenshot's teal/dark button appearance

**3. Filter Tabs area (`Diary.tsx`) -- Remove visible scrollbar**
- Hide the horizontal scrollbar on the filter tabs row (the green/teal scroll indicator visible in both the current app and screenshot)
- Use `scrollbar-hide` or CSS `overflow-x: auto` with hidden scrollbar styling

**4. Minor color/spacing tweaks**
- The feed background `bg-muted/20` matches the screenshot's light grey feed area
- Cards already use the correct shadow and border radius
- No major color system changes needed -- the monochrome theme is correct

### Technical Details

| File | Change |
|---|---|
| `src/components/diary/DiaryLeftSidebar.tsx` | Add "Your Timeline" nav row with chevron and "Get Started" button |
| `src/components/diary/DiaryProfileCard.tsx` | Add "View My Journey" button below the Overall score |
| `src/pages/Diary.tsx` | Hide scrollbar on filter tabs row, minor spacing adjustments |

### What stays the same
- 3-column layout structure (left editorial, center feed, right profile)
- PageHero component at top
- Feed card design (avatar, title, timestamp, content, Like/Comment/Share)
- Search bar design
- Module filter tabs (All, Emotions, Journal, etc.)
- Profile card avatar, name, email, performance section with progress bars
- Mobile insights sidebar and edge-swipe gesture


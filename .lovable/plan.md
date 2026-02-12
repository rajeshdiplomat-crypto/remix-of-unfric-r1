

## Recent Entries Gallery View for Journal

Add a "Recent Entries" button in the Journal header bar that opens a full-screen overlay showing all journal entries as large page-style cards with dates, providing a visual gallery for quick navigation.

### What You'll Get
- A "Recent Entries" button in the top header bar (next to the date navigation)
- Clicking it opens a full-screen overlay/page showing all entries as large card tiles
- Each card displays the entry date, title, a content preview, mood indicator, and any images
- Clicking a card navigates back to the editor with that date selected

### Technical Details

**1. Create `src/components/journal/JournalRecentEntriesView.tsx`**
- A full-screen overlay component that receives the `entries` array and `onSelectEntry` callback
- Displays entries in a responsive grid of large cards (2-3 columns on desktop, 1 on mobile)
- Each card shows:
  - Date prominently displayed (e.g., "Feb 12, 2026")
  - Time of last edit
  - Entry title (from H1)
  - Content preview text (first ~100 chars)
  - Mood color indicator dot
  - First image from the entry (extracted from TipTap JSON) as a card thumbnail/cover
- A close/back button at the top to return to the editor
- Smooth enter/exit animations

**2. Modify `src/pages/Journal.tsx`**
- Add a `showRecentEntries` boolean state
- Add a "Recent Entries" button (with `BookOpen` icon) in the header bar, positioned near the date navigation area
- When `showRecentEntries` is true, render the `JournalRecentEntriesView` overlay instead of (or on top of) the editor content
- On card click: set `selectedDate` to that entry's date and close the overlay
- Extract entry images using existing `extractImagesFromTiptapJSON` utility for card thumbnails


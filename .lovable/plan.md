

# Facebook-Style Image Feed for Diary

## What Changes
Feed cards from **Journal, Notes, and Manifest** will display attached images in a Facebook-style photo grid, just like how Facebook shows photos in posts.

## How It Works

Currently, the feed seeding logic in `Diary.tsx` doesn't populate the `media` field for any module, and `DiaryFeedCard.tsx` only renders images for journal entries. We'll fix both sides:

### 1. Seed images into feed events (`src/pages/Diary.tsx`)

During the `seedFeedEvents` function, pull image URLs from each module's data:

- **Journal entries**: Extract URLs from `images_data` (jsonb array) and also parse embedded `<img>` tags from journal answer content (TipTap HTML)
- **Notes**: Use `cover_image_url` if present
- **Manifest goals**: Use `cover_image_url` if present
- **Trackers/Habits**: Use `cover_image_url` if present

Each feed event's `media` array will be populated with these URLs.

### 2. Show images for all modules (`src/components/diary/DiaryFeedCard.tsx`)

- Remove the `isJournalEntry` guard on the media grid section
- Show the Facebook-style image grid for **any** feed card that has `media` with valid URLs
- Enhance the grid layout:
  - 1 image: full-width, rounded, max height ~320px
  - 2 images: side-by-side grid
  - 3 images: one large + two small
  - 4+ images: 2x2 grid with a "+N more" overlay on the last tile

### 3. Extract images from rich text content

Add a utility to extract `<img src="...">` URLs from HTML content (journal answers may contain inline images from the TipTap editor). This reuses the existing `extractImagesFromHTML` function from `src/lib/editorUtils.ts`.

---

## Technical Details

**File: `src/pages/Diary.tsx`**
- In the Journal seeding section, after creating the feed event, add `media` by combining `entry.images_data` (parsed as array) with any images extracted from answer HTML content
- In the Notes section, add `media: note.cover_image_url ? [note.cover_image_url] : []`
- In the Manifest section, add `media: goal.cover_image_url ? [goal.cover_image_url] : []`
- In the Trackers section, add `media: habit.cover_image_url ? [habit.cover_image_url] : []`

**File: `src/components/diary/DiaryFeedCard.tsx`**
- Change the media rendering condition from `isJournalEntry && hasUserAttachedMedia` to just `hasUserAttachedMedia` (any module with media)
- Upgrade the grid to a Facebook-style layout:
  - 1 image: full width
  - 2 images: two equal columns
  - 3 images: large left + two stacked right
  - 4+ images: 2x2 with overlay counter
- Add click-to-expand lightbox behavior (optional, can be a follow-up)


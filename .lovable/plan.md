

# Save Images to Storage and Feed from Database

## Problem
Tracker (habit) images are stored as base64 in localStorage, which means the Diary feed can't reliably access them. The feed currently uses a complex client-side enrichment workaround.

## Solution
Upload Tracker images to the existing `entry-covers` storage bucket and save the public URL to the `habits.cover_image_url` database column. Then simplify the Diary feed to read images purely from the database.

## Changes

### 1. Update ActivityImageUpload to upload to storage (`src/components/trackers/ActivityImageUpload.tsx`)
- Replace the `FileReader.readAsDataURL` approach with Supabase Storage upload (using the existing `entry-covers` bucket)
- After uploading, save the public URL to `habits.cover_image_url` via a database update
- Keep localStorage as a fast cache but store a URL (not base64)
- The `saveActivityImage` helper will also update the database column

### 2. Update TrackerCard image handler (`src/components/trackers/TrackerCard.tsx`)
- When `handleImageChange` is called, ensure the URL is persisted to `habits.cover_image_url` in the database

### 3. Update ActivityDetailPanel (`src/components/trackers/ActivityDetailPanel.tsx`)
- Replace the `FileReader.readAsDataURL` inline upload with Supabase Storage upload to `entry-covers`
- Save the resulting public URL to both localStorage and the database

### 4. Simplify Diary feed seeding (`src/pages/Diary.tsx`)
- Remove the localStorage enrichment logic (`enrichedEvents` useMemo block)
- The seeding function already reads `cover_image_url` from the database for all modules -- this will now have proper URLs for Trackers too
- Remove the `loadAllActivityImages` import since it's no longer needed for the feed

### 5. Migrate existing localStorage base64 images (one-time)
- Add a migration effect in `Trackers.tsx` that checks localStorage for base64 images, uploads them to storage, updates `habits.cover_image_url`, and clears the localStorage entry

---

## Technical Details

**Storage bucket**: `entry-covers` (already exists, public)

**Upload pattern** (reusing the same pattern from `EntryImageUpload.tsx`):
```typescript
const fileExt = file.name.split(".").pop();
const fileName = `${userId}/${Date.now()}.${fileExt}`;
await supabase.storage.from("entry-covers").upload(fileName, file);
const { data: { publicUrl } } = supabase.storage.from("entry-covers").getPublicUrl(fileName);
```

**Database update**:
```typescript
await supabase.from("habits").update({ cover_image_url: publicUrl }).eq("id", habitId);
```

**Files modified**:
- `src/components/trackers/ActivityImageUpload.tsx` -- upload to storage instead of base64
- `src/components/trackers/TrackerCard.tsx` -- persist URL to database
- `src/components/trackers/ActivityDetailPanel.tsx` -- upload to storage instead of base64
- `src/pages/Diary.tsx` -- remove localStorage enrichment, use DB data directly
- `src/pages/Trackers.tsx` -- add one-time migration of existing base64 images


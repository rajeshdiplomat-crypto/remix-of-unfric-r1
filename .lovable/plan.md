
# Fix: Manifest Visualization View Crash

## Problem
The visualization view crashes with `TypeError: goal.vision_images.filter is not a function`. The `vision_images` field is stored as a JSON **string** (e.g., `"[]"`) in the database, but the code at line 82 of `ManifestVisualizationMode.tsx` calls `.filter()` on it, which only works on arrays.

## Root Cause
In the database, `vision_images` is stored as `"[]"` (a string), not an actual empty array `[]`. The `visionImages` memo on line 78-88 checks `goal.vision_images.length > 0` and calls `.filter()` without first parsing the string.

## Fix

**File: `src/components/manifest/ManifestVisualizationMode.tsx`** (lines 78-88)

Parse `goal.vision_images` safely before using it:

```typescript
const visionImages = useMemo(() => {
  const images: string[] = [];
  if (goal.vision_image_url) images.push(goal.vision_image_url);

  // Safely parse vision_images which may be a JSON string or an array
  let parsedVisionImages: string[] = [];
  if (Array.isArray(goal.vision_images)) {
    parsedVisionImages = goal.vision_images;
  } else if (typeof goal.vision_images === 'string') {
    try {
      const parsed = JSON.parse(goal.vision_images);
      parsedVisionImages = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedVisionImages = [];
    }
  }

  if (parsedVisionImages.length > 0) {
    images.push(...parsedVisionImages.filter((img) => img && !images.includes(img)));
  }
  if (goal.cover_image_url && !images.includes(goal.cover_image_url)) {
    images.push(goal.cover_image_url);
  }
  return images;
}, [goal]);
```

This single change will fix the crash and allow the full-screen visualization mode (timer, affirmation, floating elements, ambient sounds) to render correctly.

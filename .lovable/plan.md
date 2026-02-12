

# Fix: Journal Images Not Appearing in Diary Feed

## Root Cause
The image extraction utility `extractImagesFromTiptapJSON` in `src/lib/editorUtils.ts` only looks for TipTap nodes with `type === "image"`. However, the Journal editor uses the `tiptap-extension-resize-image` package, which creates nodes with `type === "imageResize"`. This means all inline journal images are silently skipped during extraction.

This single bug causes two failures:
1. The `images_data` column on `journal_entries` is never populated (it stays `[]`) because the Journal save logic uses the same broken extractor.
2. The Diary feed seeder also uses this extractor to build the `media` array for journal feed cards -- so no images show up.

## Fix (1 file, ~2 lines)

**File: `src/lib/editorUtils.ts`** -- Update the `walk` function inside `extractImagesFromTiptapJSON` to also match `imageResize` nodes:

```typescript
// Before
if (node.type === 'image' && node.attrs?.src) {

// After
if ((node.type === 'image' || node.type === 'imageResize') && node.attrs?.src) {
```

Do the same in the `tiptapJSONToHTML` switch-case so HTML conversion also handles `imageResize`.

That is the entire fix. No other files need changing -- the Diary seeder and Journal save logic already call this function, so once it correctly finds `imageResize` nodes, everything flows through automatically.


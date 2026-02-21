

## Refactor: Mobile Journal Header and Toolbar

### What Changes

**1. Remove Cloud status indicator from the date header; merge its function into the Save button**

Currently the header shows a separate Cloud/CloudOff icon with a status label. This will be removed. Instead, the Save button itself will reflect the sync status:
- Saved state: Save button shows a check icon or subtle "Saved" text
- Saving state: Save button shows a spinner
- Unsaved state: Save button shows standard Save icon (indicating action needed)

This frees up space in the header.

**2. Move the Format (PenLine) icon into the date header bar**

The collapsible format toggle (currently rendered above the editor card via `MobileJournalToolbar`) will be moved into the header's right-side action cluster, next to the other icon buttons (BookOpen, BarChart3, Settings2). Tapping it will expand/collapse the formatting toolbar which will render directly below the header (still above the editor card).

**3. Add a 3-dots (MoreHorizontal) menu to the mobile toolbar's second row**

The desktop editor toolbar has a `MoreHorizontal` dropdown containing: Strikethrough, Code Block, Quote, Divider, Scribble toggle, Clear Formatting, and Clear Entry. A matching 3-dots button will be added to the mobile toolbar's second row, opening a dropdown with these same options.

### Technical Details

**File: `src/pages/Journal.tsx`**

1. **Header changes (lines ~966-991)**:
   - Remove the Cloud/CloudOff/Loader2 status indicator div (lines 974-981)
   - Add a PenLine icon button (mobile-only, `sm:hidden`) that toggles `mobileToolbarOpen` state
   - Modify the Save button to show contextual icons: `Check` when saved, `Loader2` when saving, `Save` when unsaved

2. **MobileJournalToolbar refactor (lines ~168-283)**:
   - Move `open` state up to the Journal component as `mobileToolbarOpen` / `setMobileToolbarOpen`
   - Remove the inline toggle button from within `MobileJournalToolbar` (the header button now controls it)
   - The toolbar still renders above the editor card but is controlled by the header icon
   - Add a `MoreHorizontal` dropdown button at the end of the second row containing:
     - Strikethrough
     - Code Block
     - Quote
     - Divider
     - Scribble toggle
     - Clear Formatting
     - Clear Entry
   - Import `MoreHorizontal`, `PenTool`, `Trash2` into Journal.tsx
   - Pass `onClear` (handleClearEntry) and scribble handlers to the toolbar

3. **Imports**: Add `MoreHorizontal`, `Check`, `PenTool`, `Trash2` to the lucide imports; add `DropdownMenu` components import.

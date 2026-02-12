

# Further Codebase Optimization

## Summary
A second-pass scan found **7 more orphaned files** plus **1 orphaned directory** that can be safely deleted, along with a naming cleanup opportunity.

## Round 2: Files to Delete

### Editor Module (entire directory is dead)
The `src/components/editor/` directory is not imported anywhere in the codebase. `EditorToolbar.tsx` and `EvernoteToolbarEditor.tsx` have zero imports, and `types.ts` and `extensions/FontSize.ts` are only consumed by `EditorToolbar.tsx` itself.

| File | Reason |
|---|---|
| `src/components/editor/EditorToolbar.tsx` | Not imported anywhere |
| `src/components/editor/EvernoteToolbarEditor.tsx` | Not imported anywhere |
| `src/components/editor/types.ts` | Only used by dead `EditorToolbar.tsx` |
| `src/components/editor/extensions/FontSize.ts` | Not imported anywhere |

### Tasks Module
| File | Reason |
|---|---|
| `src/components/tasks/ViewSwitcher.tsx` | Not imported anywhere (replaced by `TasksViewTabs.tsx`) |

### Lib Utilities
| File | Reason |
|---|---|
| `src/lib/journalImageUpload.ts` | Not imported anywhere |

## Total: 6 files + 1 directory to remove

## Technical Details
- The entire `src/components/editor/` folder can be deleted as a unit -- none of its exports are consumed
- `journalImageUpload.ts` appears to be a leftover utility superseded by the current image upload flow in `EntryImageUpload.tsx`
- `ViewSwitcher.tsx` in tasks was replaced by `TasksViewTabs.tsx` which is the one actually imported in `Tasks.tsx`
- No modifications to any remaining files are needed; these are purely orphaned with zero imports


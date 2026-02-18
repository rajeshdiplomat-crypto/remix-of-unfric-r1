

## Remove Clarity Module and Unused Code

The Clarity module (`/clarity` route) is not linked in any navigation and has zero data in both its database tables. This plan removes it entirely.

### Files to Delete (7 files)
- `src/pages/ClarityWindow.tsx`
- `src/components/clarity/BoyFigure.tsx`
- `src/components/clarity/FogLayer.tsx`
- `src/components/clarity/LifeProofPopover.tsx`
- `src/components/clarity/WindowVignette.tsx`
- `src/components/clarity/types.ts`
- `src/lib/clarityMicrocopy.ts`

### Files to Edit (3 files)

**`src/App.tsx`**
- Remove `import ClarityWindow` and the `/clarity` route block

**`src/hooks/useClarityProgress.ts`**
- Delete entirely (only used by ClarityWindow)

**`src/components/settings/HelpFeedbackForm.tsx`**
- Remove the `{ value: "clarity", label: "Clarity" }` option from the dropdown

**`src/components/common/PageLoadingScreen.tsx`**
- Remove `"clarity"` from the page type union and its quotes array

### Database Cleanup

Drop the two empty tables via a migration:

```sql
DROP TABLE IF EXISTS public.life_proofs;
DROP TABLE IF EXISTS public.clarity_state;
```

Both tables have zero rows in both Test and Live environments, so no data loss.

### Summary

- 9 files removed
- 2 files edited (App.tsx, HelpFeedbackForm.tsx, PageLoadingScreen.tsx)
- 2 empty database tables dropped
- No other unused modules were found -- all other components and pages are actively imported and used


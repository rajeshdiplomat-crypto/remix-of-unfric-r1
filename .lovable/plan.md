

# Rebuild Offline System from Scratch

## What's Wrong Now

The current offline handling is scattered across 8+ files with inconsistent patterns:
- Some pages silently skip fetches when offline, others show errors
- Save handlers only show "offline" toasts but never actually queue data for later sync
- The offline queue infrastructure exists (`offlineQueue.ts`, `useOfflineSync.ts`) but is never actually called from any save handler
- Each page has its own copy-pasted `if (navigator.onLine)` checks in catch blocks

## New Architecture

A clean, centralized offline system with three layers:

```text
+--------------------------------------------------+
|  Layer 1: Online Status (useOnlineStatus hook)    |
|  Single source of truth for connectivity          |
+--------------------------------------------------+
          |
+--------------------------------------------------+
|  Layer 2: Offline-Aware Operations                |
|  offlineAwareInsert / Update / Upsert / Delete    |
|  + offlineAwareFetch (graceful loading)           |
+--------------------------------------------------+
          |
+--------------------------------------------------+
|  Layer 3: Queue + Auto-Sync                       |
|  offlineQueue.ts stores pending ops in localStorage|
|  useOfflineSync flushes queue on reconnect        |
+--------------------------------------------------+
```

## Files to Delete and Recreate

### Keep as-is (working correctly):
- `src/hooks/useOnlineStatus.ts` -- simple, clean, works
- `src/hooks/useOfflineSync.ts` -- already handles flush on reconnect
- `src/lib/offlineQueue.ts` -- queue storage logic is fine
- `src/components/pwa/OfflineBadge.tsx` -- UI badge is fine

### Rewrite completely:
- `src/lib/offlineAwareOperation.ts` -- add `offlineAwareFetch` helper and `offlineAwareDelete`, improve existing helpers

### Clean up all pages (remove scattered `navigator.onLine` checks):
- `src/pages/Manifest.tsx` -- use centralized helpers
- `src/pages/ManifestPractice.tsx` -- use centralized helpers  
- `src/pages/Emotions.tsx` -- use centralized helpers
- `src/pages/Journal.tsx` -- use centralized helpers
- `src/pages/Settings.tsx` -- use centralized helpers
- `src/pages/Diary.tsx` -- use centralized helpers
- `src/components/diary/useFeedEvents.ts` -- use centralized helpers
- `src/components/diary/useDiaryMetrics.ts` -- use centralized helpers

## Detailed Changes

### 1. Rewrite `src/lib/offlineAwareOperation.ts`

Keep existing `offlineAwareInsert`, `offlineAwareUpdate`, `offlineAwareUpsert` (they work correctly). Add two new helpers:

- **`offlineAwareFetch`**: Wraps any Supabase `.select()` query. When offline, returns `{ data: null, offline: true }` silently (no error toast). When online, executes normally.
- **`offlineAwareDelete`**: Wraps Supabase `.delete()`. When offline, shows "will sync when connected" toast (deletes can't be easily queued, so we just inform the user).

### 2. Update all pages to use centralized helpers

Replace every `if (navigator.onLine) { toast.error(...) } else { toast.info(...) }` pattern with the appropriate `offlineAware*` helper, or at minimum use the `isOfflineError()` check consistently.

For **fetch operations** (loading data on mount):
- Replace bare `if (!navigator.onLine) return;` guards with `offlineAwareFetch` that returns empty data gracefully

For **save operations** (creating/updating records):
- Wire up `offlineAwareInsert` / `offlineAwareUpdate` / `offlineAwareUpsert` so data is actually queued in localStorage when offline
- Currently the catch blocks only show toasts but never enqueue -- this is the core bug

### 3. Pages breakdown

**Manifest.tsx** (5 operations to fix):
- `fetchData` catch block: use silent offline check
- `handleSaveGoal`: wrap insert/update with `offlineAwareInsert`/`offlineAwareUpdate`  
- `handleDeleteGoal`: wrap with `offlineAwareDelete`
- `handleCompleteGoal`: wrap with `offlineAwareUpdate`
- `handleReactivateGoal`: wrap with `offlineAwareUpdate`

**Emotions.tsx** (4 operations to fix):
- Save emotion handler: wrap with `offlineAwareInsert`
- Update strategy handler: wrap with `offlineAwareUpdate`
- Update emotion handler: wrap with `offlineAwareUpdate`
- Delete emotion handler: wrap with `offlineAwareDelete`

**Journal.tsx** (2 fetches to fix):
- Entry list fetch on mount: wrap with `offlineAwareFetch`
- Single entry fetch on date change: wrap with `offlineAwareFetch`

**Settings.tsx** (1 operation):
- Save settings catch: use `isOfflineError()` consistently

**Diary.tsx** + hooks (3 operations):
- `seedFeedEvents`: keep early return when offline
- `useFeedEvents.ts`: use `offlineAwareFetch`
- `useDiaryMetrics.ts`: use `offlineAwareFetch`

**ManifestPractice.tsx** (1 fetch):
- Goal fetch: use `offlineAwareFetch` to prevent error + redirect when offline


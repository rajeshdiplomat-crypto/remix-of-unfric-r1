

# Fix: "Failed to load manifestations" Error

## Root Cause

The `manifest_practices` table stores `proofs`, `acts`, `visualizations`, and `gratitudes` as JSONB columns. However, the data returned from the API has these fields as **JSON strings** (e.g., `"[]"`) rather than parsed arrays. 

When the code does `(p.proofs || []).map(...)`, `p.proofs` is the string `"[]"` which is truthy, so the fallback `[]` never triggers. Since strings don't have a `.map()` method, it throws a TypeError, which is caught and displayed as "Failed to load manifestations".

## Solution

Parse these JSONB fields safely before using them. Add a small helper that handles both cases (already-parsed arrays and JSON strings).

## Changes

### `src/pages/Manifest.tsx`

Add a safe JSON parse helper at the top of the file:

```typescript
function safeJsonArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}
```

Then replace all direct array accesses in the practices mapping (around lines 143-158) to use this helper:

- `p.visualizations || []` becomes `safeJsonArray(p.visualizations)`
- `p.acts || []` becomes `safeJsonArray(p.acts)`
- `p.proofs || []` becomes `safeJsonArray(p.proofs)`
- `p.gratitudes || []` becomes `safeJsonArray(p.gratitudes)`

Also apply the same fix on line 165 where proofs are extracted via `.flatMap()`.

### `src/pages/ManifestPractice.tsx`

Apply the same `safeJsonArray` helper to the identical mapping logic around lines 96-108, where the same JSONB fields are accessed.

No database or schema changes needed -- this is purely a client-side parsing fix.


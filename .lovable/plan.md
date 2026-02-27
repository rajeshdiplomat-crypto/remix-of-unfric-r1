

# Fix: "Failed to fetch" Auth Error — Root Cause & Solution

## Root Cause

The `window.fetch` in the preview environment is intercepted by `lovable.js`, which can cause transient "Failed to fetch" errors. The current retry logic (2 retries, 800ms) is insufficient — the requests hang indefinitely before failing, and there's no reachability pre-check.

## Solution: Three-layer defense

### 1. Add fetch timeout wrapper (`useAuth.tsx`)
Wrap every auth fetch with a hard 10-second timeout using `AbortController`. Currently, failed requests hang for 30+ seconds before the browser gives up.

### 2. Add reachability guard (`useAuth.tsx`)
Before any `signIn`/`signUp` call, ping the auth health endpoint (`/auth/v1/health`) with a 5-second timeout. If unreachable, immediately show a friendly error — no wasted retries.

### 3. Increase retry resilience (`useAuth.tsx`)
- Increase retries from 2 to 3
- Increase base delay from 800ms to 1500ms
- Catch `AbortError` (from timeout) alongside `TypeError`

### 4. Apply same protection to `Auth.tsx` direct calls
The `resetPasswordForEmail` and `resend` calls in `Auth.tsx` bypass `useAuth` entirely — they call `supabase.auth.*` directly without any retry or timeout protection. Wrap those too.

## Files Modified
- `src/hooks/useAuth.tsx` — timeout wrapper, reachability guard, stronger retries
- `src/pages/Auth.tsx` — wrap direct supabase calls with same protection

## Implementation Detail

```typescript
// Timeout wrapper
function fetchWithTimeout<T>(fn: () => Promise<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    fn().then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// Reachability guard
async function guardReachability(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { 
      signal: AbortSignal.timeout(5000) 
    });
    return res.ok;
  } catch { return false; }
}

// Used in signIn/signUp:
if (!(await guardReachability())) {
  return { error: new Error('Unable to reach the server...') };
}
```


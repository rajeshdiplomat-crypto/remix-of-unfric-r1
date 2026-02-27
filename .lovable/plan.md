

# Fix: Remove Artificial Timeout Wrapper from Auth Calls

## Root Cause (definitive)

`withRetry()` on line 73 of `useAuth.tsx` wraps every auth call in `fetchWithTimeout(fn)` — a hard 10-second timeout. The Lovable preview proxies all `window.fetch` calls through `lovable.js`, adding latency that regularly exceeds 10 seconds. This artificial timeout kills requests that would otherwise succeed, then retries hit the same wall. The Supabase SDK already has its own internal timeout handling (60-90s).

## Fix — Single file, single line

**File: `src/hooks/useAuth.tsx`**

1. **Line 73**: Change `return await fetchWithTimeout(fn);` to `return await fn();` — let the browser and SDK handle timeouts natively
2. **Lines 68-69**: Increase retries from 3 to 5, delay from 1500ms to 2000ms — more resilience against transient proxy failures

No other changes needed. `fetchWithTimeout` and `guardReachability` remain exported but unused in the critical path — no breaking changes.


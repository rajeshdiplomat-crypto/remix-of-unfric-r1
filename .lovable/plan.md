

# Fix: Login Still Failing — Health Check Timeout

## Problem

Network logs show the `/auth/v1/health` pre-flight check is consistently timing out in the preview environment (`signal timed out`, `signal is aborted without reason`). This causes `guardReachability()` to return `false`, which blocks login with "Unable to reach the server" — even though the actual auth endpoint works fine (the earlier test showed `/token` returning proper 400 responses).

The reachability guard is causing the very problem it was meant to prevent.

## Fix

**Remove the reachability pre-flight check from the login/signup flow entirely.** Instead, rely solely on the retry logic with proper timeouts on the actual auth calls. If the server is truly unreachable, the retry logic will catch it after 3 attempts and show the friendly error.

### Changes to `src/hooks/useAuth.tsx`

- Remove `guardReachability()` calls from `signIn()` and `signUp()`
- Keep `guardReachability()` exported (Auth.tsx uses it for forgot-password/resend, but we'll remove it there too)
- Let `withRetry()` handle all failure scenarios directly

### Changes to `src/pages/Auth.tsx`

- Remove `guardReachability()` pre-flight from `handleSubmit` (forgot-password) and `handleResend`
- Wrap those calls with `withRetry()` only — if the server is down, retries will fail and show the error

This is a 2-file, ~10-line change. No new logic — just removing the pre-flight that's blocking login.


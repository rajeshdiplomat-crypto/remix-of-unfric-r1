
Goal: Resolve the persistent “Unable to fetch” login failure by hardening the auth client flow against network outages/session-lock loops and improving recovery UX on `/auth`.

What I observed from diagnostics:
- The login request and refresh-token requests are failing at the network layer (`TypeError: Failed to fetch`, status `0`) before any backend auth validation.
- This happens repeatedly (refresh storm) and is followed by lock timeout errors:
  - `Acquiring ... lock "lock:sb-...-auth-token" timed out waiting 10000ms`
- It reproduces even in incognito, so this is not only a normal-profile cache issue.
- Current auth code (`useAuth.tsx` + `Auth.tsx`) does not classify network errors separately, so users get raw “Failed to fetch” toasts.
- Service worker is not intentionally proxying auth POSTs, but the app still needs stronger auth-failure recovery logic.

Implementation plan

1) Add resilient auth error normalization in `useAuth.tsx`
- Wrap all auth calls in try/catch and normalize errors into user-safe categories:
  - `network_unreachable` (fetch failed, status 0)
  - `auth_invalid_credentials`
  - `auth_other`
- Expose an additional context field like `authErrorState` (or `lastAuthErrorType`) for UI display.
- Ensure initial `getSession()` failure does not leave the app in ambiguous loading states.

2) Add session-lock recovery utilities in `useAuth.tsx`
- Add a helper to clear stale auth token storage keys for this project (targeted key prefix, not full localStorage wipe).
- Add a `recoverAuthSession()` method that:
  - stops in-flight auth retry loops,
  - clears stale local auth token state,
  - re-initializes session safely.
- Keep this as a deliberate user-triggered recovery, not automatic destructive behavior.

3) Reduce refresh-loop pressure while on `/auth` in `Auth.tsx`
- On auth page mount, temporarily pause auto-refresh attempts (to prevent refresh-token storms while user is actively signing in).
- Resume auto-refresh on unmount/after successful sign-in.
- This avoids lock contention from repeated background refresh attempts when network is unstable.

4) Improve `/auth` UX for network failures
- Replace raw “Failed to fetch” toast with clear messaging:
  - “Connection issue reaching authentication service. Check network/VPN/firewall and try again.”
- Add two explicit actions in UI:
  - Retry connection
  - Reset local session and retry
- If offline (`useOnlineStatus` false), show a visible offline hint and disable submit with guidance.

5) Add global unhandled rejection safety net in `src/main.tsx`
- Register a lightweight `unhandledrejection` handler to prevent silent auth lock errors from degrading UX.
- Log structured diagnostics and optionally show a non-technical toast.
- Do not swallow all errors globally; filter to auth/network lock patterns for signal over noise.

6) Validation and rollout checklist
- Test login flow end-to-end on:
  - regular browser profile,
  - incognito,
  - after toggling offline/online.
- Verify no repeated refresh requests flood while sitting on `/auth`.
- Verify lock timeout no longer appears during normal retries.
- Verify successful login restores normal token refresh behavior after leaving `/auth`.
- Verify incorrect password still shows credential-specific message (not network message).

Technical details (for implementation)
- Files to update:
  - `src/hooks/useAuth.tsx`
  - `src/pages/Auth.tsx`
  - `src/main.tsx`
- No database schema, migration, RLS, storage, or backend function changes required.
- No changes to generated backend client files.
- Error classification heuristics:
  - message includes `Failed to fetch` OR auth error status `0` => network class
  - auth message includes `Invalid login` => credential class
- Recovery action should be scoped to auth token keys only; avoid clearing unrelated app data.

Acceptance criteria
- Users no longer see raw “Failed to fetch” as the primary feedback.
- Users have a one-click recovery path from auth lock/network loops.
- Auth page does not continuously hammer refresh-token requests during failure conditions.
- Login works reliably once connectivity is restored, without requiring manual full-site data purge.

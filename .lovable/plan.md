
Implementation plan to fix login failure on `/auth`:

1. Stabilize auth client initialization (`src/hooks/useAuth.tsx`)
- Remove unused `originalAutoRefresh` ref.
- Ensure `onAuthStateChange` + `getSession` startup path always resolves `loading` deterministically.
- Harden network error classification to catch all fetch/CORS-style failures (`TypeError`, status `0`, missing response).

2. Stop refresh storm at the source (`src/integrations usage via useAuth`)
- Add an internal guard in `pauseAutoRefresh()` / `resumeAutoRefresh()` so refresh never restarts while auth screen is mounted.
- Prevent concurrent refresh pause/resume races using a single shared boolean lock/ref.

3. Make sign-in flow fail-fast and clean (`src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`)
- In `signIn`, if auth error is network class, immediately stop refresh retries and return a normalized user-safe error.
- In `Auth.tsx`, remove duplicate error filtering and rely on normalized auth error state for consistent UI messaging.

4. Improve session recovery action (`src/hooks/useAuth.tsx`)
- Expand targeted token cleanup to remove both current and legacy auth token key variants for this project only.
- After local sign-out + cleanup, run a safe `getSession()` re-check to confirm a null clean state before returning.

5. Add deterministic network diagnostics trigger on auth page (`src/pages/Auth.tsx`)
- On network banner display, show a short actionable status (“Auth service unreachable from this browser session”).
- Keep “Retry” and “Reset session”, but wire Retry to a lightweight auth reachability probe before full reload.
- Keep submit disabled while offline and while recovery is in progress.

6. Tighten global rejection filter (`src/main.tsx`)
- Match auth refresh lock/fetch errors more reliably (including non-“auth” message variants from refresh token flow).
- Suppress only known auth-network noise; keep other unhandled rejections visible.

7. Validation checklist
- Verify no continuous `grant_type=refresh_token` flood while idling on `/auth`.
- Verify: wrong password shows credential error; network failure shows connection error.
- Verify Reset session clears stuck state and allows fresh login attempt.
- Verify behavior in normal window + incognito + offline/online toggle.

Technical scope
- Files: `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`, `src/main.tsx`
- No backend schema/function/policy changes required.

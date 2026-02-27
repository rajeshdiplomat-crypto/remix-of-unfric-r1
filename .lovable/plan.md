

## Plan: Auto-sign-in for development

**Goal**: Skip the login screen by automatically signing in with a dev account when no user session exists.

### Approach
Add a `DevAutoLogin` wrapper component in `App.tsx` that:
1. Checks if a dev email/password pair is set via environment variables (`VITE_DEV_EMAIL`, `VITE_DEV_PASSWORD`)
2. If set and no user is logged in, automatically calls `signIn()` silently
3. If not set, falls through to normal auth flow (no behavior change in production)

This keeps the auth system intact (RLS still works) while removing the login friction during development.

### Implementation steps

1. **`src/components/DevAutoLogin.tsx`** (new file)
   - Uses `useAuth()` to get `user`, `loading`, `signIn`
   - On mount, if `VITE_DEV_EMAIL` and `VITE_DEV_PASSWORD` are set and no user exists, calls `signIn()` automatically
   - Shows a loading spinner while auto-signing in
   - Renders children once user is available or env vars are not set

2. **`src/App.tsx`**
   - Wrap `<Routes>` with `<DevAutoLogin>` inside `<AuthProvider>` and `<RestorationGate>`
   - The component sits between auth provider and routes, intercepting the unauthenticated state

3. **`.env`** — user manually adds:
   ```
   VITE_DEV_EMAIL=your-dev@email.com
   VITE_DEV_PASSWORD=your-password
   ```

### Technical notes
- Environment variables prefixed with `VITE_` are exposed to the client bundle — this is intentional for **development only**
- The `.env` file is gitignored, so credentials won't leak
- Production builds without these vars behave identically to current behavior
- RLS policies remain fully functional since a real authenticated session is created


import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Wrap a promise with a hard timeout so requests never hang indefinitely.
 */
function fetchWithTimeout<T>(fn: () => Promise<T>, ms = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    fn().then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * Pre-flight reachability check — pings the auth health endpoint.
 * Returns true if the server is reachable, false otherwise.
 */
async function guardReachability(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const UNREACHABLE_MSG =
  'Unable to reach the server. Please check your internet connection and try again.';

function isNetworkError(err: any): boolean {
  return (
    err instanceof TypeError ||
    err?.name === 'AbortError' ||
    err?.message?.includes('Failed to fetch') ||
    err?.message?.includes('NetworkError') ||
    err?.message?.includes('network') ||
    err?.message?.includes('Request timed out')
  );
}

/**
 * Retry a function up to `retries` times with exponential backoff.
 * Only retries on network-level / timeout errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1500,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(fn);
    } catch (err: any) {
      if (!isNetworkError(err) || attempt === retries) {
        throw err;
      }
      console.warn(
        `[Auth] Network error on attempt ${attempt + 1}/${retries + 1}, retrying in ${delayMs * (attempt + 1)}ms…`,
        err?.message,
      );
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw new Error('Retry exhausted');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('[Auth] getSession failed (may be offline):', err?.message);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!(await guardReachability())) {
      return { error: new Error(UNREACHABLE_MSG) };
    }
    try {
      const { error } = await withRetry(() =>
        supabase.auth.signInWithPassword({ email, password })
      );
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (err: any) {
      return {
        error: new Error(isNetworkError(err) ? UNREACHABLE_MSG : err?.message || 'An unexpected error occurred'),
      };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!(await guardReachability())) {
      return { error: new Error(UNREACHABLE_MSG) };
    }
    const redirectUrl = `${window.location.origin}/`;
    try {
      const { error } = await withRetry(() =>
        supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } })
      );
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (err: any) {
      return {
        error: new Error(isNetworkError(err) ? UNREACHABLE_MSG : err?.message || 'An unexpected error occurred'),
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] signOut network error, clearing local state');
      setSession(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/** Exported for use in Auth.tsx direct calls */
export { withRetry, guardReachability, UNREACHABLE_MSG, isNetworkError };

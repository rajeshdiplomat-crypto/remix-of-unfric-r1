import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
 * Retry a function up to `retries` times with exponential backoff.
 * Only retries on network-level errors (TypeError / "Failed to fetch").
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 800,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isNetworkError =
        err instanceof TypeError ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('network');

      if (!isNetworkError || attempt === retries) {
        throw err;
      }

      console.warn(
        `[Auth] Network error on attempt ${attempt + 1}/${retries + 1}, retrying in ${delayMs}ms…`,
        err?.message,
      );
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  // Should never reach here, but TypeScript needs it
  throw new Error('Retry exhausted');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
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
    try {
      const { error } = await withRetry(() =>
        supabase.auth.signInWithPassword({ email, password })
      );
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: any) {
      // Network-level failure after retries
      const message =
        err instanceof TypeError || err?.message?.includes('Failed to fetch')
          ? 'Unable to reach the server. Please check your internet connection and try again.'
          : err?.message || 'An unexpected error occurred';
      return { error: new Error(message) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    try {
      const { error } = await withRetry(() =>
        supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        })
      );
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: any) {
      const message =
        err instanceof TypeError || err?.message?.includes('Failed to fetch')
          ? 'Unable to reach the server. Please check your internet connection and try again.'
          : err?.message || 'An unexpected error occurred';
      return { error: new Error(message) };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Even if signOut network call fails, clear local state
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

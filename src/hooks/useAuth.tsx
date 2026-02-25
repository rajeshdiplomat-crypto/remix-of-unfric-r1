import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// --- Error classification ---
export type AuthErrorType = 'network_unreachable' | 'auth_invalid_credentials' | 'auth_other' | null;

export interface AuthErrorState {
  type: AuthErrorType;
  message: string;
}

function classifyAuthError(error: any): AuthErrorState {
  const msg = error?.message ?? String(error);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch') && (error?.status === 0 || error?.code === 'FETCH_ERROR')) {
    return { type: 'network_unreachable', message: 'Connection issue reaching authentication service. Check your network and try again.' };
  }
  if (msg.includes('Invalid login')) {
    return { type: 'auth_invalid_credentials', message: 'Invalid email or password.' };
  }
  return { type: 'auth_other', message: msg };
}

// --- Auth token storage helpers ---
const AUTH_STORAGE_PREFIX = 'sb-rgxsciffurjbglfffmqx-auth-token';

function clearStaleAuthTokens() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(AUTH_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => {
    localStorage.removeItem(k);
    console.log('[Auth] Cleared stale token:', k);
  });
}

// --- Context ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: AuthErrorState | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  recoverAuthSession: () => Promise<void>;
  pauseAutoRefresh: () => void;
  resumeAutoRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const refreshPausedRef = useRef(false);
  const originalAutoRefresh = useRef(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) setAuthError(null);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[Auth] getSession failed:', error.message);
        const classified = classifyAuthError(error);
        if (classified.type !== 'network_unreachable') {
          setAuthError(classified);
        }
        // Don't leave in loading state on network failure
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('[Auth] getSession unexpected error:', err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const classified = classifyAuthError(error);
        setAuthError(classified);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      const classified = classifyAuthError(err);
      setAuthError(classified);
      return { error: err };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) {
        const classified = classifyAuthError(error);
        setAuthError(classified);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      const classified = classifyAuthError(err);
      setAuthError(classified);
      return { error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const pauseAutoRefresh = useCallback(() => {
    if (!refreshPausedRef.current) {
      refreshPausedRef.current = true;
      // Stop auto-refresh by calling stopAutoRefresh if available
      try {
        (supabase.auth as any).stopAutoRefresh?.();
      } catch { /* ignore */ }
      console.log('[Auth] Auto-refresh paused');
    }
  }, []);

  const resumeAutoRefresh = useCallback(() => {
    if (refreshPausedRef.current) {
      refreshPausedRef.current = false;
      try {
        (supabase.auth as any).startAutoRefresh?.();
      } catch { /* ignore */ }
      console.log('[Auth] Auto-refresh resumed');
    }
  }, []);

  const recoverAuthSession = useCallback(async () => {
    console.log('[Auth] Recovering auth session...');
    setAuthError(null);
    setLoading(true);
    // 1. Pause refresh to stop any storm
    pauseAutoRefresh();
    // 2. Clear stale tokens
    clearStaleAuthTokens();
    // 3. Sign out cleanly (local only)
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
    setUser(null);
    setSession(null);
    // 4. Resume refresh
    resumeAutoRefresh();
    setLoading(false);
    console.log('[Auth] Session recovered — ready for fresh login');
  }, [pauseAutoRefresh, resumeAutoRefresh]);

  return (
    <AuthContext.Provider value={{
      user, session, loading, authError,
      signIn, signUp, signOut,
      recoverAuthSession, pauseAutoRefresh, resumeAutoRefresh
    }}>
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

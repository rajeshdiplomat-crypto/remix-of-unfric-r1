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
  if (!error) return { type: 'auth_other', message: 'Unknown error' };
  const msg = error?.message ?? String(error);
  const status = error?.status ?? error?.statusCode;

  // Catch all network-layer failures: TypeError from fetch, status 0, explicit network messages
  if (
    error instanceof TypeError ||
    status === 0 ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('ERR_NETWORK') ||
    msg.includes('FETCH_ERROR') ||
    msg.includes('Load failed') ||
    msg.includes('net::') ||
    msg.includes('AbortError')
  ) {
    return { type: 'network_unreachable', message: 'Connection issue reaching authentication service. Check your network and try again.' };
  }
  if (msg.includes('Invalid login')) {
    return { type: 'auth_invalid_credentials', message: 'Invalid email or password.' };
  }
  return { type: 'auth_other', message: msg };
}

// --- Auth token storage helpers ---
const SUPABASE_AUTH_PREFIX = 'sb-';
const SUPABASE_AUTH_SUFFIX = '-auth-token';

function clearAllSupabaseAuthTokens() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SUPABASE_AUTH_PREFIX) && key.endsWith(SUPABASE_AUTH_SUFFIX)) {
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
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  recoverAuthSession: () => Promise<void>;
  pauseAutoRefresh: () => void;
  resumeAutoRefresh: () => void;
  probeAuthReachability: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [recovering, setRecovering] = useState(false);
  const refreshPausedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mountedRef.current) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session) setAuthError(null);
      }
    );

    // Then check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mountedRef.current) return;
      if (error) {
        console.warn('[Auth] getSession failed:', error.message);
        const classified = classifyAuthError(error);
        // Only surface non-network errors as authError (network = transient)
        if (classified.type !== 'network_unreachable') {
          setAuthError(classified);
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      if (!mountedRef.current) return;
      console.warn('[Auth] getSession unexpected error:', err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const pauseAutoRefresh = useCallback(() => {
    if (!refreshPausedRef.current) {
      refreshPausedRef.current = true;
      try { (supabase.auth as any).stopAutoRefresh?.(); } catch { /* ignore */ }
      console.log('[Auth] Auto-refresh paused');
    }
  }, []);

  const resumeAutoRefresh = useCallback(() => {
    if (refreshPausedRef.current) {
      refreshPausedRef.current = false;
      try { (supabase.auth as any).startAutoRefresh?.(); } catch { /* ignore */ }
      console.log('[Auth] Auto-refresh resumed');
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    // Ensure refresh is paused during sign-in to avoid storms
    pauseAutoRefresh();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const classified = classifyAuthError(error);
        setAuthError(classified);
        // On network error, keep refresh paused
        if (classified.type !== 'network_unreachable') {
          resumeAutoRefresh();
        }
        return { error };
      }
      // Success — resume refresh
      resumeAutoRefresh();
      return { error: null };
    } catch (err: any) {
      const classified = classifyAuthError(err);
      setAuthError(classified);
      // Keep refresh paused on network errors
      return { error: err };
    }
  }, [pauseAutoRefresh, resumeAutoRefresh]);

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

  const recoverAuthSession = useCallback(async () => {
    console.log('[Auth] Recovering auth session...');
    setAuthError(null);
    setRecovering(true);
    setLoading(true);
    // 1. Pause refresh to stop any storm
    pauseAutoRefresh();
    // 2. Clear all supabase auth tokens (current + legacy key variants)
    clearAllSupabaseAuthTokens();
    // 3. Sign out cleanly (local only)
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
    setUser(null);
    setSession(null);
    // 4. Verify clean state
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.warn('[Auth] Session still present after recovery, clearing again');
        clearAllSupabaseAuthTokens();
        try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
      }
    } catch { /* ignore probe failure */ }
    // 5. DO NOT resume auto-refresh — Auth page will keep it paused
    setLoading(false);
    setRecovering(false);
    console.log('[Auth] Session recovered — ready for fresh login');
  }, [pauseAutoRefresh]);

  const probeAuthReachability = useCallback(async (): Promise<boolean> => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, authError, recovering,
      signIn, signUp, signOut,
      recoverAuthSession, pauseAutoRefresh, resumeAutoRefresh,
      probeAuthReachability,
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

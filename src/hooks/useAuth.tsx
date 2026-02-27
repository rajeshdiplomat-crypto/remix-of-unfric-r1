import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AuthErrorType = 'network_unreachable' | 'auth_invalid_credentials' | 'auth_other' | null;

export interface AuthErrorState {
  type: AuthErrorType;
  message: string;
}

function classifyAuthError(error: any): AuthErrorState {
  if (!error) return { type: 'auth_other', message: 'Unknown error' };
  const msg = error?.message ?? String(error);
  const status = error?.status ?? error?.statusCode;

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
    msg.includes('AbortError') ||
    msg.includes('NetworkError when attempting to fetch resource')
  ) {
    return {
      type: 'network_unreachable',
      message: 'Connection issue reaching authentication service. Check your network and try again.',
    };
  }

  if (msg.includes('Invalid login')) {
    return { type: 'auth_invalid_credentials', message: 'Invalid email or password.' };
  }

  return { type: 'auth_other', message: msg };
}

const SUPABASE_AUTH_PREFIX = 'sb-';
const SUPABASE_AUTH_SUFFIX = '-auth-token';

function clearAllSupabaseAuthTokens() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const isSupabaseAuthToken = key.startsWith(SUPABASE_AUTH_PREFIX) && key.endsWith(SUPABASE_AUTH_SUFFIX);
    const isLegacyToken = key === 'supabase.auth.token' || key.endsWith('.supabase.auth.token');

    if (isSupabaseAuthToken || isLegacyToken) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    console.log('[Auth] Cleared stale token:', key);
  });
}

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

  const mountedRef = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const pauseDepthRef = useRef(0);
  const autoRefreshRunningRef = useRef(false);
  const startupRecoveryAttemptedRef = useRef(false);

  const setAuthState = useCallback((nextSession: Session | null) => {
    if (!mountedRef.current) return;
    sessionRef.current = nextSession;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  const syncAutoRefresh = useCallback((nextSession?: Session | null) => {
    const effectiveSession = nextSession ?? sessionRef.current;
    const shouldRun = Boolean(effectiveSession) && pauseDepthRef.current === 0;

    if (shouldRun && !autoRefreshRunningRef.current) {
      try {
        (supabase.auth as any).startAutoRefresh?.();
        autoRefreshRunningRef.current = true;
        console.log('[Auth] Auto-refresh enabled');
      } catch {
        // ignore
      }
      return;
    }

    if (!shouldRun && autoRefreshRunningRef.current) {
      try {
        (supabase.auth as any).stopAutoRefresh?.();
        autoRefreshRunningRef.current = false;
        console.log('[Auth] Auto-refresh disabled');
      } catch {
        // ignore
      }
    }
  }, []);

  const pauseAutoRefresh = useCallback(() => {
    pauseDepthRef.current += 1;
    syncAutoRefresh();
  }, [syncAutoRefresh]);

  const resumeAutoRefresh = useCallback(() => {
    pauseDepthRef.current = Math.max(0, pauseDepthRef.current - 1);
    syncAutoRefresh();
  }, [syncAutoRefresh]);

  const hardResetLocalSession = useCallback(async () => {
    pauseAutoRefresh();
    clearAllSupabaseAuthTokens();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    setAuthState(null);
    syncAutoRefresh(null);
  }, [pauseAutoRefresh, setAuthState, syncAutoRefresh]);

  useEffect(() => {
    mountedRef.current = true;

    // Bootstrap with refresh paused to avoid startup refresh storms.
    pauseAutoRefresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthState(nextSession);
      if (nextSession) setAuthError(null);
      setLoading(false);
      syncAutoRefresh(nextSession);
    });

    const initialize = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          const classified = classifyAuthError(error);
          console.warn('[Auth] getSession failed:', classified.message);

          if (classified.type === 'network_unreachable' && !startupRecoveryAttemptedRef.current) {
            startupRecoveryAttemptedRef.current = true;
            await hardResetLocalSession();
          }

          if (classified.type !== 'network_unreachable') {
            setAuthError(classified);
          } else {
            setAuthError(classified);
          }
        }

        setAuthState(currentSession ?? null);
      } catch (err: any) {
        const classified = classifyAuthError(err);
        console.warn('[Auth] getSession unexpected error:', classified.message);
        if (classified.type === 'network_unreachable' && !startupRecoveryAttemptedRef.current) {
          startupRecoveryAttemptedRef.current = true;
          await hardResetLocalSession();
        }
        setAuthError(classified);
      } finally {
        if (mountedRef.current) setLoading(false);
        // Release bootstrap pause. If Auth page is mounted, it still keeps a pause lock.
        resumeAutoRefresh();
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [hardResetLocalSession, pauseAutoRefresh, resumeAutoRefresh, setAuthState, syncAutoRefresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    pauseAutoRefresh();

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const classified = classifyAuthError(error);
        setAuthError(classified);

        if (classified.type !== 'network_unreachable') {
          resumeAutoRefresh();
        }

        return { error };
      }

      resumeAutoRefresh();
      return { error: null };
    } catch (err: any) {
      const classified = classifyAuthError(err);
      setAuthError(classified);
      return { error: err };
    }
  }, [pauseAutoRefresh, resumeAutoRefresh]);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
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
    setAuthState(null);
    syncAutoRefresh(null);
  }, [setAuthState, syncAutoRefresh]);

  const recoverAuthSession = useCallback(async () => {
    console.log('[Auth] Recovering auth session...');
    setRecovering(true);
    setAuthError(null);
    setLoading(true);

    await hardResetLocalSession();

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.warn('[Auth] Session still present after recovery, forcing cleanup again');
        await hardResetLocalSession();
      }
    } catch {
      // ignore probe failure
    }

    if (mountedRef.current) {
      setLoading(false);
      setRecovering(false);
    }

    console.log('[Auth] Session recovered — ready for fresh login');
  }, [hardResetLocalSession]);

  const probeAuthReachability = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'cache-control': 'no-store',
        },
        signal: controller.signal,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        recovering,
        signIn,
        signUp,
        signOut,
        recoverAuthSession,
        pauseAutoRefresh,
        resumeAutoRefresh,
        probeAuthReachability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

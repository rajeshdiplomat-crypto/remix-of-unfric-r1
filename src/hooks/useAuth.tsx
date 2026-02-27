import { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AuthErrorType = 'network_unreachable' | 'auth_invalid_credentials' | 'auth_other' | null;

export interface AuthErrorState {
  type: AuthErrorType;
  message: string;
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

const AUTH_STORAGE_PREFIX = 'sb-';
const AUTH_STORAGE_SUFFIX = '-auth-token';

function getProjectRefFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.split('.')[0] ?? null;
  } catch {
    return null;
  }
}

function clearProjectAuthTokens() {
  const currentProjectRef = getProjectRefFromUrl(import.meta.env.VITE_SUPABASE_URL);
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const isProjectToken =
      key.startsWith(`${AUTH_STORAGE_PREFIX}${currentProjectRef ?? ''}`) &&
      key.endsWith(AUTH_STORAGE_SUFFIX);

    const isLegacyToken =
      key === 'supabase.auth.token' ||
      key.endsWith('.supabase.auth.token') ||
      key.includes('-auth-token');

    if (isProjectToken || isLegacyToken) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function isNetworkLikeError(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  const maybeObject = error as { message?: string; status?: number; statusCode?: number } | null;
  const message = String(maybeObject?.message ?? '').toLowerCase();
  const status = maybeObject?.status ?? maybeObject?.statusCode;

  if (status === 0) return true;

  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('err_network') ||
    message.includes('aborterror') ||
    message.includes('cors') ||
    message.includes('net::')
  );
}

function classifyAuthError(error: unknown): AuthErrorState {
  if (!error) return { type: 'auth_other', message: 'Unknown authentication error' };

  if (isNetworkLikeError(error)) {
    return {
      type: 'network_unreachable',
      message: 'Connection issue reaching authentication service. Check your network and try again.',
    };
  }

  const message = String((error as { message?: string })?.message ?? error);

  if (message.toLowerCase().includes('invalid login')) {
    return { type: 'auth_invalid_credentials', message: 'Invalid email or password.' };
  }

  return { type: 'auth_other', message };
}

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
        (supabase.auth as { startAutoRefresh?: () => void }).startAutoRefresh?.();
        autoRefreshRunningRef.current = true;
      } catch {
        // no-op
      }
      return;
    }

    if (!shouldRun && autoRefreshRunningRef.current) {
      try {
        (supabase.auth as { stopAutoRefresh?: () => void }).stopAutoRefresh?.();
        autoRefreshRunningRef.current = false;
      } catch {
        // no-op
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
    clearProjectAuthTokens();

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
    pauseAutoRefresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthState(nextSession);
      if (nextSession) setAuthError(null);
      if (mountedRef.current) setLoading(false);
      syncAutoRefresh(nextSession);
    });

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          const classified = classifyAuthError(error);
          setAuthError(classified);

          if (classified.type === 'network_unreachable' && !startupRecoveryAttemptedRef.current) {
            startupRecoveryAttemptedRef.current = true;
            await hardResetLocalSession();
          }
        }

        setAuthState(currentSession ?? null);
      } catch (error) {
        const classified = classifyAuthError(error);
        setAuthError(classified);

        if (classified.type === 'network_unreachable' && !startupRecoveryAttemptedRef.current) {
          startupRecoveryAttemptedRef.current = true;
          await hardResetLocalSession();
        }
      } finally {
        if (mountedRef.current) setLoading(false);
        resumeAutoRefresh();
      }
    };

    initializeAuth();

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
    } catch (error) {
      const classified = classifyAuthError(error);
      setAuthError(classified);
      return { error: error as Error };
    }
  }, [pauseAutoRefresh, resumeAutoRefresh]);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error) {
        setAuthError(classifyAuthError(error));
        return { error };
      }

      return { error: null };
    } catch (error) {
      setAuthError(classifyAuthError(error));
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    pauseAutoRefresh();
    await supabase.auth.signOut();
    setAuthState(null);
    syncAutoRefresh(null);
  }, [pauseAutoRefresh, setAuthState, syncAutoRefresh]);

  const recoverAuthSession = useCallback(async () => {
    setRecovering(true);
    setAuthError(null);
    setLoading(true);

    await hardResetLocalSession();

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await hardResetLocalSession();
      }
    } catch {
      // ignore
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRecovering(false);
      }
    }
  }, [hardResetLocalSession]);

  const probeAuthReachability = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, {
        method: 'GET',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'cache-control': 'no-store',
        },
        signal: controller.signal,
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
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

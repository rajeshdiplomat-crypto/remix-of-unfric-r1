import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useIsRestoring, useQuery } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { idbPersister } from "@/lib/idbPersister";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontProvider } from "@/contexts/FontContext";
import { MotionProvider } from "@/contexts/MotionContext";
import { CustomThemeProvider } from "@/contexts/CustomThemeContext";
import { DatePreferencesProvider } from "@/contexts/DatePreferencesContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { CursorGradient } from "@/components/motion/CursorGradient";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useNotificationScheduler } from "@/hooks/useNotifications";

/* ===========================
   Lazy Pages
=========================== */

const Auth = lazy(() => import("./pages/Auth"));
const Diary = lazy(() => import("./pages/Diary"));
const Emotions = lazy(() => import("./pages/Emotions"));
const Journal = lazy(() => import("./pages/Journal"));
const Manifest = lazy(() => import("./pages/Manifest"));
const ManifestPractice = lazy(() => import("./pages/ManifestPractice"));
const ManifestHistory = lazy(() => import("./pages/ManifestHistory"));
const Habits = lazy(() => import("./pages/Habits"));
const Notes = lazy(() => import("./pages/Notes"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskFocus = lazy(() => import("./pages/TaskFocus"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));

/* ===========================
   Reusable Loader
=========================== */

function FullScreenLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground text-sm">
        {text}
      </div>
    </div>
  );
}

/**
 * Restoration Gate
 * Gate that waits for the IDB cache to be restored before rendering children.
 * Prevents blank/empty screens while IndexedDB is still loading.
 */

function RestorationGate({ children }: { children: React.ReactNode }) {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return <FullScreenLoader text="Restoring your data…" />;
  }
  return <>{children}</>;
}

/* ===========================
   Home Redirect
=========================== */

function HomeRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { settings, loaded: settingsLoaded } = useSettings();

  if (authLoading || (user && !settingsLoaded)) {
    return <FullScreenLoader />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  let home = settings.default_home_screen || "diary";
  if (home.startsWith("/")) {
    home = home.slice(1);
  }
  if (!home || home === "dashboard") {
    home = "diary";
  }

  return <Navigate to={`/${home}`} replace />;
}

/* ===========================
   Protected Routes
=========================== */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <PageTransition>{children}</PageTransition>
    </AppLayout>
  );
}

function ProtectedFullscreenRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

/**
 * Background Services
 * Consolidates background logic (Sync, Notifications, etc.) into one headless component.
 */
function BackgroundServices() {
  useOfflineSync();
  useNotificationScheduler();
  return null;
}

/* ===========================
   App Component
=========================== */

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister: idbPersister }}
  >
    <RestorationGate>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <CustomThemeProvider>
                <FontProvider>
                  <MotionProvider>
                    <TooltipProvider>
                      <DatePreferencesProvider>
                        <CursorGradient />
                        <Sonner />
                        <BackgroundServices />
                        <InstallPrompt />

                        <ErrorBoundary>
                          <Suspense fallback={<FullScreenLoader />}>
                            <Routes>
                              <Route path="/auth" element={<Auth />} />
                              <Route path="/" element={<HomeRedirect />} />
                              <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
                              <Route path="/emotions" element={<ProtectedRoute><Emotions /></ProtectedRoute>} />
                              <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                              <Route path="/manifest" element={<ProtectedRoute><Manifest /></ProtectedRoute>} />
                              <Route path="/manifest/practice" element={<ProtectedRoute><ManifestPractice /></ProtectedRoute>} />
                              <Route path="/manifest/history" element={<ProtectedRoute><ManifestHistory /></ProtectedRoute>} />
                              <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
                              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                              <Route path="/tasks/:taskId" element={<ProtectedFullscreenRoute><TaskFocus /></ProtectedFullscreenRoute>} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/refund" element={<RefundPolicy />} />
                              <Route path="/disclaimer" element={<Disclaimer />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </DatePreferencesProvider>
                    </TooltipProvider>
                  </MotionProvider>
                </FontProvider>
              </CustomThemeProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </RestorationGate>
  </PersistQueryClientProvider>
);

export default App;

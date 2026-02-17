import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FontProvider } from "@/contexts/FontContext";
import { MotionProvider } from "@/contexts/MotionContext";
import { CustomThemeProvider } from "@/contexts/CustomThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { CursorGradient } from "@/components/motion/CursorGradient";
import Auth from "./pages/Auth";
import Diary from "./pages/Diary";
import Emotions from "./pages/Emotions";
import Journal from "./pages/Journal";
import Manifest from "./pages/Manifest";
import ManifestPractice from "./pages/ManifestPractice";
import ManifestHistory from "./pages/ManifestHistory";
import Habits from "./pages/Habits";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import TaskFocus from "./pages/TaskFocus";

import ClarityWindow from "./pages/ClarityWindow";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { NotificationScheduler } from "@/components/NotificationScheduler";

const queryClient = new QueryClient();

function HomeRedirect() {
  const { user, loading: authLoading } = useAuth();
  const [target, setTarget] = useState<string | null>(null);
  const hasQueried = React.useRef(false);

  useEffect(() => {
    // Only run once per mount when user is available
    if (!user || hasQueried.current) return;
    hasQueried.current = true;

    // Wait a tick to ensure the session token is propagated to the supabase client
    const timer = setTimeout(async () => {
      // Verify we have a valid session before querying
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.warn("[HomeRedirect] No active session, defaulting to diary");
        setTarget("/diary");
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("default_home_screen")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[HomeRedirect] Failed to fetch default_home_screen:", error);
      }

      const home = data?.default_home_screen || "diary";
      console.log("[HomeRedirect] DB value:", data?.default_home_screen, "→ redirecting to:", `/${home}`);
      setTarget(`/${home}`);
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  return <Navigate to={target} replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <PageTransition>{children}</PageTransition>
    </AppLayout>
  );
}

// Fullscreen route without AppLayout/PageTransition (for focus mode)
function ProtectedFullscreenRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <CustomThemeProvider>
        <FontProvider>
          <MotionProvider>
            <TooltipProvider>
              <CursorGradient />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <NotificationScheduler />
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<HomeRedirect />} />
                    <Route
                      path="/diary"
                      element={
                        <ProtectedRoute>
                          <Diary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/emotions"
                      element={
                        <ProtectedRoute>
                          <Emotions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/journal"
                      element={
                        <ProtectedRoute>
                          <Journal />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manifest"
                      element={
                        <ProtectedRoute>
                          <Manifest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manifest/practice/:goalId"
                      element={
                        <ProtectedRoute>
                          <ManifestPractice />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manifest/history/:goalId"
                      element={
                        <ProtectedRoute>
                          <ManifestHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/habits"
                      element={
                        <ProtectedRoute>
                          <Habits />
                        </ProtectedRoute>
                      }
                    />
                    {/* Legacy route redirect */}
                    <Route path="/trackers" element={<Navigate to="/habits" replace />} />
                    <Route
                      path="/notes"
                      element={
                        <ProtectedRoute>
                          <Notes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        <ProtectedRoute>
                          <Tasks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tasks/focus/:taskId"
                      element={
                        <ProtectedFullscreenRoute>
                          <TaskFocus />
                        </ProtectedFullscreenRoute>
                      }
                    />
                    <Route
                      path="/clarity"
                      element={
                        <ProtectedFullscreenRoute>
                          <ClarityWindow />
                        </ProtectedFullscreenRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </MotionProvider>
        </FontProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

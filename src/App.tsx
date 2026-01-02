import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ManifestHistory from "./pages/ManifestHistory";
import Trackers from "./pages/Trackers";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Navigate to="/diary" replace />} />
                    <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
                    <Route path="/emotions" element={<ProtectedRoute><Emotions /></ProtectedRoute>} />
                    <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                    <Route path="/manifest" element={<ProtectedRoute><Manifest /></ProtectedRoute>} />
                    <Route path="/manifest/history/:goalId" element={<ProtectedRoute><ManifestHistory /></ProtectedRoute>} />
                    <Route path="/trackers" element={<ProtectedRoute><Trackers /></ProtectedRoute>} />
                    <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/tasks/focus/:taskId" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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

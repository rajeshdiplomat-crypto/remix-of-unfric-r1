import { useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL;
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD;

export function DevAutoLogin({ children }: { children: ReactNode }) {
  const { user, loading, signIn } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const attempted = useRef(false);

  const hasDevCreds = Boolean(DEV_EMAIL && DEV_PASSWORD);

  useEffect(() => {
    if (!hasDevCreds || loading || user || attempted.current) return;
    attempted.current = true;
    setSigningIn(true);

    signIn(DEV_EMAIL, DEV_PASSWORD).finally(() => setSigningIn(false));
  }, [hasDevCreds, loading, user, signIn]);

  if (hasDevCreds && (loading || signingIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Auto-signing in…</div>
      </div>
    );
  }

  return <>{children}</>;
}

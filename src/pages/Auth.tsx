import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, Trash2, WifiOff, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { UnfricLogo } from "@/components/common/UnfricLogo";

type AuthMode = "signin" | "signup" | "forgot-password" | "verify-email";

export default function Auth() {
  const {
    user,
    loading,
    signIn,
    signUp,
    resetPassword,
    resendVerification,
    authError,
    recovering,
    pauseAutoRefresh,
    resumeAutoRefresh,
    recoverAuthSession,
    probeAuthReachability,
  } = useAuth();

  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    pauseAutoRefresh();
    return () => resumeAutoRefresh();
  }, [pauseAutoRefresh, resumeAutoRefresh]);

  useEffect(() => {
    if (user && !loading) navigate("/");
  }, [user, loading, navigate]);

  const isActionDisabled = isSubmitting || recovering || isProbing;
  const showNetworkBanner = !isOnline || authError?.type === "network_unreachable";

  const title = useMemo(() => {
    if (mode === "signup") return "Create account";
    if (mode === "forgot-password") return "Reset password";
    if (mode === "verify-email") return "Check your inbox";
    return "Welcome back";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "signup") return "Start your journey";
    if (mode === "forgot-password") return "We will send a reset link";
    if (mode === "verify-email") return `Verification sent to ${email}`;
    return "Sign in to continue";
  }, [mode, email]);

  const handleAuthErrorToast = (error: unknown) => {
    const message = String((error as { message?: string })?.message ?? "");
    if (message.toLowerCase().includes("invalid login")) {
      toast.error("Invalid email or password.");
      return;
    }
    if (message.toLowerCase().includes("already registered")) {
      toast.error("Email already registered. Please sign in.");
      return;
    }
    if (!message.toLowerCase().includes("failed to fetch") && !message.toLowerCase().includes("network")) {
      toast.error(message || "Authentication failed.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    if (!isOnline) {
      toast.error("You are offline. Please reconnect and retry.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "forgot-password") {
        const { error } = await resetPassword(email);
        if (error) {
          handleAuthErrorToast(error);
          return;
        }

        toast.success("Reset email sent.");
        setMode("signin");
        return;
      }

      if (mode === "signup") {
        if (!ageConfirmed) {
          toast.error("Please confirm you are 18 or older.");
          return;
        }

        if (!password || password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          handleAuthErrorToast(error);
          return;
        }

        setMode("verify-email");
        toast.success("Check your email to verify your account.");
        return;
      }

      if (!password) {
        toast.error("Please enter your password.");
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        handleAuthErrorToast(error);
      }
    } catch {
      toast.error("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryConnection = async () => {
    setIsProbing(true);
    try {
      const reachable = await probeAuthReachability();
      if (reachable) toast.success("Connection restored. Try again.");
      else toast.error("Authentication service still unreachable from this browser session.");
    } finally {
      setIsProbing(false);
    }
  };

  const handleResetSession = async () => {
    await recoverAuthSession();
    toast.success("Session reset complete. Please sign in again.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-center">
          <UnfricLogo size="md" />
        </div>

        {showNetworkBanner && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 text-destructive">
                <WifiOff className="h-4 w-4 mt-0.5" />
                <p className="text-sm">
                  {!isOnline
                    ? "You are offline. Connect to the internet to continue."
                    : "Authentication service unreachable from this browser session."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleRetryConnection} disabled={isProbing}>
                  {isProbing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Retry
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleResetSession} disabled={recovering}>
                  {recovering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Reset session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "verify-email" ? (
              <div className="space-y-4">
                <Button type="button" variant="outline" className="w-full" onClick={() => setMode("signin")}>Back to sign in</Button>
                <Button
                  type="button"
                  className="w-full"
                  disabled={isActionDisabled}
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      const { error } = await resendVerification(email);
                      if (error) toast.error(error.message);
                      else toast.success("Verification email sent.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Resend verification
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isActionDisabled}
                    placeholder="you@example.com"
                  />
                </div>

                {mode !== "forgot-password" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <Button type="button" variant="link" className="h-auto p-0" onClick={() => setMode("forgot-password")}>
                          Forgot password?
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isActionDisabled}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <div className="flex items-start gap-2">
                    <Checkbox id="age-confirmed" checked={ageConfirmed} onCheckedChange={(checked) => setAgeConfirmed(Boolean(checked))} />
                    <Label htmlFor="age-confirmed" className="text-sm font-normal">I confirm I am 18 or older</Label>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isActionDisabled || !isOnline}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === "forgot-password" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}
                </Button>

                {mode === "signup" && (
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
                  </p>
                )}

                <div className="pt-2 text-center">
                  {mode === "forgot-password" ? (
                    <Button type="button" variant="ghost" onClick={() => setMode("signin")}>
                      <ArrowLeft className="h-4 w-4" /> Back to sign in
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                    >
                      {mode === "signup" ? "Already have an account? Sign in" : "Don’t have an account? Create one"}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

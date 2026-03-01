import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, WifiOff, RefreshCw, Trash2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnfricLogo } from "@/components/common/UnfricLogo";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import authImage from "@/assets/auth-editorial.jpg";

type AuthMode = "signin" | "signup" | "forgot-password" | "verify-email";

export default function Auth() {
  const { user, loading, signIn, signUp, authError, pauseAutoRefresh, resumeAutoRefresh, recoverAuthSession } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    pauseAutoRefresh();
    return () => { resumeAutoRefresh(); };
  }, [pauseAutoRefresh, resumeAutoRefresh]);

  useEffect(() => {
    if (user && !loading) navigate("/");
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    if (!isOnline) { toast.error("You appear to be offline. Please check your connection."); return; }
    setIsSubmitting(true);
    try {
      if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) { showAuthError(error); } else {
          toast.success("Password reset link sent!");
          setMode("signin");
        }
      } else if (mode === "signup") {
        if (!ageConfirmed) { toast.error("Please confirm you are 18 or older"); setIsSubmitting(false); return; }
        if (!password || password.length < 6) { toast.error("Password must be at least 6 characters"); setIsSubmitting(false); return; }
        const { error } = await signUp(email, password);
        if (error) { showAuthError(error); } else {
          setMode("verify-email");
          toast.success("Check your email to verify!");
        }
      } else {
        if (!password) { toast.error("Please enter your password"); setIsSubmitting(false); return; }
        const { error } = await signIn(email, password);
        if (error && !error.message?.includes('Failed to fetch')) {
          showAuthError(error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAuthError = (error: any) => {
    const msg = error?.message ?? "An error occurred";
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) return;
    if (msg.includes("Invalid login")) toast.error("Invalid email or password");
    else if (msg.includes("already registered")) toast.error("Already registered. Please sign in.");
    else toast.error(msg);
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) toast.error(error.message);
      else toast.success("Verification email sent!");
    } finally { setIsSubmitting(false); }
  };

  const handleRetry = () => window.location.reload();
  const handleResetSession = async () => {
    await recoverAuthSession();
    toast.success("Session reset. Please try logging in again.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showNetworkBanner = !isOnline || authError?.type === 'network_unreachable';

  const title = {
    signin: "Welcome back",
    signup: "Create your account",
    "forgot-password": "Reset password",
    "verify-email": "Check your inbox",
  }[mode];

  const subtitle = {
    signin: "Sign in to continue your journey",
    signup: "Start your personal growth journey",
    "forgot-password": "We'll send you a reset link",
    "verify-email": `We sent a verification link to ${email}`,
  }[mode];

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04] dark:opacity-[0.06]" style={{
        background: 'radial-gradient(ellipse at 30% 0%, hsl(200 80% 60%) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, hsl(280 60% 60%) 0%, transparent 50%)',
      }} />

      {/* Left: Editorial image — desktop only */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden h-screen sticky top-0">
        <img src={authImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/5" />
        {/* Overlay branding */}
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <UnfricLogo size="lg" className="text-background [text-shadow:_0_1px_6px_rgba(0,0,0,0.3)]" />
          <div className="max-w-md">
            <p className="text-background/80 text-sm font-light leading-relaxed tracking-wide [text-shadow:_0_1px_4px_rgba(0,0,0,0.3)]">
              Your personal space for mindfulness, productivity, and self-discovery.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Auth panel */}
      <div className="flex-1 flex flex-col min-h-screen lg:w-[45%] relative z-10">
        {/* Mobile header */}
        <div className="flex items-center justify-center h-16 lg:hidden">
          <UnfricLogo size="md" />
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-sm space-y-8">
            {/* Network banner */}
            {showNetworkBanner && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 backdrop-blur-sm">
                <div className="flex items-start gap-3 text-destructive">
                  <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-light">
                    {!isOnline
                      ? "You're offline. Connect to the internet to continue."
                      : "Connection issue. Check your network, VPN, or firewall."}
                  </p>
                </div>
                <div className="flex gap-3 pl-7">
                  <button onClick={handleRetry}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                  <button onClick={handleResetSession}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
                    <Trash2 className="h-3 w-3" /> Reset session
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-light tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm font-light text-muted-foreground tracking-wide">
                {subtitle}
              </p>
            </div>

            {mode === "verify-email" ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center space-y-1">
                  <p className="text-xs text-muted-foreground font-light">Verification sent to</p>
                  <p className="text-sm text-foreground font-normal tracking-wide">{email}</p>
                </div>
                <button onClick={handleResend} disabled={isSubmitting}
                  className="w-full py-3.5 text-[11px] uppercase tracking-[0.2em] font-light border border-border/60 text-foreground hover:bg-muted/50 transition-all duration-300 rounded-lg disabled:opacity-50">
                  {isSubmitting ? "Sending…" : "Resend verification"}
                </button>
                <button onClick={() => setMode("signin")}
                  className="flex items-center justify-center gap-1.5 w-full text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-normal">
                      Email
                    </label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting}
                      className="w-full bg-muted/30 border border-border/60 focus:border-foreground/40 focus:bg-background outline-none rounded-lg px-4 py-3 text-sm text-foreground font-light transition-all duration-200 placeholder:text-muted-foreground/40"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Password field */}
                  {mode !== "forgot-password" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-normal">
                          Password
                        </label>
                        {mode === "signin" && (
                          <button type="button" onClick={() => setMode("forgot-password")}
                            className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 hover:text-foreground transition-colors">
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting}
                          className="w-full bg-muted/30 border border-border/60 focus:border-foreground/40 focus:bg-background outline-none rounded-lg px-4 py-3 pr-11 text-sm text-foreground font-light transition-all duration-200"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Age confirmation */}
                  {mode === "signup" && (
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="accent-foreground mt-0.5 h-4 w-4 rounded" />
                      <span className="text-xs text-muted-foreground font-light leading-relaxed group-hover:text-foreground transition-colors">
                        I confirm I am 18 years or older
                      </span>
                    </label>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || (mode === "signup" && !ageConfirmed) || !isOnline}
                    className={cn(
                      "w-full py-3.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 disabled:opacity-40 rounded-lg",
                      "bg-foreground text-background hover:opacity-90 hover:shadow-lg",
                    )}
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-2" />}
                    {mode === "forgot-password" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}
                  </button>

                  {/* Terms */}
                  {mode === "signup" && (
                    <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed font-light">
                      By creating an account, you agree to our{" "}
                      <Link to="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
                    </p>
                  )}
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="text-center pt-2">
                  {mode === "forgot-password" ? (
                    <button onClick={() => setMode("signin")}
                      className="flex items-center justify-center gap-1.5 mx-auto text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="h-3 w-3" /> Back to sign in
                    </button>
                  ) : (
                    <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                      className="text-xs text-muted-foreground font-light hover:text-foreground transition-colors">
                      {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                      <span className="underline underline-offset-4">{mode === "signup" ? "Sign in" : "Create one"}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom tagline — desktop only */}
        <div className="hidden lg:flex items-center justify-center h-16 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-light">
          Mindfulness · Productivity · Growth
        </div>
      </div>
    </div>
  );
}

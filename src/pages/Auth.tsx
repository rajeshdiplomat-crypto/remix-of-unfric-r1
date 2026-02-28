import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth, withRetry } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnfricLogo } from "@/components/common/UnfricLogo";
import { cn } from "@/lib/utils";
import authImage from "@/assets/auth-editorial.jpg";

type AuthMode = "signin" | "signup" | "forgot-password" | "verify-email";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate("/");
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setIsSubmitting(true);
    try {
      if (mode === "forgot-password") {
        const { error } = await withRetry(() =>
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth?mode=reset`,
          })
        );
        if (error) toast.error(error.message);
        else { toast.success("Password reset link sent!"); setMode("signin"); }
      } else if (mode === "signup") {
        if (!ageConfirmed) { toast.error("Please confirm you are 18 or older"); setIsSubmitting(false); return; }
        if (!password || password.length < 6) { toast.error("Password must be at least 6 characters"); setIsSubmitting(false); return; }
        const { error } = await signUp(email, password);
        if (error) toast.error(error.message.includes("already registered") ? "Already registered. Please sign in." : error.message);
        else { setMode("verify-email"); toast.success("Check your email to verify!"); }
      } else {
        if (!password) { toast.error("Please enter your password"); setIsSubmitting(false); return; }
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message;
          if (msg.includes("Invalid login")) toast.error("Invalid email or password");
          else if (msg.includes("Unable to reach")) toast.error(msg);
          else toast.error(msg);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await withRetry(() =>
        supabase.auth.resend({ type: "signup", email })
      );
      if (error) toast.error(error.message);
      else toast.success("Verification email sent!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const title = mode === "signup" ? "Get started" : mode === "forgot-password" ? "Reset password" : mode === "verify-email" ? "Check your inbox" : "Welcome back";
  const subtitle = mode === "signup" ? "Create your account to begin" : mode === "forgot-password" ? "We'll send you a reset link" : mode === "verify-email" ? "Tap the link we sent you" : "Sign in to continue your journey";

  return (
    <div className="flex flex-col md:flex-row bg-background overflow-hidden" style={{ height: '100dvh', minHeight: '100vh' }}>
      {/* Left: Editorial image — fixed to viewport height */}
      <div className="hidden md:block md:w-[45%] lg:w-[50%] relative flex-shrink-0 overflow-hidden h-full">
        <img
          src={authImage}
          alt=""
          className="h-full w-auto max-w-none object-center"
        />
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        {/* Branding */}
        <div className="absolute top-8 left-8 z-10">
          <UnfricLogo size="md" className="text-background [text-shadow:_0_1px_4px_rgba(0,0,0,0.4)]" />
        </div>
        {/* Tagline */}
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <p className="text-background/90 text-sm font-light leading-relaxed max-w-xs [text-shadow:_0_1px_4px_rgba(0,0,0,0.3)]">
            Your personal space for mindfulness, productivity, and self-discovery.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col md:w-[45%] overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center justify-center h-14 md:hidden">
          <UnfricLogo size="md" />
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 lg:px-20">
          <div className="w-full max-w-sm">
            {/* Welcome heading */}
            <h1 className="text-2xl font-medium text-foreground tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 mb-10">{subtitle}</p>

            {mode === "verify-email" ? (
              <div className="space-y-8">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a verification link to <span className="text-foreground font-medium">{email}</span>
                </p>
                <button
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="w-full py-4 text-[11px] uppercase tracking-[0.2em] bg-foreground text-background hover:opacity-85 transition-opacity duration-300 disabled:opacity-40 rounded-lg"
                >
                  {isSubmitting ? "Sending…" : "Resend Email"}
                </button>
                <button
                  onClick={() => setMode("signin")}
                  className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-muted/50 border border-border/60 rounded-lg px-4 py-3.5 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors placeholder:text-muted-foreground/40"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Password */}
                  {mode !== "forgot-password" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                          Password
                        </label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={() => setMode("forgot-password")}
                            className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 hover:text-foreground transition-colors"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full bg-muted/50 border border-border/60 rounded-lg px-4 py-3.5 pr-11 text-sm text-foreground outline-none focus:border-foreground/40 transition-colors"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Age confirmation */}
                  {mode === "signup" && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="accent-foreground mt-0.5 h-3.5 w-3.5"
                      />
                      <span className="text-[10px] text-muted-foreground leading-relaxed">
                        I confirm I am 18 years or older
                      </span>
                    </label>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || (mode === "signup" && !ageConfirmed)}
                    className="w-full py-4 text-[11px] uppercase tracking-[0.25em] font-normal bg-foreground text-background hover:opacity-85 transition-opacity duration-300 disabled:opacity-40 rounded-lg"
                  >
                    {isSubmitting && <Loader2 className="h-3 w-3 animate-spin inline mr-2" />}
                    {mode === "forgot-password" ? "Send Link" : mode === "signup" ? "Create Account" : "Sign In"}
                  </button>

                  {/* Terms */}
                  {mode === "signup" && (
                    <p className="text-[9px] text-muted-foreground/50 text-center leading-relaxed">
                      By creating an account, you agree to our{" "}
                      <Link to="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
                    </p>
                  )}
                </form>

                {/* Mode switch */}
                <div className="text-center mt-8">
                  {mode === "forgot-password" ? (
                    <button
                      onClick={() => setMode("signin")}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Back to Sign In
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                      <button
                        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                        className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                      >
                        {mode === "signup" ? "Sign in" : "Create one"}
                      </button>
                    </p>
                  )}
                </div>

                {/* Category tags */}
                <div className="mt-10 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
                  <span>Mindfulness</span>
                  <span>·</span>
                  <span>Productivity</span>
                  <span>·</span>
                  <span>Growth</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

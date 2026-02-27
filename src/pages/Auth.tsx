import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, withRetry, guardReachability, UNREACHABLE_MSG } from "@/hooks/useAuth";
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
        if (!(await guardReachability())) { toast.error(UNREACHABLE_MSG); setIsSubmitting(false); return; }
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
      if (!(await guardReachability())) { toast.error(UNREACHABLE_MSG); setIsSubmitting(false); return; }
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left: Editorial image — hidden on mobile, half on md+ */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <img
          src={authImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle overlay with logo */}
        <div className="absolute inset-0 bg-foreground/10" />
        <div className="absolute bottom-10 left-10">
          <UnfricLogo size="lg" className="text-background [text-shadow:_0_1px_4px_rgba(0,0,0,0.4)]" />
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0 md:w-1/2">
        {/* Mobile-only top bar with logo */}
        <div className="flex items-center justify-center h-14 border-b border-border/30 md:hidden">
          <UnfricLogo size="md" />
        </div>

        {/* Form area — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 lg:px-20">
          <div className="w-full max-w-xs space-y-10">
            {/* Title */}
            <h1 className="text-[11px] font-light uppercase tracking-[0.2em] text-center text-muted-foreground">
              {mode === "signup" && "Create Account"}
              {mode === "signin" && "Log In"}
              {mode === "forgot-password" && "Reset Password"}
              {mode === "verify-email" && "Verify Email"}
            </h1>

            {mode === "verify-email" ? (
              <div className="space-y-8 text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We sent a link to <span className="text-foreground">{email}</span>
                </p>
                <button
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="w-full py-3 text-[11px] uppercase tracking-[0.15em] border border-border text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Sending…" : "Resend"}
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
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-3">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-transparent border-0 border-b border-border/60 focus:border-foreground outline-none py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40"
                      placeholder="you@example.com"
                    />
                  </div>

                  {mode !== "forgot-password" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          Password
                        </label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={() => setMode("forgot-password")}
                            className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60 hover:text-foreground transition-colors"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-transparent border-0 border-b border-border/60 focus:border-foreground outline-none py-2.5 text-sm text-foreground transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  {mode === "signup" && (
                    <label className="flex items-start gap-2.5 cursor-pointer">
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

                  <button
                    type="submit"
                    disabled={isSubmitting || (mode === "signup" && !ageConfirmed)}
                    className={cn(
                      "w-full py-3.5 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 disabled:opacity-50",
                      "bg-foreground text-background hover:opacity-90",
                    )}
                  >
                    {isSubmitting && <Loader2 className="h-3 w-3 animate-spin inline mr-2" />}
                    {mode === "forgot-password" ? "Send Link" : mode === "signup" ? "Create Account" : "Log In"}
                  </button>

                  {mode === "signup" && (
                    <p className="text-[9px] text-muted-foreground/60 text-center leading-relaxed">
                      By creating an account, you agree to our{" "}
                      <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
                    </p>
                  )}
                </form>

                <div className="text-center">
                  {mode === "forgot-password" ? (
                    <button
                      onClick={() => setMode("signin")}
                      className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Back to Log In
                    </button>
                  ) : (
                    <button
                      onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                      className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {mode === "signup" ? "Already have an account?" : "Create an account"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

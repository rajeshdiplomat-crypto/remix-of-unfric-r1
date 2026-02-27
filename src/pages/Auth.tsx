import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, withRetry } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnfricLogo } from "@/components/common/UnfricLogo";
import { LegalFooter } from "@/components/layout/LegalFooter";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left: Full-bleed editorial image */}
        <div className="hidden md:block md:w-[55%] relative overflow-hidden">
          <img
            src={authImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Minimal bottom-left branding */}
          <div className="absolute bottom-8 left-8 z-10">
            <UnfricLogo size="lg" className="text-background [text-shadow:_0_1px_6px_rgba(0,0,0,0.3)]" />
          </div>
        </div>

        {/* Right: Form — stark white, no card, pure Zara */}
        <div className="flex-1 flex flex-col md:w-[45%]">
          {/* Mobile logo */}
          <div className="flex items-center justify-center h-14 md:hidden">
            <UnfricLogo size="md" />
          </div>

          {/* Centered form */}
          <div className="flex-1 flex items-center justify-center px-8 py-16 sm:px-16 lg:px-24">
            <div className="w-full max-w-[320px]">
              {/* Title — Zara-scale uppercase */}
              <h1 className="text-[13px] font-normal uppercase tracking-[0.25em] text-foreground text-center mb-12">
                {mode === "signup" && "Create Account"}
                {mode === "signin" && "Log In"}
                {mode === "forgot-password" && "Reset Password"}
                {mode === "verify-email" && "Verify Email"}
              </h1>

              {mode === "verify-email" ? (
                <div className="space-y-10 text-center">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We sent a verification link to<br />
                    <span className="text-foreground font-medium">{email}</span>
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={isSubmitting}
                    className="w-full py-4 text-[11px] uppercase tracking-[0.2em] border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 disabled:opacity-40"
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
                  <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Email */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground block mb-4">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/30"
                        placeholder="you@example.com"
                      />
                    </div>

                    {/* Password */}
                    {mode !== "forgot-password" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
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
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-sm text-foreground transition-colors"
                          placeholder="••••••••"
                        />
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

                    {/* Submit — solid black, Zara CTA */}
                    <button
                      type="submit"
                      disabled={isSubmitting || (mode === "signup" && !ageConfirmed)}
                      className="w-full py-4 text-[11px] uppercase tracking-[0.25em] font-normal bg-foreground text-background hover:opacity-85 transition-opacity duration-300 disabled:opacity-40"
                    >
                      {isSubmitting && <Loader2 className="h-3 w-3 animate-spin inline mr-2" />}
                      {mode === "forgot-password" ? "Send Link" : mode === "signup" ? "Create Account" : "Log In"}
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
                  <div className="text-center mt-10">
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

      {/* Minimal footer */}
      <LegalFooter />
    </div>
  );
}

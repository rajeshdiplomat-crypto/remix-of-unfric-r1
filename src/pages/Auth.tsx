import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnfricLogo } from "@/components/common/UnfricLogo";

type AuthMode = "signin" | "signup" | "forgot-password" | "verify-email";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/diary");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) toast.error(error.message);
        else {
          toast.success("Password reset link sent! Check your email.");
          setMode("signin");
        }
      } else if (mode === "signup") {
        if (!password) { toast.error("Please enter a password"); return; }
        if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message.includes("already registered")
            ? "This email is already registered. Please sign in instead."
            : error.message);
        } else {
          setMode("verify-email");
          toast.success("Please check your email to verify your account!");
        }
      } else {
        if (!password) { toast.error("Please enter your password"); return; }
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(
            error.message.includes("Invalid login credentials") ? "Invalid email or password"
            : error.message.includes("Email not confirmed") ? "Please verify your email before signing in"
            : error.message
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) toast.error(error.message);
      else toast.success("Verification email sent!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <UnfricLogo size="lg" className="mx-auto mb-6" />
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">
            {mode === "signup" ? "Create your account"
              : mode === "forgot-password" ? "Reset your password"
              : mode === "verify-email" ? "Check your email"
              : "Welcome back"}
          </p>
        </div>

        {mode === "verify-email" ? (
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've sent a verification email to <strong className="text-foreground">{email}</strong>. Click the link to verify your account.
            </p>
            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full h-12 uppercase tracking-[0.15em] text-xs font-normal"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Resend verification email"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="flex items-center gap-2 mx-auto text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Log In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/50"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              {mode !== "forgot-password" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot-password")}
                        className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-sm text-foreground transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 uppercase tracking-[0.15em] text-xs font-normal"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {mode === "forgot-password" ? "Send reset link"
                  : mode === "signup" ? "Create account"
                  : "Log in"}
              </Button>
            </form>

            {/* Mode toggle */}
            <div className="text-center pt-4 border-t border-border">
              {mode === "forgot-password" ? (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="flex items-center gap-2 mx-auto text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Log In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "signup" ? "Already have an account? Log in" : "Don't have an account? Create one"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

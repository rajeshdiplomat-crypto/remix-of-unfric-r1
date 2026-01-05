import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset link sent! Check your email.");
          setMode("signin");
        }
      } else if (mode === "signup") {
        if (!password) {
          toast.error("Please enter a password");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          setMode("verify-email");
          toast.success("Please check your email to verify your account!");
        }
      } else {
        if (!password) {
          toast.error("Please enter your password");
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please verify your email before signing in");
          } else {
            toast.error(error.message);
          }
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
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground uppercase tracking-[0.2em] text-xs">
          Loading...
        </div>
      </div>
    );
  }

  const getSectionTitle = () => {
    switch (mode) {
      case "signup":
        return "CREATE ACCOUNT";
      case "forgot-password":
        return "RESET PASSWORD";
      case "verify-email":
        return "VERIFY EMAIL";
      default:
        return "LOG IN";
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 xl:px-24 py-12 lg:py-0">
        <div className="max-w-md mx-auto w-full">
          {/* Brand name */}
          <h1 className="font-serif text-4xl lg:text-5xl tracking-wide mb-16 text-foreground">
            INBALANCE
          </h1>

          {/* Section title */}
          <h2 className="text-xs uppercase tracking-[0.2em] font-normal mb-10 text-foreground">
            {getSectionTitle()}
          </h2>

          {mode === "verify-email" ? (
            <div className="space-y-8">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a verification email to your inbox. Please check and click the link to verify your account.
              </p>
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Didn't receive the email?
              </p>
              <Button
                onClick={handleResendVerification}
                variant="outline"
                className="w-full h-12 uppercase tracking-[0.15em] text-xs font-normal border-foreground hover:bg-foreground hover:text-background transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? "SENDING..." : "RESEND VERIFICATION EMAIL"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Log In
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email field */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground block mb-3"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/50"
                    placeholder=""
                  />
                </div>

                {/* Password field */}
                {mode !== "forgot-password" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label 
                        htmlFor="password" 
                        className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                      >
                        Password
                      </label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Forgot password?
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
                    />
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="w-full h-12 uppercase tracking-[0.15em] text-xs font-normal border-foreground hover:bg-foreground hover:text-background transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "PLEASE WAIT..."
                      : mode === "forgot-password"
                      ? "SEND RESET LINK"
                      : mode === "signup"
                      ? "CREATE ACCOUNT"
                      : "LOG IN"}
                  </Button>
                </div>
              </form>

              {/* Mode toggle */}
              <div className="mt-16 pt-8 border-t border-border">
                {mode === "forgot-password" ? (
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
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
                    {mode === "signup"
                      ? "Already have an account? Log in"
                      : "Don't have an account? Create one"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side - Full-bleed image */}
      <div className="hidden lg:block w-1/2 relative bg-muted">
        <img 
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover grayscale"
        />
        {/* Subtle overlay for better contrast */}
        <div className="absolute inset-0 bg-background/10" />
      </div>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  PenLine,
  Sparkles,
  CheckCircle2,
  Shield,
  Lock,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnfricLogo } from "@/components/common/UnfricLogo";
type AuthMode = "signin" | "signup" | "forgot-password" | "verify-email";
interface ModuleSectionProps {
  title: string;
  description: string;
  features: string[];
  imageSrc: string;
  imageLeft: boolean;
  icon: ReactNode;
}
const ModuleSection = ({ title, description, features, imageSrc, imageLeft, icon }: ModuleSectionProps) => (
  <section className="min-h-screen flex flex-col lg:flex-row">
    {imageLeft ? (
      <>
        <div className="w-full lg:w-1/2 relative min-h-[50vh] lg:min-h-screen bg-muted">
          <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        </div>
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-16 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-[0.2em] text-foreground">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">{description}</p>
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-foreground/40" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </>
    ) : (
      <>
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-16 order-2 lg:order-1 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-[0.2em] text-foreground">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">{description}</p>
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-foreground/40" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:w-1/2 relative min-h-[50vh] lg:min-h-screen bg-muted order-1 lg:order-2">
          <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-l from-background/80 to-transparent" />
        </div>
      </>
    )}
  </section>
);
const modules = [
  {
    title: "DIARY",
    description:
      "Your daily companion for reflection and growth. Capture moments, track patterns, and celebrate your journey with an elegant feed-style experience that brings all your activities together in one beautiful timeline.",
    features: ["Daily check-ins", "Photo memories", "AI-powered insights", "Weekly summaries", "Activity aggregation"],
    imageSrc: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&h=1600&fit=crop&q=80",
    imageLeft: true,
    icon: <BookOpen className="h-5 w-5 text-foreground" />,
  },
  {
    title: "EMOTIONS",
    description:
      "Track your emotional journey with beautiful visualizations. Understand your patterns, discover triggers, and nurture your mental wellness with evidence-based coping strategies.",
    features: [
      "Emotion tracking",
      "Pattern recognition",
      "Coping strategies",
      "Guided exercises",
      "Contextual insights",
    ],
    imageSrc: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=1600&fit=crop&q=80",
    imageLeft: false,
    icon: <Heart className="h-5 w-5 text-foreground" />,
  },
  {
    title: "JOURNAL",
    description:
      "A sanctuary for your thoughts and ideas. Write freely with a rich editor, organize with prompts, and let your creativity flow. Multiple themes and templates to match your style.",
    features: ["Rich text editor", "Daily prompts", "Drawing canvas", "Auto-save", "Customizable templates"],
    imageSrc: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=1600&fit=crop&q=80",
    imageLeft: true,
    icon: <PenLine className="h-5 w-5 text-foreground" />,
  },
  {
    title: "MANIFEST",
    description:
      "Visualize and attract your dreams into reality. Set intentions, practice affirmations, and track your manifestation journey with daily practices and progress tracking.",
    features: ["Vision boards", "Daily affirmations", "Visualization mode", "Progress tracking", "Proof collection"],
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1600&fit=crop&q=80",
    imageLeft: false,
    icon: <Sparkles className="h-5 w-5 text-foreground" />,
  },
];
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
        <div className="animate-pulse text-muted-foreground uppercase tracking-[0.2em] text-xs">Loading...</div>
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
    <div className="bg-background">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <UnfricLogo size="lg" />
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#modules"
                className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Modules
              </a>
              <a
                href="#about"
                className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setMode("signin");
                  document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs uppercase tracking-[0.15em] hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  setMode("signup");
                  document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs uppercase tracking-[0.15em] px-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-transparent to-transparent" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-[0.1em] mb-6 text-foreground">
            Your Personal Wellness Companion
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Track your emotions, journal your thoughts, manifest your dreams, and build better habits—all in one
            beautifully designed platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              onClick={() => {
                setMode("signup");
                document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              size="lg"
              className="w-full sm:w-auto px-8 h-12 uppercase tracking-[0.15em] text-xs font-normal"
            >
              Start Free Today
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode("signin");
                document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              size="lg"
              className="w-full sm:w-auto px-8 h-12 uppercase tracking-[0.15em] text-xs font-normal"
            >
              Sign In
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-12 border-t border-border/40">
            <div>
              <div className="text-3xl font-light mb-2 text-foreground">7</div>
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Core Modules</div>
            </div>
            <div>
              <div className="text-3xl font-light mb-2 text-foreground">100%</div>
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Private & Secure</div>
            </div>
            <div>
              <div className="text-3xl font-light mb-2 text-foreground">Free</div>
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light tracking-[0.1em] mb-4 text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform for personal growth, emotional wellness, and productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="p-3 rounded-lg bg-muted/50 w-fit mb-4">
                <BookOpen className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Unified Diary</h3>
              <p className="text-sm text-muted-foreground">
                See all your activities, thoughts, and progress in one beautiful feed
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="p-3 rounded-lg bg-muted/50 w-fit mb-4">
                <Heart className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Emotion Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Understand your emotional patterns with visual tracking and insights
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="p-3 rounded-lg bg-muted/50 w-fit mb-4">
                <PenLine className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Rich Journaling</h3>
              <p className="text-sm text-muted-foreground">
                Write freely with a powerful editor and customizable templates
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="p-3 rounded-lg bg-muted/50 w-fit mb-4">
                <Sparkles className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Goal Manifestation</h3>
              <p className="text-sm text-muted-foreground">
                Turn your dreams into reality with daily practices and visualization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="min-h-screen flex flex-col lg:flex-row py-20">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 xl:px-24 py-12 lg:py-0 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-transparent" />

          <div className="max-w-sm mx-auto w-full relative z-10">
            {/* Section title */}
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-[0.2em] font-normal mb-2 text-foreground">
                {getSectionTitle()}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === "signup"
                  ? "Create your free account to get started"
                  : "Welcome back to your wellness journey"}
              </p>
            </div>

            {/* Welcome message for signup */}
            {mode === "signup" && (
              <div className="mb-8 p-4 rounded-lg bg-muted/30 border border-border/40">
                <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Start your journey
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Join thousands tracking their wellness journey. Get started in seconds and unlock all features.
                </p>
              </div>
            )}

            {/* Key benefits for new users */}
            {mode === "signup" && (
              <div className="mb-8 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-foreground/60" />
                  <span>End-to-end encrypted & private</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-foreground/60" />
                  <span>Free forever, no credit card required</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-foreground/60" />
                  <span>Track your progress over time</span>
                </div>
              </div>
            )}

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
                      {mode === "signup" ? "Already have an account? Log in" : "Don't have an account? Create one"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side - Full-bleed image with overlay content */}
        <div className="hidden lg:block w-1/2 relative bg-muted">
          <img
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/60" />

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col justify-center px-12 xl:px-16 z-10">
            <div className="max-w-md">
              <h3 className="text-2xl lg:text-3xl font-light tracking-[0.1em] mb-6 text-foreground">
                Everything you need for personal growth
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Unfric brings together journaling, emotion tracking, goal manifestation, and productivity tools in one
                beautifully designed platform.
              </p>

              {/* Feature highlights */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/50 mt-0.5">
                    <BookOpen className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Unified Diary</h4>
                    <p className="text-xs text-muted-foreground">
                      See all your activities, thoughts, and progress in one beautiful feed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/50 mt-0.5">
                    <Heart className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Emotion Intelligence</h4>
                    <p className="text-xs text-muted-foreground">
                      Understand your emotional patterns with visual tracking and insights
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/50 mt-0.5">
                    <Sparkles className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Goal Manifestation</h4>
                    <p className="text-xs text-muted-foreground">
                      Turn your dreams into reality with daily practices and visualization
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="pt-6 border-t border-border/40">
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Private</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Trusted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module Sections */}
      <section id="modules" className="border-t border-border/40">
        {modules.map((module, index) => (
          <ModuleSection key={index} {...module} />
        ))}
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-light tracking-[0.1em] mb-6 text-foreground">About Unfric</h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
            Unfric is designed to be your all-in-one companion for personal growth and wellness. We believe that
            tracking your emotions, journaling your thoughts, and setting intentions are powerful tools for living a
            more intentional and fulfilling life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="text-2xl font-light mb-2 text-foreground">Our Mission</div>
              <p className="text-sm text-muted-foreground">
                To empower individuals to understand themselves better through thoughtful tracking and reflection
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="text-2xl font-light mb-2 text-foreground">Privacy First</div>
              <p className="text-sm text-muted-foreground">
                Your data is yours. We use end-to-end encryption and never share your personal information
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/40">
              <div className="text-2xl font-light mb-2 text-foreground">Always Free</div>
              <p className="text-sm text-muted-foreground">
                No subscriptions, no hidden fees. All core features are available to everyone, forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-[60vh] flex flex-col items-center justify-center px-8 lg:px-16 py-20 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-light tracking-[0.1em] mb-6 text-foreground">
            Ready to begin your journey?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            Join a community of people committed to personal growth, emotional wellness, and living intentionally. Start
            tracking your progress today—it only takes a minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => {
                setMode("signup");
                document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-8 h-12 uppercase tracking-[0.15em] text-xs font-normal"
            >
              Create Free Account
            </Button>
            <Button
              onClick={() => {
                setMode("signin");
                document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              variant="outline"
              className="w-full sm:w-auto px-8 h-12 uppercase tracking-[0.15em] text-xs font-normal"
            >
              Sign In
            </Button>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-4">What you'll get:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
                <span>Unlimited entries across all modules</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
                <span>Beautiful visualizations and insights</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
                <span>Export your data anytime</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
                <span>Sync across all your devices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <UnfricLogo size="lg" className="mb-4" />
              <p className="text-xs text-muted-foreground">
                Your personal wellness companion for tracking emotions, journaling thoughts, and manifesting goals.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#modules" className="hover:text-foreground transition-colors">
                    Modules
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground mb-4">Connect</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/40 text-center">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Unfric. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

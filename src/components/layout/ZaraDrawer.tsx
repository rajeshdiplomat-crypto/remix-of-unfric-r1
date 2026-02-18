import { X, Settings, Maximize2, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { UnfricLogo } from "@/components/common/UnfricLogo";
import { useCallback } from "react";

const mainNavItems = [
  { title: "Diary", url: "/diary" },
  { title: "Emotions", url: "/emotions" },
  { title: "Journal", url: "/journal" },
  { title: "Manifest", url: "/manifest" },
  { title: "Habits", url: "/habits" },
];

const productivityItems = [
  { title: "Notes", url: "/notes" },
  { title: "Tasks", url: "/tasks" },
];

interface ZaraDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ZaraDrawer({ open, onClose }: ZaraDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleNav = useCallback(
    (url: string) => {
      onClose();
      // Navigate after closing to avoid visual delay
      requestAnimationFrame(() => navigate(url));
    },
    [onClose, navigate],
  );

  const handleSignOut = useCallback(() => {
    onClose();
    signOut();
  }, [onClose, signOut]);

  const linkClass = (url: string) =>
    cn(
      "text-sm font-light uppercase tracking-zara-wide transition-colors cursor-pointer",
      isActive(url)
        ? "text-foreground border-b border-foreground pb-0.5 inline-block"
        : "text-muted-foreground hover:text-foreground block",
    );

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer — Liquid Glass */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-full max-w-sm transition-transform duration-300 ease-out",
          "bg-background/20 dark:bg-background/20 backdrop-blur-xl",
          "border-r border-foreground/[0.06]",
          "shadow-[inset_1px_0_0_0_hsl(var(--foreground)/0.04),_inset_-1px_0_0_0_hsl(var(--foreground)/0.02),_8px_0_30px_-5px_hsl(var(--foreground)/0.08)]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 hover:bg-foreground/10 text-foreground/80 hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full pt-12 pb-6 px-6 overflow-y-auto">
          {/* Logo */}
          <button onClick={() => handleNav("/diary")} className="mb-6 text-left">
            <UnfricLogo size="lg" />
          </button>

          {/* Main nav */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <button
                key={item.url}
                onClick={() => handleNav(item.url)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm font-light uppercase tracking-zara-wide transition-all duration-200",
                  isActive(item.url)
                    ? "text-foreground bg-foreground/10 backdrop-blur-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.07]",
                )}
              >
                {item.title}
              </button>
            ))}
          </nav>

          <div className="my-5 border-t border-foreground/[0.08]" />

          {/* Productivity */}
          <nav className="space-y-1">
            {productivityItems.map((item) => (
              <button
                key={item.url}
                onClick={() => handleNav(item.url)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm font-light uppercase tracking-zara-wide transition-all duration-200",
                  isActive(item.url)
                    ? "text-foreground bg-foreground/10 backdrop-blur-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.07]",
                )}
              >
                {item.title}
              </button>
            ))}
          </nav>

          <div className="my-5 border-t border-foreground/[0.08]" />

          {/* Settings */}
          <nav className="space-y-1">
            <button
              onClick={() => handleNav("/settings")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm font-light uppercase tracking-zara-wide transition-all duration-200",
                isActive("/settings")
                  ? "text-foreground bg-foreground/10 backdrop-blur-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.07]",
              )}
            >
              Settings
            </button>
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-light uppercase tracking-zara-wide text-foreground/50">Theme</span>
              <ThemeToggle collapsed={false} />
            </div>

            {user?.email && (
              <p className="text-[11px] font-light text-foreground/50 truncate uppercase tracking-zara">
                {user.email}
              </p>
            )}

            <button
              onClick={handleSignOut}
              className="text-sm font-light uppercase tracking-zara-wide text-foreground/50 hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

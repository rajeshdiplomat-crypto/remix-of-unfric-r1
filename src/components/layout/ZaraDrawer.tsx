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
          "fixed inset-0 z-50 bg-foreground/20 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-full max-w-sm bg-background transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 hover:bg-transparent">
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
          <nav className="space-y-4">
            {mainNavItems.map((item) => (
              <button key={item.url} onClick={() => handleNav(item.url)} className={linkClass(item.url)}>
                {item.title}
              </button>
            ))}
          </nav>

          <div className="my-5 border-t border-border" />

          {/* Productivity */}
          <nav className="space-y-4">
            {productivityItems.map((item) => (
              <button key={item.url} onClick={() => handleNav(item.url)} className={linkClass(item.url)}>
                {item.title}
              </button>
            ))}
          </nav>

          <div className="my-5 border-t border-border" />

          {/* Settings + Fullscreen (visible items that are hidden on mobile header) */}
          <nav className="space-y-4">
            <button onClick={() => handleNav("/settings")} className={linkClass("/settings")}>
              Settings
            </button>
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-light uppercase tracking-zara-wide text-muted-foreground">Theme</span>
              <ThemeToggle collapsed={false} />
            </div>

            {user?.email && (
              <p className="text-[11px] font-light text-muted-foreground truncate uppercase tracking-zara">
                {user.email}
              </p>
            )}

            <button
              onClick={handleSignOut}
              className="text-sm font-light uppercase tracking-zara-wide text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

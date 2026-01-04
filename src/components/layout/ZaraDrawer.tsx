import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Diary", url: "/diary" },
  { title: "Emotions", url: "/emotions" },
  { title: "Journal", url: "/journal" },
  { title: "Manifest", url: "/manifest" },
  { title: "Trackers", url: "/trackers" },
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
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-foreground/20 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-full max-w-sm bg-background transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <div className="absolute top-6 right-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-14 w-14 hover:bg-transparent"
          >
            <X className="h-8 w-8" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Navigation content */}
        <div className="flex flex-col h-full pt-16 pb-8 px-8 overflow-y-auto">
          {/* Logo */}
          <NavLink to="/diary" onClick={onClose} className="mb-8">
            <span className="text-5xl font-extralight uppercase tracking-[0.5em] text-foreground leading-relaxed">
              inbalance
            </span>
          </NavLink>

          {/* Main navigation */}
          <nav className="space-y-6">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={onClose}
                className={cn(
                  "text-sm font-light uppercase tracking-zara-wide transition-colors",
                  isActive(item.url)
                    ? "text-foreground border-b border-foreground pb-0.5 inline-block"
                    : "text-muted-foreground hover:text-foreground block"
                )}
              >
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-8 border-t border-border" />

          {/* Productivity section */}
          <nav className="space-y-6">
            {productivityItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={onClose}
                className={cn(
                  "text-sm font-light uppercase tracking-zara-wide transition-colors",
                  isActive(item.url)
                    ? "text-foreground border-b border-foreground pb-0.5 inline-block"
                    : "text-muted-foreground hover:text-foreground block"
                )}
              >
                {item.title}
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-8 border-t border-border" />

          {/* Settings & Account */}
          <nav className="space-y-6">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={cn(
                "text-sm font-light uppercase tracking-zara-wide transition-colors",
                isActive("/settings")
                  ? "text-foreground border-b border-foreground pb-0.5 inline-block"
                  : "text-muted-foreground hover:text-foreground block"
              )}
            >
              Settings
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-8 space-y-6">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-light uppercase tracking-zara-wide text-muted-foreground">
                Theme
              </span>
              <ThemeToggle collapsed={false} />
            </div>

            {/* User email */}
            {user?.email && (
              <p className="text-[11px] font-light text-muted-foreground truncate uppercase tracking-zara">
                {user.email}
              </p>
            )}

            {/* Sign out */}
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

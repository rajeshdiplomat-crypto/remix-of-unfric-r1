import { Menu, LogOut, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UnfricLogo } from "@/components/common/UnfricLogo";

interface ZaraHeaderProps {
  onMenuClick: () => void;
}

const modules = [
  { name: "DIARY", path: "/diary" },
  { name: "EMOTIONS", path: "/emotions" },
  { name: "JOURNAL", path: "/journal" },
  { name: "MANIFEST", path: "/manifest" },
  { name: "HABITS", path: "/trackers" },
  { name: "NOTES", path: "/notes" },
  { name: "TASKS", path: "/tasks" },
];

export function ZaraHeader({ onMenuClick }: ZaraHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger after scrolling past ~200px (hero section)
      setIsScrolled(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
        isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-8">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className={cn(
              "h-16 w-16 hover:bg-transparent transition-all duration-300",
              isScrolled ? "text-foreground" : "text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
            )}
          >
            <Menu className="h-10 w-10" strokeWidth={2} />
          </Button>
          <NavLink to="/diary" className="flex items-center">
            <UnfricLogo
              size="md"
              className={cn(
                "transition-all duration-300",
                isScrolled ? "" : "[text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
              )}
            />
          </NavLink>
        </div>

        {/* Right: Module Nav + Fullscreen + Sign Out */}
        <div className="flex items-center gap-6">
          {/* Module Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {modules.map((module) => (
              <NavLink
                key={module.path}
                to={module.path}
                className={cn(
                  "text-[11px] font-light uppercase tracking-zara-wide transition-all duration-300",
                  isActive(module.path)
                    ? cn(
                        "border-b pb-0.5",
                        isScrolled
                          ? "text-foreground border-foreground"
                          : "text-foreground border-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
                      )
                    : cn(
                        "hover:text-foreground",
                        isScrolled
                          ? "text-foreground/60"
                          : "text-foreground/70 [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
                      ),
                )}
              >
                {module.name}
              </NavLink>
            ))}
          </nav>

          {/* Fullscreen button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className={cn(
              "h-10 w-10 hover:bg-transparent transition-all duration-300 hidden md:flex",
              isScrolled
                ? "text-foreground/60 hover:text-foreground"
                : "text-foreground/70 hover:text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
            )}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>

          {/* Sign Out button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className={cn(
              "h-10 w-10 hover:bg-transparent transition-all duration-300 hidden md:flex",
              isScrolled
                ? "text-foreground/60 hover:text-foreground"
                : "text-foreground/70 hover:text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
            )}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Settings link only on mobile */}
          <NavLink
            to="/settings"
            className={cn(
              "text-[11px] font-light uppercase tracking-zara-wide hover:text-foreground transition-all duration-300 md:hidden",
              isScrolled ? "text-foreground/60" : "text-foreground/70 [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]",
            )}
          >
            Settings
          </NavLink>
        </div>
      </div>
    </header>
  );
}

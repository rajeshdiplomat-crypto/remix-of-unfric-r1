import { Menu, Maximize2, Settings, ChevronLeft, ChevronRight, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UnfricLogo } from "@/components/common/UnfricLogo";
import { Separator } from "@/components/ui/separator";

interface ZaraHeaderProps {
  onMenuClick: () => void;
}

const modules = [
{ name: "DIARY", path: "/diary" },
{ name: "EMOTIONS", path: "/emotions" },
{ name: "JOURNAL", path: "/journal" },
{ name: "MANIFEST", path: "/manifest" },
{ name: "HABITS", path: "/habits" },
{ name: "NOTES", path: "/notes" },
{ name: "TASKS", path: "/tasks" }];


export function ZaraHeader({ onMenuClick }: ZaraHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const iconClass = (scrolled: boolean) =>
  cn(
    "h-8 w-8 rounded-full hover:bg-foreground/10 transition-all duration-300",
    scrolled ? "text-foreground/60 hover:text-foreground" : "text-foreground/70 hover:text-foreground"
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50" : "bg-transparent"
      )}>

      <div className="flex items-center justify-between h-14 px-3 sm:px-4 lg:px-8">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className={cn(
              "h-12 w-12 sm:h-16 sm:w-16 hover:bg-transparent transition-all duration-300",
              isScrolled ? "text-foreground" : "text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
            )}>

            <Menu className="h-7 w-7 sm:h-10 sm:w-10" strokeWidth={2} />
          </Button>
          <NavLink to="/diary" className="flex items-center">
            <UnfricLogo
              size="md"
              className={cn(
                "transition-all duration-300",
                isScrolled ? "" : "[text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
              )} />

          </NavLink>
        </div>

        {/* Center: Module Nav — desktop only */}
        <nav className="hidden lg:flex items-center gap-6">
          {modules.map((module) =>
          <NavLink
            key={module.path}
            to={module.path}
            className={cn(
              "text-[11px] font-light uppercase tracking-zara-wide transition-all duration-300",
              isActive(module.path) ?
              cn(
                "border-b pb-0.5",
                isScrolled ?
                "text-foreground border-foreground" :
                "text-foreground border-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
              ) :
              cn(
                "hover:text-foreground",
                isScrolled ?
                "text-foreground/60" :
                "text-foreground/70 [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
              )
            )}>

              {module.name}
            </NavLink>
          )}
        </nav>

        {/* Right: Action buttons */}
        <div className={cn("flex items-center gap-0.5 px-1 py-0.5 transition-all duration-300 rounded-sm",

        isScrolled ? "bg-muted/60" : "bg-foreground/10 backdrop-blur-sm"
        )}>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className={iconClass(isScrolled)} title="Back">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)} className={iconClass(isScrolled)} title="Forward">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-0.5 bg-foreground/15 hidden sm:block" />

          {/* Settings — hidden on smallest screens, visible on sm+ */}
          <NavLink to="/settings" className="hidden sm:block">
            <Button variant="ghost" size="icon" className={iconClass(isScrolled)} title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </NavLink>

          {/* Fullscreen — hidden on mobile, visible on sm+ */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className={cn(iconClass(isScrolled), "hidden sm:flex")}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>

            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Sign out — hidden on mobile, visible on sm+ */}
          <div className="hidden sm:flex items-center">
            <Separator orientation="vertical" className="h-4 mx-0.5 bg-foreground/15" />
            <Button variant="ghost" size="icon" onClick={() => signOut()} className={iconClass(isScrolled)} title="Sign Out">
              <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>);

}
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";

interface ZaraHeaderProps {
  onMenuClick: () => void;
}

export function ZaraHeader({ onMenuClick }: ZaraHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger after scrolling past ~200px (hero section)
      setIsScrolled(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-8">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className={`h-10 w-10 hover:bg-transparent transition-all duration-300 ${
              isScrolled
                ? "text-foreground"
                : "text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
            }`}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <NavLink to="/diary" className="flex items-center">
            <span
              className={`text-lg font-normal uppercase tracking-zara-wide transition-all duration-300 ${
                isScrolled
                  ? "text-foreground"
                  : "text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
              }`}
            >
              inbalance
            </span>
          </NavLink>
        </div>

        {/* Right: Links */}
        <div className="flex items-center gap-6">
          <NavLink
            to="/settings"
            className={`text-[11px] font-light uppercase tracking-zara-wide hover:text-muted-foreground transition-all duration-300 hidden sm:inline ${
              isScrolled
                ? "text-foreground"
                : "text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
            }`}
          >
            Help
          </NavLink>
          <NavLink
            to="/settings"
            className={`text-[11px] font-light uppercase tracking-zara-wide hover:text-muted-foreground transition-all duration-300 ${
              isScrolled
                ? "text-foreground"
                : "text-foreground [text-shadow:_0_1px_3px_rgba(0,0,0,0.3)]"
            }`}
          >
            Settings
          </NavLink>
        </div>
      </div>
    </header>
  );
}

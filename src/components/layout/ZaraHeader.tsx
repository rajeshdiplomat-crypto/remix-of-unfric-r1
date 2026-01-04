import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavLink } from "@/components/NavLink";

interface ZaraHeaderProps {
  onMenuClick: () => void;
}

export function ZaraHeader({ onMenuClick }: ZaraHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-8">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-10 w-10 hover:bg-transparent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <NavLink to="/diary" className="flex items-center gap-2">
            <img 
              src="/favicon.png" 
              alt="inbalance" 
              className="h-6 w-6 object-cover"
            />
            <span className="text-xs font-normal uppercase tracking-zara-wide text-foreground hidden sm:inline">
              inbalance
            </span>
          </NavLink>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-10 h-9 bg-muted/30 border-0 text-xs uppercase tracking-zara placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-border"
            />
          </div>
        </div>

        {/* Right: Links */}
        <div className="flex items-center gap-6">
          <NavLink
            to="/settings"
            className="text-[11px] font-light uppercase tracking-zara-wide text-foreground hover:text-muted-foreground transition-colors hidden sm:inline"
          >
            Help
          </NavLink>
          <NavLink
            to="/settings"
            className="text-[11px] font-light uppercase tracking-zara-wide text-foreground hover:text-muted-foreground transition-colors"
          >
            Settings
          </NavLink>
        </div>
      </div>
    </header>
  );
}

import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Heart,
  PenLine,
  Sparkles,
  BarChart3,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Diary", url: "/diary", icon: BookOpen },
  { title: "My Emotions", url: "/emotions", icon: Heart },
  { title: "My Journal", url: "/journal", icon: PenLine },
  { title: "Manifest", url: "/manifest", icon: Sparkles },
  { title: "Trackers", url: "/trackers", icon: BarChart3 },
];

const productivityItems = [
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
];

interface MobileNavProps {
  onNavigate: () => void;
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => (
    <NavLink
      to={item.url}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        isActive(item.url) 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-foreground hover:bg-muted/50"
      )}
    >
      <item.icon className="h-5 w-5" />
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">MindFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-2 space-y-1">
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </p>
          {mainNavItems.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="px-2 space-y-1">
          <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Productivity
          </p>
          {productivityItems.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="px-2">
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              isActive("/settings") 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-foreground hover:bg-muted/50"
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary font-medium">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              signOut();
              onNavigate();
            }}
            className="h-9 w-9"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

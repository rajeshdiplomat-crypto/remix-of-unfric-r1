import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  collapsed?: boolean;
}

export function ThemeToggle({ className, collapsed }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme.isDark;

  const toggleTheme = () => {
    if (isDark) {
      setTheme('calm-blue');
    } else {
      setTheme('midnight-dark');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-9 w-9 rounded-lg transition-all duration-200",
        "hover:bg-primary/10 hover:text-primary",
        className
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className={cn(
        "h-4 w-4 transition-all duration-300",
        isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
      )} />
      <Moon className={cn(
        "absolute h-4 w-4 transition-all duration-300",
        isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

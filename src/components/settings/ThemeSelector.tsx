import { Check, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme, THEMES, ThemeId } from "@/contexts/ThemeContext";

export function ThemeSelector() {
  const { themeId, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all",
                "hover:shadow-md",
                themeId === theme.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
            >
              {/* Color Preview */}
              <div className="flex gap-1 mb-3">
                <div
                  className="h-6 w-6 rounded-full border border-border/50"
                  style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border/50"
                  style={{ backgroundColor: `hsl(${theme.colors.background})` }}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border/50"
                  style={{ backgroundColor: `hsl(${theme.colors.chart1})` }}
                />
                <div
                  className="h-6 w-6 rounded-full border border-border/50"
                  style={{ backgroundColor: `hsl(${theme.colors.foreground})` }}
                />
              </div>

              <div className="text-left">
                <p className="font-medium text-foreground">{theme.name}</p>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>

              {/* Selected indicator */}
              {themeId === theme.id && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

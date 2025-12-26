import { useState } from "react";
import { Check, Palette, Sliders } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme, THEMES, ThemeId } from "@/contexts/ThemeContext";
import { useCustomTheme } from "@/contexts/CustomThemeContext";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 text-sm uppercase"
            maxLength={7}
          />
        </div>
      </div>
    </div>
  );
}

export function ThemeSelector() {
  const { themeId, setTheme } = useTheme();
  const { customColors, setCustomColors, isCustomTheme } = useCustomTheme();
  const [showCustom, setShowCustom] = useState(isCustomTheme);
  const [localColors, setLocalColors] = useState(customColors);

  const handleToggleCustom = (enabled: boolean) => {
    setShowCustom(enabled);
    if (!enabled) {
      setCustomColors(null);
    }
  };

  const updateColor = (key: keyof typeof localColors, value: string) => {
    setLocalColors(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setCustomColors(localColors);
  };

  const handleReset = () => {
    const defaults = {
      background: '#f4f6f8',
      card: '#fafbfc',
      foreground: '#1a2332',
      mutedForeground: '#6b7280',
      primary: '#0891b2',
      accent: '#8b5cf6',
      border: '#d1d5db',
    };
    setLocalColors(defaults);
    setCustomColors(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme
        </CardTitle>
        <CardDescription>Choose your preferred color theme</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Themes */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Preset Themes</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme.id);
                  setShowCustom(false);
                  setCustomColors(null);
                }}
                className={cn(
                  "relative flex flex-col items-start p-3 rounded-xl border-2 transition-all",
                  "hover:shadow-md",
                  themeId === theme.id && !isCustomTheme
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border"
                )}
              >
                {/* Color Preview */}
                <div className="flex gap-1 mb-2">
                  <div
                    className="h-5 w-5 rounded-full border border-border/50"
                    style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                  />
                  <div
                    className="h-5 w-5 rounded-full border border-border/50"
                    style={{ backgroundColor: `hsl(${theme.colors.background})` }}
                  />
                  <div
                    className="h-5 w-5 rounded-full border border-border/50"
                    style={{ backgroundColor: `hsl(${theme.colors.foreground})` }}
                  />
                </div>

                <p className="font-medium text-foreground text-sm">{theme.name}</p>

                {themeId === theme.id && !isCustomTheme && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Theme Toggle */}
        <div className="flex items-center justify-between py-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="custom-theme" className="text-sm font-medium">
              Custom Theme
            </Label>
          </div>
          <Switch
            id="custom-theme"
            checked={showCustom}
            onCheckedChange={handleToggleCustom}
          />
        </div>

        {/* Custom Theme Editor */}
        {showCustom && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <ColorInput
                label="Background"
                value={localColors.background}
                onChange={(v) => updateColor('background', v)}
              />
              <ColorInput
                label="Card/Surface"
                value={localColors.card}
                onChange={(v) => updateColor('card', v)}
              />
              <ColorInput
                label="Text"
                value={localColors.foreground}
                onChange={(v) => updateColor('foreground', v)}
              />
              <ColorInput
                label="Muted Text"
                value={localColors.mutedForeground}
                onChange={(v) => updateColor('mutedForeground', v)}
              />
              <ColorInput
                label="Primary"
                value={localColors.primary}
                onChange={(v) => updateColor('primary', v)}
              />
              <ColorInput
                label="Border"
                value={localColors.border}
                onChange={(v) => updateColor('border', v)}
              />
            </div>

            {/* Live Preview */}
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: localColors.background,
                borderColor: localColors.border,
              }}
            >
              <div 
                className="p-3 rounded-md mb-2"
                style={{ backgroundColor: localColors.card }}
              >
                <p 
                  className="font-semibold text-sm"
                  style={{ color: localColors.foreground }}
                >
                  Preview Card
                </p>
                <p 
                  className="text-xs"
                  style={{ color: localColors.mutedForeground }}
                >
                  This is how your theme will look
                </p>
              </div>
              <Button
                size="sm"
                style={{ 
                  backgroundColor: localColors.primary,
                  color: '#ffffff',
                }}
              >
                Sample Button
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                Apply Theme
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";
import { Palette, AlertTriangle, RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCustomTheme, CustomColors, DEFAULT_COLORS, checkContrast, autoFixContrast } from "@/contexts/CustomThemeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
        </div>
        <Input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              onChange(val);
            }
          }}
          className="font-mono text-xs h-10"
          placeholder="#FFFFFF"
        />
      </div>
    </div>
  );
}

export function ThemeCustomizer() {
  const { customColors, setCustomColors, isCustomTheme } = useCustomTheme();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<CustomColors>(customColors || DEFAULT_COLORS);
  const [contrastWarning, setContrastWarning] = useState<string>('');

  useEffect(() => {
    const check = checkContrast(colors);
    setContrastWarning(check.hasIssue ? check.message : '');
  }, [colors]);

  const updateColor = (key: keyof CustomColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setCustomColors(colors);
    setOpen(false);
  };

  const handleReset = () => {
    setCustomColors(null);
    setColors(DEFAULT_COLORS);
  };

  const handleAutoFix = () => {
    const fixed = autoFixContrast(colors);
    setColors(fixed);
  };

  // Preview colors live
  useEffect(() => {
    if (open) {
      // Apply preview while dialog is open
      const root = document.documentElement;
      const hexToHsl = (hex: string): string => {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      root.style.setProperty('--background', hexToHsl(colors.background));
      root.style.setProperty('--card', hexToHsl(colors.card));
      root.style.setProperty('--foreground', hexToHsl(colors.foreground));
      root.style.setProperty('--muted-foreground', hexToHsl(colors.mutedForeground));
      root.style.setProperty('--primary', hexToHsl(colors.primary));
      root.style.setProperty('--border', hexToHsl(colors.border));
    }
  }, [colors, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Palette className="h-4 w-4" />
          Customize Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Customizer
          </DialogTitle>
          <DialogDescription>
            Create your perfect color palette with full color wheel control
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <ColorInput
            label="Background"
            value={colors.background}
            onChange={(v) => updateColor('background', v)}
          />
          <ColorInput
            label="Surface/Card"
            value={colors.card}
            onChange={(v) => updateColor('card', v)}
          />
          <ColorInput
            label="Text Color"
            value={colors.foreground}
            onChange={(v) => updateColor('foreground', v)}
          />
          <ColorInput
            label="Muted Text"
            value={colors.mutedForeground}
            onChange={(v) => updateColor('mutedForeground', v)}
          />
          <ColorInput
            label="Primary/Accent"
            value={colors.primary}
            onChange={(v) => updateColor('primary', v)}
          />
          <ColorInput
            label="Border Color"
            value={colors.border}
            onChange={(v) => updateColor('border', v)}
          />
        </div>

        {contrastWarning && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{contrastWarning}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoFix}
              className="gap-1 text-xs"
            >
              <Wand2 className="h-3 w-3" />
              Auto-fix
            </Button>
          </div>
        )}

        {/* Preview */}
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }}
        >
          <div 
            className="p-3 rounded-lg mb-2"
            style={{ backgroundColor: colors.card }}
          >
            <p style={{ color: colors.foreground }} className="font-medium">Preview Card</p>
            <p style={{ color: colors.mutedForeground }} className="text-sm">Muted text example</p>
          </div>
          <button
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ 
              backgroundColor: colors.primary, 
              color: '#FFFFFF' 
            }}
          >
            Primary Button
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleApply}>
            Apply Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Check, Type } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFont, FONTS, FontId } from "@/contexts/FontContext";

export function FontSelector() {
  const { fontId, setFont } = useFont();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typography
        </CardTitle>
        <CardDescription>Choose your preferred font family</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => setFont(font.id)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all",
                "hover:shadow-md",
                fontId === font.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
            >
              <p 
                className="text-lg font-semibold text-foreground mb-1"
                style={{ fontFamily: font.cssFamily }}
              >
                Aa
              </p>
              <p className="text-sm font-medium text-foreground">{font.name}</p>
              <p 
                className="text-xs text-muted-foreground mt-1"
                style={{ fontFamily: font.cssFamily }}
              >
                The quick brown fox
              </p>

              {fontId === font.id && (
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

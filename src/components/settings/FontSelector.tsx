import { Check, Type } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFont, FONT_PAIRS, FontPairId } from "@/contexts/FontContext";

export function FontSelector() {
  const { fontPairId, setFontPair } = useFont();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typography
        </CardTitle>
        <CardDescription>Choose your preferred font pairing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => setFontPair(pair.id)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
                "hover:shadow-md",
                fontPairId === pair.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
            >
              <div className="w-full mb-3 pb-3 border-b border-border/30">
                <p 
                  className="text-xl font-semibold text-foreground"
                  style={{ fontFamily: pair.headingFamily }}
                >
                  Heading
                </p>
                <p 
                  className="text-sm text-muted-foreground mt-1"
                  style={{ fontFamily: pair.bodyFamily }}
                >
                  Body text preview here
                </p>
              </div>
              
              <p className="font-medium text-foreground text-sm">{pair.name}</p>
              <p className="text-xs text-muted-foreground">{pair.description}</p>

              {fontPairId === pair.id && (
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

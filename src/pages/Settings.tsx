import { useFont, FONT_PAIRS, FontPairId } from "@/contexts/FontContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export default function Settings() {
  const { fontPairId, setFontPair } = useFont();

  const handleReset = () => {
    setFontPair("elegant");
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-xl mx-auto px-6 py-10 space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light uppercase tracking-widest text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your experience
          </p>
        </div>

        {/* Font Section */}
        <section className="space-y-6">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Font
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {FONT_PAIRS.map((pair) => (
              <button
                key={pair.id}
                onClick={() => setFontPair(pair.id as FontPairId)}
                className={cn(
                  "text-left p-4 rounded-lg border transition-all",
                  fontPairId === pair.id
                    ? "border-foreground bg-card shadow-sm"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <p
                  className="text-base mb-1 text-foreground"
                  style={{ fontFamily: pair.headingFamily }}
                >
                  {pair.name}
                </p>
                <p
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: pair.bodyFamily }}
                >
                  {pair.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Reset */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-xs uppercase tracking-wider"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
}

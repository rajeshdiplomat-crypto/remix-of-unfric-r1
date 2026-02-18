import { useEffect, useState, useCallback } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INSTALL_DISMISSED_KEY = "unfric_install_dismissed";
const VISIT_COUNT_KEY = "unfric_visit_count";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Track visits
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    // Only show on 2nd+ visit, not dismissed, and not already installed
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (count < 2 || dismissed) return;

    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay so it doesn't appear immediately on page load
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setShow(false);
      setIsExiting(false);
      localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    }, 300);
  }, []);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]",
        "flex items-center gap-3 px-5 py-3 max-w-sm w-[calc(100%-2rem)]",
        "bg-background/20 backdrop-blur-2xl",
        "border border-foreground/[0.08]",
        "shadow-[inset_0_0.5px_0_0_hsl(var(--foreground)/0.06),_0_8px_32px_-4px_hsl(var(--foreground)/0.15)]",
        "rounded-2xl",
        "transition-all duration-300",
        isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0",
        "animate-in fade-in slide-in-from-bottom-4 duration-500"
      )}
    >
      <Download className="h-5 w-5 text-foreground/70 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground/90">Install unfric</p>
        <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5">
          Add to your home screen for the full experience
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstall}
        className="text-[10px] tracking-widest uppercase font-light h-7 px-3 hover:bg-foreground/10"
      >
        Install
      </Button>
      <button
        onClick={dismiss}
        className="p-1 rounded-full hover:bg-foreground/10 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground/60" />
      </button>
    </div>
  );
}

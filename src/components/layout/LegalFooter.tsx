import { Link } from "react-router-dom";

interface LegalFooterProps {
  onOpenCookieSettings?: () => void;
}

export function LegalFooter({ onOpenCookieSettings }: LegalFooterProps) {
  return (
    <footer className="w-full border-t border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-1">
        <p className="text-[10px] text-muted-foreground/60 tracking-wide">
          © {new Date().getFullYear()} unfric — All rights reserved
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors tracking-wide"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors tracking-wide"
          >
            Terms
          </Link>
          <button
            onClick={onOpenCookieSettings}
            className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors tracking-wide"
          >
            Cookie Settings
          </button>
        </div>
      </div>
    </footer>
  );
}

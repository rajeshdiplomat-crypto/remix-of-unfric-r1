import { Link } from "react-router-dom";

interface LegalFooterProps {
  onOpenCookieSettings?: () => void;
}

export function LegalFooter({ onOpenCookieSettings }: LegalFooterProps) {
  return (
    <footer className="w-full border-t border-border/10 bg-background/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-center gap-4">
        <span className="text-[8px] text-muted-foreground/40 tracking-widest uppercase">© {new Date().getFullYear()} unfric</span>
        <span className="text-muted-foreground/20">·</span>
        <Link to="/privacy" className="text-[8px] text-muted-foreground/40 hover:text-foreground/60 transition-colors tracking-widest uppercase">Privacy</Link>
        <Link to="/terms" className="text-[8px] text-muted-foreground/40 hover:text-foreground/60 transition-colors tracking-widest uppercase">Terms</Link>
        <button onClick={onOpenCookieSettings} className="text-[8px] text-muted-foreground/40 hover:text-foreground/60 transition-colors tracking-widest uppercase">Cookies</button>
      </div>
    </footer>
  );
}

import { ReactNode, useState } from "react";
import { ZaraHeader } from "./ZaraHeader";
import { ZaraDrawer } from "./ZaraDrawer";
import { LegalFooter } from "./LegalFooter";
import { CookieConsent } from "@/components/compliance/CookieConsent";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background overflow-x-hidden relative" style={{ minHeight: '100dvh' }}>
      {/* Subtle mesh gradient for glass effects */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        background: 'radial-gradient(ellipse at 20% 20%, hsl(200 80% 60%) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, hsl(280 60% 60%) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, hsl(160 70% 50%) 0%, transparent 60%)',
      }} />
      {/* Fixed header */}
      <ZaraHeader onMenuClick={() => setDrawerOpen(true)} />

      {/* Full-screen drawer */}
      <ZaraDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content with top padding for fixed header */}
      <main className="flex-1 flex flex-col w-full min-w-0 pt-14">
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>

      {/* Legal footer */}
      <LegalFooter onOpenCookieSettings={() => setCookieSettingsOpen(true)} />

      {/* Cookie consent */}
      <CookieConsent
        forceOpen={cookieSettingsOpen}
        onClose={() => setCookieSettingsOpen(false)}
      />
    </div>
  );
}

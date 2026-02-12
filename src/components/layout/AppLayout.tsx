import { ReactNode, useState } from "react";
import { ZaraHeader } from "./ZaraHeader";
import { ZaraDrawer } from "./ZaraDrawer";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
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
    </div>
  );
}

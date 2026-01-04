import { ReactNode, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ZaraDrawer, ZaraDrawerContent } from "@/components/ui/zara-drawer";
import { MenuToggle } from "./MenuToggle";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block flex-shrink-0">
        <AppSidebar />
      </div>
      
      <main className="flex-1 flex flex-col w-full min-w-0">
        {/* Mobile menu - ZARA-style drawer */}
        <div className="md:hidden">
          <MenuToggle 
            isOpen={mobileNavOpen} 
            onClick={() => setMobileNavOpen(!mobileNavOpen)} 
          />
          <ZaraDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <ZaraDrawerContent>
              <MobileNav onNavigate={() => setMobileNavOpen(false)} />
            </ZaraDrawerContent>
          </ZaraDrawer>
        </div>
        
        <div className="flex-1 flex flex-col overflow-auto px-6 lg:px-10 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

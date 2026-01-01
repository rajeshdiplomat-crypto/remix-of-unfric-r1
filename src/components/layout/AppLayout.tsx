import { ReactNode, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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
        {/* Mobile menu - only visible on mobile */}
        <div className="md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 fixed top-3 left-3 z-50 bg-card/80 backdrop-blur-sm border border-border">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <MobileNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex-1 flex flex-col overflow-auto px-4 lg:px-6 py-4">
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

import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <MobileNav onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            
            {/* Desktop sidebar trigger */}
            <div className="hidden md:block">
              <SidebarTrigger />
            </div>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col overflow-auto p-3 sm:p-4 md:p-6">
          <div className="flex-1 w-full max-w-[2400px] mx-auto px-0 sm:px-2 lg:px-4 xl:px-8 2xl:px-12">
            {children}
          </div>
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

import { EmotionEntry } from "./types";

interface EmotionsPageLayoutProps {
  children: React.ReactNode;
  entries?: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionsPageLayout({ 
  children, 
}: EmotionsPageLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}

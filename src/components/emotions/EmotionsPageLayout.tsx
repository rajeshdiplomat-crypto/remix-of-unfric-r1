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
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

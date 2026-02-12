import type { SourceModule } from "./types";

interface DiaryLeftSidebarProps {
  userName: string;
  filter: SourceModule | 'all' | 'saved';
  onFilterChange: (filter: SourceModule | 'all' | 'saved') => void;
}

export function DiaryLeftSidebar({
  userName,
  filter,
  onFilterChange,
}: DiaryLeftSidebarProps) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Placeholder - content to be added later */}
    </div>
  );
}

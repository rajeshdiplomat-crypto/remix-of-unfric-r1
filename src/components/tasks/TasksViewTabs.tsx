import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Columns3, Clock, FileText } from "lucide-react";

export type TasksViewTab = "overview" | "lists" | "board" | "timeline" | "files";

interface TasksViewTabsProps {
  activeTab: TasksViewTab;
  onTabChange: (tab: TasksViewTab) => void;
}

const tabs: { id: TasksViewTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "lists", label: "Lists", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "files", label: "Files", icon: FileText },
];

export function TasksViewTabs({ activeTab, onTabChange }: TasksViewTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TasksViewTab)}>
      <TabsList className="w-full justify-start border-b border-border/40 rounded-none px-0 gap-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <TabsTrigger key={id} value={id} className="gap-1.5 text-[11px]">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

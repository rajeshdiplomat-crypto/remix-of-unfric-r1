import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Columns3, Clock } from "lucide-react";

export type TasksViewTab = "lists" | "board" | "timeline";

interface TasksViewTabsProps {
  activeTab: TasksViewTab;
  onTabChange: (tab: TasksViewTab) => void;
}

const tabs: { id: TasksViewTab; label: string; icon: React.ElementType }[] = [
  { id: "lists", label: "Lists", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: Clock },
];

export function TasksViewTabs({ activeTab, onTabChange }: TasksViewTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TasksViewTab)}>
      <TabsList className="w-full justify-start border-b border-border rounded-none px-0 gap-4">
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

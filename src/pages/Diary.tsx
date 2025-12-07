import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DiaryEntry {
  id: string;
  type: "emotion" | "journal" | "manifest" | "habit" | "note" | "task";
  title: string;
  preview: string;
  date: string;
  icon: typeof Heart;
}

const typeConfig = {
  emotion: { icon: Heart, label: "Emotion", color: "bg-pink-500/10 text-pink-500" },
  journal: { icon: PenLine, label: "Journal", color: "bg-blue-500/10 text-blue-500" },
  manifest: { icon: Sparkles, label: "Manifest", color: "bg-purple-500/10 text-purple-500" },
  habit: { icon: BarChart3, label: "Habit", color: "bg-green-500/10 text-green-500" },
  note: { icon: FileText, label: "Note", color: "bg-orange-500/10 text-orange-500" },
  task: { icon: CheckSquare, label: "Task", color: "bg-cyan-500/10 text-cyan-500" },
};

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchAllEntries() {
      setLoading(true);
      const allEntries: DiaryEntry[] = [];

      // Fetch emotions
      const { data: emotions } = await supabase
        .from("emotions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      emotions?.forEach((e) => {
        allEntries.push({
          id: e.id,
          type: "emotion",
          title: e.emotion,
          preview: e.notes || `Feeling ${e.emotion}`,
          date: e.created_at,
          icon: Heart,
        });
      });

      // Fetch journal entries
      const { data: journals } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      journals?.forEach((j) => {
        allEntries.push({
          id: j.id,
          type: "journal",
          title: `Journal - ${format(new Date(j.entry_date), "MMM d")}`,
          preview: j.daily_feeling || j.daily_gratitude || "Journal entry",
          date: j.created_at,
          icon: PenLine,
        });
      });

      // Fetch manifest goals
      const { data: goals } = await supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      goals?.forEach((g) => {
        allEntries.push({
          id: g.id,
          type: "manifest",
          title: g.title,
          preview: g.description || "Manifestation goal",
          date: g.created_at,
          icon: Sparkles,
        });
      });

      // Fetch notes
      const { data: notes } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      notes?.forEach((n) => {
        allEntries.push({
          id: n.id,
          type: "note",
          title: n.title,
          preview: n.content?.substring(0, 100) || "Note",
          date: n.created_at,
          icon: FileText,
        });
      });

      // Fetch tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      tasks?.forEach((t) => {
        allEntries.push({
          id: t.id,
          type: "task",
          title: t.title,
          preview: t.description || (t.is_completed ? "Completed" : "Pending"),
          date: t.created_at,
          icon: CheckSquare,
        });
      });

      // Sort all entries by date
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(allEntries);
      setLoading(false);
    }

    fetchAllEntries();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Diary</h1>
        <p className="text-muted-foreground mt-1">
          A timeline of all your entries across modules
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <PenLine className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
          <p className="text-muted-foreground mt-1">
            Start journaling, tracking emotions, or creating goals to see them here.
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-4 pr-4">
            {entries.map((entry) => {
              const config = typeConfig[entry.type];
              const IconComponent = config.icon;
              return (
                <Card key={entry.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base">{entry.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{entry.preview}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(entry.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

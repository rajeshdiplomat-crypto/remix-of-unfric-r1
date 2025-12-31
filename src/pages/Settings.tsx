import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Download, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { FontSelector } from "@/components/settings/FontSelector";
import { MotionToggle } from "@/components/settings/MotionToggle";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    if (!user) return;

    setExporting(true);

    try {
      const [emotions, journals, goals, habits, notes, tasks] = await Promise.all([
        supabase.from("emotions").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("manifest_goals").select("*").eq("user_id", user.id),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        emotions: emotions.data,
        journals: journals.data,
        manifestGoals: goals.data,
        habits: habits.data,
        notes: notes.data,
        tasks: tasks.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindflow-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Exported!", description: "Your data has been downloaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    }

    setExporting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xl bg-primary/20 text-primary">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium text-foreground">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">
              Connected via Google. Email cannot be changed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Selector */}
      <FontSelector />

      {/* Theme Selector */}
      <ThemeSelector />

      {/* Motion Toggle */}
      <MotionToggle />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>Download all your data as JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export all your emotions, journal entries, goals, habits, notes, and tasks.
          </p>
          <Button onClick={exportData} disabled={exporting} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export Data"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            Sign Out
          </CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signOut} variant="destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

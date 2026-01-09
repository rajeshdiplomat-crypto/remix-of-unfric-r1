import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Shield, Lock, Eye, Download, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserSettings } from '@/hooks/useUserSettings';

interface PrivacySectionProps {
  settings: UserSettings | null;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  saving: boolean;
}

export function PrivacySection({ settings, onUpdate, saving }: PrivacySectionProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportData = async () => {
    if (!user) return;
    setExporting(true);

    try {
      const [emotions, journals, goals, habits, notes, tasks, profile, userSettings] =
        await Promise.all([
          supabase.from('emotions').select('*').eq('user_id', user.id),
          supabase.from('journal_entries').select('*').eq('user_id', user.id),
          supabase.from('manifest_goals').select('*').eq('user_id', user.id),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('notes').select('*').eq('user_id', user.id),
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('profiles').select('*').eq('user_id', user.id),
          supabase.from('user_settings').select('*').eq('user_id', user.id),
        ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: { email: user.email },
        profile: profile.data,
        settings: userSettings.data,
        emotions: emotions.data,
        journals: journals.data,
        manifestGoals: goals.data,
        habits: habits.data,
        notes: notes.data,
        tasks: tasks.data,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unfric-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Data exported', description: 'Your backup has been downloaded' });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    }

    setExporting(false);
  };

  const deleteAllData = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      // Delete all user data from tables
      await Promise.all([
        supabase.from('emotions').delete().eq('user_id', user.id),
        supabase.from('journal_entries').delete().eq('user_id', user.id),
        supabase.from('manifest_goals').delete().eq('user_id', user.id),
        supabase.from('habits').delete().eq('user_id', user.id),
        supabase.from('habit_completions').delete().eq('user_id', user.id),
        supabase.from('notes').delete().eq('user_id', user.id),
        supabase.from('tasks').delete().eq('user_id', user.id),
        supabase.from('feed_events').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
      ]);

      toast({
        title: 'Data deleted',
        description: 'All your data has been permanently removed',
      });

      // Sign out after deletion
      await signOut();
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
    }

    setDeleting(false);
  };

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Security
        </CardTitle>
        <CardDescription>Protect your sensitive diary and emotion data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>App Lock</Label>
                <p className="text-xs text-muted-foreground">
                  Require passcode or biometrics to open
                </p>
              </div>
            </div>
            <Switch
              checked={settings.privacy_passcode_enabled}
              onCheckedChange={(checked) => onUpdate({ privacy_passcode_enabled: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Hide Sensitive Content</Label>
                <p className="text-xs text-muted-foreground">
                  Blur diary and emotion previews on screen
                </p>
              </div>
            </div>
            <Switch
              checked={settings.privacy_blur_sensitive}
              onCheckedChange={(checked) => onUpdate({ privacy_blur_sensitive: checked })}
              disabled={saving}
            />
          </div>
        </div>

        {/* Data management */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium">Data Management</h4>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={exportData} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All Data'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your data including journals, emotions,
                    tasks, notes, habits, and goals. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllData}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting...' : 'Delete Everything'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground">
            Export creates a JSON backup of all your data. Delete removes everything permanently.
          </p>
        </div>

        {/* Sign out */}
        <div className="pt-4 border-t">
          <Button variant="destructive" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

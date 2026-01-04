import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Globe, Calendar, Clock, Home, Bell } from 'lucide-react';
import { UserSettings } from '@/hooks/useUserSettings';

interface AppPreferencesSectionProps {
  settings: UserSettings | null;
  onUpdate: (updates: Partial<UserSettings>) => Promise<void>;
  saving: boolean;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const HOME_SCREENS = [
  { value: 'diary', label: 'Diary' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'emotions', label: 'Emotions' },
  { value: 'journal', label: 'Journal' },
  { value: 'manifest', label: 'Manifest' },
  { value: 'trackers', label: 'Trackers' },
  { value: 'notes', label: 'Notes' },
];

const RESET_TIMES = [
  { value: '00:00', label: 'Midnight (12:00 AM)' },
  { value: '02:00', label: '2:00 AM (Night owl)' },
  { value: '03:00', label: '3:00 AM' },
  { value: '04:00', label: '4:00 AM (Early bird)' },
  { value: '05:00', label: '5:00 AM' },
  { value: '06:00', label: '6:00 AM' },
];

export function AppPreferencesSection({ settings, onUpdate, saving }: AppPreferencesSectionProps) {
  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          App Preferences
        </CardTitle>
        <CardDescription>Customize how the app works for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time & Date settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Time & Date
          </h4>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => onUpdate({ timezone: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={settings.date_format}
                onValueChange={(value) => onUpdate({ date_format: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((fmt) => (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Start of Week
              </Label>
              <Select
                value={settings.start_of_week}
                onValueChange={(value) => onUpdate({ start_of_week: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Daily Reset Time
              </Label>
              <Select
                value={settings.daily_reset_time}
                onValueChange={(value) => onUpdate({ daily_reset_time: value })}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESET_TIMES.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When your "day" ends for habits and tasks
              </p>
            </div>
          </div>
        </div>

        {/* Default screen */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            Default Home Screen
          </h4>
          <Select
            value={settings.default_home_screen}
            onValueChange={(value) => onUpdate({ default_home_screen: value })}
            disabled={saving}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOME_SCREENS.map((screen) => (
                <SelectItem key={screen.value} value={screen.value}>
                  {screen.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The screen shown when you open the app
          </p>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Notification Preferences
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Diary prompts</Label>
                <p className="text-xs text-muted-foreground">
                  Reminders to write in your diary
                </p>
              </div>
              <Switch
                checked={settings.notification_diary_prompt}
                onCheckedChange={(checked) =>
                  onUpdate({ notification_diary_prompt: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Task reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Notifications for upcoming tasks
                </p>
              </div>
              <Switch
                checked={settings.notification_task_reminder}
                onCheckedChange={(checked) =>
                  onUpdate({ notification_task_reminder: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Emotion check-in</Label>
                <p className="text-xs text-muted-foreground">
                  Daily prompts to log your emotions
                </p>
              </div>
              <Switch
                checked={settings.notification_emotion_checkin}
                onCheckedChange={(checked) =>
                  onUpdate({ notification_emotion_checkin: checked })
                }
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

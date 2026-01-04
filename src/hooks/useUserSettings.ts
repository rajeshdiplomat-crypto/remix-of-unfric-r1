import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserSettings {
  id: string;
  user_id: string;
  timezone: string;
  start_of_week: string;
  daily_reset_time: string;
  date_format: string;
  default_home_screen: string;
  notification_diary_prompt: boolean;
  notification_task_reminder: boolean;
  notification_emotion_checkin: boolean;
  privacy_passcode_enabled: boolean;
  privacy_blur_sensitive: boolean;
  note_skin_preference: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  focus_areas: string[];
}

const defaultSettings: Partial<UserSettings> = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  start_of_week: 'monday',
  daily_reset_time: '00:00',
  date_format: 'MM/DD/YYYY',
  default_home_screen: 'diary',
  notification_diary_prompt: true,
  notification_task_reminder: true,
  notification_emotion_checkin: true,
  privacy_passcode_enabled: false,
  privacy_blur_sensitive: false,
};

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettingsAndProfile();
    }
  }, [user]);

  const fetchSettingsAndProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setSettings(settingsData as unknown as UserSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ...defaultSettings })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings as unknown as UserSettings);
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error loading settings',
        description: error.message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast({ title: 'Settings saved' });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    }

    setSaving(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('user_id', user.id);

      if (error) throw error;

      // Also update auth metadata for avatar and full_name
      if (updates.full_name || updates.avatar_url) {
        await supabase.auth.updateUser({
          data: {
            full_name: updates.full_name ?? profile?.full_name,
            avatar_url: updates.avatar_url ?? profile?.avatar_url,
          },
        });
      }

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      toast({ title: 'Profile saved' });
    } catch (error: any) {
      toast({
        title: 'Error saving profile',
        description: error.message,
        variant: 'destructive',
      });
    }

    setSaving(false);
  };

  return {
    settings,
    profile,
    loading,
    saving,
    updateSettings,
    updateProfile,
    refetch: fetchSettingsAndProfile,
  };
}

import { ProfileSection } from "@/components/settings/ProfileSection";
import { AppPreferencesSection } from "@/components/settings/AppPreferencesSection";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { FontSelector } from "@/components/settings/FontSelector";
import { MotionToggle } from "@/components/settings/MotionToggle";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { settings, profile, loading, saving, updateSettings, updateProfile } = useUserSettings();

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-8 px-6 lg:px-8 pt-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <ProfileSection profile={profile} onSave={updateProfile} saving={saving} />

      {/* App Preferences Section */}
      <AppPreferencesSection settings={settings} onUpdate={updateSettings} saving={saving} />

      {/* Appearance */}
      <FontSelector />
      <ThemeSelector />
      <MotionToggle />

      {/* Privacy & Security Section */}
      <PrivacySection settings={settings} onUpdate={updateSettings} saving={saving} />
    </div>
  );
}

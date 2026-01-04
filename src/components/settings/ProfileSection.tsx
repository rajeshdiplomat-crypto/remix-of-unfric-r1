import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, X, User, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  saving: boolean;
}

const FOCUS_AREA_OPTIONS = [
  'Health',
  'Career',
  'Wellness',
  'Fitness',
  'Mindfulness',
  'Productivity',
  'Relationships',
  'Learning',
  'Creativity',
  'Finance',
];

export function ProfileSection({ profile, onSave, saving }: ProfileSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || user?.user_metadata?.bio || '');
  const [focusAreas, setFocusAreas] = useState<string[]>(profile?.focus_areas || []);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl(null);
    setAvatarUrl('');
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setUploading(true);

    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = data.publicUrl;
      }

      await onSave({
        full_name: fullName,
        username: username || null,
        bio: bio || null,
        avatar_url: newAvatarUrl || null,
        focus_areas: focusAreas,
      });

      setPreviewUrl(null);
      setAvatarFile(null);
      setAvatarUrl(newAvatarUrl);
    } catch (error: any) {
      toast({
        title: 'Error saving profile',
        description: error.message,
        variant: 'destructive',
      });
    }

    setUploading(false);
  };

  const displayAvatar = previewUrl || avatarUrl;
  const hasChanges =
    fullName !== (profile?.full_name || '') ||
    username !== (profile?.username || '') ||
    bio !== (profile?.bio || '') ||
    JSON.stringify(focusAreas) !== JSON.stringify(profile?.focus_areas || []) ||
    avatarFile !== null ||
    avatarUrl !== (profile?.avatar_url || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription>Your personal information and identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-2 ring-border">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-medium">
                {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'absolute bottom-0 right-0 p-2 rounded-full',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors shadow-md'
              )}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              Upload a profile photo. Max 5MB.
            </p>
            {displayAvatar && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleRemoveAvatar}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove photo
              </Button>
            )}
          </div>
        </div>

        {/* Name and username */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Display Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="@handle"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio (optional)</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What are you working on right now?"
            className="resize-none h-20"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
        </div>

        {/* Focus areas */}
        <div className="space-y-2">
          <Label>Focus Areas (optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Select areas you're focusing on for self-improvement
          </p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREA_OPTIONS.map((area) => (
              <Badge
                key={area}
                variant={focusAreas.includes(area) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => toggleFocusArea(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>

        {/* Save button */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving || uploading} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving || uploading ? 'Saving...' : 'Save Profile'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

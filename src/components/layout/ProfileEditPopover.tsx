import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Camera, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProfileEditPopoverProps {
  collapsed?: boolean;
}

export function ProfileEditPopover({ collapsed }: ProfileEditPopoverProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [bio, setBio] = useState(user?.user_metadata?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrl;
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          bio: bio,
          avatar_url: newAvatarUrl,
        }
      });

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setPreviewUrl(null);
      setAvatarFile(null);
      setOpen(false);
      
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({ 
        title: "Failed to update profile", 
        description: error.message,
        variant: "destructive" 
      });
    }

    setLoading(false);
  };

  const displayAvatar = previewUrl || avatarUrl;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayBio = user?.user_metadata?.bio;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "w-full rounded-2xl transition-all duration-200",
            "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
            "hover:from-primary/15 hover:via-primary/10 hover:shadow-sm",
            "border border-primary/10",
            collapsed ? "p-2 flex items-center justify-center" : "p-4"
          )}
        >
          {collapsed ? (
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="bg-primary/20 text-primary font-semibold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-sidebar-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Edit profile
                </p>
              </div>
            </div>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="right" 
        align="end" 
        className="w-72 p-4"
        sideOffset={8}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Edit Profile</h4>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "absolute bottom-0 right-0 p-1.5 rounded-full",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90 transition-colors"
                )}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Display Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="h-9"
            />
          </div>

          {/* Bio field */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="resize-none h-20"
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>

          {/* Save button */}
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

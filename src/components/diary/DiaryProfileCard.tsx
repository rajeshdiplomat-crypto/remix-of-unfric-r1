import { User, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DiaryProfileCardProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
}

export function DiaryProfileCard({ userName, userEmail, avatarUrl }: DiaryProfileCardProps) {
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Card className="bg-card border-border/40 overflow-hidden">
      {/* Cover banner */}
      <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
      
      <CardContent className="pt-0 -mt-8 space-y-3">
        {/* Avatar */}
        <Avatar className="h-16 w-16 border-4 border-card shadow-sm">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Name & email */}
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>

        <div className="h-px bg-border" />

        {/* Quick stats row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Joined {format(new Date(), "MMMM yyyy")}</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Tracking your personal growth journey across journaling, habits, emotions, and more.
        </p>
      </CardContent>
    </Card>
  );
}

import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PenLine, CheckSquare, Heart, User } from "lucide-react";

interface DiaryCreatePostProps {
  userName: string;
  onOpenJournal: () => void;
}

export function DiaryCreatePost({ userName, onOpenJournal }: DiaryCreatePostProps) {
  const navigate = useNavigate();

  return (
    <Card className="mb-4 bg-card border-border/40 shadow-sm">
      {/* Main composer area */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div 
          className="flex-1 bg-muted/50 hover:bg-muted/70 rounded-full px-4 py-2.5 cursor-pointer transition-colors"
          onClick={onOpenJournal}
        >
          <span className="text-sm text-muted-foreground">
            What's on your mind, {userName.split(' ')[0]}?
          </span>
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* Quick action buttons */}
      <div className="flex items-center justify-around p-2">
        <Button 
          variant="ghost" 
          size="sm"
          className="flex-1 gap-2 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={onOpenJournal}
        >
          <PenLine className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Journal</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex-1 gap-2 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={() => navigate('/tasks')}
        >
          <CheckSquare className="h-5 w-5 text-accent-foreground" />
          <span className="text-sm font-medium">Task</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex-1 gap-2 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={() => navigate('/emotions')}
        >
          <Heart className="h-5 w-5 text-destructive" />
          <span className="text-sm font-medium">Check-in</span>
        </Button>
      </div>
    </Card>
  );
}

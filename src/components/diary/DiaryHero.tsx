import { format } from "date-fns";

interface DiaryHeroProps {
  userName: string;
}

export function DiaryHero({ userName }: DiaryHeroProps) {
  const today = new Date();
  const greeting = getGreeting();
  
  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {format(today, "EEEE, MMMM d")}
        </span>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening in your world today.
        </p>
      </div>
    </div>
  );
}

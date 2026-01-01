import type { LucideIcon } from "lucide-react";

export type FeedEventType = 'create' | 'update' | 'publish' | 'complete' | 'checkin' | 'focus_end' | 'streak_milestone' | 'journal_question';
export type SourceModule = 'tasks' | 'journal' | 'notes' | 'mindmap' | 'trackers' | 'manifest' | 'focus';

export interface FeedEvent {
  id: string;
  user_id: string;
  type: FeedEventType;
  source_module: SourceModule;
  source_id: string | null;
  title: string;
  summary: string | null;
  content_preview: string | null;
  media: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface FeedReaction {
  id: string;
  user_id: string;
  feed_event_id: string;
  emoji: string;
  created_at: string;
}

export interface FeedComment {
  id: string;
  user_id: string;
  feed_event_id: string;
  parent_comment_id: string | null;
  text: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  replies?: FeedComment[];
}

export interface FeedSave {
  id: string;
  user_id: string;
  feed_event_id: string;
  created_at: string;
}

export interface ModuleConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

export type TimeRange = 'today' | 'week' | 'month';

export interface MetricsSnapshot {
  tasks: {
    dueToday: number;
    completed: number;
    planned: number;
  };
  trackers: {
    completionPercent: number;
    sessionsCompleted: number;
  };
  journal: {
    entriesWritten: number;
    streak: number;
  };
  focus: {
    focusMinutes: number;
    sessionsCompleted: number;
  };
  manifest: {
    checkInsDone: number;
    goalsActive: number;
  };
  notes: {
    created: number;
    updated: number;
  };
}

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🙏", "🔥", "💯"];

export const DAILY_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
];

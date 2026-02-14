import type { LucideIcon } from "lucide-react";

export type FeedEventType = 'create' | 'update' | 'delete' | 'publish' | 'complete' | 'checkin' | 'focus_end' | 'streak_milestone' | 'journal_question';
export type SourceModule = 'tasks' | 'journal' | 'notes' | 'mindmap' | 'trackers' | 'manifest' | 'emotions';

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
  manifest: {
    checkInsDone: number;
    goalsActive: number;
  };
  notes: {
    created: number;
    updated: number;
  };
  emotions: {
    checkIns: number;
  };
}


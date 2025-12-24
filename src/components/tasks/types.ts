export type Urgency = 'low' | 'high';
export type Importance = 'low' | 'high';
export type Status = 'overdue' | 'ongoing' | 'upcoming' | 'completed';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type DateBucket = 'yesterday' | 'today' | 'tomorrow' | 'week';

export type QuadrantMode = 'urgent-important' | 'status' | 'date' | 'time';

export interface QuadrantTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  // Extended fields for quadrant
  urgency: Urgency;
  importance: Importance;
  status: Status;
  time_of_day: TimeOfDay;
  date_bucket: DateBucket;
  tags: string[];
  subtasks: Subtask[];
  quadrant_assigned: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface QuadrantConfig {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
}

export const QUADRANT_MODES: Record<QuadrantMode, { label: string; quadrants: QuadrantConfig[] }> = {
  'urgent-important': {
    label: 'Urgent × Important',
    quadrants: [
      { id: 'urgent-important', title: 'URGENT & IMPORTANT', icon: 'flame', color: 'hsl(var(--destructive))' },
      { id: 'urgent-not-important', title: 'URGENT & NOT IMPORTANT', icon: 'clock', color: 'hsl(var(--chart-1))' },
      { id: 'not-urgent-important', title: 'NOT URGENT & IMPORTANT', icon: 'sparkles', color: 'hsl(var(--primary))' },
      { id: 'not-urgent-not-important', title: 'NOT URGENT & NOT IMPORTANT', icon: 'archive', color: 'hsl(var(--muted))' },
    ],
  },
  'status': {
    label: 'Status',
    quadrants: [
      { id: 'overdue', title: 'OVERDUE', icon: 'alert-triangle', color: 'hsl(var(--destructive))' },
      { id: 'ongoing', title: 'ONGOING', icon: 'play', color: 'hsl(var(--chart-1))' },
      { id: 'upcoming', title: 'UPCOMING', icon: 'calendar', color: 'hsl(var(--primary))' },
      { id: 'completed', title: 'COMPLETED', icon: 'check-circle', color: 'hsl(var(--muted))' },
    ],
  },
  'date': {
    label: 'Date',
    quadrants: [
      { id: 'yesterday', title: 'YESTERDAY', icon: 'clock', color: 'hsl(var(--destructive))' },
      { id: 'today', title: 'TODAY', icon: 'sun', color: 'hsl(var(--chart-1))' },
      { id: 'tomorrow', title: 'TOMORROW', icon: 'sunrise', color: 'hsl(var(--primary))' },
      { id: 'week', title: 'THIS WEEK', icon: 'calendar', color: 'hsl(var(--muted))' },
    ],
  },
  'time': {
    label: 'Time of Day',
    quadrants: [
      { id: 'morning', title: 'MORNING', icon: 'sunrise', color: 'hsl(var(--chart-1))' },
      { id: 'afternoon', title: 'AFTERNOON', icon: 'sun', color: 'hsl(var(--primary))' },
      { id: 'evening', title: 'EVENING', icon: 'sunset', color: 'hsl(var(--chart-2))' },
      { id: 'night', title: 'NIGHT', icon: 'moon', color: 'hsl(var(--muted))' },
    ],
  },
};

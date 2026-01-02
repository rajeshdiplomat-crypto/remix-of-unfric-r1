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
  due_time: string | null;
  priority: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  started_at: string | null;
  // Reminder & Alarm
  reminder_at: string | null;
  alarm_enabled: boolean;
  // Focus tracking
  total_focus_minutes: number;
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

// Compute task status based on fields
export function computeTaskStatus(task: QuadrantTask): Status {
  if (task.completed_at || task.is_completed) return 'completed';
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    dueDate.setHours(23, 59, 59, 999);
    if (new Date() > dueDate) return 'overdue';
  }
  if (task.started_at) return 'ongoing';
  return 'upcoming';
}

export function suggestTimeOfDay(dueTime: string | null): TimeOfDay {
  if (!dueTime) return 'morning';
  const [hours] = dueTime.split(':').map(Number);
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 21) return 'evening';
  return 'night';
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

export const BOARD_COLUMNS: QuadrantConfig[] = [
  { id: 'overdue', title: 'OVERDUE', icon: 'alert-triangle', color: 'hsl(var(--destructive))' },
  { id: 'upcoming', title: 'UPCOMING', icon: 'calendar', color: 'hsl(var(--primary))' },
  { id: 'ongoing', title: 'ONGOING', icon: 'play', color: 'hsl(var(--chart-1))' },
  { id: 'completed', title: 'COMPLETED', icon: 'check-circle', color: 'hsl(var(--muted))' },
];

// Default task template
export const createDefaultTask = (overrides?: Partial<QuadrantTask>): QuadrantTask => ({
  id: crypto.randomUUID(),
  title: '',
  description: null,
  due_date: null,
  due_time: null,
  priority: 'medium',
  is_completed: false,
  completed_at: null,
  created_at: new Date().toISOString(),
  started_at: null,
  reminder_at: null,
  alarm_enabled: false,
  total_focus_minutes: 0,
  urgency: 'low',
  importance: 'low',
  status: 'upcoming',
  time_of_day: 'morning',
  date_bucket: 'today',
  tags: [],
  subtasks: [],
  quadrant_assigned: false,
  ...overrides,
});

export interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
  category?: string;
  cover_image?: string;
  target_date?: string;
  visualization_length?: number;
  daily_affirmation?: string;
  check_in_time?: string;
  act_as_if?: string;
  conviction?: number;
  live_from_end?: string;
  woop?: {
    wish: string;
    outcome: string;
    obstacle: string;
    plan: string;
  };
  if_then_triggers?: Array<{ id: string; if_part: string; then_part: string }>;
  micro_step?: string;
}

export interface ManifestCheckIn {
  id: string;
  goal_id: string;
  user_id: string;
  entry_date: string;
  created_at: string;
  alignment: number;
  acted_today: 'yes' | 'mostly' | 'not_yet';
  proofs: string[];
  proof_images?: string[];
  growth_note?: string;
  gratitude?: string;
}

export interface StarterTemplate {
  id: string;
  name: string;
  category: string;
  assumption: string;
  act_as_if: string;
  visualization_script: string;
  affirmation: string;
}

export const CATEGORIES = [
  { id: "all", label: "All", icon: "Target" },
  { id: "wealth", label: "Wealth", icon: "DollarSign" },
  { id: "health", label: "Health", icon: "Heart" },
  { id: "career", label: "Career", icon: "Briefcase" },
  { id: "growth", label: "Growth", icon: "TrendingUp" },
  { id: "habits", label: "Habits", icon: "Repeat" },
] as const;

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "career",
    name: "Career Leap",
    category: "career",
    assumption: "I am confidently in my ideal role and growing every month.",
    act_as_if: "I update my LinkedIn with my new title mindset",
    visualization_script: "See yourself walking into the office of your dreams. Feel the confidence in your stride. Hear your colleagues congratulating you.",
    affirmation: "I attract opportunities that align with my highest self."
  },
  {
    id: "wealth",
    name: "Wealth Flow",
    category: "wealth",
    assumption: "Money flows to me easily and abundantly.",
    act_as_if: "I review my investment portfolio as a wealthy person would",
    visualization_script: "Picture your bank balance growing. Feel the security and freedom wealth provides. See yourself making generous decisions.",
    affirmation: "I am a magnet for financial abundance."
  },
  {
    id: "health",
    name: "Vibrant Health",
    category: "health",
    assumption: "My body is strong, healthy, and full of energy.",
    act_as_if: "I prepare my workout clothes the night before",
    visualization_script: "Feel the vitality flowing through every cell. See yourself moving with ease and joy. Experience the energy of optimal health.",
    affirmation: "Every cell in my body vibrates with health and vitality."
  },
  {
    id: "habit",
    name: "Daily Discipline",
    category: "habits",
    assumption: "I naturally follow through on my commitments to myself.",
    act_as_if: "I set my alarm 30 minutes earlier as a disciplined person would",
    visualization_script: "See yourself completing your daily routine with ease. Feel the pride of consistency. Watch your habits compound into success.",
    affirmation: "I am someone who keeps promises to myself."
  },
  {
    id: "relationship",
    name: "Deep Connection",
    category: "growth",
    assumption: "I attract and maintain loving, supportive relationships.",
    act_as_if: "I reach out to express appreciation to someone I care about",
    visualization_script: "Feel the warmth of genuine connection. See yourself surrounded by people who uplift you. Experience the joy of deep bonds.",
    affirmation: "I give and receive love freely and abundantly."
  },
  {
    id: "learning",
    name: "Rapid Learning",
    category: "growth",
    assumption: "I absorb and apply new knowledge with ease.",
    act_as_if: "I dedicate focused time to learning something new today",
    visualization_script: "See yourself mastering a new skill. Feel the satisfaction of understanding. Watch yourself confidently applying what you've learned.",
    affirmation: "My mind is sharp, curious, and always growing."
  }
];

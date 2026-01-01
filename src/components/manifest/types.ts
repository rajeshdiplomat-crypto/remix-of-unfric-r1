export interface ManifestGoal {
  id: string;
  user_id: string;
  title: string; // The assumption (present tense)
  category: string;
  vision_image_url?: string;
  target_date?: string;
  live_from_end?: string;
  act_as_if: string;
  conviction: number; // Latest conviction 1-10
  visualization_minutes: 3 | 5 | 10;
  daily_affirmation: string;
  check_in_time: string;
  committed_7_days: boolean;
  is_completed: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ManifestProof {
  id: string;
  goal_id: string;
  text: string;
  image_url?: string;
  created_at: string;
}

export interface ManifestConviction {
  id: string;
  goal_id: string;
  value: number; // 1-10
  entry_date: string;
  created_at: string;
}

export interface ManifestDailyPractice {
  id: string;
  goal_id: string;
  user_id: string;
  entry_date: string;
  created_at: string;
  
  // Section 1 - Daily Practice
  visualization_completed: boolean;
  acted: boolean;
  proof_text?: string;
  proof_image_url?: string;
  custom_act_as_if?: string; // User's custom act-as-if for this day
  
  // Section 2 - Daily Check-in
  alignment?: number; // 1-10
  growth_note?: string;
  gratitude?: string;
  
  // Lock state
  locked: boolean;
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

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "career",
    name: "Career",
    category: "career",
    assumption: "I am thriving in my ideal role.",
    act_as_if: "Update profile",
    visualization_script: "See yourself on day one of your dream role. Feel the confidence as you walk through the door.",
    affirmation: "My ideal career is unfolding perfectly for me."
  },
  {
    id: "wealth",
    name: "Wealth",
    category: "wealth",
    assumption: "My income grows steadily.",
    act_as_if: "Automate savings",
    visualization_script: "Picture your bank balance growing. Feel the security and freedom wealth provides.",
    affirmation: "Abundance flows to me naturally and consistently."
  },
  {
    id: "health",
    name: "Health",
    category: "health",
    assumption: "I feel energetic every morning.",
    act_as_if: "10-min movement now",
    visualization_script: "Feel the vitality flowing through every cell. See yourself moving with ease and joy.",
    affirmation: "My body is strong, healthy, and full of energy."
  },
  {
    id: "habit",
    name: "Habit",
    category: "habits",
    assumption: "I read nightly.",
    act_as_if: "Read one page tonight",
    visualization_script: "See yourself finishing the book. Feel the satisfaction of consistent practice.",
    affirmation: "I naturally follow through on my commitments."
  },
  {
    id: "relationships",
    name: "Relationships",
    category: "relationships",
    assumption: "My relationships are warm and supportive.",
    act_as_if: "Send a gratitude message",
    visualization_script: "Feel the warmth of genuine connection. See yourself surrounded by people who uplift you.",
    affirmation: "I attract and nurture loving relationships."
  },
  {
    id: "learning",
    name: "Learning",
    category: "learning",
    assumption: "I practice 15 minutes daily and improve.",
    act_as_if: "Do one practice task now",
    visualization_script: "See yourself mastering a new skill. Feel the satisfaction of growth and understanding.",
    affirmation: "I learn and grow with ease every day."
  }
];

export const ACT_AS_IF_OPTIONS = [
  "Update profile",
  "Send one confident message",
  "Practice 5-min pitch",
  "Dress the part"
];

export const CATEGORIES = [
  { id: "career", label: "Career" },
  { id: "wealth", label: "Wealth" },
  { id: "health", label: "Health" },
  { id: "habits", label: "Habits" },
  { id: "relationships", label: "Relationships" },
  { id: "learning", label: "Learning" },
  { id: "other", label: "Other" }
];

// Draft storage key
export const MANIFEST_DRAFT_KEY = "manifest_create_draft";
export const GOAL_EXTRAS_KEY = "manifest_goal_extras";
export const DAILY_PRACTICE_KEY = "manifest_daily_practice";

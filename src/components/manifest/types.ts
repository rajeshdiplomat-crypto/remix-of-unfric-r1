export interface ManifestGoal {
  id: string;
  title: string; // The assumption
  conviction: number; // 1-10
  live_from_end?: string;
  act_as_if: string;
  visualization_minutes: 3 | 5 | 10;
  daily_affirmation: string;
  check_in_time: string;
  committed_7_days: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ManifestCheckIn {
  id: string;
  goal_id: string;
  user_id: string;
  entry_date: string;
  created_at: string;
  alignment: number; // 1-10
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

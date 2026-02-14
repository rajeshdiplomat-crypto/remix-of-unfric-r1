// Journal Data Models

export interface JournalEntry {
  id: string;
  entryDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  title: string;
  preview?: string; // First 3 lines of content for display
  contentJSON: string; // TipTap JSON content
  mood?: string;
  tags?: string[];
  imagesData?: string[]; // Attached image URLs
}

export interface JournalQuestion {
  id: string;
  text: string;
  type: "heading+answer";
}

export interface JournalTemplate {
  questions: JournalQuestion[];
  applyOnNewEntry: boolean;
  unstructured: boolean;
  defaultSkinId: string;
  /** ISO date (YYYY-MM-DD) from which the current mode takes effect */
  effectiveFrom?: string;
}

export interface JournalSkin {
  id: string;
  name: string;
  pageBg: string;
  panelBg: string;
  cardBg: string;
  border: string;
  shadow: string;
  text: string;
  mutedText: string;
  editorPaperBg?: string;
  accent: string;
}

export const DEFAULT_QUESTIONS: JournalQuestion[] = [
  { id: "q1", text: "How are you feeling today?", type: "heading+answer" },
  { id: "q2", text: "What are you grateful for?", type: "heading+answer" },
  { id: "q3", text: "What act of kindness did you do or receive?", type: "heading+answer" },
  { id: "q4", text: "Additional thoughts…", type: "heading+answer" },
];

export const JOURNAL_SKINS: JournalSkin[] = [
  {
    id: "minimal-light",
    name: "Minimal Light",
    pageBg: "hsl(210 40% 98%)",
    panelBg: "hsl(210 40% 98%)",
    cardBg: "hsl(0 0% 100%)",
    border: "hsl(212 26% 87%)",
    shadow: "0 1px 3px hsl(0 0% 0% / 0.05)",
    text: "hsl(222 47% 11%)",
    mutedText: "hsl(215 16% 46%)",
    editorPaperBg: "hsl(0 0% 100%)",
    accent: "hsl(216 19% 26%)",
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    pageBg: "hsl(40 30% 96%)",
    panelBg: "hsl(40 25% 95%)",
    cardBg: "hsl(40 40% 97%)",
    border: "hsl(35 20% 85%)",
    shadow: "0 1px 3px hsl(30 10% 30% / 0.08)",
    text: "hsl(30 15% 20%)",
    mutedText: "hsl(30 10% 45%)",
    editorPaperBg: "hsl(42 35% 97%)",
    accent: "hsl(25 60% 45%)",
  },
  {
    id: "soft-mint",
    name: "Soft Mint",
    pageBg: "hsl(160 30% 96%)",
    panelBg: "hsl(160 25% 95%)",
    cardBg: "hsl(160 30% 98%)",
    border: "hsl(160 20% 85%)",
    shadow: "0 1px 3px hsl(160 15% 30% / 0.08)",
    text: "hsl(170 20% 15%)",
    mutedText: "hsl(160 15% 40%)",
    editorPaperBg: "hsl(160 25% 99%)",
    accent: "hsl(160 40% 40%)",
  },
  {
    id: "focus-grey",
    name: "Focus Grey",
    pageBg: "hsl(220 15% 95%)",
    panelBg: "hsl(220 12% 93%)",
    cardBg: "hsl(220 15% 97%)",
    border: "hsl(220 10% 85%)",
    shadow: "0 1px 3px hsl(220 10% 20% / 0.06)",
    text: "hsl(220 15% 20%)",
    mutedText: "hsl(220 10% 50%)",
    editorPaperBg: "hsl(220 12% 98%)",
    accent: "hsl(220 20% 45%)",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    pageBg: "hsl(222 47% 11%)",
    panelBg: "hsl(220 40% 13%)",
    cardBg: "hsl(220 35% 16%)",
    border: "hsl(220 25% 25%)",
    shadow: "0 1px 3px hsl(0 0% 0% / 0.3)",
    text: "hsl(210 40% 96%)",
    mutedText: "hsl(215 20% 65%)",
    editorPaperBg: "hsl(220 35% 18%)",
    accent: "hsl(210 60% 60%)",
  },
  {
    id: "sunset-beige",
    name: "Sunset Beige",
    pageBg: "hsl(30 30% 95%)",
    panelBg: "hsl(30 25% 93%)",
    cardBg: "hsl(30 35% 97%)",
    border: "hsl(25 20% 85%)",
    shadow: "0 1px 3px hsl(25 15% 30% / 0.08)",
    text: "hsl(25 20% 18%)",
    mutedText: "hsl(25 12% 45%)",
    editorPaperBg: "hsl(30 30% 98%)",
    accent: "hsl(15 50% 50%)",
  },
];

export const DEFAULT_TEMPLATE: JournalTemplate = {
  questions: DEFAULT_QUESTIONS,
  applyOnNewEntry: true,
  unstructured: false,
  defaultSkinId: "minimal-light",
};

export const DAILY_PROMPTS = [
  "What made you smile today?",
  "Describe a challenge you overcame recently.",
  "What's something you're looking forward to?",
  "Write about a person who inspires you.",
  "What lesson did today teach you?",
  "Describe your ideal peaceful moment.",
  "What would you tell your past self?",
  "What are you most proud of this week?",
];

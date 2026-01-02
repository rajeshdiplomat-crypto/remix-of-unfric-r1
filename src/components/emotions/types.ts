export type QuadrantType = 'high-pleasant' | 'high-unpleasant' | 'low-unpleasant' | 'low-pleasant';

export interface QuadrantInfo {
  id: QuadrantType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emotions: string[];
}

export const QUADRANTS: Record<QuadrantType, QuadrantInfo> = {
  'high-pleasant': {
    id: 'high-pleasant',
    label: 'High Energy, Pleasant',
    description: 'Energized and positive',
    color: 'hsl(45, 93%, 47%)', // warm yellow
    bgColor: 'hsl(45, 93%, 95%)',
    borderColor: 'hsl(45, 93%, 70%)',
    emotions: ['Excited', 'Joyful', 'Inspired', 'Energetic', 'Enthusiastic', 'Optimistic', 'Proud', 'Thrilled', 'Elated', 'Ecstatic', 'Hopeful', 'Passionate', 'Confident', 'Amazed', 'Playful', 'Grateful', 'Amused', 'Cheerful', 'Blissful', 'Motivated', 'Alive', 'Radiant', 'Vibrant', 'Exhilarated', 'Empowered']
  },
  'high-unpleasant': {
    id: 'high-unpleasant',
    label: 'High Energy, Unpleasant',
    description: 'Energized but uncomfortable',
    color: 'hsl(0, 72%, 51%)', // red
    bgColor: 'hsl(0, 72%, 95%)',
    borderColor: 'hsl(0, 72%, 75%)',
    emotions: ['Anxious', 'Angry', 'Frustrated', 'Stressed', 'Overwhelmed', 'Irritated', 'Panicked', 'Furious', 'Agitated', 'Restless', 'Nervous', 'Tense', 'Worried', 'Annoyed', 'Impatient', 'Fearful', 'Enraged', 'Hostile', 'Jealous', 'Defensive', 'Alarmed', 'Shocked', 'Resentful', 'Bitter', 'Apprehensive']
  },
  'low-unpleasant': {
    id: 'low-unpleasant',
    label: 'Low Energy, Unpleasant',
    description: 'Low energy and uncomfortable',
    color: 'hsl(215, 20%, 45%)', // muted blue-gray
    bgColor: 'hsl(215, 20%, 95%)',
    borderColor: 'hsl(215, 20%, 70%)',
    emotions: ['Sad', 'Tired', 'Depressed', 'Lonely', 'Drained', 'Hopeless', 'Discouraged', 'Bored', 'Disappointed', 'Guilty', 'Ashamed', 'Exhausted', 'Empty', 'Melancholy', 'Numb', 'Indifferent', 'Apathetic', 'Grief-stricken', 'Dejected', 'Withdrawn', 'Defeated', 'Gloomy', 'Isolated', 'Vulnerable', 'Lost']
  },
  'low-pleasant': {
    id: 'low-pleasant',
    label: 'Low Energy, Pleasant',
    description: 'Calm and positive',
    color: 'hsl(142, 52%, 45%)', // green
    bgColor: 'hsl(142, 52%, 95%)',
    borderColor: 'hsl(142, 52%, 70%)',
    emotions: ['Calm', 'Content', 'Relaxed', 'Peaceful', 'Grateful', 'Serene', 'Comfortable', 'Satisfied', 'Secure', 'Cozy', 'Tranquil', 'Mellow', 'Rested', 'Thoughtful', 'Appreciative', 'Centered', 'Grounded', 'Balanced', 'Soft', 'Tender', 'Soothed', 'At ease', 'Still', 'Hopeful', 'Loving']
  }
};

export interface Strategy {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'breathing' | 'grounding' | 'cognitive' | 'movement' | 'mindfulness';
  targetQuadrants: QuadrantType[];
  icon: string;
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'A calming technique: breathe in for 4 seconds, hold for 4, exhale for 4, hold for 4.',
    duration: '2-3 min',
    type: 'breathing',
    targetQuadrants: ['high-unpleasant'],
    icon: 'Wind'
  },
  {
    id: '5-4-3-2-1',
    title: '5-4-3-2-1 Grounding',
    description: 'Notice 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.',
    duration: '3-5 min',
    type: 'grounding',
    targetQuadrants: ['high-unpleasant', 'low-unpleasant'],
    icon: 'Hand'
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'Slowly scan from head to toe, noticing sensations without judgment.',
    duration: '5 min',
    type: 'mindfulness',
    targetQuadrants: ['high-unpleasant', 'low-unpleasant'],
    icon: 'User'
  },
  {
    id: 'reframe-thoughts',
    title: 'Thought Reframing',
    description: 'Identify a negative thought and find alternative, balanced perspectives.',
    duration: '5 min',
    type: 'cognitive',
    targetQuadrants: ['high-unpleasant', 'low-unpleasant'],
    icon: 'Lightbulb'
  },
  {
    id: 'gentle-stretch',
    title: 'Gentle Stretching',
    description: 'Simple stretches to release tension and reconnect with your body.',
    duration: '3-5 min',
    type: 'movement',
    targetQuadrants: ['low-unpleasant', 'low-pleasant'],
    icon: 'Sparkles'
  },
  {
    id: 'gratitude-moment',
    title: 'Gratitude Moment',
    description: 'List 3 things you are grateful for right now, no matter how small.',
    duration: '2 min',
    type: 'cognitive',
    targetQuadrants: ['low-unpleasant', 'low-pleasant'],
    icon: 'Heart'
  },
  {
    id: 'energizing-breath',
    title: 'Energizing Breath',
    description: 'Quick, rhythmic breathing to boost alertness and energy.',
    duration: '1-2 min',
    type: 'breathing',
    targetQuadrants: ['low-unpleasant', 'low-pleasant'],
    icon: 'Zap'
  },
  {
    id: 'savoring',
    title: 'Savoring the Moment',
    description: 'Fully appreciate your current positive state by noticing details.',
    duration: '2-3 min',
    type: 'mindfulness',
    targetQuadrants: ['high-pleasant', 'low-pleasant'],
    icon: 'Sun'
  }
];

export interface EmotionEntry {
  id: string;
  quadrant: QuadrantType;
  emotion: string;
  intensity?: number;
  note?: string;
  context?: {
    who?: string;
    what?: string;
    body?: string;
    sleepHours?: string;
    physicalActivity?: string;
  };
  entry_date: string;
  created_at: string;
}

export type EmotionSection = 'check-in' | 'patterns' | 'strategies';

// Descriptions for emotions - shown on hover
export const EMOTION_DESCRIPTIONS: Record<string, string> = {
  // High-Pleasant
  'Excited': 'Feeling great enthusiasm and eagerness about something',
  'Joyful': 'Experiencing happiness and positive energy',
  'Inspired': 'Feeling mentally stimulated to create or achieve',
  'Energetic': 'Having plenty of vitality and vigor',
  'Enthusiastic': 'Showing intense and eager enjoyment',
  'Optimistic': 'Hopeful and confident about the future',
  'Proud': 'Feeling deep satisfaction from achievements',
  'Thrilled': 'Extremely pleased and excited',
  'Elated': 'Ecstatically happy and joyful',
  'Ecstatic': 'Feeling overwhelming happiness',
  'Hopeful': 'Feeling expectation and desire for something good',
  'Passionate': 'Showing strong feelings or enthusiasm',
  'Confident': 'Feeling certain about your abilities',
  'Amazed': 'Greatly surprised and impressed',
  'Playful': 'Light-hearted and full of fun',
  'Grateful': 'Feeling thankful and appreciative',
  'Amused': 'Finding something funny or entertaining',
  'Cheerful': 'Noticeably happy and optimistic',
  'Blissful': 'Extremely happy; full of joy',
  'Motivated': 'Having a strong reason to act or accomplish',
  'Alive': 'Feeling full of energy and life',
  'Radiant': 'Clearly emanating joy and health',
  'Vibrant': 'Full of energy and enthusiasm',
  'Exhilarated': 'Feeling very happy, animated, or elated',
  'Empowered': 'Feeling confident and in control',
  
  // High-Unpleasant
  'Anxious': 'Feeling worried, uneasy, or nervous',
  'Angry': 'Feeling strong displeasure or hostility',
  'Frustrated': 'Upset because of inability to achieve something',
  'Stressed': 'Feeling mental or emotional strain',
  'Overwhelmed': 'Feeling buried under too many demands',
  'Irritated': 'Feeling annoyed or impatient',
  'Panicked': 'Feeling sudden uncontrollable fear',
  'Furious': 'Extremely angry',
  'Agitated': 'Feeling troubled or nervous',
  'Restless': 'Unable to rest or relax',
  'Nervous': 'Easily worried or anxious',
  'Tense': 'Feeling mental or nervous strain',
  'Worried': 'Anxious or troubled about problems',
  'Annoyed': 'Slightly angry; irritated',
  'Impatient': 'Wanting things to happen quickly',
  'Fearful': 'Feeling afraid or anxious',
  'Enraged': 'Very angry; furious',
  'Hostile': 'Unfriendly and aggressive',
  'Jealous': 'Feeling resentment toward others',
  'Defensive': 'Protecting yourself from criticism',
  'Alarmed': 'Frightened or concerned',
  'Shocked': 'Feeling sudden surprise or distress',
  'Resentful': 'Feeling bitter about unfair treatment',
  'Bitter': 'Feeling angry and unhappy',
  'Apprehensive': 'Anxious about the future',
  
  // Low-Unpleasant
  'Sad': 'Feeling unhappy or sorrowful',
  'Tired': 'In need of rest or sleep',
  'Depressed': 'In a state of low spirits',
  'Lonely': 'Feeling isolated and disconnected',
  'Drained': 'Exhausted of emotional resources',
  'Hopeless': 'Feeling that nothing will improve',
  'Discouraged': 'Having lost confidence or enthusiasm',
  'Bored': 'Feeling weary from lack of interest',
  'Disappointed': 'Sad about unmet expectations',
  'Guilty': 'Feeling responsible for wrongdoing',
  'Ashamed': 'Embarrassed or guilty about something',
  'Exhausted': 'Completely drained of energy',
  'Empty': 'Feeling hollow or lacking purpose',
  'Melancholy': 'A deep, pensive sadness',
  'Numb': 'Unable to feel emotions',
  'Indifferent': 'Having no interest or concern',
  'Apathetic': 'Lacking interest or enthusiasm',
  'Grief-stricken': 'Feeling deep sorrow from loss',
  'Dejected': 'Sad and depressed; dispirited',
  'Withdrawn': 'Not wanting to communicate with others',
  'Defeated': 'Feeling like you have lost',
  'Gloomy': 'Feeling depressed or pessimistic',
  'Isolated': 'Feeling alone and separated',
  'Vulnerable': 'Feeling exposed and unprotected',
  'Lost': 'Not knowing what to do or how to feel',
  
  // Low-Pleasant
  'Calm': 'Free from agitation or strong emotion',
  'Content': 'Peacefully satisfied and happy',
  'Relaxed': 'Free from tension and anxiety',
  'Peaceful': 'Free from disturbance; tranquil',
  'Serene': 'Calm, peaceful, and untroubled',
  'Comfortable': 'In a state of physical or mental ease',
  'Satisfied': 'Fulfilled; pleased with what you have',
  'Secure': 'Feeling safe and protected',
  'Cozy': 'Comfortable and warm',
  'Tranquil': 'Free from disturbance or turmoil',
  'Mellow': 'Relaxed and easygoing',
  'Rested': 'Refreshed by rest or sleep',
  'Thoughtful': 'Absorbed in thought; reflective',
  'Appreciative': 'Feeling grateful and thankful',
  'Centered': 'Emotionally balanced and grounded',
  'Grounded': 'Mentally and emotionally stable',
  'Balanced': 'Having equilibrium in life',
  'Soft': 'Gentle and peaceful',
  'Tender': 'Showing gentleness and care',
  'Soothed': 'Calmed and comforted',
  'At ease': 'Relaxed and comfortable',
  'Still': 'Calm and quiet; not moving',
  'Loving': 'Feeling or showing love',
};

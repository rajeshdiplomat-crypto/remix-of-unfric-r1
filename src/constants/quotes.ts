export type ModuleType = "diary" | "journal" | "notes" | "tasks" | "emotions" | "manifest" | "habits" | "settings";

export const LOADING_QUOTES: Record<ModuleType, { text: string; author: string }[]> = {
    diary: [
        { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { text: "Today is the first day of the rest of your life.", author: "Charles Dederich" },
        { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    ],
    journal: [
        { text: "Writing is the painting of the voice.", author: "Voltaire" },
        { text: "I write to discover what I know.", author: "Flannery O'Connor" },
        { text: "The pen is mightier than the sword.", author: "Edward Bulwer-Lytton" },
        { text: "There is no greater agony than bearing an untold story.", author: "Maya Angelou" },
        { text: "Start writing, no matter what.", author: "Louis L'Amour" },
    ],
    notes: [
        { text: "Knowledge is power.", author: "Francis Bacon" },
        { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
        { text: "The beautiful thing about learning is that no one can take it away.", author: "B.B. King" },
        { text: "Ideas are the beginning points of all fortunes.", author: "Napoleon Hill" },
        { text: "The art of simplicity is a puzzle of complexity.", author: "Douglas Horton" },
    ],
    tasks: [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
        { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
        { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    ],
    emotions: [
        { text: "Feelings are just visitors, let them come and go.", author: "Mooji" },
        { text: "The only way out is through.", author: "Robert Frost" },
        { text: "What lies within us is what matters most.", author: "Ralph Waldo Emerson" },
        { text: "Vulnerability is the birthplace of connection.", author: "Brené Brown" },
        { text: "Be gentle with yourself.", author: "Unknown" },
    ],
    manifest: [
        { text: "What you think, you become. What you feel, you attract.", author: "Buddha" },
        { text: "The universe is not outside of you. Look inside yourself.", author: "Rumi" },
        { text: "Whatever the mind can conceive, it can achieve.", author: "Napoleon Hill" },
        { text: "You are the creator of your own destiny.", author: "Swami Vivekananda" },
        { text: "Dream it. Believe it. Build it.", author: "Unknown" },
    ],
    habits: [
        { text: "We are what we repeatedly do.", author: "Aristotle" },
        { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
        { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
        { text: "Consistency is more important than perfection.", author: "Unknown" },
        { text: "Progress, not perfection.", author: "Unknown" },
    ],
    settings: [
        { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
        { text: "The details are not the details. They make the design.", author: "Charles Eames" },
        { text: "Make it simple, but significant.", author: "Don Draper" },
        { text: "Less is more.", author: "Ludwig Mies van der Rohe" },
        { text: "Perfection is achieved when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
    ],
};

export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type AppLanguage = 'fr' | 'en';

export interface AssessmentQuestion {
  id: number;
  question: string;
  context?: string;
  type: 'multiple-choice' | 'open-response';
  choices?: string[];
  field: 'Grammar' | 'Vocabulary' | 'Listening/Pronunciation' | 'Nuances' | 'Basics';
  level?: CefrLevel;
}

export interface AssessmentResult {
  score: number;
  evaluatedLevel: CefrLevel;
  grammarScore: number;
  vocabularyScore: number;
  listeningScore: number;
  nuanceScore: number;
  feedback: string;
  weakPoints: string[];
  recommendations: string[];
}

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-in-the-blank' | 'translation';
  question: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: 'Grammar' | 'Vocabulary' | 'Speaking' | 'Culture' | 'Pronunciation' | 'Basics';
  description: string;
  difficulty: CefrLevel;
  content: string; // Dynamic text or guide
  vocabularyList?: { word: string; translation: string; example: string }[];
  exercises: Exercise[];
  completed?: boolean;
}

export interface Curriculum {
  level?: CefrLevel;
  focusAreas: string[];
  weakPoints: string[];
  targetGoals: string[];
  lessons: Lesson[];
}

export interface PronunciationItem {
  id: string;
  level: CefrLevel;
  category?: 'basics' | 'shortcuts' | 'vowels' | 'liaison';
  formal: string;     // e.g. "Je suis fatigué" or "É vs È"
  actual: string;     // e.g. "Chuis fatigué"
  phoneticFormal: string;
  phoneticActual: string;
  explanation: string;
  explanationEn?: string;
  audioClipTextFormal: string;
  audioClipTextActual: string;
  exampleContext: string;
  exampleContextEn?: string;
}

export interface DictionaryExplainer {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  translation: string;
  translationEn?: string;
  definition: string;
  definitionEn?: string;
  register: 'Soutenu' | 'Courant' | 'Familier' | 'Argot' | 'Standard';
  culturalNuances: string;
  spokenFrenchTip?: string;
  collocations: string[];
  examples: {
    french: string;
    english: string;
    contextExplanation?: string;
  }[];
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  translation?: string;
  translationEn?: string;
  pronunciationFeedback?: string;
  grammarFeedback?: string;
  fluencyScore?: number; // 1-10
}

export interface SrsCard {
  id: string;
  level?: CefrLevel;
  front: string;         // Word, expression or prompt
  back: string;          // Meaning, nuances, translations
  category: 'Vocabulaire' | 'Grammaire' | 'Registre & Nuances' | 'Expression Orale' | 'Prononciation' | 'Bases A0/A1';
  example?: string;      // Contextual sentence
  interval: number;      // Days until next review
  repetition: number;    // Count of consecutive successful reviews
  easeFactor: number;    // SM-2 multiplier
  dueDate: string;       // YYYY-MM-DD
  lastReviewed?: string;
}

export interface UserProgress {
  streak: number;
  lastActive: string; // ISO string
  currentLevel: CefrLevel;
  language: AppLanguage;
  assessmentResult: AssessmentResult | null;
  curriculum: Curriculum | null;
  completedLessons: string[]; // lesson ids
  score: number; // Experience points
  dictionaryHistory: DictionaryExplainer[];
  customWords: string[];
  srsCards?: SrsCard[];
}


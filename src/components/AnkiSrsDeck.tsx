import React, { useState, useEffect } from "react";
import { SrsCard, CefrLevel, AppLanguage } from "../types";
import { translations } from "../translations";
import {
  RotateCcw,
  Volume2,
  Sparkles,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Brain,
  Search,
  Layers,
  Flame,
  X,
  Loader2,
  BookOpen
} from "lucide-react";

interface AnkiSrsDeckProps {
  cards: SrsCard[];
  onUpdateCards: (newCards: SrsCard[]) => void;
  onRewardXp: (amount: number) => void;
  currentLevel: CefrLevel;
  language: AppLanguage;
}

export const MULTI_LEVEL_INITIAL_CARDS: SrsCard[] = [
  // A0 - A1 Foundations
  {
    id: "anki-a0-1",
    level: "A0",
    front: "Bonjour / Au revoir",
    back: "Hello, Good day / Goodbye.\nPolite baseline greeting used in any shop, bakery, or interaction in France.",
    category: "Bases A0/A1",
    example: "Bonjour madame, une baguette s'il vous plaît !",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-a0-2",
    level: "A0",
    front: "Être (Je suis, Tu es, Il/Elle est)",
    back: "To be (I am, You are, He/She is).\nEssential irregular verb for identity, feelings, and location.",
    category: "Bases A0/A1",
    example: "Je suis ravi de faire votre connaissance.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-a1-1",
    level: "A1",
    front: "Avoir (J'ai, Tu as, Il/Elle a)",
    back: "To have (I have, You have, He/She has).\nAlso used for age ('J'ai 30 ans') and hunger/thirst ('J'ai faim').",
    category: "Bases A0/A1",
    example: "J'ai une réservation pour deux personnes ce soir.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-a1-2",
    level: "A1",
    front: "Combien ça coûte ?",
    back: "How much does it cost? / How much is this?\nKey survival phrase for market shopping and stores.",
    category: "Expression Orale",
    example: "Pardon monsieur, combien ça coûte ces croissants ?",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-a2-1",
    level: "A2",
    front: "Passé Composé (Avoir / Être + Participe)",
    back: "Main past tense for completed actions.\nRemember: Verbs of movement (aller, venir, partir) use 'être'!",
    category: "Grammaire",
    example: "Hier, je suis allé au marché et j'ai acheté des fruits frais.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  // B2 - C1 Advanced
  {
    id: "anki-c1-1",
    level: "C1",
    front: "S'avérer",
    back: "Se révéler à l'usage, apparaître clairement comme vrai. Registre soutenu.\nAttention : Ne pas dire 's'avérer vrai' (pléonasme).",
    category: "Vocabulaire",
    example: "Cette stratégie diplomatique s'est avérée particulièrement efficace lors des négociations.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-c1-2",
    level: "C1",
    front: "Nonobstant",
    back: "Malgré, en dépit de (Notwithstanding / Despite). Registre très soutenu, juridique ou littéraire.",
    category: "Registre & Nuances",
    example: "Nonobstant la complexité du dossier, l'équipe a rendu son rapport dans les délais.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-c1-3",
    level: "C1",
    front: "Avoir voix au chapitre",
    back: "Avoir le droit d'exprimer son opinion et être consulté dans une décision importante (To have a say).",
    category: "Expression Orale",
    example: "Sur ces questions environnementales, tous les citoyens doivent avoir voix au chapitre.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  },
  {
    id: "anki-c1-4",
    level: "C1",
    front: "Chuis / J'sais pas",
    back: "Contraction orale naturelle de 'Je suis' [ʃɥi] et 'Je ne sais pas' [ʃɛpa]. Usage quotidien entre natifs.",
    category: "Prononciation",
    example: "Chuis prêt, mais j'sais pas si le train est à l'heure.",
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString().split("T")[0],
  }
];

export const DEFAULT_INITIAL_CARDS = MULTI_LEVEL_INITIAL_CARDS;

export default function AnkiSrsDeck({
  cards,
  onUpdateCards,
  onRewardXp,
  currentLevel,
  language
}: AnkiSrsDeckProps) {
  const t = translations[language].anki;
  const common = translations[language].common;

  const [deck, setDeck] = useState<SrsCard[]>(() => {
    if (cards && cards.length > 0) return cards;
    return MULTI_LEVEL_INITIAL_CARDS;
  });

  const [mode, setMode] = useState<"review" | "manage">("review");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [reviewedInSessionCount, setReviewedInSessionCount] = useState<number>(0);

  // Management State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("Tous");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Card Form
  const [newFront, setNewFront] = useState<string>("");
  const [newBack, setNewBack] = useState<string>("");
  const [newCategory, setNewCategory] = useState<SrsCard["category"]>("Vocabulaire");
  const [newLevel, setNewLevel] = useState<CefrLevel>(currentLevel);
  const [newExample, setNewExample] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter due cards for review session
  const dueCards = deck.filter((card) => card.dueDate <= todayStr);

  useEffect(() => {
    onUpdateCards(deck);
  }, [deck]);

  // Handle Speech Synthesis
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = currentLevel === "A0" || currentLevel === "A1" ? 0.8 : 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // SM-2 Spaced Repetition Rating Handler
  const handleRating = (rating: "again" | "hard" | "good" | "easy") => {
    const activeCard = dueCards[currentCardIndex];
    if (!activeCard) return;

    let newInterval = activeCard.interval;
    let newRepetition = activeCard.repetition;
    let newEase = activeCard.easeFactor;

    if (rating === "again") {
      newRepetition = 0;
      newInterval = 1; // Due tomorrow
      newEase = Math.max(1.3, newEase - 0.2);
    } else if (rating === "hard") {
      newInterval = newRepetition === 0 ? 1 : Math.round(newInterval * 1.2);
      newEase = Math.max(1.3, newEase - 0.15);
    } else if (rating === "good") {
      if (newRepetition === 0) newInterval = 1;
      else if (newRepetition === 1) newInterval = 3;
      else newInterval = Math.round(newInterval * newEase);
      newRepetition += 1;
    } else if (rating === "easy") {
      if (newRepetition === 0) newInterval = 3;
      else if (newRepetition === 1) newInterval = 7;
      else newInterval = Math.round(newInterval * newEase * 1.3);
      newRepetition += 1;
      newEase += 0.15;
    }

    // Calculate Next Due Date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    const nextDueDateStr = nextDate.toISOString().split("T")[0];

    const updatedCard: SrsCard = {
      ...activeCard,
      interval: newInterval,
      repetition: newRepetition,
      easeFactor: Number(newEase.toFixed(2)),
      dueDate: nextDueDateStr,
      lastReviewed: todayStr,
    };

    setDeck((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    setReviewedInSessionCount((prev) => prev + 1);
    onRewardXp(10);

    setIsFlipped(false);
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  // Generate cards using AI adapted to level and language
  const handleGenerateAiCards = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/anki/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 5,
          level: currentLevel,
          language: language
        }),
      });
      if (!res.ok) throw new Error("Server error during card generation");
      const newCards: SrsCard[] = await res.json();
      setDeck((prev) => [...newCards, ...prev]);
      onRewardXp(25);
    } catch (err) {
      console.error(err);
      alert(language === 'fr' 
        ? "Impossible de générer des cartes par l'IA actuellement. Vérifiez votre clé API." 
        : "Failed to generate AI flashcards. Please check API credentials.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Create Custom Card
  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const createdCard: SrsCard = {
      id: "custom-" + Date.now(),
      level: newLevel,
      front: newFront.trim(),
      back: newBack.trim(),
      category: newCategory,
      example: newExample.trim() || undefined,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: todayStr,
    };

    setDeck((prev) => [createdCard, ...prev]);
    setNewFront("");
    setNewBack("");
    setNewExample("");
    setShowAddModal(false);
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    if (confirm(t.deleteConfirm)) {
      setDeck((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Export Deck to Anki CSV
  const handleExportAnkiCsv = () => {
    const csvHeader = "Front (French);Back (Explanation);Level;Category;Example\n";
    const csvRows = deck
      .map((card) => {
        const cleanFront = `"${card.front.replace(/"/g, '""')}"`;
        const cleanBack = `"${card.back.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const cleanLevel = `"${card.level || currentLevel}"`;
        const cleanCat = `"${card.category}"`;
        const cleanEx = `"${(card.example || "").replace(/"/g, '""')}"`;
        return `${cleanFront};${cleanBack};${cleanLevel};${cleanCat};${cleanEx}`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `french_companion_anki_${currentLevel}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Cards for Management Table
  const filteredCards = deck.filter((card) => {
    const matchesSearch =
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.example && card.example.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "Tous" || card.category === selectedCategory;
    const matchesLevel = selectedLevelFilter === "Tous" || card.level === selectedLevelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const currentCard = dueCards[currentCardIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="anki-srs-deck-container">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-bold">
              <Brain className="w-3.5 h-3.5" /> {language === 'fr' ? 'Méthode Anki • Répétition Espacée (SRS)' : 'Anki Method • Spaced Repetition System (SRS)'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
              {t.title}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="block text-2xl font-extrabold text-amber-400 font-display">
                {dueCards.length}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {t.dueToday}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="block text-2xl font-extrabold text-indigo-300 font-display">
                {deck.length}
              </span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                {t.totalCards}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Review vs Manage) */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => {
              setMode("review");
              setSessionCompleted(false);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === "review"
                ? "bg-white text-indigo-950 shadow-md font-sans"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" /> {t.reviewSession} ({dueCards.length})
          </button>
          <button
            onClick={() => setMode("manage")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === "manage"
                ? "bg-white text-indigo-950 shadow-md font-sans"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" /> {t.manageDeck} ({deck.length})
          </button>
        </div>
      </div>

      {/* MODE 1: REVIEW SESSION */}
      {mode === "review" && (
        <div>
          {sessionCompleted || dueCards.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-6 shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                🎉
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-extrabold text-slate-900">
                  {t.completedTitle}
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  {reviewedInSessionCount > 0
                    ? `${t.completedSub} (+${reviewedInSessionCount * 10} XP)`
                    : t.noCardsDue}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleGenerateAiCards}
                  disabled={isGeneratingAi}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {t.generateAiCards} ({currentLevel})
                </button>
                <button
                  onClick={() => setMode("manage")}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  {t.manageDeck}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress bar inside session */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-bold px-1">
                <span>
                  {language === 'fr' ? 'Carte' : 'Card'} {currentCardIndex + 1} / {dueCards.length}
                </span>
                <span className="inline-flex items-center gap-1 text-indigo-600">
                  <Flame className="w-3.5 h-3.5" /> +10 XP
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
                />
              </div>

              {/* Interactive Flashcard Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-white border-2 border-indigo-100 rounded-3xl p-8 sm:p-12 text-center min-h-[320px] flex flex-col justify-between shadow-lg shadow-indigo-500/5 cursor-pointer hover:border-indigo-300 transition relative select-none group"
              >
                {/* Category & Level Badges */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white">
                      {currentCard.level || currentLevel}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                      {currentCard.category}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleSpeak(currentCard.front, e)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                    title="Écouter la prononciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Content (Front vs Back) */}
                <div className="my-auto py-6 space-y-4">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
                        {currentCard.front}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {t.clickToFlip}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <h3 className="text-xl sm:text-2xl font-display font-bold text-indigo-600">
                        {currentCard.front}
                      </h3>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed font-sans whitespace-pre-line text-left">
                        {currentCard.back}
                      </div>
                      {currentCard.example && (
                        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs sm:text-sm text-indigo-900 text-left italic">
                          💡 <strong>{language === 'fr' ? 'Exemple :' : 'Example:'}</strong> « {currentCard.example} »
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Flip hint at bottom */}
                <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                  {isFlipped ? t.rateRecall : t.clickToFlip}
                </div>
              </div>

              {/* SM-2 Anki Rating Buttons */}
              {isFlipped && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => handleRating("again")}
                    className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center hover:bg-rose-100 transition cursor-pointer"
                  >
                    <span className="block font-bold text-xs">{t.ratingAgain}</span>
                    <span className="block text-[10px] opacity-75 font-mono">&lt; 1 {language === 'fr' ? 'jour' : 'day'}</span>
                  </button>
                  <button
                    onClick={() => handleRating("hard")}
                    className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-center hover:bg-amber-100 transition cursor-pointer"
                  >
                    <span className="block font-bold text-xs">{t.ratingHard}</span>
                    <span className="block text-[10px] opacity-75 font-mono">1-2 {language === 'fr' ? 'jours' : 'days'}</span>
                  </button>
                  <button
                    onClick={() => handleRating("good")}
                    className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl text-center hover:bg-blue-100 transition cursor-pointer"
                  >
                    <span className="block font-bold text-xs">{t.ratingGood}</span>
                    <span className="block text-[10px] opacity-75 font-mono">3-4 {language === 'fr' ? 'jours' : 'days'}</span>
                  </button>
                  <button
                    onClick={() => handleRating("easy")}
                    className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-center hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <span className="block font-bold text-xs">{t.ratingEasy}</span>
                    <span className="block text-[10px] opacity-75 font-mono">7+ {language === 'fr' ? 'jours' : 'days'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: MANAGE DECK */}
      {mode === "manage" && (
        <div className="space-y-6">
          {/* Toolbar Actions */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            {/* Search and Filters */}
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Level Filter */}
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl text-xs font-sans focus:outline-none"
              >
                <option value="Tous">{language === 'fr' ? 'Tous les niveaux' : 'All Levels'}</option>
                <option value="A0">A0</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl text-xs font-sans focus:outline-none"
              >
                <option value="Tous">{t.allCategories}</option>
                <option value="Bases A0/A1">Bases A0/A1</option>
                <option value="Vocabulaire">Vocabulaire</option>
                <option value="Grammaire">Grammaire</option>
                <option value="Registre & Nuances">Registre & Nuances</option>
                <option value="Expression Orale">Expression Orale</option>
                <option value="Prononciation">Prononciation</option>
              </select>
            </div>

            {/* Actions: Add card, AI generator, Export */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> {t.addCard}
              </button>
              <button
                onClick={handleGenerateAiCards}
                disabled={isGeneratingAi}
                className="px-3.5 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isGeneratingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                IA +5 ({currentLevel})
              </button>
              <button
                onClick={handleExportAnkiCsv}
                className="p-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                title={t.exportCsv}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {filteredCards.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {language === 'fr' ? 'Aucune carte ne correspond à votre recherche.' : 'No flashcards match your search filter.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-600 text-white">
                          {card.level || "B2"}
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          {card.front}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-600">
                          {card.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {language === 'fr' ? 'Dû :' : 'Due:'} {card.dueDate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {card.back}
                      </p>
                      {card.example && (
                        <p className="text-[11px] text-indigo-600 italic">
                          « {card.example} »
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSpeak(card.front)}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                        title="Écouter"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE CARD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-display font-bold text-slate-900">
                {t.addCustomModalTitle}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomCard} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t.frontLabel}
                </label>
                <input
                  type="text"
                  required
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Ex : S'il vous plaît / Coup de foudre"
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t.backLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Ex : Please / Love at first sight."
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{common.level}</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as CefrLevel)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:outline-none"
                  >
                    <option value="A0">A0 (Grand Débutant)</option>
                    <option value="A1">A1 (Débutant)</option>
                    <option value="A2">A2 (Élémentaire)</option>
                    <option value="B1">B1 (Intermédiaire)</option>
                    <option value="B2">B2 (Avancé)</option>
                    <option value="C1">C1 (Autonome)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{t.categoryLabel}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:outline-none"
                  >
                    <option value="Bases A0/A1">Bases A0/A1</option>
                    <option value="Vocabulaire">Vocabulaire</option>
                    <option value="Grammaire">Grammaire</option>
                    <option value="Registre & Nuances">Registre & Nuances</option>
                    <option value="Expression Orale">Expression Orale</option>
                    <option value="Prononciation">Prononciation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">
                  {t.exampleLabel}
                </label>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Ex : Un café, s'il vous plaît !"
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

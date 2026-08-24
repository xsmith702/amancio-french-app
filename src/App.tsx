import React, { useState, useEffect } from "react";
import { UserProgress, AssessmentResult, Curriculum, Lesson, DictionaryExplainer, SrsCard, CefrLevel, AppLanguage } from "./types";
import ProgressDashboard from "./components/ProgressDashboard";
import LevelAssessment from "./components/LevelAssessment";
import CurriculumPlan from "./components/CurriculumPlan";
import LessonDetail from "./components/LessonDetail";
import SpeakingCoach from "./components/SpeakingCoach";
import DictionaryAndCulture from "./components/DictionaryAndCulture";
import PronunciationExplorer from "./components/PronunciationExplorer";
import AnkiSrsDeck, { DEFAULT_INITIAL_CARDS } from "./components/AnkiSrsDeck";
import { translations, CEFR_LEVELS } from "./translations";
import { LayoutDashboard, Award, Map, Volume2, Search, BookOpen, AlertCircle, CheckCircle, Sun, Moon, Brain, Globe } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem("french_progression_progress_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          currentLevel: parsed.currentLevel || "A0",
          language: parsed.language || "en",
        };
      } catch (e) {
        console.error("Failed to parse progress data", e);
      }
    }
    // Also check older key if available
    const oldSaved = localStorage.getItem("french_b2_c1_progress");
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        return {
          ...parsed,
          currentLevel: parsed.currentLevel || "A0",
          language: parsed.language || "en",
        };
      } catch (e) {
        console.error("Failed to parse old progress data", e);
      }
    }
    return {
      streak: 1,
      lastActive: new Date().toISOString(),
      currentLevel: "A0" as CefrLevel,
      language: "en" as AppLanguage,
      assessmentResult: null,
      curriculum: null,
      completedLessons: [],
      score: 150, // Welcome XP
      dictionaryHistory: [],
      customWords: [],
      srsCards: DEFAULT_INITIAL_CARDS,
    };
  });

  const language: AppLanguage = progress.language || "en";
  const currentLevel: CefrLevel = progress.currentLevel || "A0";
  const t = translations[language];

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("french_dark_mode");
    if (saved !== null) {
      return saved === "true";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Toggle document level dark class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("french_dark_mode", String(isDark));
  }, [isDark]);

  // Sync state changes to local storage
  useEffect(() => {
    localStorage.setItem("french_progression_progress_v2", JSON.stringify(progress));
  }, [progress]);

  // Check backend server config on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setIsApiConfigured(data.isConfigured);
      })
      .catch((err) => {
        console.error("Failed to check api config status:", err);
      });
  }, []);

  // Update study streak on daily visits
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const lastActiveStr = progress.lastActive.split("T")[0];
    
    if (todayStr !== lastActiveStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      
      let newStreak = progress.streak;
      if (lastActiveStr === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1; // reset streak if gap exists
      }

      setProgress((prev) => ({
        ...prev,
        streak: newStreak,
        lastActive: new Date().toISOString(),
      }));
    }
  }, []);

  const handleLanguageToggle = () => {
    const nextLang: AppLanguage = language === "fr" ? "en" : "fr";
    setProgress((prev) => ({
      ...prev,
      language: nextLang,
    }));
  };

  const handleLevelChange = (newLevel: CefrLevel) => {
    setProgress((prev) => ({
      ...prev,
      currentLevel: newLevel,
    }));
  };

  const handleAssessmentCompleted = (result: AssessmentResult) => {
    setProgress((prev) => ({
      ...prev,
      assessmentResult: result,
      currentLevel: result.evaluatedLevel,
      score: prev.score + 250, // Big XP reward for finishing assessment
    }));
    setActiveTab("curriculum"); // Guide them straight to curriculum generation
  };

  const handleCurriculumGenerated = (curriculum: Curriculum) => {
    setProgress((prev) => ({
      ...prev,
      curriculum,
      score: prev.score + 100,
    }));
  };

  const handleLessonCompleted = (lessonId: string) => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      return {
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
        score: prev.score + 150, // 150 XP for course completion
      };
    });
  };

  const handleAddDictionaryHistory = (entry: DictionaryExplainer) => {
    setProgress((prev) => {
      const filtered = prev.dictionaryHistory.filter((item) => item.word.toLowerCase() !== entry.word.toLowerCase());
      return {
        ...prev,
        dictionaryHistory: [entry, ...filtered].slice(0, 30),
      };
    });
  };

  const handleUpdateAnkiCards = (newCards: SrsCard[]) => {
    setProgress((prev) => ({
      ...prev,
      srsCards: newCards,
    }));
  };

  const handleAddAnkiCard = (card: SrsCard) => {
    setProgress((prev) => {
      const currentCards = prev.srsCards || DEFAULT_INITIAL_CARDS;
      return {
        ...prev,
        srsCards: [card, ...currentCards],
        score: prev.score + 15,
      };
    });
  };

  const handleRewardXp = (amount: number) => {
    setProgress((prev) => ({
      ...prev,
      score: prev.score + amount,
    }));
  };

  const handleResetAssessment = () => {
    const confirmText = language === "fr"
      ? "Voulez-vous vraiment réinitialiser votre évaluation et votre curriculum ?"
      : "Are you sure you want to reset your assessment and curriculum?";
    if (confirm(confirmText)) {
      setProgress((prev) => ({
        ...prev,
        assessmentResult: null,
        curriculum: null,
        completedLessons: [],
      }));
      setActiveLesson(null);
      setActiveTab("assessment");
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ProgressDashboard
            progress={progress}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              setActiveLesson(null);
            }}
            onLevelChange={handleLevelChange}
            language={language}
          />
        );
      case "assessment":
        return (
          <LevelAssessment
            assessmentResult={progress.assessmentResult}
            onAssessmentCompleted={handleAssessmentCompleted}
            onReset={handleResetAssessment}
            currentLevel={currentLevel}
            onLevelChange={handleLevelChange}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              setActiveLesson(null);
            }}
            language={language}
          />
        );
      case "curriculum":
        if (activeLesson) {
          return (
            <LessonDetail
              lesson={activeLesson}
              onBack={() => setActiveLesson(null)}
              onComplete={handleLessonCompleted}
              isCompleted={progress.completedLessons.includes(activeLesson.id)}
              language={language}
            />
          );
        }
        return (
          <CurriculumPlan
            assessmentResult={progress.assessmentResult}
            curriculum={progress.curriculum}
            onCurriculumGenerated={handleCurriculumGenerated}
            onSelectLesson={setActiveLesson}
            completedLessons={progress.completedLessons}
            currentLevel={currentLevel}
            language={language}
          />
        );
      case "anki":
        return (
          <AnkiSrsDeck
            cards={progress.srsCards && progress.srsCards.length > 0 ? progress.srsCards : DEFAULT_INITIAL_CARDS}
            onUpdateCards={handleUpdateAnkiCards}
            onRewardXp={handleRewardXp}
            currentLevel={currentLevel}
            language={language}
          />
        );
      case "speaking":
        return (
          <SpeakingCoach
            currentLevel={currentLevel}
            language={language}
          />
        );
      case "dictionary":
        return (
          <DictionaryAndCulture
            history={progress.dictionaryHistory}
            onAddHistory={handleAddDictionaryHistory}
            onAddToAnki={handleAddAnkiCard}
            currentLevel={currentLevel}
            language={language}
          />
        );
      case "pronunciation":
        return (
          <PronunciationExplorer
            currentLevel={currentLevel}
            language={language}
          />
        );
      default:
        return (
          <ProgressDashboard
            progress={progress}
            onNavigateToTab={setActiveTab}
            onLevelChange={handleLevelChange}
            language={language}
          />
        );
    }
  };

  const nav = t.nav;

  const menuItems = [
    { id: "dashboard", label: nav.dashboard, icon: LayoutDashboard },
    { id: "anki", label: nav.anki, icon: Brain },
    { id: "assessment", label: `${nav.assessment} (${currentLevel})`, icon: Award },
    { id: "curriculum", label: nav.curriculum, icon: Map },
    { id: "speaking", label: nav.speaking, icon: BookOpen },
    { id: "dictionary", label: nav.dictionary, icon: Search },
    { id: "pronunciation", label: nav.pronunciation, icon: Volume2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header & Navigation Layout */}
      <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 relative md:sticky md:top-0 z-50 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20 gap-2">
            
            {/* Logo / Brand Name */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-display font-extrabold text-xs sm:text-base tracking-tight shadow-md shadow-indigo-500/10 shrink-0">
                {currentLevel}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-0.5 line-clamp-1">
                  {language === "fr" ? "Progression Française A0 → C2" : "French Progression Companion • A0 → C2"}
                </span>
                <h1 className="font-display font-extrabold text-slate-900 dark:text-white tracking-tight text-[11px] sm:text-sm md:text-lg line-clamp-1">
                  {language === "fr" ? "Français A0 à C2" : "French A0 to C2 Companion"} • <span className="text-indigo-600 dark:text-indigo-400">{currentLevel}</span>
                </h1>
              </div>
            </div>

            {/* Header Controls: Level Selector, Language Toggle, Score, Dark Mode */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              {/* Level Quick Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 text-slate-400 uppercase hidden md:inline">
                  {t.common.level}:
                </span>
                <select
                  value={currentLevel}
                  onChange={(e) => handleLevelChange(e.target.value as CefrLevel)}
                  className="bg-transparent text-xs font-display font-extrabold text-indigo-600 dark:text-indigo-400 px-1.5 py-1 focus:outline-none cursor-pointer"
                  title={language === "fr" ? "Changer de niveau CEFR" : "Switch CEFR Target Level"}
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl.code} value={lvl.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {lvl.code} - {language === "fr" ? lvl.nameFr : lvl.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Toggle Button (FR / EN) */}
              <button
                onClick={handleLanguageToggle}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-mono font-bold text-xs shadow-2xs transition cursor-pointer shrink-0"
                title={language === "fr" ? "Switch language to English" : "Passer en Français"}
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="font-extrabold">{language === "fr" ? "FR 🇫🇷" : "EN 🇺🇸"}</span>
              </button>

              {/* API Status */}
              {!isApiConfigured ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/55 shrink-0">
                  <AlertCircle className="w-3 h-3" />
                  <span>{t.common.missingKey}</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  <span>{t.common.aiActive}</span>
                </span>
              )}
              
              {/* Score badge */}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                ⭐ {progress.score} XP
              </span>

              {/* Dark mode trigger */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shrink-0"
                title={isDark ? "Light mode" : "Dark mode"}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Tab selection bar */}
        <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1 sm:space-x-2 h-12 md:h-14 items-center" aria-label="Tabs">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setActiveLesson(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 border border-indigo-600"
                        : "text-slate-600 dark:text-slate-400 border border-transparent hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Help Banner if API is not set */}
        {!isApiConfigured && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 font-sans text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>{t.common.missingKey}</strong>{" "}
              {language === "fr"
                ? "Pour activer les corrections grammaticales instantanées, la génération de curriculum adaptatif et le dictionnaire sociolinguistique, ajoutez votre clé GEMINI_API_KEY dans les secrets."
                : "To enable instant grammar corrections, adaptive curriculum generation, and conversational coaching, add your GEMINI_API_KEY in the secrets panel."}
            </div>
          </div>
        )}

        {renderActiveTabContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-850 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-mono transition-colors duration-200">
        © 2026 {language === "fr" ? "Compagnon de Progression Française • A0 à C2" : "French Progression Companion • A0 to C2 All-Level Framework"}
      </footer>

    </div>
  );
}

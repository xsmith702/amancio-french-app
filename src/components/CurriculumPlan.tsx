import React, { useState } from "react";
import { Curriculum, AssessmentResult, Lesson, CefrLevel, AppLanguage } from "../types";
import { translations } from "../translations";
import { Compass, BookOpen, Target, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface CurriculumPlanProps {
  assessmentResult: AssessmentResult | null;
  curriculum: Curriculum | null;
  onCurriculumGenerated: (curriculum: Curriculum) => void;
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: string[];
  currentLevel: CefrLevel;
  language: AppLanguage;
}

export default function CurriculumPlan({
  assessmentResult,
  curriculum,
  onCurriculumGenerated,
  onSelectLesson,
  completedLessons,
  currentLevel,
  language,
}: CurriculumPlanProps) {
  const t = translations[language].curriculum;
  const common = translations[language].common;

  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Level-specific goal suggestions
  const defaultGoalsByLevel: Record<CefrLevel, { fr: string[]; en: string[] }> = {
    A0: {
      fr: [
        "Prononciation des sons français et l'alphabet",
        "Saluer, se présenter et formules de politesse de base",
        "Chiffres, commander au café et poser des questions simples",
      ],
      en: [
        "French vowel sounds, silent letters and basic phonetics",
        "Greetings, self-introduction and daily courtesy formulas",
        "Numbers, ordering at a café and asking basic questions",
      ],
    },
    A1: {
      fr: [
        "Poser des questions quotidiennes et comprendre les réponses",
        "Acheter au marché, commander au restaurant et prix",
        "Verbes essentiels au présent (Être, Avoir, Aller, Faire)",
      ],
      en: [
        "Asking daily questions and understanding short answers",
        "Ordering food at restaurants and shopping at markets",
        "Core present tense verbs (Être, Avoir, Aller, Faire)",
      ],
    },
    A2: {
      fr: [
        "Raconter des événements au Passé Composé et Imparfait",
        "Gérer des situations de voyage, hôtels et transports",
        "Exprimer son accord, ses préférences et ses sentiments",
      ],
      en: [
        "Narrating past events with Passé Composé & Imparfait",
        "Handling travel situations, hotels, and train stations",
        "Expressing agreement, preferences, and feelings",
      ],
    },
    B1: {
      fr: [
        "Parler couramment de projets et d'expériences personnelles",
        "Comprendre le français parlé naturel et les contractions",
        "Utiliser le conditionnel, le subjonctif de base et les pronoms",
      ],
      en: [
        "Speaking smoothly about personal projects and experiences",
        "Understanding everyday spoken French shortcuts and drops",
        "Using conditional tense, basic subjunctive, and object pronouns",
      ],
    },
    B2: {
      fr: [
        "Argumenter et défendre un point de vue avec nuance",
        "Maîtriser les connecteurs logiques et la syntaxe complexe",
        "Comprendre les podcasts et médias d'actualité sans sous-titres",
      ],
      en: [
        "Debating and defending complex viewpoints with nuance",
        "Mastering logical connectors and rich sentence structures",
        "Understanding native podcasts and news broadcasts without subtitles",
      ],
    },
    C1: {
      fr: [
        "Parler avec le naturel d'un locuteur natif (registre familier & soutenu)",
        "Comprendre les subtilités d'humour, métaphores et double-sens",
        "Rédaction avancée et structure de phrases de niveau DALF C1",
      ],
      en: [
        "Speaking with natural native cadence (informal slang to formal register)",
        "Mastering cultural humor subtleties, metaphors, and implicit cues",
        "High-level written discourse and rhetorical DALF C1 patterns",
      ],
    },
    C2: {
      fr: [
        "Maîtrise stylistique digne d'un locuteur natif très cultivé",
        "Capacité de synthèse instantanée sur sujets philosophiques et techniques",
      ],
      en: [
        "Native-level stylistic mastery in literary and professional contexts",
        "Instant summarization and debating on philosophical/technical topics",
      ],
    },
  };

  const availableGoals = defaultGoalsByLevel[currentLevel]
    ? defaultGoalsByLevel[currentLevel][language]
    : defaultGoalsByLevel.B2[language];

  const [selectedGoals, setSelectedGoals] = useState<string[]>(() => availableGoals.slice(0, 2));

  const handleToggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const generateCurriculum = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/curriculum/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentResult,
          targetGoals: selectedGoals,
          level: currentLevel,
          language: language,
        }),
      });
      if (!res.ok) {
        let errMsg = language === 'fr' ? "Échec de la génération du curriculum." : "Failed to generate personalized curriculum.";
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg += " " + errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      onCurriculumGenerated(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during curriculum generation");
    } finally {
      setGenerating(false);
    }
  };

  const categoryIcons: Record<string, string> = {
    Grammar: "✍️",
    Vocabulary: "📖",
    Speaking: "🗣️",
    Culture: "🎭",
    Pronunciation: "📢",
    Basics: "🌱",
  };

  const categoryColors: Record<string, string> = {
    Grammar: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Vocabulary: "bg-slate-100 text-slate-700 border-slate-200",
    Speaking: "bg-orange-50 text-orange-700 border-orange-100",
    Culture: "bg-violet-50 text-violet-700 border-violet-100",
    Pronunciation: "bg-amber-50 text-amber-700 border-amber-100",
    Basics: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  if (!curriculum) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xs max-w-2xl mx-auto animate-fade-in" id="curriculum-generator">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 border border-indigo-100 shadow-xs">
            <Compass className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
            {t.curriculumTag} ({currentLevel})
          </span>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            {t.generateTitle}
          </h2>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto leading-relaxed">
            {assessmentResult ? t.generateDescWithTest : t.generateDescWithoutTest}
          </p>
        </div>

        {/* Goals selection */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-600" /> {t.goalsQuestion}
          </label>
          <div className="space-y-2">
            {availableGoals.map((goal, idx) => {
              const isChecked = selectedGoals.includes(goal);
              return (
                <button
                  key={idx}
                  onClick={() => handleToggleGoal(goal)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-sans text-sm transition cursor-pointer text-left ${
                    isChecked
                      ? "border-indigo-600 bg-indigo-50/20 text-indigo-950 font-bold"
                      : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="pr-4">{goal}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="accent-indigo-600 rounded-md w-4 h-4 shrink-0 pointer-events-none"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 mb-6 text-sm flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={generateCurriculum}
          disabled={generating || selectedGoals.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.generatingCurriculum}
            </>
          ) : (
            <>
              {t.generateBtn} ({currentLevel}) <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="curriculum-dashboard">
      <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
              {t.curriculumTag}
            </span>
            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
              {currentLevel}
            </span>
          </div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 mt-3">
            {t.curriculumTitle}
          </h2>
          <p className="text-slate-600 text-sm mt-1 max-w-xl leading-relaxed">
            {curriculum.lessons.length} {language === 'fr' ? 'cours sur mesure basés sur vos objectifs' : 'tailored modules targeting your core learning priorities'}.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="flex gap-4 shrink-0 font-sans">
          <div className="bg-white px-5 py-3 rounded-2xl border border-indigo-100/50 text-center shadow-xs">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.modules}</div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {completedLessons.length} / {curriculum.lessons.length}
            </div>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-indigo-100/50 text-center shadow-xs">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.completion}</div>
            <div className="text-xl font-bold font-mono text-indigo-600">
              {Math.round((completedLessons.length / curriculum.lessons.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{t.focusAreas}</div>
          <div className="text-xs font-sans font-bold text-slate-800 leading-relaxed">
            {curriculum.focusAreas?.slice(0, 3).join(" • ") || currentLevel}
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">{t.priorityGaps}</div>
          <div className="text-xs font-sans font-bold text-slate-800 leading-relaxed">
            {curriculum.weakPoints?.slice(0, 2).join(" & ") || (language === 'fr' ? "Bases & Pratique" : "Basics & Practice")}
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{t.targetGoal}</div>
          <div className="text-xs font-sans font-bold text-slate-800 leading-relaxed">
            {language === 'fr' ? `Niveau cible : ${currentLevel}` : `Target Level: ${currentLevel}`}
          </div>
        </div>
      </div>

      {/* Curriculum modules */}
      <div className="space-y-4">
        <h3 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> {t.lessonModules}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {curriculum.lessons.map((lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const badgeStyle = categoryColors[lesson.category] || "bg-slate-100 text-slate-800 border-slate-200";
            return (
              <div
                key={lesson.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 transition"
                id={`curriculum-lesson-card-${lesson.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl border border-slate-150 shrink-0">
                    {categoryIcons[lesson.category] || "📘"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle}`}>
                        {lesson.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-full">
                        {lesson.difficulty}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-sans font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {t.completed}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-display font-extrabold text-slate-900">
                      {lesson.title}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-2xl">
                      {lesson.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSelectLesson(lesson)}
                  className={`px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition shrink-0 cursor-pointer ${
                    isCompleted
                      ? "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
                  }`}
                >
                  {isCompleted ? t.reviewLesson : t.startLesson}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

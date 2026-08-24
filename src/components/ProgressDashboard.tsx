import React from "react";
import { UserProgress, CefrLevel, AppLanguage } from "../types";
import { translations, CEFR_LEVELS } from "../translations";
import { Zap, Calendar, TrendingUp, BookOpen, CheckCircle, GraduationCap, Brain, Layers, ArrowRight, Sparkles } from "lucide-react";

interface ProgressDashboardProps {
  progress: UserProgress;
  onNavigateToTab: (tab: string) => void;
  onLevelChange: (level: CefrLevel) => void;
  language: AppLanguage;
}

export default function ProgressDashboard({
  progress,
  onNavigateToTab,
  onLevelChange,
  language,
}: ProgressDashboardProps) {
  const t = translations[language].dashboard;
  const common = translations[language].common;

  const { assessmentResult, completedLessons, curriculum, score, streak, srsCards, currentLevel } = progress;

  const totalLessons = curriculum?.lessons.length || 5;
  const completedCount = completedLessons.length;
  const completionPercentage = Math.round((completedCount / totalLessons) * 100);

  const todayStr = new Date().toISOString().split("T")[0];
  const srsDeck = srsCards || [];
  const dueCount = srsDeck.filter((c) => c.dueDate <= todayStr).length;

  const compositeScore = assessmentResult?.score ?? 0;
  const evaluatedLevel = assessmentResult?.evaluatedLevel ?? currentLevel;

  const skillsData = [
    { label: language === 'fr' ? "Grammaire & Subjonctif" : "Grammar & Subjunctive", score: assessmentResult?.grammarScore ?? 0, bg: "bg-indigo-600" },
    { label: language === 'fr' ? "Registres & Vocabulaire" : "Registers & Vocabulary", score: assessmentResult?.vocabularyScore ?? 0, bg: "bg-slate-800" },
    { label: language === 'fr' ? "Phonétique & Raccourcis" : "Phonetics & Native Shortcuts", score: assessmentResult?.listeningScore ?? 0, bg: "bg-indigo-400" },
    { label: language === 'fr' ? "Nuances Socioculturelles" : "Sociocultural Nuances", score: assessmentResult?.nuanceScore ?? 0, bg: "bg-orange-500" },
  ];

  return (
    <div className="space-y-8" id="progress-dashboard">
      
      {/* High-Level Overview Cards Styled as distinct Bento Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Experience Card */}
        <div className="bg-indigo-50/60 rounded-3xl border border-indigo-100 p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-0.5">{t.activeExp}</div>
            <div className="text-2xl font-extrabold font-display text-indigo-950">{score} XP</div>
            <div className="text-xs text-indigo-700/80 font-medium">{t.globalActivity}</div>
          </div>
        </div>

        {/* Level Card: Contrast Dark Bento Panel */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-700 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">{t.currentLevelCard}</div>
            <div className="text-2xl font-extrabold font-display text-white">{currentLevel}</div>
            <div className="text-xs text-slate-400">
              {assessmentResult ? t.confirmedByTest : t.testPending}
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-0.5">{t.dailyStreak}</div>
            <div className="text-2xl font-extrabold font-display text-slate-950">{streak} {language === 'fr' ? 'Jours' : 'Days'}</div>
            <div className="text-xs text-slate-500">{t.activePractice}</div>
          </div>
        </div>

        {/* Lesson Progress Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{t.completedLessons}</div>
            <div className="text-2xl font-extrabold font-display text-slate-950">
              {completedCount} / {totalLessons}
            </div>
            <div className="text-xs text-indigo-600 font-semibold">{t.completionRate} : {completionPercentage}%</div>
          </div>
        </div>

      </div>

      {/* Anki SRS Daily Review Quick Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center text-indigo-300 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300 font-mono">
              <Layers className="w-3.5 h-3.5" /> {language === 'fr' ? 'Méthode Anki • Spaced Repetition System' : 'Anki Method • Spaced Repetition System'}
            </div>
            <h3 className="text-base sm:text-lg font-display font-extrabold">
              {dueCount > 0
                ? `${dueCount} ${language === 'fr' ? 'carte(s) Anki à réviser aujourd\'hui !' : 'Anki card(s) due today!'}`
                : language === 'fr' ? 'Vos cartes Anki sont à jour pour aujourd\'hui !' : 'All Anki flashcards reviewed for today!'}
            </h3>
            <p className="text-xs text-slate-300 max-w-lg mt-0.5">
              {language === 'fr'
                ? 'Révisez vos phrases et vocabulaire par la répétition espacée SM-2 pour une mémorisation active à long terme.'
                : 'Review your French vocabulary and patterns with the SM-2 algorithm for long-term retention.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab("anki")}
          className="px-5 py-3 bg-white text-indigo-950 hover:bg-slate-100 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm font-sans"
        >
          {dueCount > 0 ? t.launchAnkiReview : t.manageAnkiCards}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Visual charts & Diagnostics summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left pane: Visual skills scores & levels */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">{t.detailedProfile}</span>
              <h3 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> {t.skillsProfile} ({currentLevel})
              </h3>
            </div>
            {assessmentResult && (
              <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full">
                {t.overallScore}: {compositeScore}%
              </span>
            )}
          </div>

          {!assessmentResult ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700">
                <Brain className="w-6 h-6" />
              </div>
              <div className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed font-sans">
                {t.diagnosticPrompt}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateToTab("curriculum")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> {t.startCurriculumBtn}
                </button>
                <button
                  onClick={() => onNavigateToTab("assessment")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {t.takeDiagnosticBtn}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Radial Score Gauge & Bars */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                
                {/* SVG Radial Progress Ring */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="10"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-indigo-600 fill-none transition-all duration-1000"
                      strokeWidth="10"
                      strokeDasharray="377"
                      strokeDashoffset={377 - (377 * compositeScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-3xl font-extrabold font-display text-slate-900">{compositeScore}%</div>
                    <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">{t.mastery}</div>
                  </div>
                </div>

                {/* Vertical list of sub-competencies */}
                <div className="flex-1 w-full space-y-4">
                  {skillsData.map((sk, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="font-semibold text-slate-700">{sk.label}</span>
                        <span className="font-bold text-slate-900 font-mono">{sk.score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`${sk.bg} h-2 rounded-full transition-all duration-500`} style={{ width: `${sk.score}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Progress feedback message from diagnostic */}
              <div className="p-5 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl text-xs font-sans text-indigo-950 leading-relaxed italic">
                💡 <span className="font-semibold not-italic text-indigo-900">{t.aiAnalysisTitle} : </span> 
                « {assessmentResult.feedback.length > 280 ? `${assessmentResult.feedback.substring(0, 280)}...` : assessmentResult.feedback} »
              </div>

            </div>
          )}
        </div>

        {/* Right pane: Goals checklist and weekly curriculum review */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">{t.moduleProgress}</span>
              <h3 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" /> {t.roadmapTitle} ({currentLevel})
              </h3>
            </div>

            {curriculum ? (
              <div className="space-y-3 font-sans">
                {curriculum.lessons.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                        isCompleted
                          ? "bg-slate-50 border-slate-200 text-slate-800"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{isCompleted ? "✅" : "⏳"}</span>
                        <div>
                          <div className="font-bold text-slate-900">{lesson.title}</div>
                          <div className="text-[10px] text-slate-500">{lesson.category} • {lesson.difficulty}</div>
                        </div>
                      </div>
                      {!isCompleted && (
                        <button
                          onClick={() => onNavigateToTab("curriculum")}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition"
                        >
                          {language === 'fr' ? 'Étudier' : 'Study'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-4">
                  {t.noCurriculumDesc}
                </p>
                <button
                  onClick={() => onNavigateToTab("curriculum")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-800 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition font-sans cursor-pointer"
                >
                  {t.generateCurriculumBtn}
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>{common.level} {currentLevel}</span>
            <span className="font-bold font-mono text-indigo-600">{completionPercentage}% {language === 'fr' ? 'complété' : 'completed'}</span>
          </div>

        </div>

      </div>

    </div>
  );
}

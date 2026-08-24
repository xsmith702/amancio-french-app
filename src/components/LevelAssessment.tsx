import React, { useState } from "react";
import { AssessmentQuestion, AssessmentResult, CefrLevel, AppLanguage } from "../types";
import { translations, CEFR_LEVELS } from "../translations";
import { Sparkles, Brain, ArrowRight, CheckCircle2, RotateCcw, Award, ClipboardCheck } from "lucide-react";

interface LevelAssessmentProps {
  assessmentResult: AssessmentResult | null;
  onAssessmentCompleted: (result: AssessmentResult) => void;
  onReset: () => void;
  currentLevel: CefrLevel;
  onLevelChange: (level: CefrLevel) => void;
  onNavigateToTab?: (tab: string) => void;
  language: AppLanguage;
}

export default function LevelAssessment({
  assessmentResult,
  onAssessmentCompleted,
  onReset,
  currentLevel,
  onLevelChange,
  onNavigateToTab,
  language,
}: LevelAssessmentProps) {
  const t = translations[language].assessment;
  const common = translations[language].common;

  const [targetLevel, setTargetLevel] = useState<CefrLevel>(currentLevel);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1: Intro, >=0: Question index
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: targetLevel, language }),
      });
      if (!res.ok) throw new Error(language === 'fr' ? "Erreur de génération des questions." : "Failed to generate assessment questions.");
      const data = await res.json();
      setQuestions(data);
      setCurrentStep(0);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAnswers();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAnswers = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers, level: targetLevel, language }),
      });
      if (!res.ok) throw new Error(language === 'fr' ? "Erreur lors de l'évaluation." : "Failed to evaluate answers.");
      const result = await res.json();
      if (result.evaluatedLevel) {
        onLevelChange(result.evaluatedLevel as CefrLevel);
      }
      onAssessmentCompleted(result);
    } catch (err: any) {
      setError(err.message || "An error occurred during evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  const renderIntro = () => (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xs max-w-2xl mx-auto text-center" id="assessment-intro">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 border border-indigo-100 shadow-xs">
        <ClipboardCheck className="w-8 h-8" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
        {language === 'fr' ? 'DIAGNOSTIC ADAPTATIF' : 'ADAPTIVE DIAGNOSTIC'}
      </span>
      <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-4">
        {t.title}
      </h2>
      <p className="text-slate-600 mb-6 leading-relaxed font-sans text-sm">
        {t.introDesc}
      </p>

      {targetLevel === 'A0' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-5 mb-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{language === 'fr' ? 'Nouveau dans l\'apprentissage ?' : 'Brand New to French?'}</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-sans">
              {language === 'fr'
                ? 'Les débutants complets n\'ont pas besoin de test ! Vous pouvez commencer vos premiers cours et mémoriser vos premiers mots dès maintenant.'
                : 'Absolute beginners do not need to take an evaluation test! You can jump straight into foundational lessons and start learning right away.'}
            </p>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('curriculum')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer shrink-0 transition"
            >
              {language === 'fr' ? 'Aller au Plan d\'Étude' : 'Go to Study Plan'} →
            </button>
          )}
        </div>
      )}

      {/* Target Level Selection for Diagnostic */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left space-y-3">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          {t.levelTarget} :
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CEFR_LEVELS.filter(l => l.code !== 'C2').map((lvl) => (
            <button
              key={lvl.code}
              type="button"
              onClick={() => setTargetLevel(lvl.code)}
              className={`p-2.5 rounded-xl border text-center font-sans font-bold text-xs transition cursor-pointer ${
                targetLevel === lvl.code
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="block">{lvl.code}</span>
              <span className="text-[9px] font-normal opacity-90 block truncate">
                {language === 'fr' ? lvl.nameFr.split(' ')[0] : lvl.nameEn.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 font-sans italic">
          {language === 'fr' 
            ? CEFR_LEVELS.find(l => l.code === targetLevel)?.descFr
            : CEFR_LEVELS.find(l => l.code === targetLevel)?.descEn}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 mb-6 text-sm text-left">
          {error}
        </div>
      )}

      <button
        id="btn-start-diagnostic"
        onClick={startAssessment}
        disabled={loading}
        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-600/10 cursor-pointer"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {t.generatingQuestions}
          </>
        ) : (
          <>
            {t.startBtn} ({targetLevel}) <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
      <div className="mt-4 text-xs font-mono text-slate-400">
        {language === 'fr' ? 'Durée estimée : 4-6 minutes • IA adaptative' : 'Estimated time: 4-6 minutes • Adaptive AI'}
      </div>
    </div>
  );

  const renderQuestion = () => {
    const q = questions[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === questions.length - 1;
    const currentAnswer = answers[q.id] || "";

    return (
      <div className="max-w-2xl mx-auto animate-fade-in" id={`assessment-step-${currentStep}`}>
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
            {q.field}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-400">
            {t.questionOf} {currentStep + 1} {t.of} {questions.length}
          </span>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Text */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs mb-6">
          {q.context && (
            <div className="mb-5 p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-600 font-sans italic text-slate-700 text-sm leading-relaxed whitespace-pre-line shadow-xs">
              {q.context}
            </div>
          )}
          <h3 className="text-lg font-display font-extrabold text-slate-900 mb-6 leading-relaxed">
            {q.question}
          </h3>

          {/* Multiple choice inputs */}
          {q.type === "multiple-choice" && q.choices && (
            <div className="space-y-3">
              {q.choices.map((choice, idx) => {
                const isSelected = currentAnswer === choice;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(q.id, choice)}
                    className={`w-full text-left p-4 rounded-xl border font-sans transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 font-semibold"
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                          : "border-slate-300 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{choice}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Open response input */}
          {q.type === "open-response" && (
            <div>
              <textarea
                rows={4}
                value={currentAnswer}
                onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                placeholder={language === 'fr' ? "Rédigez votre réponse en français..." : "Type your answer in French..."}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-sans text-slate-850"
              />
              <div className="mt-2 text-xs text-slate-400 font-sans leading-relaxed">
                💡 {language === 'fr' 
                  ? "Conseil : Répondez spontanément en français pour que l'IA évalue précisément votre syntaxe."
                  : "Tip: Write in French as best you can so the AI can evaluate your level."}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirst || evaluating}
            className="px-6 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition disabled:opacity-30 cursor-pointer"
          >
            {t.previous}
          </button>

          <button
            onClick={handleNext}
            disabled={!currentAnswer.trim() || evaluating}
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            {evaluating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {t.analyzing}
              </>
            ) : isLast ? (
              <>
                {t.submit} <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                {t.next} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!assessmentResult) return null;

    const subscores = [
      { label: language === 'fr' ? "Grammaire & Structures" : "Grammar & Structures", val: assessmentResult.grammarScore, color: "bg-indigo-600" },
      { label: language === 'fr' ? "Vocabulaire & Précision" : "Vocabulary & Precision", val: assessmentResult.vocabularyScore, color: "bg-slate-800" },
      { label: language === 'fr' ? "Phonétique & Compréhension" : "Phonetics & Listening", val: assessmentResult.listeningScore, color: "bg-indigo-400" },
      { label: language === 'fr' ? "Nuances & Contexte" : "Nuances & Context", val: assessmentResult.nuanceScore, color: "bg-orange-500" },
    ];

    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-3xl mx-auto space-y-8" id="assessment-result">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
              {language === 'fr' ? 'Diagnostic Complété' : 'Assessment Completed'}
            </span>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              {t.resultsTitle}
            </h2>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 shrink-0">
            <div className="text-right">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {t.suggestedLevel}
              </div>
              <div className="text-2xl font-extrabold font-display text-slate-900">
                {assessmentResult.evaluatedLevel}
              </div>
            </div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-bold font-mono shadow-md shadow-indigo-600/20">
              {assessmentResult.score}
            </div>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="space-y-4">
          <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" /> {t.skillsBreakdown}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscores.map((s, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">{s.label}</span>
                  <span className="font-mono font-bold text-slate-950">{s.val}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className={`${s.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${s.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-indigo-50/30 border border-indigo-100 rounded-3xl p-6">
          <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-3">
            {t.aiReport}
          </h4>
          <p className="text-slate-700 font-sans text-sm leading-relaxed whitespace-pre-line">
            {assessmentResult.feedback}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weak points */}
          <div className="border border-orange-100 bg-orange-50/20 rounded-3xl p-6">
            <h4 className="text-xs font-bold text-orange-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-orange-600" /> {t.weakPoints}
            </h4>
            <ul className="space-y-2.5">
              {assessmentResult.weakPoints.map((item, idx) => (
                <li key={idx} className="text-xs text-orange-950 font-sans flex items-start gap-2 leading-relaxed">
                  <span className="text-orange-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="border border-indigo-100 bg-indigo-50/20 rounded-3xl p-6">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> {t.recommendations}
            </h4>
            <ul className="space-y-2.5">
              {assessmentResult.recommendations.map((item, idx) => (
                <li key={idx} className="text-xs text-indigo-950 font-sans flex items-start gap-2 leading-relaxed">
                  <span className="text-indigo-500 font-bold shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> {t.retakeBtn}
          </button>
          
          <div className="text-xs text-slate-400 font-sans text-center sm:text-right font-medium">
            {t.readyForCurriculum}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-4">
      {assessmentResult
        ? renderResults()
        : currentStep === -1
        ? renderIntro()
        : renderQuestion()}
    </div>
  );
}

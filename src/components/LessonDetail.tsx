import React, { useState } from "react";
import { Lesson, AppLanguage } from "../types";
import { translations } from "../translations";
import { ArrowLeft, Check, X, HelpCircle, GraduationCap, ChevronRight, RefreshCw, CheckCircle, Volume2 } from "lucide-react";

interface LessonDetailProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (lessonId: string) => void;
  isCompleted: boolean;
  language: AppLanguage;
}

export default function LessonDetail({
  lesson,
  onBack,
  onComplete,
  isCompleted,
  language,
}: LessonDetailProps) {
  const t = translations[language].lessonDetail;
  const common = translations[language].common;

  const [currentExerciseIdx, setCurrentExerciseIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittedExercises, setSubmittedExercises] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const currentExercise = lesson.exercises[currentExerciseIdx];
  const isLastExercise = currentExerciseIdx === lesson.exercises.length - 1;

  const handleSelectOption = (exerciseId: string, option: string) => {
    if (submittedExercises.includes(exerciseId)) return;
    setUserAnswers((prev) => ({ ...prev, [exerciseId]: option }));
  };

  const handleTextAnswerChange = (exerciseId: string, val: string) => {
    if (submittedExercises.includes(exerciseId)) return;
    setUserAnswers((prev) => ({ ...prev, [exerciseId]: val }));
  };

  const handleCheckAnswer = (exerciseId: string) => {
    setSubmittedExercises((prev) => [...prev, exerciseId]);
  };

  const handleNextExercise = () => {
    if (isLastExercise) {
      setShowSummary(true);
      onComplete(lesson.id);
    } else {
      setCurrentExerciseIdx(currentExerciseIdx + 1);
    }
  };

  const handleResetExercises = () => {
    setCurrentExerciseIdx(0);
    setUserAnswers({});
    setSubmittedExercises([]);
    setShowSummary(false);
  };

  // Web Speech synthesis to read vocab words aloud
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const scoreCount = lesson.exercises.filter((ex) => {
    const userAns = (userAnswers[ex.id] || "").trim().toLowerCase();
    const correctAns = ex.correctAnswer.trim().toLowerCase();
    return userAns === correctAns;
  }).length;

  return (
    <div className="space-y-6" id={`lesson-detail-container-${lesson.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-xs font-bold font-sans cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t.backToCurriculum}
        </button>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
          {t.module} : {lesson.category}
        </span>
      </div>

      {/* Lesson Title */}
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
          {lesson.title}
        </h2>
        <p className="text-slate-500 text-xs mt-1 max-w-xl">
          {lesson.description} • {t.difficulty} {lesson.difficulty}
        </p>
      </div>

      {/* Two columns: Content & Drills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Course content and training */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <h3 className="text-base font-display font-extrabold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> {t.courseGuide}
            </h3>
            
            <div className="prose prose-slate max-w-none font-sans text-slate-700 leading-relaxed text-sm space-y-4 whitespace-pre-wrap">
              {lesson.content}
            </div>
          </div>

          {/* Vocabulary helper list */}
          {lesson.vocabularyList && lesson.vocabularyList.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {t.vocabAndExpressions}
              </h3>
              <div className="space-y-4">
                {lesson.vocabularyList.map((vocab, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-extrabold text-slate-900 text-sm">{vocab.word}</span>
                        <button
                          onClick={() => handleSpeak(vocab.word)}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                          title="Listen"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs font-sans text-slate-500 italic">
                        {t.definition} : {vocab.translation}
                      </div>
                      <div className="text-xs font-sans text-slate-700 font-medium">
                        {t.example} : {vocab.example}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exercises/Drills segment */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs sticky top-4">
            {!showSummary ? (
              <div id="active-exercise" className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {t.exercise} {currentExerciseIdx + 1} {t.of} {lesson.exercises.length}
                  </span>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {currentExercise.type}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 transition-all duration-300"
                    style={{ width: `${((currentExerciseIdx + 1) / lesson.exercises.length) * 100}%` }}
                  ></div>
                </div>

                {/* Exercise question */}
                <div className="mb-6 font-display font-extrabold text-slate-900 text-base leading-relaxed">
                  {currentExercise.question}
                </div>

                {/* Multiple choice choices */}
                {currentExercise.type === "multiple-choice" && currentExercise.choices && (
                  <div className="space-y-2 mb-6">
                    {currentExercise.choices.map((choice, idx) => {
                      const isSelected = userAnswers[currentExercise.id] === choice;
                      const isSubmitted = submittedExercises.includes(currentExercise.id);
                      const isCorrect = choice === currentExercise.correctAnswer;

                      let btnStyle = "border-slate-150 bg-white hover:bg-slate-50 text-slate-700";
                      if (isSelected) {
                        btnStyle = "border-slate-800 bg-slate-50 text-slate-950 font-bold";
                      }
                      if (isSubmitted) {
                        if (isCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
                        } else if (isSelected) {
                          btnStyle = "border-rose-300 bg-rose-50 text-rose-950";
                        } else {
                          btnStyle = "border-slate-150 bg-white text-slate-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(currentExercise.id, choice)}
                          disabled={isSubmitted}
                          className={`w-full text-left p-3.5 rounded-xl border font-sans text-sm transition flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                        >
                          <span>{choice}</span>
                          {isSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the blank and Translation types */}
                {(currentExercise.type === "fill-in-the-blank" || currentExercise.type === "translation") && (
                  <div className="mb-6">
                    <input
                      type="text"
                      value={userAnswers[currentExercise.id] || ""}
                      onChange={(e) => handleTextAnswerChange(currentExercise.id, e.target.value)}
                      disabled={submittedExercises.includes(currentExercise.id)}
                      placeholder={currentExercise.type === "fill-in-the-blank" ? t.fillBlankPlaceholder : t.translationPlaceholder}
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition font-sans text-sm text-slate-850"
                    />

                    {submittedExercises.includes(currentExercise.id) && (
                      <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 text-indigo-950 rounded-xl text-xs font-sans">
                        <strong className="text-indigo-900">{t.expectedAnswer} :</strong> {currentExercise.correctAnswer}
                      </div>
                    )}
                  </div>
                )}

                {/* Check Explanation */}
                {submittedExercises.includes(currentExercise.id) && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 mb-6 text-xs font-sans text-slate-600 leading-relaxed">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> {t.explanation}
                    </div>
                    {currentExercise.explanation}
                  </div>
                )}

                {/* Action controls */}
                {!submittedExercises.includes(currentExercise.id) ? (
                  <button
                    onClick={() => handleCheckAnswer(currentExercise.id)}
                    disabled={!userAnswers[currentExercise.id]?.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 font-sans cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    {t.checkAnswer}
                  </button>
                ) : (
                  <button
                    onClick={handleNextExercise}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition font-sans cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    {isLastExercise ? t.finishLesson : t.nextExercise} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4 animate-fade-in" id="exercise-completed-summary">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 border border-indigo-100 shadow-xs">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-extrabold text-slate-900 mb-2">
                  {t.lessonCompletedTitle}
                </h3>
                <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                  {t.lessonCompletedDesc}
                </p>

                <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 mb-6 font-sans">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.yourScore}</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-display">
                    {scoreCount} / {lesson.exercises.length} {language === 'fr' ? 'corrects' : 'correct'}
                  </div>
                  <div className="text-xs text-indigo-600 font-bold mt-1">
                    + {scoreCount * 15} {t.xpRewarded}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={onBack}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition font-sans cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    {t.backToModules}
                  </button>
                  <button
                    onClick={handleResetExercises}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition font-sans cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {t.retryExercises}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

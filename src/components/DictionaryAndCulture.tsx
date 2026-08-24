import React, { useState } from "react";
import { DictionaryExplainer, SrsCard, CefrLevel, AppLanguage } from "../types";
import { translations } from "../translations";
import { Search, Sparkles, BookMarked, Globe, MessageCircle, HelpCircle, Loader2, Volume2, ArrowUpRight, Brain, Check } from "lucide-react";

interface DictionaryAndCultureProps {
  history: DictionaryExplainer[];
  onAddHistory: (entry: DictionaryExplainer) => void;
  onAddToAnki?: (card: SrsCard) => void;
  currentLevel: CefrLevel;
  language: AppLanguage;
}

export default function DictionaryAndCulture({
  history,
  onAddHistory,
  onAddToAnki,
  currentLevel,
  language,
}: DictionaryAndCultureProps) {
  const t = translations[language].dictionary;
  const common = translations[language].common;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<DictionaryExplainer | null>(null);
  const [addedAnki, setAddedAnki] = useState<boolean>(false);

  const handleSearch = async (termToSearch = searchTerm, question = customQuestion) => {
    const finalTerm = termToSearch.trim();
    if (!finalTerm) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dictionary/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: finalTerm,
          userQuestion: question.trim() || undefined,
          level: currentLevel,
          language: language,
        }),
      });

      if (!res.ok) throw new Error(language === 'fr' ? "Erreur lors de l'analyse du terme." : "Could not process dictionary explanation.");
      const data = await res.json();
      setCurrentEntry(data);
      setAddedAnki(false);
      onAddHistory(data);
      setCustomQuestion("");
    } catch (err: any) {
      setError(err.message || "Failed to search word");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = currentLevel === "A0" || currentLevel === "A1" ? 0.8 : 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const registerColors: Record<string, string> = {
    Soutenu: "bg-indigo-50 text-indigo-700 border-indigo-150",
    Courant: "bg-slate-100 text-slate-700 border-slate-200",
    Familier: "bg-amber-50 text-amber-700 border-amber-200",
    Argot: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto" id="dictionary-container">
      
      {/* Search Input and Lookup History */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
            {language === 'fr' ? 'DÉCRYPTAGE SÉMANTIQUE' : 'SEMANTIC & CULTURAL DECODER'}
          </span>
          <h3 className="text-base font-display font-extrabold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-1.5">
            <BookMarked className="w-5 h-5 text-indigo-600" /> {t.title}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">{t.searchLabel}</label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t.placeholder}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">{t.questionLabel}</label>
              <textarea
                rows={2}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder={t.questionPlaceholder}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-sm font-sans leading-relaxed"
              />
            </div>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl font-sans">
                {error}
              </div>
            )}

            <button
              onClick={() => handleSearch()}
              disabled={loading || !searchTerm.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.analyzingSemantics}
                </>
              ) : (
                <>
                  {t.analyzeBtn} <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved/Lookup history */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            {t.recentLookups} ({history.length})
          </h4>
          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-sans">
              {t.noLookupsYet}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {history.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentEntry(entry);
                    setSearchTerm(entry.word);
                  }}
                  className="w-full text-left py-2.5 hover:bg-slate-50 px-2 rounded-xl transition flex items-center justify-between text-xs font-sans text-slate-700"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{entry.word}</span>
                    <span className="text-slate-400 font-normal italic text-[10px]">{entry.translation}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${registerColors[entry.register] || "bg-slate-100 text-slate-600"}`}>
                    {entry.register}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Display Panel */}
      <div className="lg:col-span-7">
        {currentEntry ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6" id="dictionary-result">
            
            {/* Header: Term and Phonetics */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold font-display text-slate-900">{currentEntry.word}</h2>
                  <button
                    onClick={() => handleSpeak(currentEntry.word)}
                    className="p-1.5 hover:bg-indigo-50 rounded-full text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                    title="Speak"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                  <span>[{currentEntry.phonetic}]</span>
                  <span>•</span>
                  <span className="italic">{currentEntry.partOfSpeech}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${registerColors[currentEntry.register] || "bg-slate-100 text-slate-600"}`}>
                  {t.register} : {currentEntry.register}
                </span>
                {onAddToAnki && (
                  <button
                    onClick={() => {
                      onAddToAnki({
                        id: "anki-dict-" + Date.now(),
                        level: currentLevel,
                        front: currentEntry.word,
                        back: `${currentEntry.translation} - ${currentEntry.definition}\n${t.register} : ${currentEntry.register}`,
                        category: "Vocabulaire",
                        example: currentEntry.examples[0]?.french,
                        interval: 0,
                        repetition: 0,
                        easeFactor: 2.5,
                        dueDate: new Date().toISOString().split("T")[0],
                      });
                      setAddedAnki(true);
                    }}
                    disabled={addedAnki}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition cursor-pointer ${
                      addedAnki
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                    }`}
                  >
                    {addedAnki ? <Check className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                    {addedAnki ? t.ankiCardAdded : t.addToAnki}
                  </button>
                )}
              </div>
            </div>

            {/* Translation & definition */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.synonymDef}</h4>
              <div className="text-sm font-sans">
                <strong className="text-slate-900 font-extrabold text-lg block mb-0.5">{currentEntry.translation}</strong>
                <p className="text-slate-600 leading-relaxed text-sm">{currentEntry.definition}</p>
              </div>
            </div>

            {/* Cultural Nuance breakdown */}
            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" /> {t.culturalPragmatic}
              </h4>
              <p className="text-slate-700 text-xs font-sans leading-relaxed whitespace-pre-wrap">
                {currentEntry.culturalNuances}
              </p>
            </div>

            {/* Spoken tip */}
            {currentEntry.spokenFrenchTip && (
              <div className="p-6 bg-orange-50/45 border border-orange-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-orange-800 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-orange-600" /> {t.spokenTip}
                </h4>
                <p className="text-slate-700 text-xs font-sans leading-relaxed">
                  {currentEntry.spokenFrenchTip}
                </p>
              </div>
            )}

            {/* Collocations */}
            {currentEntry.collocations && currentEntry.collocations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.collocations}</h4>
                <div className="flex flex-wrap gap-2">
                  {currentEntry.collocations.map((col, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-sans font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => {
                        setSearchTerm(col);
                        handleSearch(col);
                      }}
                    >
                      {col} <ArrowUpRight className="w-3 h-3 inline-block ml-0.5 text-slate-400" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Context Examples */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.realWorldExamples}</h4>
              <div className="grid grid-cols-1 gap-3">
                {currentEntry.examples.map((ex, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-sans font-bold text-slate-900 italic text-sm">
                      « {ex.french} »
                    </div>
                    <div className="font-sans text-slate-500">
                      {ex.english}
                    </div>
                    {ex.contextExplanation && (
                      <div className="font-sans text-indigo-800 text-[10px] mt-1.5 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg inline-block">
                        💡 {ex.contextExplanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center h-full min-h-[350px]">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <HelpCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-display font-extrabold text-slate-900">{t.noWordSearched}</h3>
            <p className="text-slate-400 text-sm font-sans mt-2 max-w-sm leading-relaxed">
              {t.searchPrompt}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

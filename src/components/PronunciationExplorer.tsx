import React, { useState } from "react";
import { PronunciationItem, CefrLevel, AppLanguage } from "../types";
import { curatedPronunciations } from "../pronunciationData";
import { translations } from "../translations";
import { Volume2, Sparkles, MessageSquare, Loader2, Info } from "lucide-react";

interface PronunciationExplorerProps {
  currentLevel: CefrLevel;
  language: AppLanguage;
}

export default function PronunciationExplorer({
  currentLevel,
  language,
}: PronunciationExplorerProps) {
  const t = translations[language].pronunciation;
  const common = translations[language].common;

  const [items, setItems] = useState<PronunciationItem[]>(curatedPronunciations);
  const [activeItem, setActiveItem] = useState<PronunciationItem>(() => {
    const matching = curatedPronunciations.find((p) => p.level === currentLevel);
    return matching || curatedPronunciations[0];
  });
  const [customPhrase, setCustomPhrase] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("Tous");

  // Programmatic Speech Synthesis Playback
  const playAudio = (text: string, isActual: boolean) => {
    if (!("speechSynthesis" in window)) {
      alert(language === 'fr' ? "Votre navigateur ne supporte pas la synthèse vocale." : "Your browser does not support speech synthesis.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    
    if (isActual) {
      utterance.rate = currentLevel === "A0" || currentLevel === "A1" ? 0.9 : 1.1; 
      utterance.pitch = 0.95;
    } else {
      utterance.rate = currentLevel === "A0" || currentLevel === "A1" ? 0.75 : 0.85;
      utterance.pitch = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateCustom = async () => {
    const trimmed = customPhrase.trim();
    if (!trimmed) return;

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/pronunciation/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase: trimmed, level: currentLevel, language }),
      });

      if (!res.ok) throw new Error(language === 'fr' ? "Erreur lors de l'analyse phonétique." : "Failed to analyze pronunciation shortcuts.");
      const data = await res.json();
      
      const newItem: PronunciationItem = {
        ...data,
        id: `custom_${Date.now()}`,
        level: currentLevel,
      };

      setItems((prev) => [newItem, ...prev]);
      setActiveItem(newItem);
      setCustomPhrase("");
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setGenerating(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterLevel === "Tous") return true;
    return item.level === filterLevel;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto" id="pronunciation-explorer">
      
      {/* List of Curated Contractions & Custom Input */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
            {language === 'fr' ? 'ANALYSE PHONÉTIQUE IA' : 'AI PHONETIC ANALYSIS'}
          </span>
          <h3 className="text-base font-display font-extrabold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300" /> {t.convertTitle}
          </h3>
          
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              {t.convertDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateCustom()}
                placeholder={t.placeholder}
                className="flex-1 min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-sm font-sans"
              />
              <button
                onClick={handleGenerateCustom}
                disabled={generating || !customPhrase.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 font-sans cursor-pointer whitespace-nowrap shrink-0"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.analyzeBtn}
              </button>
            </div>
            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-sans">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* List index */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t.libraryTitle}
            </h4>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="Tous">{language === 'fr' ? 'Tous les niveaux' : 'All levels'}</option>
              <option value="A0">A0</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isActive = activeItem.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs font-sans transition flex flex-col gap-1 cursor-pointer ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 font-bold shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.level && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800">
                          {item.level}
                        </span>
                      )}
                      <span className="font-extrabold text-slate-950 text-xs sm:text-sm">{item.actual}</span>
                    </div>
                    <span className="text-slate-400 italic font-mono text-[10px] truncate max-w-[120px]">
                      {item.formal}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Analysis details panel with play clip buttons */}
      <div className="lg:col-span-7">
        {activeItem && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6" id="pronunciation-analysis-panel">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
                {t.phoneticAnalysis}
              </span>
              {activeItem.level && (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">
                  {common.level} {activeItem.level}
                </span>
              )}
            </div>

            {/* Side by side pronunciation clips comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Written academic block */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-between h-40 shadow-xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t.formalWritten}</span>
                  <div className="text-base sm:text-lg font-extrabold font-display text-slate-900 mt-1 leading-tight">{activeItem.formal}</div>
                  <div className="text-xs font-mono text-slate-500 mt-1">/{activeItem.phoneticFormal}/</div>
                </div>
                <button
                  onClick={() => playAudio(activeItem.audioClipTextFormal, false)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-slate-500" /> {t.listenFormal}
                </button>
              </div>

              {/* Spoken real block */}
              <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex flex-col justify-between h-40 shadow-xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">{t.spokenNatural}</span>
                  <div className="text-base sm:text-lg font-extrabold font-display text-indigo-950 mt-1 leading-tight">{activeItem.actual}</div>
                  <div className="text-xs font-mono text-indigo-700 mt-1">/{activeItem.phoneticActual}/</div>
                </div>
                <button
                  onClick={() => playAudio(activeItem.audioClipTextActual, true)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-indigo-100" /> {t.listenNatural}
                </button>
              </div>

            </div>

            {/* Structural details explanation */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
              <h4 className="text-xs font-sans font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" /> {t.whyDifference}
              </h4>
              <p className="text-slate-700 text-xs font-sans leading-relaxed whitespace-pre-line">
                {language === 'en' && activeItem.explanationEn ? activeItem.explanationEn : activeItem.explanation}
              </p>
            </div>

            {/* Context dialogue */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> {t.contextDialogue}
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-sans whitespace-pre-line italic text-slate-700 leading-relaxed">
                {language === 'en' && activeItem.exampleContextEn ? activeItem.exampleContextEn : activeItem.exampleContext}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}

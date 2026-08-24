import React, { useState, useRef, useEffect } from "react";
import { ConversationTurn, CefrLevel, AppLanguage } from "../types";
import { translations } from "../translations";
import { Mic, MicOff, Send, Volume2, Sparkles, AlertCircle, RefreshCw, Award, ArrowRight } from "lucide-react";

interface SpeakingCoachProps {
  currentLevel: CefrLevel;
  language: AppLanguage;
}

interface TopicConfig {
  id: string;
  level: CefrLevel[];
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  starter: string;
}

const TOPICS: TopicConfig[] = [
  // A0 - A1 Foundations
  {
    id: "t-a0-1",
    level: ["A0", "A1"],
    titleFr: "Au Café & à la Boulangerie",
    titleEn: "At the Café & Bakery",
    descFr: "Commandez un café, un croissant et demandez l'addition avec politesse.",
    descEn: "Order a coffee, a croissant and ask for the bill politely in French.",
    starter: "Bonjour ! Qu'est-ce que je vous sers aujourd'hui ?"
  },
  {
    id: "t-a0-2",
    level: ["A0", "A1"],
    titleFr: "Se Présenter et Faire Connaissance",
    titleEn: "Introducing Yourself & Greetings",
    descFr: "Dites votre prénom, votre ville d'origine et votre métier ou loisir.",
    descEn: "Share your name, hometown, and hobby with a new acquaintance.",
    starter: "Enchanté ! Je m'appelle Thomas. Et vous, comment vous vous appelez ?"
  },
  {
    id: "t-a2-1",
    level: ["A2", "B1"],
    titleFr: "Demander son Chemin à la Gare",
    titleEn: "Asking for Directions at the Station",
    descFr: "Demandez l'horaire d'un train, le bon quai et le prix d'un billet.",
    descEn: "Ask for train schedules, platform directions, and ticket prices.",
    starter: "Bonjour monsieur/dame, vous cherchez un train en particulier ?"
  },
  // B1 - C1 Advanced
  {
    id: "t1",
    level: ["B1", "B2", "C1"],
    titleFr: "Au Café Parisien (Débat d'actualité)",
    titleEn: "Parisian Café Debate",
    descFr: "Débattez d'un sujet d'actualité politique ou culturelle avec un ami dans un café.",
    descEn: "Debate a current cultural or political topic with a friend in Saint-Germain.",
    starter: "Salut ! Alors, tu as vu l'article de ce matin sur la nouvelle loi climat ? Qu'est-ce que tu en penses ?"
  },
  {
    id: "t2",
    level: ["B2", "C1", "C2"],
    titleFr: "L'Entretien de Recrutement",
    titleEn: "Professional Job Interview",
    descFr: "Passez un entretien d'embauche technique/managérial pour un poste à Paris.",
    descEn: "Go through a technical or leadership interview in high-level formal French.",
    starter: "Bonjour, merci d'être venu aujourd'hui. Pour commencer, pourriez-vous m'expliquer ce qui vous motive le plus dans ce poste chez nous ?"
  },
  {
    id: "t3",
    level: ["B2", "C1", "C2"],
    titleFr: "Dîner Mondain chez des Amis",
    titleEn: "Formal Dinner Party Nuances",
    descFr: "Participez à un dîner élégant. Utilisez des structures indirectes pour nuancer.",
    descEn: "Participate in an elegant dinner. Use indirect rhetorical devices to nuance opinions.",
    starter: "Ah, vous voilà ! Installez-vous. On discutait justement de l'impact des réseaux sociaux sur notre rapport à la culture. C'est fascinant, non ?"
  }
];

export default function SpeakingCoach({
  currentLevel,
  language,
}: SpeakingCoachProps) {
  const t = translations[language].speaking;
  const common = translations[language].common;

  const [selectedTopic, setSelectedTopic] = useState<TopicConfig | null>(null);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter topics appropriate for the current level
  const filteredTopics = TOPICS.filter((tp) => tp.level.includes(currentLevel));
  const displayedTopics = filteredTopics.length > 0 ? filteredTopics : TOPICS;

  useEffect(() => {
    // Initialize Web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "fr-FR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => prev + (prev ? " " : "") + transcript);
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const startTopic = (topic: TopicConfig) => {
    setSelectedTopic(topic);
    setHistory([
      {
        id: "start",
        role: "assistant",
        text: topic.starter,
        translation: language === 'en' ? "Greeting from your conversation partner" : topic.starter,
        pronunciationFeedback: currentLevel === "A0" || currentLevel === "A1"
          ? (language === 'fr' ? "Prenez votre temps pour prononcer chaque voyelle clairement." : "Take your time to articulate each vowel clearly.")
          : (language === 'fr' ? "Entraînez-vous à faire les liaisons et à lier les mots de manière fluide." : "Practice connecting liaisons and natural fluid cadence."),
        grammarFeedback: language === 'fr' ? "Formule d'accroche pour lancer la conversation." : "Opening phrase to start our conversation.",
        fluencyScore: 10
      }
    ]);
    setInputValue("");
    setError(null);
  };

  const handleToggleRecord = () => {
    if (!recognition) {
      alert(language === 'fr'
        ? "La reconnaissance vocale n'est pas supportée sur ce navigateur. Veuillez taper votre réponse."
        : "Speech recognition is not supported in this browser. Please type your reply.");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedTopic) return;

    const userText = inputValue.trim();
    setInputValue("");
    setError(null);

    // Append user message immediately
    const userTurnId = `user_${Date.now()}`;
    const newHistory: ConversationTurn[] = [
      ...history,
      { id: userTurnId, role: "user", text: userText }
    ];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/speaking/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: language === 'en' ? selectedTopic.titleEn : selectedTopic.titleFr,
          chatHistory: newHistory,
          userMessage: userText,
          level: currentLevel,
          language: language,
        }),
      });

      if (!res.ok) throw new Error(language === 'fr' ? "Erreur du coach vocal IA." : "Failed to receive feedback from speaking coach.");
      const feedback = await res.json();

      setHistory((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: "assistant",
          text: feedback.text,
          translation: feedback.translation,
          pronunciationFeedback: feedback.pronunciationFeedback,
          grammarFeedback: feedback.grammarFeedback,
          fluencyScore: feedback.fluencyScore
        }
      ]);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Speaks aloud the coach's French response
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = currentLevel === "A0" || currentLevel === "A1" ? 0.8 : 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleResetTopic = () => {
    setSelectedTopic(null);
    setHistory([]);
    setInputValue("");
    setError(null);
  };

  if (!selectedTopic) {
    return (
      <div className="max-w-3xl mx-auto" id="speaking-coach-setup">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
            {language === 'fr' ? 'SIMULATEUR DE CONVERSATION IA' : 'AI CONVERSATION SIMULATOR'}
          </span>
          <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            {t.title} ({currentLevel})
          </h2>
          <p className="text-slate-500 mt-2 text-xs leading-relaxed max-w-lg mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          {displayedTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-indigo-200 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              onClick={() => startTopic(topic)}
              id={`speaking-topic-${topic.id}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {topic.level.join(", ")}
                  </span>
                  <h3 className="text-base font-display font-extrabold text-slate-900">
                    {language === 'en' ? topic.titleEn : topic.titleFr}
                  </h3>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {language === 'en' ? topic.descEn : topic.descFr}
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition shrink-0 cursor-pointer shadow-md shadow-indigo-600/10"
                onClick={(e) => {
                  e.stopPropagation();
                  startTopic(topic);
                }}
              >
                {t.practiceBtn} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-slate-400 font-sans leading-relaxed">
          {t.micNotice}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto" id="speaking-coach-active">
      
      {/* Dialogue Thread */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[600px]">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-extrabold text-slate-900">
              {t.scenario} : {language === 'en' ? selectedTopic.titleEn : selectedTopic.titleFr}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.coachOnline}</span>
          </div>
          <button
            onClick={handleResetTopic}
            className="text-xs font-sans font-bold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-white bg-white transition cursor-pointer"
          >
            {t.changeScenario}
          </button>
        </div>

        {/* Message feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {history.map((msg, idx) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${isAI ? "justify-start" : "justify-end"}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs text-indigo-600 font-bold shrink-0">
                    AI
                  </div>
                )}
                <div className="space-y-1 max-w-[85%]">
                  <div
                    className={`p-4 rounded-2xl text-xs font-sans leading-relaxed ${
                      isAI
                        ? "bg-slate-50 text-slate-800 rounded-tl-sm"
                        : "bg-slate-900 text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.text}
                    {isAI && msg.translation && msg.translation !== msg.text && (
                      <div className="mt-2 text-xs border-t border-slate-200/60 pt-2 text-slate-500 italic">
                        <strong>{language === 'en' ? 'Translation / Rephrasing:' : 'Reformulation / Traduction :'}</strong> « {msg.translation} »
                      </div>
                    )}
                  </div>
                  {isAI && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> {t.listen}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-xs text-indigo-600 font-bold">
                AI
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-xs font-sans flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" /> {t.coachAnalyzing}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 text-xs font-sans flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input panel */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <button
            onClick={handleToggleRecord}
            className={`p-3.5 rounded-xl border transition shrink-0 cursor-pointer ${
              isRecording
                ? "bg-red-500 text-white border-red-600 animate-pulse"
                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
            }`}
            title={isRecording ? "Stop" : "Mic"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading || isRecording}
            placeholder={isRecording ? t.listeningMic : t.typeFrenchPlaceholder}
            className="flex-1 p-3.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs font-sans text-slate-850"
          />

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading || isRecording}
            className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-45 shrink-0 cursor-pointer shadow-md shadow-indigo-600/10"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Real-time analytical feedback sidebar */}
      <div className="lg:col-span-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" /> {t.feedbackTitle}
        </h3>

        {history.length <= 1 && (
          <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center font-sans text-xs text-slate-400 leading-relaxed shadow-xs">
            {t.startSpeakingPrompt}
          </div>
        )}

        {history.slice(1).reverse().filter(msg => msg.role === 'assistant').map((msg, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.turnAnalysis}</span>
              {msg.fluencyScore && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5" /> {t.fluency} : {msg.fluencyScore}/10
                </span>
              )}
            </div>

            {/* Pronunciation reductions/tips */}
            {msg.pronunciationFeedback && (
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">{t.pronunciationTips}</h4>
                <p className="text-slate-700 text-xs font-sans leading-relaxed">
                  {msg.pronunciationFeedback}
                </p>
              </div>
            )}

            {/* Grammar upgrades */}
            {msg.grammarFeedback && (
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{t.grammarUpgrades}</h4>
                <p className="text-slate-700 text-xs font-sans leading-relaxed">
                  {msg.grammarFeedback}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

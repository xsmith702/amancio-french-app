import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is missing or placeholder. Please configure your secrets in the Settings menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Ensure the application can check if the API key is set before executing calls
app.get("/api/config", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== "MY_GEMINI_API_KEY";
  res.json({ isConfigured });
});

// 1. ASSESSMENT GENERATION ENDPOINT
app.post("/api/assessment/generate", async (req, res) => {
  try {
    const ai = getAI();
    const { level = "B2", language = "fr" } = req.body;
    
    const isBeginner = level === "A0" || level === "A1" || level === "A2";
    const langNote = language === "en" 
      ? "The question instructions, context, and explanations should be in English with French target language content so a beginner can understand."
      : "Rédigez les questions et instructions en français.";

    const prompt = `Generate exactly 8 diagnostic assessment questions in French for a student at CEFR level ${level}.
Target Level Context:
- If A0/A1: Test basic greetings (bonjour, au revoir), essential verbs (être, avoir), definite/indefinite articles (le/la/un/une), numbers, common nouns, and basic phonetics.
- If A2/B1: Test past tenses (passé composé vs imparfait), simple future, daily life vocabulary, basic pronouns, and asking for directions/ordering.
- If B2/C1/C2: Test advanced grammar (subjunctive, conditionnel passé), lexical precision, formal vs informal registers, spoken French shortcuts, and idioms.

Format requirements:
- 4 multiple-choice questions
- 4 open-response or fill-in questions (simple short answers for A0-A1, complex reformulations for B2-C1).
${langNote}

Fields distribution:
- 'Grammar'
- 'Vocabulary'
- 'Listening/Pronunciation'
- 'Nuances' (or 'Basics' for A0/A1)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              question: { type: Type.STRING, description: "Question prompt" },
              context: { type: Type.STRING, description: "Optional context or dialogue" },
              type: { type: Type.STRING, description: "Must be 'multiple-choice' or 'open-response'" },
              choices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 4 options if multiple-choice"
              },
              field: { type: Type.STRING, description: "One of: 'Grammar', 'Vocabulary', 'Listening/Pronunciation', 'Nuances', 'Basics'" }
            },
            required: ["id", "question", "type", "field"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    res.json(data);
  } catch (error: any) {
    console.error("Error generating assessment:", error);
    res.status(500).json({ error: error.message || "Failed to generate assessment questions" });
  }
});

// 2. ASSESSMENT EVALUATION ENDPOINT
app.post("/api/assessment/evaluate", async (req, res) => {
  try {
    const ai = getAI();
    const { questions, answers, level = "B2", language = "fr" } = req.body;

    const langInstruction = language === "en"
      ? "Write the feedback report, weak points, and recommendations in English, referencing French examples."
      : "Rédigez le rapport, les points faibles et les recommandations en français.";

    const evaluationPrompt = `You are an expert French language evaluator (DELF/DALF certified).
Evaluate the user's answers to the following 8 diagnostic questions for target level ${level}.
${langInstruction}

Questions and user answers:
${JSON.stringify(questions.map((q: any) => ({
  id: q.id,
  field: q.field,
  question: q.question,
  choices: q.choices,
  userAnswer: answers[q.id] || "No answer provided"
})), null, 2)}

Provide:
1. Overall score from 0 to 100.
2. Suggested CEFR level: 'A0', 'A1', 'A2', 'B1', 'B2', 'B2+', 'C1', or 'C2'.
3. Individual scores (0-100) for Grammar, Vocabulary, Listening/Pronunciation, and Nuances/Basics.
4. An encouraging, constructive feedback report.
5. Specific identified weak points.
6. 3-4 actionable study recommendations for the next level.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: evaluationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Composite score from 0 to 100" },
            evaluatedLevel: { type: Type.STRING, description: "Must be 'A0', 'A1', 'A2', 'B1', 'B2', 'B2+', 'C1', or 'C2'" },
            grammarScore: { type: Type.INTEGER, description: "Grammar score 0 to 100" },
            vocabularyScore: { type: Type.INTEGER, description: "Vocabulary score 0 to 100" },
            listeningScore: { type: Type.INTEGER, description: "Listening/Pronunciation score 0 to 100" },
            nuanceScore: { type: Type.INTEGER, description: "Nuances / Basics score 0 to 100" },
            feedback: { type: Type.STRING, description: "Detailed feedback evaluation report" },
            weakPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific weak points identified" },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concrete learning recommendations" }
          },
          required: ["score", "evaluatedLevel", "grammarScore", "vocabularyScore", "listeningScore", "nuanceScore", "feedback", "weakPoints", "recommendations"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error evaluating assessment:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate answers" });
  }
});

// 3. CURRICULUM GENERATION ENDPOINT
app.post("/api/curriculum/generate", async (req, res) => {
  try {
    const ai = getAI();
    const { assessmentResult, targetGoals, level = "B2", language = "fr" } = req.body;

    const targetLevel = level || assessmentResult?.evaluatedLevel || "B2";
    const weakPointsStr = assessmentResult?.weakPoints?.join(", ") || "General foundation & progression";
    const goalsStr = targetGoals?.join(", ") || "Fluency, speaking confidence, and practical vocabulary";

    const langInstruction = language === "en"
      ? "Course explanations, lesson descriptions, and vocabulary definitions should include clear English translations/guidance to assist the learner."
      : "Rédigez les explications, descriptions et définitions en français.";

    const prompt = `Design a custom 5-lesson French curriculum for a student at CEFR Level ${targetLevel}.
Learner Weak Points: ${weakPointsStr}
Learner Goals: ${goalsStr}
${langInstruction}

Ensure the 5 modules cover:
1. Grammar (adapted to level: e.g. A0/A1 present tense & être/avoir; A2 passé composé; B1 futur/imparfait; B2/C1 subjunctive & nuances)
2. Vocabulary (level-appropriate practical vocabulary)
3. Speaking (dialogues & conversational phrases)
4. Culture (social etiquette, everyday life, customs)
5. Pronunciation (vowels, accents, silent letters for beginners; contractions & speed for advanced)

Each lesson must contain:
- 'id': unique id (e.g. 'lesson_1')
- 'title': engaging title
- 'category': one of 'Grammar', 'Vocabulary', 'Speaking', 'Culture', 'Pronunciation', 'Basics'
- 'description': clear summary
- 'difficulty': '${targetLevel}'
- 'content': rich educational guide in Markdown (at least 200 words with rules, examples, memory tips)
- 'vocabularyList': 4 key terms with word, translation (with English if requested), and example sentence
- 'exercises': exactly 3 interactive exercises ('multiple-choice', 'fill-in-the-blank', or 'translation') with correctAnswer and explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            weakPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING, description: "One of: 'Grammar', 'Vocabulary', 'Speaking', 'Culture', 'Pronunciation', 'Basics'" },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  content: { type: Type.STRING },
                  vocabularyList: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        example: { type: Type.STRING }
                      },
                      required: ["word", "translation", "example"]
                    }
                  },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, description: "Must be: 'multiple-choice', 'fill-in-the-blank', or 'translation'" },
                        question: { type: Type.STRING },
                        choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["id", "type", "question", "correctAnswer", "explanation"]
                    }
                  }
                },
                required: ["id", "title", "category", "description", "difficulty", "content", "exercises"]
              }
            }
          },
          required: ["focusAreas", "weakPoints", "targetGoals", "lessons"]
        }
      }
    });

    const curriculum = JSON.parse(response.text || "{}");
    res.json(curriculum);
  } catch (error: any) {
    console.error("Error generating curriculum:", error);
    res.status(500).json({ error: error.message || "Failed to generate curriculum" });
  }
});

// 4. DAILY INTERACTIVE SPEAKING ENDPOINT (COACH CHAT FEEDBACK)
app.post("/api/speaking/feedback", async (req, res) => {
  try {
    const ai = getAI();
    const { topic, chatHistory, userMessage, level = "B2", language = "fr" } = req.body;

    const messagesFormatted = chatHistory ? chatHistory.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Coach'}: ${msg.text}`).join("\n") : "";

    const langInstruction = language === "en"
      ? "Provide translation and grammar feedback in English to assist the student, while the assistant's main reply should be in French suitable for level " + level + "."
      : "Fournissez les conseils et retours en français adapté au niveau " + level + ".";

    const prompt = `You are an encouraging native French speaking coach tutoring a student at CEFR Level ${level}.
Topic: "${topic}".
Student's last message: "${userMessage}"
${langInstruction}

Conversation history:
${messagesFormatted}

Return JSON with:
1. 'text': Natural, encouraging response in French adapted to level ${level} (keep it simple for A0/A1, conversational for A2/B1, nuanced for B2/C1).
2. 'translation': English translation (if English requested) or alternative wording in French.
3. 'pronunciationFeedback': Clear pronunciation tips (e.g. silent letters, vowels for A0/A1; fast speech reductions for B2/C1).
4. 'grammarFeedback': Gentle grammar correction or vocabulary upgrade tailored to level ${level}.
5. 'fluencyScore': Score 1 to 10 calibrated to level ${level}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Natural response in French" },
            translation: { type: Type.STRING, description: "Translation or alternative reformulation" },
            pronunciationFeedback: { type: Type.STRING, description: "Phonetic and pronunciation advice" },
            grammarFeedback: { type: Type.STRING, description: "Grammar improvement advice" },
            fluencyScore: { type: Type.INTEGER, description: "Rating from 1 to 10" }
          },
          required: ["text", "translation", "pronunciationFeedback", "grammarFeedback", "fluencyScore"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error giving speaking feedback:", error);
    res.status(500).json({ error: error.message || "Failed to process chat response" });
  }
});

// 5. DICTIONARY & CULTURE NUANCE EXPLAINER ENDPOINT
app.post("/api/dictionary/explain", async (req, res) => {
  try {
    const ai = getAI();
    const { word, userQuestion, level = "B2", language = "fr" } = req.body;

    const langInstruction = language === "en"
      ? "Provide English translation, English definitions, and English cultural explanations alongside French examples."
      : "Fournissez les explications, définitions et nuances en français.";

    const prompt = `Analyze the French word, idiom, or expression: "${word}".
Specific user question (if any): "${userQuestion || "None"}"
Learner target level: ${level}.
${langInstruction}

Provide comprehensive analysis:
1. Phonetic guide (IPA).
2. Part of speech.
3. Translation into English (or French synonym if French mode).
4. Semantic definition.
5. Register: 'Soutenu' (Formal), 'Courant' (Standard), 'Familier' (Informal), 'Argot' (Slang), or 'Standard'.
6. Cultural nuances & pragmatic usage tips.
7. Spoken French tip (spoken reductions or common usage quirks).
8. Related collocations or idioms.
9. 3 realistic example sentences with translations and context explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING, description: "Phonetic pronunciation guide" },
            partOfSpeech: { type: Type.STRING, description: "Part of speech (e.g. noun, verb)" },
            translation: { type: Type.STRING, description: "Clear translation or synonym" },
            definition: { type: Type.STRING, description: "Semantic definition" },
            register: { type: Type.STRING, description: "Must be: 'Soutenu', 'Courant', 'Familier', 'Argot', or 'Standard'" },
            culturalNuances: { type: Type.STRING, description: "Cultural context and pragmatic usage insights" },
            spokenFrenchTip: { type: Type.STRING, description: "Spoken pronunciation or conversational tip" },
            collocations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Collocations or related expressions" },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  french: { type: Type.STRING, description: "French example sentence" },
                  english: { type: Type.STRING, description: "Translation of the example sentence" },
                  contextExplanation: { type: Type.STRING, description: "Context or register explanation" }
                },
                required: ["french", "english"]
              }
            }
          },
          required: ["word", "phonetic", "partOfSpeech", "translation", "definition", "register", "culturalNuances", "collocations", "examples"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error explaining word:", error);
    res.status(500).json({ error: error.message || "Failed to analyze word" });
  }
});

// 6. PRONUNCIATION / ACTUAL SPOKEN FRENCH EXPLORER
app.post("/api/pronunciation/explain", async (req, res) => {
  try {
    const ai = getAI();
    const { phrase, level = "B2", language = "fr" } = req.body;

    const langInstruction = language === "en"
      ? "Provide linguistic explanations and context in English."
      : "Rédigez les explications en français.";

    const prompt = `Analyze French pronunciation and speech phonetics for: "${phrase}".
Target level: ${level}.
${langInstruction}

Provide:
- Formal / standard written version.
- Spoken / natural reduced version.
- Phonetic transcriptions for both.
- Clear linguistic explanation of sounds, silent letters, liaisons, or contractions.
- Audio text strings for Web Speech Synthesis.
- Context example dialogue.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            formal: { type: Type.STRING, description: "Formal written phrase" },
            actual: { type: Type.STRING, description: "Spoken or phonetically reduced phrase" },
            phoneticFormal: { type: Type.STRING, description: "IPA phonetic of formal phrase" },
            phoneticActual: { type: Type.STRING, description: "IPA phonetic of spoken phrase" },
            explanation: { type: Type.STRING, description: "Linguistic explanation" },
            audioClipTextFormal: { type: Type.STRING, description: "Text for formal TTS reading" },
            audioClipTextActual: { type: Type.STRING, description: "Text for spoken TTS reading" },
            exampleContext: { type: Type.STRING, description: "Context dialogue example" }
          },
          required: ["id", "formal", "actual", "phoneticFormal", "phoneticActual", "explanation", "audioClipTextFormal", "audioClipTextActual", "exampleContext"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error explaining pronunciation:", error);
    res.status(500).json({ error: error.message || "Failed to analyze pronunciation" });
  }
});

// 7. GENERATE ANKI SRS FLASHCARDS
app.post("/api/anki/generate", async (req, res) => {
  try {
    const ai = getAI();
    const { category, topic, count = 5, level = "B2", language = "fr" } = req.body;

    const langInstruction = language === "en"
      ? "On the back of the flashcard, provide clear English translations, meanings, and explanations to assist the learner."
      : "Rédigez le verso en français.";

    const prompt = `Generate exactly ${count} French flashcards for Anki spaced repetition (SM-2 method) for CEFR Level ${level}.
Category or theme: ${category || "General Vocabulary, Grammar & Phrases"} ${topic ? `(Specific topic: ${topic})` : ""}.
Target Level Context:
- A0/A1: Core survival words (Bonjour, Merci, S'il vous plaît, les nombres, les jours, être/avoir).
- A2/B1: Everyday verbs, daily routines, past tenses, connectors.
- B2/C1/C2: Advanced vocabulary, idiomatic turns, subjunctive triggers, spoken contractions.
${langInstruction}

Each flashcard must contain:
- 'front': French word, phrase, prompt or expression.
- 'back': Meaning, English translation, grammatical notes, register.
- 'category': One of 'Vocabulaire' | 'Grammaire' | 'Registre & Nuances' | 'Expression Orale' | 'Prononciation' | 'Bases A0/A1'
- 'example': Context sentence demonstrating natural usage.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              category: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ["front", "back", "category", "example"]
          }
        }
      }
    });

    const cardsData = JSON.parse(response.text || "[]");
    const today = new Date().toISOString().split("T")[0];

    const formattedCards = cardsData.map((card: any, idx: number) => ({
      id: "anki-" + Date.now() + "-" + idx,
      level: level || "B2",
      front: card.front,
      back: card.back,
      category: card.category || "Vocabulaire",
      example: card.example,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: today,
    }));

    res.json(formattedCards);
  } catch (error: any) {
    console.error("Error generating Anki cards:", error);
    res.status(500).json({ error: error.message || "Failed to generate Anki cards" });
  }
});

// VITE MIDDLEWARE OR STATIC FILES FOR EXPRESS
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server boot failed:", err);
});

// System prompts per toolMode. Mirrors _reference/netlify/functions/openai.js
// but expands reading_generate / listening_generate / essay_evaluate /
// task_response_evaluate to be exam-mode aware (IELTS vs TOEFL).

export type ToolMode =
  | "chat"
  | "interview"
  | "grammar"
  | "tutor"
  | "translate"
  | "level"
  | "essay_evaluate"
  | "reading_generate"
  | "listening_generate"
  | "task_response_evaluate"
  | "speed_reading_generate"
  | "conversation_generate";

export type ExamMode = "IELTS" | "TOEFL" | null;

export function buildSystemPrompt(
  mode: ToolMode,
  examMode: ExamMode,
  userLevel: { level?: string; description?: string } | null,
): string {
  const base = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.chat;
  const examNote = examNoteFor(mode, examMode);
  let prompt = base + (examNote ? "\n\n" + examNote : "");
  if (userLevel?.level) {
    prompt += `\n\nIMPORTANT: The user's English proficiency level is ${userLevel.level} (${userLevel.description ?? ""}). Adjust vocabulary, complexity, and feedback accordingly.`;
  }
  return prompt;
}

function examNoteFor(mode: ToolMode, exam: ExamMode): string {
  if (!exam) return "";
  switch (mode) {
    case "reading_generate":
      return exam === "TOEFL"
        ? "Tune the passage and questions for TOEFL iBT Reading. Include 1 inference question and 1 summary question (3 correct out of 5 statements)."
        : "Tune for IELTS Academic Reading. Include a mix of True/False/Not Given, multiple choice, and fill-in-the-blank.";
    case "listening_generate":
      return exam === "TOEFL"
        ? "Tune for TOEFL iBT Listening — academic lecture style with note-taking-friendly structure."
        : "Tune for IELTS Listening — academic lecture or seminar style.";
    case "essay_evaluate":
      return exam === "TOEFL"
        ? "Use TOEFL iBT writing rubric (0–5 scaled to 30). Map your bandScore proportionally to IELTS 4–9 for backwards compatibility, but include a TOEFL-specific note in feedback."
        : "Use the official IELTS Writing Task 2 rubric (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)."
    case "task_response_evaluate":
      return exam === "TOEFL"
        ? "TOEFL Integrated Writing — evaluate accuracy of summarising the lecture's points relative to the reading."
        : "IELTS Academic Task 1 — evaluate overview, data accuracy, comparisons, and academic vocabulary.";
    default:
      return "";
  }
}

const SYSTEM_PROMPTS: Record<ToolMode, string> = {
  chat:
    "You are a friendly English conversation partner. Keep replies concise and encouraging. Help improve fluency naturally. Gently correct mistakes.",
  interview:
    "You are a professional interviewer. Ask one relevant question at a time based on the candidate's field. Give constructive feedback after answers.",
  grammar:
    "You are a grammar expert. Correct the user's text, explain mistakes clearly, and provide the corrected version.",
  tutor:
    "You are an English language tutor. Explain grammar rules, vocabulary, and concepts clearly with practical examples.",
  translate:
    "You are a professional translator. Translate the user's text between Turkish and English. If the input is in Turkish, translate to English. If the input is in English, translate to Turkish. Provide ONLY the translation, then briefly explain idioms or cultural nuances if relevant.",
  level:
    "You are an English proficiency assessor. Evaluate the user's English level (CEFR A1-C2) based on their responses.",

  essay_evaluate: `You are an experienced IELTS examiner. Evaluate the essay using the official IELTS Writing rubric.
Input: JSON {topic, essay, wordCount, taskType?, sourceMaterial?}.
Respond with a JSON object (no markdown):
{
  "bandScore": 6.5,
  "taskAchievement": 6.5,
  "coherenceCohesion": 6.0,
  "lexicalResource": 7.0,
  "grammarAccuracy": 6.5,
  "feedback": "Overall assessment",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "grammarErrors": [{"original": "...", "corrected": "...", "explanation": "..."}],
  "suggestions": ["..."],
  "improvedSentences": [{"original": "...", "improved": "..."}]
}
Band scores between 4.0 and 9.0 in 0.5 increments.`,

  reading_generate: `You are a reading test creator. Generate an academic passage with comprehension questions.
Create a 500–700 word passage on an interesting academic topic.
Respond with a JSON object (no markdown):
{
  "title": "...",
  "passage": "...",
  "wordCount": 600,
  "questions": [
    { "id": 1, "type": "true_false_ng", "question": "...", "correctAnswer": "True", "explanation": "..." },
    { "id": 2, "type": "multiple_choice", "question": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "correctAnswer": "B", "explanation": "..." },
    { "id": 3, "type": "fill_blank", "question": "...", "correctAnswer": "...", "explanation": "..." }
  ]
}
Include 5–7 questions.`,

  listening_generate: `You are a listening test creator. Generate an academic lecture transcript with comprehension questions.
Create a 300–500 word transcript designed for text-to-speech with natural pauses and clear structure.
Respond with a JSON object (no markdown):
{
  "title": "...",
  "topic": "...",
  "transcript": "...",
  "wordCount": 400,
  "duration": "2-3 minutes",
  "questions": [
    { "id": 1, "type": "multiple_choice", "question": "...", "options": ["A) ...","B) ...","C) ...","D) ..."], "correctAnswer": "B", "explanation": "..." },
    { "id": 2, "type": "fill_blank", "question": "...", "correctAnswer": "...", "explanation": "..." },
    { "id": 3, "type": "true_false", "question": "...", "correctAnswer": "True", "explanation": "..." }
  ]
}
Include 5–7 questions.`,

  task_response_evaluate: `You are an IELTS Task 1 / TOEFL Integrated Writing examiner. Evaluate the user's response.
Input: JSON {taskType, topic, sourceMaterial, response, wordCount}.
Respond with a JSON object:
{
  "bandScore": 6.5,
  "taskAchievement": 6.5,
  "coherenceCohesion": 6.0,
  "lexicalResource": 7.0,
  "grammarAccuracy": 6.5,
  "feedback": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "dataAccuracy": "...",
  "overviewPresent": true,
  "suggestions": ["..."]
}
Band scores between 4.0 and 9.0 in 0.5 increments.`,

  speed_reading_generate: `Generate a 100–200 word passage for speed reading practice with a single main-idea question.
Respond with a JSON object: {title, passage, wordCount, questions: [{id, type:"main_idea", question, options:["A)...",...], correctAnswer, explanation}]}.`,

  conversation_generate: `Generate a 2-3 person dialogue (200-300 words) on everyday topics for listening practice.
Respond with a JSON object: {title, topic, transcript, wordCount, questions:[...], idioms:[...], casualExpressions:[...]}.`,
};

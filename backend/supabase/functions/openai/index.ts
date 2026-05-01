// supabase/functions/openai
//
// Edge Function that proxies all chat-style OpenAI requests for AITutor.
// Keeps the OPENAI_API_KEY out of the mobile app.
//
// Request body:
//   {
//     toolMode: "chat" | "reading_generate" | "essay_evaluate" | ... ,
//     userText: string,
//     userLevel?: { level: "B2", description: "..." },
//     examMode?: "IELTS" | "TOEFL"
//   }
// Response:
//   { text: "..." }
//
// Deploy with:
//   supabase functions deploy openai --no-verify-jwt
//   supabase secrets set OPENAI_API_KEY=sk-...

import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { buildSystemPrompt, type ExamMode, type ToolMode } from "../_shared/prompts.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const MAX_TOKENS_BY_MODE: Record<string, number> = {
  reading_generate: 4000,
  listening_generate: 4000,
  conversation_generate: 4000,
  speed_reading_generate: 3000,
  essay_evaluate: 3000,
  task_response_evaluate: 3000,
  chat: 2000,
  interview: 2000,
  grammar: 2000,
  tutor: 2000,
  translate: 1500,
  level: 1500,
};

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return jsonResponse({ error: "OPENAI_API_KEY missing on server" }, 500);

  const body = await req.json().catch(() => null);
  if (!body) return jsonResponse({ error: "Invalid JSON body" }, 400);

  const toolMode = (body.toolMode ?? "chat") as ToolMode;
  const userText = (body.userText ?? "") as string;
  const examMode = (body.examMode ?? null) as ExamMode;
  const userLevel = body.userLevel ?? null;
  const model = Deno.env.get("OPENAI_MODEL") ?? body.model ?? "gpt-4o-mini";

  const systemPrompt = buildSystemPrompt(toolMode, examMode, userLevel);
  const maxTokens = MAX_TOKENS_BY_MODE[toolMode] ?? 2000;

  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    return jsonResponse(
      { error: data.error?.message ?? "OpenAI API error", details: data },
      upstream.status,
    );
  }

  const text = data.choices?.[0]?.message?.content ??
    "Sorry, I couldn't generate a response.";
  return jsonResponse({ text });
});

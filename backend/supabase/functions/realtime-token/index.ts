// supabase/functions/realtime-token
//
// Returns a short-lived OpenAI Realtime API token so the mobile client can
// open a WebRTC session for live voice practice (Speaking module).
//
// Body: { mode: "academic" | "native" }
// Response: { token, sessionId, expiresAt }

import { handlePreflight, jsonResponse } from "../_shared/cors.ts";

const REALTIME_URL = "https://api.openai.com/v1/realtime/sessions";

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return jsonResponse({ error: "OPENAI_API_KEY not configured" }, 500);

  const body = await req.json().catch(() => ({}));
  const mode = (body.mode ?? "academic") as "academic" | "native";

  const instructions = mode === "academic"
    ? `You are an English language tutor helping a student practice academic speaking skills.
- Engage in academic discussions on various topics
- Gently correct grammar/pronunciation errors
- Suggest more academic ways to express ideas
- Ask follow-up questions
- Use clear, articulate speech at moderate pace`
    : `You are a friendly English conversation partner for casual chat practice.
- Have natural, everyday conversations
- Use common idioms and expressions
- Gently correct errors
- Keep conversation flowing
- Be encouraging and supportive`;

  const upstream = await fetch(REALTIME_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return jsonResponse(
      { error: err.error?.message ?? "Failed to create realtime session" },
      upstream.status,
    );
  }

  const data = await upstream.json();
  const sessionId = `speak_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  return jsonResponse({
    token: data.client_secret?.value ?? data.token,
    sessionId,
    expiresAt: data.expires_at ?? null,
  });
});

// supabase/functions/transcribe
//
// Whisper transcription. Body: { audio: "data:audio/...;base64,..." }
// Response: { text: "..." }

import { handlePreflight, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return jsonResponse({ error: "Method Not Allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return jsonResponse({ error: "OPENAI_API_KEY missing on server" }, 500);

  const body = await req.json().catch(() => null);
  if (!body?.audio) return jsonResponse({ error: "No audio data" }, 400);

  const audio: string = body.audio;
  const match = audio.match(/^data:(.+);base64,(.+)$/);
  if (!match) return jsonResponse({ error: "Invalid audio format" }, 400);

  const mime = match[1];
  const b64 = match[2];
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const ext = mime.includes("mp3") ? "mp3"
    : mime.includes("wav") ? "wav"
    : mime.includes("m4a") ? "m4a"
    : mime.includes("ogg") ? "ogg"
    : "webm";

  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), `audio.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "en");

  const upstream = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    return jsonResponse(
      { error: data.error?.message ?? "Whisper API error", details: data },
      upstream.status,
    );
  }
  return jsonResponse({ text: data.text ?? "" });
});

// js/services/openaiService.js
import { OPENAI_PROXY_URL, OPENAI_MODEL } from "../config/env.js";

// Suggested usage: Call via OPENAI_PROXY_URL (Netlify Function).
// Because it is not safe to put the OpenAI API key in the browser.
// (OpenAI docs: API key secret, don't put it on client-side.)
export async function callOpenAI({ toolMode, userText, images = [], messages = [], userLevel = null }) {
  const payload = {
    toolMode,
    userText,
    images, // Pass images to backend
    messages, // Pass conversation history to backend
    userLevel, // Pass user language level to backend
    model: OPENAI_MODEL
  };

  // If you have a proxy, use it
  if (OPENAI_PROXY_URL) {
    const res = await fetch(OPENAI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI proxy error: ${res.status} ${errText}`);
    }
    const data = await res.json();
    return data.text ?? "No response.";
  }

  throw new Error("OPENAI_PROXY_URL tanımlı değil.");
}

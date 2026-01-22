// netlify/functions/openai.js
export default async (request, context) => {
  // CORS headers for browser requests
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing on server" }), {
      status: 500,
      headers
    });
  }

  try {
    const body = await request.json();
    const userText = body.userText || "";
    const toolMode = body.toolMode || "chat";
    const userLevel = body.userLevel || null; // Get user's language level
    const model = process.env.OPENAI_MODEL || body.model || "gpt-4o-mini";

    // Tool-specific system prompts
    const systemPrompts = {
      chat: "You are a friendly English conversation partner. Keep replies concise and encouraging. Help improve fluency naturally.",
      interview: "You are a professional interviewer. Ask one relevant question at a time based on the candidate's field. Give constructive feedback.",
      grammar: "You are a grammar expert. Correct the user's text, explain mistakes clearly, and provide the corrected version.",
      tutor: "You are an English language tutor. Explain grammar rules, vocabulary, and concepts clearly with practical examples.",
      translate: "You are a professional translator. Translate the user's text between Turkish and English. If the input is in Turkish, translate to English. If the input is in English, translate to Turkish. Provide ONLY the translation, nothing else. After the translation, briefly explain any idioms or cultural nuances if relevant.",
      level: "You are an English proficiency assessor. Help evaluate the user's English level based on their responses."
    };

    let systemPrompt = systemPrompts[toolMode] || systemPrompts.chat;

    // Enhance prompt with user level if available
    if (userLevel && userLevel.level) {
      const levelGuidance = `\n\nIMPORTANT: The user's English proficiency level is ${userLevel.level} (${userLevel.description}). Please adjust your responses accordingly:
- Use vocabulary and grammar appropriate for ${userLevel.level} level
- Provide explanations that match their comprehension level
- Offer constructive feedback suited to their current abilities
- Challenge them appropriately without overwhelming them`;

      systemPrompt += levelGuidance;
    }

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI Error:", data);
      return new Response(JSON.stringify({
        error: data.error?.message || "OpenAI API error",
        details: data
      }), {
        status: openaiResponse.status,
        headers
      });
    }

    // Extract response text
    const text = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers
    });
  }
};
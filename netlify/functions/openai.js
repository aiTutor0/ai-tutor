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
      level: "You are an English proficiency assessor. Help evaluate the user's English level based on their responses.",
      essay_evaluate: `You are an experienced IELTS examiner. Evaluate the essay based on the official IELTS Writing Task 2 criteria.

The user will provide a JSON with "topic", "essay", and "wordCount".

Evaluate and respond with a JSON object (no markdown):
{
  "bandScore": 6.5,
  "taskAchievement": 6.5,
  "coherenceCohesion": 6.0,
  "lexicalResource": 7.0,
  "grammarAccuracy": 6.5,
  "feedback": "Overall assessment of the essay",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "grammarErrors": [
    {"original": "wrong text", "corrected": "correct text", "explanation": "why"}
  ],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "improvedSentences": [
    {"original": "weak sentence", "improved": "better version"}
  ]
}

Be constructive but honest. Band scores should be between 4.0 and 9.0 in 0.5 increments.`,
      reading_generate: `You are an IELTS reading test creator. Generate an academic passage with comprehension questions.

Create a passage of 500-700 words on an interesting academic topic (science, history, technology, environment, society).

Respond with a JSON object (no markdown):
{
  "title": "Passage Title",
  "passage": "Full passage text here...",
  "wordCount": 550,
  "questions": [
    {
      "id": 1,
      "type": "true_false_ng",
      "question": "Statement to evaluate",
      "correctAnswer": "True",
      "explanation": "Why this is the correct answer"
    },
    {
      "id": 2,
      "type": "multiple_choice",
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B",
      "explanation": "Why B is correct"
    },
    {
      "id": 3,
      "type": "fill_blank",
      "question": "Complete: The main purpose of the study was to ___.",
      "correctAnswer": "investigate climate patterns",
      "explanation": "Based on paragraph 2"
    }
  ]
}

Include 5-7 questions with a mix of True/False/Not Given, Multiple Choice, and Fill in the Blank types.`,
      listening_generate: `You are an IELTS listening test creator. Generate an academic listening passage with comprehension questions.

Create a realistic academic lecture or presentation transcript of 300-500 words on an interesting topic (science, history, technology, environment, society).

Respond with a JSON object (no markdown):
{
  "title": "Lecture Title",
  "topic": "Brief topic description",
  "transcript": "Full transcript with natural speech patterns, pauses indicated by commas, and clear structure...",
  "wordCount": 400,
  "duration": "2-3 minutes",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What is the main topic of the lecture?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B",
      "explanation": "Why B is correct"
    },
    {
      "id": 2,
      "type": "fill_blank",
      "question": "The speaker mentions that the process takes approximately ___.",
      "correctAnswer": "three weeks",
      "explanation": "Based on the middle section"
    },
    {
      "id": 3,
      "type": "true_false",
      "question": "The research was conducted in multiple countries.",
      "correctAnswer": "True",
      "explanation": "Mentioned in paragraph 2"
    }
  ]
}

Include 5-7 questions with a mix of Multiple Choice, Fill in the Blank, and True/False types. Make the transcript sound natural for text-to-speech conversion.`,
      task_response_evaluate: `You are an IELTS examiner for Writing Task 1 (Academic). Evaluate the user's chart/graph description.

The user will provide JSON with "chartData" (chart type and data) and "response" (their description).

Evaluate based on IELTS Task 1 criteria and respond with a JSON object (no markdown):
{
  "bandScore": 6.5,
  "taskAchievement": 6.5,
  "coherenceCohesion": 6.0,
  "lexicalResource": 7.0,
  "grammarAccuracy": 6.5,
  "feedback": "Overall assessment of the description",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "dataAccuracy": "Comment on whether key data points are accurately described",
  "overviewPresent": true,
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Task 1 specific criteria:
- Overview: Does it summarize main trends/features?
- Data Selection: Are significant data points highlighted?
- Accuracy: Is the data described correctly?
- Comparisons: Are appropriate comparisons made?
- Academic Vocabulary: Uses formal language and data description vocabulary
- Length: Should be 150+ words

Band scores between 4.0-9.0 in 0.5 increments.`,
      speed_reading_generate: `You are a reading comprehension expert. Generate a short passage for speed reading practice.

Create a 100-200 word passage on an interesting topic (any subject).

Respond with JSON (no markdown):
{
  "title": "Passage Title",
  "passage": "Short passage text (100-200 words)...",
  "wordCount": 150,
  "questions": [
    {
      "id": 1,
      "type": "main_idea",
      "question": "What is the main idea of this passage?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B",
      "explanation": "The passage mainly discusses..."
    }
  ]
}

Include exactly 1 main idea question to test comprehension without slowing down reading speed.`,
      conversation_generate: `You are an English conversation teacher. Generate a realistic daily life dialogue for listening practice.

Create a 2-3 person dialogue (200-300 words) on everyday topics: shopping, restaurant, directions, phone call, meeting friends, etc.

Respond with JSON (no markdown):
{
  "title": "At the Restaurant",
  "topic": "Ordering food",
  "transcript": "Waiter: Good evening! Are you ready to order?\nCustomer: Yes, I'll have the pasta, please.\n...",
  "wordCount": 250,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What did the customer order?",
      "options": ["A) Pasta", "B) Pizza", "C) Salad", "D) Soup"],
      "correctAnswer": "A",
      "explanation": "The customer said 'I'll have the pasta'"
    },
    {
      "id": 2,
      "type": "inference",
      "question": "How does the customer feel about the service?",
      "options": ["A) Satisfied", "B) Angry", "C) Confused", "D) Neutral"],
      "correctAnswer": "A",
      "explanation": "Based on the friendly tone"
    }
  ],
  "idioms": ["piece of cake", "hit the nail on the head"],
  "casualExpressions": ["gonna", "wanna", "kinda"]
}

Include 4-6 questions with focus on inference, tone, and casual language understanding. Use natural contractions and idioms.`
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
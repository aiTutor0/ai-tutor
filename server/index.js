// server/index.js
// Express.js server for local development (replaces Netlify Functions)

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// === CORS Configuration ===
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8888', // Netlify dev
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// === Rate Limiting ===
const requestCounts = new Map();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function rateLimit(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  // Filter out old requests
  const requests = requestCounts.get(ip).filter(t => t > windowStart);

  if (requests.length >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment.',
      retryAfter: Math.ceil((requests[0] + RATE_WINDOW - now) / 1000)
    });
  }

  requests.push(now);
  requestCounts.set(ip, requests);
  next();
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;
  for (const [ip, times] of requestCounts.entries()) {
    const filtered = times.filter(t => t > windowStart);
    if (filtered.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, filtered);
    }
  }
}, 300000);

// === Middleware ===
app.use(express.json({ limit: '5mb' })); // Limit request size

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// OpenAI API endpoint (replaces /.netlify/functions/openai)
// Rate limiter applied to prevent abuse
app.post('/api/openai', rateLimit, async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing on server' });
  }

  try {
    const { userText = '', toolMode = 'chat', model, images = [], messages = [] } = req.body;

    // === Input Validation ===
    if (typeof userText !== 'string') {
      return res.status(400).json({ error: 'Invalid userText format' });
    }

    if (userText.length > 10000) {
      return res.status(400).json({ error: 'Message too long (max 10000 characters)' });
    }

    if (!Array.isArray(images) || images.length > 5) {
      return res.status(400).json({ error: 'Invalid images format or too many images (max 5)' });
    }

    if (!Array.isArray(messages) || messages.length > 50) {
      return res.status(400).json({ error: 'Invalid messages format or too many messages (max 50)' });
    }

    const validModes = ['chat', 'interview', 'grammar', 'tutor', 'level', 'translate', 'group'];
    if (!validModes.includes(toolMode)) {
      return res.status(400).json({ error: 'Invalid tool mode' });
    }

    const openaiModel = process.env.OPENAI_MODEL || model || 'gpt-4o-mini';

    // Tool-specific system prompts
    const systemPrompts = {
      chat: 'You are a friendly English conversation partner. Keep replies concise and encouraging. Help improve fluency naturally.',
      interview: `You are a professional job interviewer. Your task:
1. Ask one relevant question at a time based on the candidate's field
2. Wait for their answer before asking the next question
3. After each answer, provide brief constructive feedback
4. Cover: introduction, experience, skills, behavioral questions
5. At the end, give an overall assessment with strengths and areas to improve`,
      grammar: `You are a grammar expert. When the user sends text:
1. Identify all grammar, spelling, and punctuation errors
2. Show the corrected version
3. Explain each mistake briefly
4. Give the corrected sentence at the end
Format: ❌ Error → ✅ Correction (Explanation)`,
      tutor: 'You are an English language tutor. Explain grammar rules, vocabulary, and concepts clearly with practical examples. Use simple language and provide exercises when helpful.',
      level: `You are an English level assessment expert. Your task:
1. Ask 5-7 questions of increasing difficulty (A1 to C2)
2. Include: vocabulary, grammar, reading comprehension, expression
3. Evaluate answers and track performance
4. After completing questions, provide:
   - CEFR Level (A1/A2/B1/B2/C1/C2)
   - Strengths
   - Areas to improve  
   - Recommended next steps
Start by introducing the test and asking the first question.`,
      translate: `You are a professional translator. When the user sends text:
1. If no target language specified, ask which language they want
2. Provide accurate translation
3. Note any idiomatic expressions or cultural context
4. Offer alternative translations if applicable
Support: English, Turkish, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic`,
      group: 'You are a friendly group chat assistant. Help facilitate discussion, answer questions, and keep the conversation engaging for all participants.'
    };

    const systemPrompt = systemPrompts[toolMode] || systemPrompts.chat;

    // Construct User Message (Multimodal support)
    let userContent;

    if (images && images.length > 0) {
      // Vision API format: content is array of objects
      userContent = [
        { type: "text", text: userText || "Analyze this image." }
      ];

      // Append images
      images.forEach(imgBase64 => {
        userContent.push({
          type: "image_url",
          image_url: {
            url: imgBase64
          }
        });
      });
    } else {
      // Content is just string
      userContent = userText;
    }

    // Build full conversation history
    // messages array comes from frontend with previous conversation history
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,  // Previous messages from conversation history
      { role: 'user', content: userContent }  // Current user message
    ];

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: fullMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error('OpenAI Error:', data);
      return res.status(openaiResponse.status).json({
        error: data.error?.message || 'OpenAI API error',
        details: data
      });
    }

    // Extract response text
    const text = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    res.json({ text });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Whisper Speech-to-Text endpoint
app.post('/api/transcribe', rateLimit, async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing on server' });
  }

  try {
    const { audio } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Convert base64 to buffer
    const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Create form data for Whisper API
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Default to English

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    const data = await whisperResponse.json();

    if (!whisperResponse.ok) {
      console.error('Whisper Error:', data);
      return res.status(whisperResponse.status).json({
        error: data.error?.message || 'Whisper API error'
      });
    }

    res.json({ text: data.text || '' });

  } catch (error) {
    console.error('Transcription Error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      message: error.message
    });
  }
});

// OpenAI Realtime API Token endpoint
// Generates ephemeral tokens for WebRTC connection
app.post('/api/realtime-token', rateLimit, async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing on server' });
  }

  try {
    const { mode = 'academic' } = req.body;

    // Validate mode
    if (!['academic', 'native'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "academic" or "native"' });
    }

    // System instructions based on mode
    const instructions = {
      academic: `You are an academic English speaking tutor. Your role is to:
1. Speak in formal, academic English
2. Correct grammar, pronunciation, and word choice in real-time
3. Suggest more sophisticated vocabulary and sentence structures
4. Provide corrections using formal academic language
5. Focus on clarity, precision, and proper grammar
6. When correcting, say something like: "A more academic way to express that would be..."
7. Keep responses concise but educational
8. Speak at a moderate pace for learners`,

      native: `You are a casual English conversation partner. Your role is to:
1. Speak naturally like a native English speaker
2. Use common idioms, slang, and everyday expressions
3. Correct mistakes with casual, friendly suggestions
4. Suggest more natural ways to express things
5. Focus on fluency and natural conversation flow
6. When correcting, say something like: "Native speakers usually say..."
7. Keep the conversation fun and engaging
8. Use contractions and casual speech patterns`
    };

    // Request ephemeral token from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: instructions[mode],
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI Realtime Token Error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Failed to create realtime session'
      });
    }

    res.json({
      token: data.client_secret?.value,
      expiresAt: data.client_secret?.expires_at,
      sessionId: data.id,
      mode: mode
    });

  } catch (error) {
    console.error('Realtime Token Error:', error);
    res.status(500).json({
      error: 'Failed to generate realtime token',
      message: error.message
    });
  }
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AITutor server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '..')}`);
  console.log(`🌐 LAN access: http://YOUR_IP:${PORT}`);
});

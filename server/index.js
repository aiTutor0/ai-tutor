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

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// OpenAI API endpoint (replaces /.netlify/functions/openai)
app.post('/api/openai', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing on server' });
  }

  try {
    const { userText = '', toolMode = 'chat', model } = req.body;
    const openaiModel = process.env.OPENAI_MODEL || model || 'gpt-4o-mini';

    // Tool-specific system prompts
    const systemPrompts = {
      chat: 'You are a friendly English conversation partner. Keep replies concise and encouraging. Help improve fluency naturally.',
      interview: 'You are a professional interviewer. Ask one relevant question at a time based on the candidate\'s field. Give constructive feedback.',
      grammar: 'You are a grammar expert. Correct the user\'s text, explain mistakes clearly, and provide the corrected version.',
      tutor: 'You are an English language tutor. Explain grammar rules, vocabulary, and concepts clearly with practical examples.'
    };

    const systemPrompt = systemPrompts[toolMode] || systemPrompts.chat;

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        max_tokens: 500,
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

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AITutor server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '..')}`);
  console.log(`🌐 LAN access: http://YOUR_IP:${PORT}`);
});

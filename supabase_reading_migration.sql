-- Supabase Migration: Reading Sessions Table
-- Run this in Supabase SQL Editor

-- Reading Sessions Table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mode TEXT NOT NULL DEFAULT 'academic', -- 'academic', 'speed'
  passage_title TEXT NOT NULL,
  passage_content TEXT NOT NULL,
  passage_word_count INTEGER DEFAULT 0,
  questions JSONB NOT NULL,
  user_answers JSONB,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  time_limit_seconds INTEGER DEFAULT 1200, -- 20 minutes default
  wpm INTEGER, -- words per minute (for speed reading)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own reading sessions"
  ON reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own reading sessions"
  ON reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own reading sessions"
  ON reading_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON reading_sessions(created_at DESC);

-- Reading Statistics Table
CREATE TABLE IF NOT EXISTS reading_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  best_score DECIMAL(5,2),
  total_passages_read INTEGER DEFAULT 0,
  average_wpm INTEGER,
  best_wpm INTEGER,
  total_time_seconds INTEGER DEFAULT 0,
  last_practice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for statistics
ALTER TABLE reading_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading statistics"
  ON reading_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own reading statistics"
  ON reading_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading statistics"
  ON reading_statistics FOR UPDATE
  USING (auth.uid() = user_id);

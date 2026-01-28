-- Supabase Migration: Listening Sessions Table
-- Run this in Supabase SQL Editor

-- Listening Sessions Table
CREATE TABLE IF NOT EXISTS listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mode TEXT NOT NULL DEFAULT 'academic', -- 'academic', 'conversation'
  topic TEXT NOT NULL,
  transcript TEXT NOT NULL,
  audio_url TEXT,
  questions JSONB NOT NULL,
  user_answers JSONB,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own listening sessions"
  ON listening_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own listening sessions"
  ON listening_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own listening sessions"
  ON listening_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_listening_sessions_user_id ON listening_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_created_at ON listening_sessions(created_at DESC);

-- Listening Statistics Table
CREATE TABLE IF NOT EXISTS listening_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  best_score DECIMAL(5,2),
  total_time_seconds INTEGER DEFAULT 0,
  last_practice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for statistics
ALTER TABLE listening_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own listening statistics"
  ON listening_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own listening statistics"
  ON listening_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listening statistics"
  ON listening_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- Supabase Migration: Writing Essays Table
-- Run this in Supabase SQL Editor

-- Writing Essays Table
CREATE TABLE IF NOT EXISTS writing_essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  topic TEXT NOT NULL,
  essay_content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  band_score DECIMAL(2,1),
  task_achievement DECIMAL(2,1),
  coherence_cohesion DECIMAL(2,1),
  lexical_resource DECIMAL(2,1),
  grammar_accuracy DECIMAL(2,1),
  ai_feedback JSONB,
  grammar_errors JSONB,
  suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE writing_essays ENABLE ROW LEVEL SECURITY;

-- Users can only see their own essays
CREATE POLICY "Users can view own essays"
  ON writing_essays FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own essays
CREATE POLICY "Users can insert own essays"
  ON writing_essays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own essays
CREATE POLICY "Users can update own essays"
  ON writing_essays FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own essays
CREATE POLICY "Users can delete own essays"
  ON writing_essays FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_writing_essays_user_id ON writing_essays(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_essays_created_at ON writing_essays(created_at DESC);

-- Writing Statistics Table (for tracking progress)
CREATE TABLE IF NOT EXISTS writing_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_essays INTEGER DEFAULT 0,
  average_band_score DECIMAL(2,1),
  best_band_score DECIMAL(2,1),
  total_words_written INTEGER DEFAULT 0,
  essays_this_week INTEGER DEFAULT 0,
  last_practice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for statistics
ALTER TABLE writing_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statistics"
  ON writing_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own statistics"
  ON writing_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON writing_statistics FOR UPDATE
  USING (auth.uid() = user_id);

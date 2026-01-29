-- ============================================================
-- SUPABASE COMPLETE MIGRATION - AI TUTOR
-- ============================================================
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır
-- Tüm tabloları ve RLS policy'lerini oluşturur
-- ============================================================

-- ============================================================
-- PART 1: SPEAK SESSIONS & STATISTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS speak_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('academic', 'native')),
    duration_seconds INTEGER DEFAULT 0,
    transcript JSONB DEFAULT '[]'::jsonb,
    corrections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speak_sessions_user_id ON speak_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speak_sessions_created_at ON speak_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speak_sessions_mode ON speak_sessions(mode);

ALTER TABLE speak_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own speak sessions" ON speak_sessions;
CREATE POLICY "Users can view their own speak sessions"
    ON speak_sessions FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own speak sessions" ON speak_sessions;
CREATE POLICY "Users can insert their own speak sessions"
    ON speak_sessions FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

-- Speak Statistics
CREATE TABLE IF NOT EXISTS speak_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    academic_sessions INTEGER DEFAULT 0,
    native_sessions INTEGER DEFAULT 0,
    common_errors JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speak_statistics_user_id ON speak_statistics(user_id);

ALTER TABLE speak_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own speak statistics" ON speak_statistics;
CREATE POLICY "Users can view their own speak statistics"
    ON speak_statistics FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own speak statistics" ON speak_statistics;
CREATE POLICY "Users can insert their own speak statistics"
    ON speak_statistics FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own speak statistics" ON speak_statistics;
CREATE POLICY "Users can update their own speak statistics"
    ON speak_statistics FOR UPDATE
    USING ((select auth.uid()) = user_id);

-- ============================================================
-- PART 2: WRITING ESSAYS & STATISTICS
-- ============================================================

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

ALTER TABLE writing_essays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own essays" ON writing_essays;
CREATE POLICY "Users can view own essays"
  ON writing_essays FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own essays" ON writing_essays;
CREATE POLICY "Users can insert own essays"
  ON writing_essays FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own essays" ON writing_essays;
CREATE POLICY "Users can update own essays"
  ON writing_essays FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own essays" ON writing_essays;
CREATE POLICY "Users can delete own essays"
  ON writing_essays FOR DELETE
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_writing_essays_user_id ON writing_essays(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_essays_created_at ON writing_essays(created_at DESC);

-- Writing Statistics
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

ALTER TABLE writing_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own writing statistics" ON writing_statistics;
CREATE POLICY "Users can view own writing statistics"
  ON writing_statistics FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can upsert own writing statistics" ON writing_statistics;
CREATE POLICY "Users can upsert own writing statistics"
  ON writing_statistics FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own writing statistics" ON writing_statistics;
CREATE POLICY "Users can update own writing statistics"
  ON writing_statistics FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- PART 3: READING SESSIONS & STATISTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mode TEXT NOT NULL DEFAULT 'academic',
  passage_title TEXT NOT NULL,
  passage_content TEXT NOT NULL,
  passage_word_count INTEGER DEFAULT 0,
  questions JSONB NOT NULL,
  user_answers JSONB,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  time_limit_seconds INTEGER DEFAULT 1200,
  wpm INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reading sessions" ON reading_sessions;
CREATE POLICY "Users can view own reading sessions"
  ON reading_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own reading sessions" ON reading_sessions;
CREATE POLICY "Users can insert own reading sessions"
  ON reading_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reading sessions" ON reading_sessions;
CREATE POLICY "Users can update own reading sessions"
  ON reading_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON reading_sessions(created_at DESC);

-- Reading Statistics
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

ALTER TABLE reading_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reading statistics" ON reading_statistics;
CREATE POLICY "Users can view own reading statistics"
  ON reading_statistics FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can upsert own reading statistics" ON reading_statistics;
CREATE POLICY "Users can upsert own reading statistics"
  ON reading_statistics FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reading statistics" ON reading_statistics;
CREATE POLICY "Users can update own reading statistics"
  ON reading_statistics FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- PART 4: LISTENING SESSIONS & STATISTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  mode TEXT NOT NULL DEFAULT 'academic',
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

ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own listening sessions" ON listening_sessions;
CREATE POLICY "Users can view own listening sessions"
  ON listening_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own listening sessions" ON listening_sessions;
CREATE POLICY "Users can insert own listening sessions"
  ON listening_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own listening sessions" ON listening_sessions;
CREATE POLICY "Users can update own listening sessions"
  ON listening_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_listening_sessions_user_id ON listening_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_created_at ON listening_sessions(created_at DESC);

-- Listening Statistics
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

ALTER TABLE listening_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own listening statistics" ON listening_statistics;
CREATE POLICY "Users can view own listening statistics"
  ON listening_statistics FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can upsert own listening statistics" ON listening_statistics;
CREATE POLICY "Users can upsert own listening statistics"
  ON listening_statistics FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own listening statistics" ON listening_statistics;
CREATE POLICY "Users can update own listening statistics"
  ON listening_statistics FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- DONE! Tüm tablolar ve RLS policy'leri oluşturuldu
-- ============================================================

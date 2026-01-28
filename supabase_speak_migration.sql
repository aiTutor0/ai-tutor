-- Supabase Migration: Speak Sessions and Statistics Tables
-- Run this in your Supabase SQL Editor

-- ================================================
-- 1. SPEAK SESSIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS speak_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('academic', 'native')),
    duration_seconds INTEGER DEFAULT 0,
    transcript JSONB DEFAULT '[]'::jsonb,
    corrections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_speak_sessions_user_id ON speak_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_speak_sessions_created_at ON speak_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speak_sessions_mode ON speak_sessions(mode);

-- Enable RLS
ALTER TABLE speak_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own sessions
CREATE POLICY "Users can view their own speak sessions"
    ON speak_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speak sessions"
    ON speak_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 2. SPEAK STATISTICS TABLE
-- ================================================

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

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_speak_statistics_user_id ON speak_statistics(user_id);

-- Enable RLS
ALTER TABLE speak_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can see and modify their own statistics
CREATE POLICY "Users can view their own speak statistics"
    ON speak_statistics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speak statistics"
    ON speak_statistics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own speak statistics"
    ON speak_statistics FOR UPDATE
    USING (auth.uid() = user_id);

-- ================================================
-- 3. OPTIONAL: Admin Access Policies
-- ================================================

-- Allow admins to view all speak sessions (for analytics)
-- Uncomment if you have admin role logic
-- CREATE POLICY "Admins can view all speak sessions"
--     ON speak_sessions FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE profiles.id = auth.uid() 
--             AND profiles.role = 'admin'
--         )
--     );

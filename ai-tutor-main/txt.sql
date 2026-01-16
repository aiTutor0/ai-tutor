-- ======================================
-- AI Tutor - Supabase Database Schema
-- ======================================
-- This schema supports the full AI Tutor application
-- including authentication, chat history, scheduling,
-- level tests, group chats, and voice features
-- ======================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================
-- 1. USERS TABLE (Extended Profile)
-- ======================================
-- Extends Supabase Auth with additional user metadata
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 2. CHAT SESSIONS TABLE
-- ======================================
-- Stores individual chat sessions (previously in localStorage as chat history)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'interview', 'translate', 'grammar', 'tutor', 'level')),
    manual_title BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 3. MESSAGES TABLE
-- ======================================
-- Stores individual messages within chat sessions
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'assistant')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 4. SCHEDULED SESSIONS TABLE
-- ======================================
-- Stores scheduled learning sessions (for teacher-student coordination)
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 5. LEVEL TEST RESULTS TABLE
-- ======================================
-- Stores English level test results
CREATE TABLE IF NOT EXISTS public.level_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    description TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 6. GROUP CHAT ROOMS TABLE
-- ======================================
-- Stores group chat rooms
CREATE TABLE IF NOT EXISTS public.group_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 7. ROOM MEMBERS TABLE
-- ======================================
-- Tracks which users are members of which rooms
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.group_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- ======================================
-- 8. ROOM MESSAGES TABLE
-- ======================================
-- Stores messages in group chat rooms
CREATE TABLE IF NOT EXISTS public.room_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.group_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 9. ROOM INVITATIONS TABLE
-- ======================================
-- Stores invitations to join group rooms
CREATE TABLE IF NOT EXISTS public.room_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.group_rooms(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 10. VOICE RECORDINGS TABLE (Optional)
-- ======================================
-- Stores metadata for voice recordings and transcriptions
CREATE TABLE IF NOT EXISTS public.voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    transcription TEXT,
    audio_url TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- 11. USER PREFERENCES TABLE
-- ======================================
-- Stores user preferences like theme, language, etc.
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language TEXT DEFAULT 'en',
    voice_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================
-- INDEXES for Better Performance
-- ======================================

-- Chat sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_session_id ON public.messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Scheduled sessions indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_student_id ON public.scheduled_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_teacher_id ON public.scheduled_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date ON public.scheduled_sessions(scheduled_date);

-- Level test results indexes
CREATE INDEX IF NOT EXISTS idx_level_test_results_user_id ON public.level_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_level_test_results_created_at ON public.level_test_results(created_at DESC);

-- Room members indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);

-- Room messages indexes
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON public.room_messages(created_at);

-- Room invitations indexes
CREATE INDEX IF NOT EXISTS idx_room_invitations_to_email ON public.room_invitations(to_email);
CREATE INDEX IF NOT EXISTS idx_room_invitations_status ON public.room_invitations(status);

-- ======================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ======================================
-- USERS TABLE POLICIES
-- ======================================
-- Users can read all users (for collaboration features)
CREATE POLICY "Users can view all users"
    ON public.users FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ======================================
-- CHAT SESSIONS POLICIES
-- ======================================
-- Users can view their own chat sessions
CREATE POLICY "Users can view own chat sessions"
    ON public.chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own chat sessions
CREATE POLICY "Users can create own chat sessions"
    ON public.chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
    ON public.chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
    ON public.chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ======================================
-- MESSAGES POLICIES
-- ======================================
-- Users can view messages in their own chat sessions
CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.chat_session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Users can insert messages in their own chat sessions
CREATE POLICY "Users can create own messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.chat_session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
    ON public.messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.chat_session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- ======================================
-- SCHEDULED SESSIONS POLICIES
-- ======================================
-- Students can view their own scheduled sessions
CREATE POLICY "Students can view own scheduled sessions"
    ON public.scheduled_sessions FOR SELECT
    USING (auth.uid() = student_id);

-- Teachers can view sessions they're assigned to
CREATE POLICY "Teachers can view assigned sessions"
    ON public.scheduled_sessions FOR SELECT
    USING (auth.uid() = teacher_id OR (teacher_id IS NULL AND EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'teacher'
    )));

-- Students can create their own scheduled sessions
CREATE POLICY "Students can create scheduled sessions"
    ON public.scheduled_sessions FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Students can update their own sessions
CREATE POLICY "Students can update own sessions"
    ON public.scheduled_sessions FOR UPDATE
    USING (auth.uid() = student_id);

-- Students can delete their own sessions
CREATE POLICY "Students can delete own sessions"
    ON public.scheduled_sessions FOR DELETE
    USING (auth.uid() = student_id);

-- ======================================
-- LEVEL TEST RESULTS POLICIES
-- ======================================
-- Users can view their own test results
CREATE POLICY "Users can view own test results"
    ON public.level_test_results FOR SELECT
    USING (auth.uid() = user_id);

-- Teachers can view all student test results
CREATE POLICY "Teachers can view all test results"
    ON public.level_test_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
        )
    );

-- Users can insert their own test results
CREATE POLICY "Users can create own test results"
    ON public.level_test_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own test results
CREATE POLICY "Users can delete own test results"
    ON public.level_test_results FOR DELETE
    USING (auth.uid() = user_id);

-- ======================================
-- GROUP ROOMS POLICIES
-- ======================================
-- Users can view rooms they are members of
CREATE POLICY "Users can view joined rooms"
    ON public.group_rooms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_members.room_id = group_rooms.id
            AND room_members.user_id = auth.uid()
        )
    );

-- Anyone can create a room
CREATE POLICY "Users can create rooms"
    ON public.group_rooms FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Room creators can update their rooms
CREATE POLICY "Creators can update rooms"
    ON public.group_rooms FOR UPDATE
    USING (auth.uid() = creator_id);

-- Room creators can delete their rooms
CREATE POLICY "Creators can delete rooms"
    ON public.group_rooms FOR DELETE
    USING (auth.uid() = creator_id);

-- ======================================
-- ROOM MEMBERS POLICIES
-- ======================================
-- Users can view members of rooms they belong to
CREATE POLICY "Members can view room members"
    ON public.room_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_members rm
            WHERE rm.room_id = room_members.room_id
            AND rm.user_id = auth.uid()
        )
    );

-- Room creators can add members
CREATE POLICY "Creators can add members"
    ON public.room_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_rooms
            WHERE group_rooms.id = room_id
            AND group_rooms.creator_id = auth.uid()
        )
    );

-- Room creators can remove members
CREATE POLICY "Creators can remove members"
    ON public.room_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_rooms
            WHERE group_rooms.id = room_members.room_id
            AND group_rooms.creator_id = auth.uid()
        )
    );

-- Members can remove themselves
CREATE POLICY "Members can leave rooms"
    ON public.room_members FOR DELETE
    USING (auth.uid() = user_id);

-- ======================================
-- ROOM MESSAGES POLICIES
-- ======================================
-- Room members can view messages in their rooms
CREATE POLICY "Members can view room messages"
    ON public.room_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_members.room_id = room_messages.room_id
            AND room_members.user_id = auth.uid()
        )
    );

-- Room members can post messages
CREATE POLICY "Members can send room messages"
    ON public.room_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_members.room_id = room_messages.room_id
            AND room_members.user_id = auth.uid()
        )
    );

-- Users can delete their own messages
CREATE POLICY "Users can delete own room messages"
    ON public.room_messages FOR DELETE
    USING (auth.uid() = user_id);

-- ======================================
-- ROOM INVITATIONS POLICIES
-- ======================================
-- Users can view invitations sent to their email
CREATE POLICY "Users can view own invitations"
    ON public.room_invitations FOR SELECT
    USING (
        to_email = (SELECT email FROM public.users WHERE id = auth.uid())
    );

-- Room members can view invitations for their rooms
CREATE POLICY "Members can view room invitations"
    ON public.room_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_members.room_id = room_invitations.room_id
            AND room_members.user_id = auth.uid()
        )
    );

-- Room members can create invitations
CREATE POLICY "Members can create invitations"
    ON public.room_invitations FOR INSERT
    WITH CHECK (
        auth.uid() = from_user_id AND
        EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_members.room_id = room_invitations.room_id
            AND room_members.user_id = auth.uid()
        )
    );

-- Recipients can update invitations (accept/decline)
CREATE POLICY "Recipients can respond to invitations"
    ON public.room_invitations FOR UPDATE
    USING (to_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- ======================================
-- VOICE RECORDINGS POLICIES
-- ======================================
-- Users can view their own voice recordings
CREATE POLICY "Users can view own recordings"
    ON public.voice_recordings FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own voice recordings
CREATE POLICY "Users can create recordings"
    ON public.voice_recordings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
    ON public.voice_recordings FOR DELETE
    USING (auth.uid() = user_id);

-- ======================================
-- USER PREFERENCES POLICIES
-- ======================================
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can create own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- ======================================
-- FUNCTIONS & TRIGGERS
-- ======================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_sessions_updated_at
    BEFORE UPDATE ON public.scheduled_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_rooms_updated_at
    BEFORE UPDATE ON public.group_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_invitations_updated_at
    BEFORE UPDATE ON public.room_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    
    -- Create default preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ======================================
-- COMMENTS for Documentation
-- ======================================

COMMENT ON TABLE public.users IS 'Extended user profiles with role-based access';
COMMENT ON TABLE public.chat_sessions IS 'Individual chat sessions for each user';
COMMENT ON TABLE public.messages IS 'Messages within chat sessions supporting multimodal content';
COMMENT ON TABLE public.scheduled_sessions IS 'Learning sessions scheduled between students and teachers';
COMMENT ON TABLE public.level_test_results IS 'English proficiency test results';
COMMENT ON TABLE public.group_rooms IS 'Group chat rooms for collaborative learning';
COMMENT ON TABLE public.room_members IS 'Room membership tracking';
COMMENT ON TABLE public.room_messages IS 'Messages in group chat rooms';
COMMENT ON TABLE public.room_invitations IS 'Invitations to join rooms';
COMMENT ON TABLE public.voice_recordings IS 'Voice recording metadata and transcriptions';
COMMENT ON TABLE public.user_preferences IS 'User-specific preferences and settings';

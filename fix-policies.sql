-- ======================================
-- SQL Fix Script - Run this if you get "policy already exists" error
-- ======================================
-- This script drops existing policies and recreates them

-- Drop existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on public tables
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Now run the main txt.sql file
-- or just enable RLS and create policies again:

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.level_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ======================================
-- USERS TABLE POLICIES
-- ======================================
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ======================================
-- CHAT SESSIONS POLICIES
-- ======================================
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- MESSAGES POLICIES
-- ======================================
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = messages.chat_session_id AND chat_sessions.user_id = auth.uid()));
CREATE POLICY "Users can create own messages" ON public.messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = chat_session_id AND chat_sessions.user_id = auth.uid()));
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = messages.chat_session_id AND chat_sessions.user_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = messages.chat_session_id AND chat_sessions.user_id = auth.uid()));

-- ======================================
-- LEVEL TEST RESULTS POLICIES
-- ======================================
CREATE POLICY "Users can view own test results" ON public.level_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own test results" ON public.level_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own test results" ON public.level_test_results FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view all test results" ON public.level_test_results FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'teacher'));

-- ======================================
-- SCHEDULED SESSIONS POLICIES
-- ======================================
CREATE POLICY "Students can view own scheduled sessions" ON public.scheduled_sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view assigned sessions" ON public.scheduled_sessions FOR SELECT
    USING (auth.uid() = teacher_id OR (teacher_id IS NULL AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'teacher')));
CREATE POLICY "Students can create scheduled sessions" ON public.scheduled_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own sessions" ON public.scheduled_sessions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can delete own sessions" ON public.scheduled_sessions FOR DELETE USING (auth.uid() = student_id);

-- ======================================
-- GROUP ROOMS POLICIES
-- ======================================
CREATE POLICY "Users can view joined rooms" ON public.group_rooms FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = group_rooms.id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can create rooms" ON public.group_rooms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update rooms" ON public.group_rooms FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete rooms" ON public.group_rooms FOR DELETE USING (auth.uid() = creator_id);

-- ======================================
-- ROOM MEMBERS POLICIES
-- ======================================
CREATE POLICY "Members can view room members" ON public.room_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()));
CREATE POLICY "Creators can add members" ON public.room_members FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.group_rooms WHERE group_rooms.id = room_id AND group_rooms.creator_id = auth.uid()));
CREATE POLICY "Creators can remove members" ON public.room_members FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.group_rooms WHERE group_rooms.id = room_members.room_id AND group_rooms.creator_id = auth.uid()));
CREATE POLICY "Members can leave rooms" ON public.room_members FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- ROOM MESSAGES POLICIES
-- ======================================
CREATE POLICY "Members can view room messages" ON public.room_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_messages.room_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Members can send room messages" ON public.room_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_messages.room_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can delete own room messages" ON public.room_messages FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- ROOM INVITATIONS POLICIES
-- ======================================
CREATE POLICY "Users can view own invitations" ON public.room_invitations FOR SELECT
    USING (to_email = (SELECT email FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Members can view room invitations" ON public.room_invitations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_invitations.room_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Members can create invitations" ON public.room_invitations FOR INSERT
    WITH CHECK (auth.uid() = from_user_id AND EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_invitations.room_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Recipients can respond to invitations" ON public.room_invitations FOR UPDATE
    USING (to_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- ======================================
-- VOICE RECORDINGS POLICIES
-- ======================================
CREATE POLICY "Users can view own recordings" ON public.voice_recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create recordings" ON public.voice_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recordings" ON public.voice_recordings FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- USER PREFERENCES POLICIES
-- ======================================
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Done!
SELECT 'All policies created successfully!' as result;

-- AI Tutor Group Chat Schema for Supabase
-- Run this in Supabase SQL Editor to create required tables

-- Drop existing tables if they exist (WARNING: deletes data!)
-- DROP TABLE IF EXISTS room_messages;
-- DROP TABLE IF EXISTS room_invitations;
-- DROP TABLE IF EXISTS room_members;
-- DROP TABLE IF EXISTS group_rooms;

-- 1. Group Rooms Table
CREATE TABLE IF NOT EXISTS group_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_email VARCHAR(255) NOT NULL,
  creator_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Room Members Table
CREATE TABLE IF NOT EXISTS room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES group_rooms(id) ON DELETE CASCADE,
  member_email VARCHAR(255) NOT NULL,
  member_name VARCHAR(255),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, member_email)
);

-- 3. Room Messages Table
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES group_rooms(id) ON DELETE CASCADE,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Room Invitations Table
CREATE TABLE IF NOT EXISTS room_invitations (
  id SERIAL PRIMARY KEY,
  room_id UUID REFERENCES group_rooms(id) ON DELETE CASCADE,
  room_name VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  to_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_members_email ON room_members(member_email);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_to ON room_invitations(to_email, status);
CREATE INDEX IF NOT EXISTS idx_group_rooms_creator ON group_rooms(creator_email);

-- Disable RLS for simplicity (email-based access control)
ALTER TABLE group_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_invitations ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since we're using email-based filtering in app)
CREATE POLICY "Allow all for group_rooms" ON group_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for room_members" ON room_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for room_messages" ON room_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for room_invitations" ON room_invitations FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anon role
GRANT ALL ON group_rooms TO anon;
GRANT ALL ON room_members TO anon;
GRANT ALL ON room_messages TO anon;
GRANT ALL ON room_invitations TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;

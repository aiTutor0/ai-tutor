-- AITutor — initial schema
-- Apply with: supabase db push (or paste in SQL editor)
--
-- Tables:
--   profiles         — public per-user profile (display_name, avatar_url, exam_mode)
--   reading_sessions
--   listening_sessions
--   writing_essays
--   writing_tasks
--   speak_sessions
--   chat_messages          — 1:1 AI tutor history
--   rooms / room_members / group_messages
--   study_schedule
--
-- Auth: every row references auth.users(id). Row-Level Security is enabled
-- so each user only sees their own data, except group_messages which are
-- visible to room members.

-- ── profiles ──────────────────────────────────────────────────────────
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url text,
    exam_mode text check (exam_mode in ('IELTS', 'TOEFL')),
    cefr_level text,
    created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles self" on profiles
    for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── reading_sessions ──────────────────────────────────────────────────
create table if not exists reading_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    exam_mode text not null check (exam_mode in ('IELTS', 'TOEFL')),
    passage_title text,
    passage_content text,
    passage_word_count int,
    questions text,
    user_answers text,
    correct_answers int,
    total_questions int,
    score_percentage int,
    time_taken_seconds int,
    time_limit_seconds int,
    wpm int,
    created_at timestamptz default now()
);
alter table reading_sessions enable row level security;
create policy "reading self" on reading_sessions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── listening_sessions ────────────────────────────────────────────────
create table if not exists listening_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    exam_mode text not null check (exam_mode in ('IELTS', 'TOEFL')),
    title text,
    topic text,
    transcript text,
    score int,
    total_questions int,
    score_percentage int,
    time_taken_seconds int,
    created_at timestamptz default now()
);
alter table listening_sessions enable row level security;
create policy "listening self" on listening_sessions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── writing_essays ────────────────────────────────────────────────────
create table if not exists writing_essays (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_type text not null,
    exam_mode text not null check (exam_mode in ('IELTS', 'TOEFL')),
    topic text,
    essay_content text,
    word_count int,
    band_score numeric(3,1),
    task_achievement numeric(3,1),
    coherence_cohesion numeric(3,1),
    lexical_resource numeric(3,1),
    grammar_accuracy numeric(3,1),
    ai_feedback text,
    created_at timestamptz default now()
);
alter table writing_essays enable row level security;
create policy "essays self" on writing_essays
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── speak_sessions ────────────────────────────────────────────────────
create table if not exists speak_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    mode text,
    duration_seconds int,
    transcript text,
    corrections text,
    created_at timestamptz default now()
);
alter table speak_sessions enable row level security;
create policy "speak self" on speak_sessions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── chat_messages (1:1 AI tutor) ──────────────────────────────────────
create table if not exists chat_messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    tutor_mode text,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz default now()
);
alter table chat_messages enable row level security;
create policy "chat self" on chat_messages
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── rooms / room_members / group_messages ────────────────────────────
create table if not exists rooms (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_by uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now()
);
alter table rooms enable row level security;
create policy "rooms read" on rooms for select using (true);
create policy "rooms insert" on rooms for insert with check (auth.uid() = created_by);

create table if not exists room_members (
    room_id uuid references rooms(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    joined_at timestamptz default now(),
    primary key (room_id, user_id)
);
alter table room_members enable row level security;
create policy "members read" on room_members for select using (true);
create policy "members insert" on room_members for insert with check (auth.uid() = user_id);

create table if not exists group_messages (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    display_name text,
    content text not null,
    created_at timestamptz default now()
);
alter table group_messages enable row level security;
create policy "group read" on group_messages
    for select using (
        exists (
            select 1 from room_members rm
            where rm.room_id = group_messages.room_id and rm.user_id = auth.uid()
        )
    );
create policy "group insert" on group_messages
    for insert with check (
        auth.uid() = user_id
        and exists (
            select 1 from room_members rm
            where rm.room_id = group_messages.room_id and rm.user_id = auth.uid()
        )
    );

-- Enable realtime for group_messages
alter publication supabase_realtime add table group_messages;

-- ── study_schedule ────────────────────────────────────────────────────
create table if not exists study_schedule (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    notes text,
    scheduled_for timestamptz not null,
    created_at timestamptz default now()
);
alter table study_schedule enable row level security;
create policy "schedule self" on study_schedule
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

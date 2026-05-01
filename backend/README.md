# AITutor — Backend (Supabase)

This directory contains everything needed to power the AITutor mobile clients
(Android + iOS) on Supabase: the database schema and three Edge Functions that
proxy OpenAI calls so the API key never ships in the app.

## Layout

```
backend/
└── supabase/
    ├── functions/
    │   ├── _shared/
    │   │   ├── cors.ts            CORS headers + helpers
    │   │   └── prompts.ts         system prompts per toolMode (IELTS/TOEFL aware)
    │   ├── openai/index.ts        chat-completion proxy (used by Reading/Listening/Writing/Chat)
    │   ├── realtime-token/index.ts ephemeral token for OpenAI Realtime (Speaking)
    │   └── transcribe/index.ts    Whisper proxy (optional fallback)
    └── migrations/
        └── 0001_init.sql          tables, RLS policies, realtime publication
```

## One-time Supabase setup

1. Create a Supabase project at https://supabase.com/dashboard
2. Install the CLI: `npm i -g supabase` (or `brew install supabase/tap/supabase`).
3. Link this folder to your project:
   ```bash
   cd backend
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
4. Apply the schema:
   ```bash
   supabase db push
   ```

## Edge Functions

### Set the secret (server-side OpenAI key)

```bash
supabase secrets set OPENAI_API_KEY=sk-...
# optional: pin a model (default gpt-4o-mini)
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

### Deploy

```bash
supabase functions deploy openai          --no-verify-jwt
supabase functions deploy realtime-token  --no-verify-jwt
supabase functions deploy transcribe      --no-verify-jwt
```

`--no-verify-jwt` keeps the functions callable from the mobile clients with
the anon key. Auth is enforced via Row-Level Security on the database, so the
proxy itself doesn't need user identity.

### Verify

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"toolMode":"chat","userText":"Hi tutor!"}' \
  https://<ref>.supabase.co/functions/v1/openai
```

Should return `{ "text": "..." }`.

## What lives where

- `_shared/prompts.ts` is the single source of truth for system prompts.
  Edit it to tune IELTS vs TOEFL output. The mobile clients never see these
  prompts — they only send `{ toolMode, userText, examMode? }`.
- `0001_init.sql` enables `auth.uid()`-based RLS on every per-user table
  (reading/listening/writing/speak/chat/schedule). Group chat tables let any
  authenticated user list rooms but restrict messages to room members.
- `realtime` publication is extended to `group_messages` so the Android
  client receives live INSERT events.

## Bumping the schema

Add a new file under `migrations/` named `NNNN_<description>.sql`, then run
`supabase db push`. Never modify `0001_init.sql` after first deploy.

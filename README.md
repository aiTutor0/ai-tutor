# AITutor — Mobile

Native English-learning app focused on **IELTS** and **TOEFL** preparation.
Ported from the [aiTutor0/ai-tutor](https://github.com/aiTutor0/ai-tutor) web
project (`android` branch). Duolingo-style gamified UX, AI-graded skills, live
voice tutor.

```
.
├── _reference/   the original web app — kept as a porting reference
├── android/      Native Android — Kotlin + Jetpack Compose (this is the live target)
├── ios/          (future) Native iOS — Swift + SwiftUI
├── backend/      Supabase: SQL migrations + Edge Functions (Deno) — shared by both clients
└── docs/
```

## What's in the box (Android)

- **Onboarding**: Splash → Login / Register (Supabase Auth, email + Google) → Exam picker (IELTS vs TOEFL) → Main
- **Main scaffold**: gamification top bar (exam pill, streak, hearts, XP) + 4-tab bottom nav (Learn / Skills / Tutor / Profile)
- **Reading**: AI-generated passages, MCQ / True-False-NG / fill-blank / inference / summary, WPM, lenient grader
- **Listening**: AI-generated lectures, on-device TTS, 5–7 questions
- **Writing**: IELTS Task 1 (chart) + Task 2 (essay) and TOEFL Independent + Integrated, AI band-score evaluation, grammar fixes, improved-sentence rewrites
- **Level Test**: 10-question CEFR placement (A1 → C1)
- **Tutor Chat**: 5 modes — free chat, mock interview, grammar fixer, topic explainer, translator
- **Group Chat**: Supabase Realtime channels
- **Schedule**: per-user upcoming sessions
- **Speaking**: WebRTC live voice with OpenAI Realtime API, mute/unmute, transcript

All AI calls go through Supabase Edge Functions — the OpenAI API key never
leaves the server.

## Setup

### 1. Backend (Supabase) — once

```bash
cd backend
supabase login
supabase link --project-ref YOUR_REF
supabase db push                               # applies migrations/0001_init.sql
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy openai          --no-verify-jwt
supabase functions deploy realtime-token  --no-verify-jwt
supabase functions deploy transcribe      --no-verify-jwt
```

Details: [`backend/README.md`](backend/README.md)

### 2. Android client

```bash
cd android
cp local.properties.example local.properties
# edit local.properties with sdk.dir, SUPABASE_URL, SUPABASE_ANON_KEY
```

Open `android/` in Android Studio, sync Gradle, run.

Details: [`android/README.md`](android/README.md)

## Stack

| Layer | Tech |
|------|------|
| Android UI | Jetpack Compose, Material 3, Material Icons Extended |
| Architecture | MVVM + repository pattern, Hilt DI |
| Async | Kotlin coroutines + Flow / StateFlow |
| Network | Supabase Kotlin SDK 2.6 (auth / postgrest / realtime / storage / functions), Ktor 2.3 |
| Persistence | DataStore Preferences (per-user gamification + exam mode) |
| Audio | `android.speech.tts.TextToSpeech` (Listening), `io.getstream:stream-webrtc-android` (Speaking) |
| Backend | Supabase Postgres + Auth + Realtime + Edge Functions (Deno) |
| AI | OpenAI Chat Completions (`gpt-4o-mini`) + Realtime (`gpt-4o-realtime-preview`) + Whisper |

## License

MIT — same as upstream.

# AITutor — Mobile

Native English-learning app focused on **IELTS** and **TOEFL** preparation.
Ported from the [aiTutor0/ai-tutor](https://github.com/aiTutor0/ai-tutor) web
project (`ios` branch). Duolingo-style gamified UX, AI-graded skills, live
voice tutor.

```
.
├── ios/          Native iOS — Swift + SwiftUI (this is the live target)
├── android/      (sister branch) Native Android — Kotlin + Jetpack Compose
├── backend/      Supabase: SQL migrations + Edge Functions (Deno) — shared by both clients
└── docs/
```

## What's in the box (iOS)

- **Onboarding**: Splash → Login / Register (Supabase Auth, email + Google) → Exam picker (IELTS vs TOEFL) → Main
- **Main scaffold**: gamification top bar (exam pill, streak, hearts, XP) + 4-tab `TabView` (Learn / Skills / Tutor / Profile)
- **Reading**: AI-generated passages, MCQ / True-False-NG / fill-blank / inference / summary, WPM, lenient grader *(port pending)*
- **Listening**: AI-generated lectures, on-device TTS, 5–7 questions *(port pending)*
- **Writing**: IELTS Task 1 (chart) + Task 2 (essay) and TOEFL Independent + Integrated, AI band-score evaluation, grammar fixes, improved-sentence rewrites *(port pending)*
- **Level Test**: 10-question CEFR placement (A1 → C1) *(port pending)*
- **Tutor Chat**: 5 modes — free chat, mock interview, grammar fixer, topic explainer, translator *(port pending)*
- **Group Chat**: Supabase Realtime channels *(port pending)*
- **Schedule**: per-user upcoming sessions *(port pending)*
- **Speaking**: WebRTC live voice with OpenAI Realtime API *(port pending — needs SPM-friendly WebRTC binary)*

All AI calls go through Supabase Edge Functions — the OpenAI API key never
leaves the server.

This first iOS push lands the architecture (domain, repositories, theme,
DI), the auth flow end-to-end (Splash → Login → Register → ExamSelect), and
the main TabView scaffold. The skill modules are placeholder views; each one
will be ported across in subsequent commits, mirroring the corresponding
screen on the `android` branch.

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

### 2. iOS client (Mac required)

```bash
cd ios
brew install xcodegen
cp AITutor/Secrets.example.swift AITutor/Secrets.swift
# edit AITutor/Secrets.swift with your supabaseURL + supabaseAnonKey
xcodegen generate
open AITutor.xcodeproj
```

Then select your team in Signing & Capabilities and Run.

Details: [`ios/README.md`](ios/README.md)

# AITutor — Android

Native Kotlin + Jetpack Compose port of [aiTutor0/ai-tutor](https://github.com/aiTutor0/ai-tutor).

Focused on **IELTS** and **TOEFL** preparation with a Duolingo-style learning experience.

## Stack

- Kotlin 2.0 + Jetpack Compose (Material 3)
- Hilt for DI
- Supabase Kotlin SDK (auth, postgrest, realtime, storage, functions)
- Media3 ExoPlayer (Listening audio)
- Stream WebRTC (Speaking — OpenAI Realtime API)
- DataStore Preferences

## First-time setup

1. **Android Studio** — Hedgehog (2023.1) or newer. Open the `android/` folder as a project.
2. **JDK 17** is required for AGP 8.7.
3. **SDK** — Compile SDK 35, min SDK 26 (Android 8.0+).
4. Copy `local.properties.example` → `local.properties` and fill in:
   ```
   sdk.dir=...path to Android SDK...
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=...your anon key...
   ```
5. Sync Gradle, then **Run** the `app` configuration on a device or emulator.

## OpenAI proxy

The app **does not** ship with an OpenAI key — all AI traffic goes through
Supabase Edge Functions (see `../backend/`). Deploy the functions to your own
Supabase project and set `OPENAI_API_KEY` as a secret there.

## Folder structure

```
app/src/main/java/com/aitutor/app/
├── data/           remote (Supabase, OpenAI proxy), local (DataStore), repositories
├── domain/         models, repository interfaces, use-cases
├── ui/
│   ├── theme/      Duolingo-inspired Material 3 theme
│   ├── components/ DuoButton, hearts/streak chips, etc.
│   ├── navigation/ NavGraph + routes
│   └── screens/    auth, exam_select, home, reading, listening, …
├── di/             Hilt modules
├── AITutorApp.kt   @HiltAndroidApp
└── MainActivity.kt
```

## Phases

- **Phase 0** — project skeleton, theme, nav. ✅
- **Phase 1** — Supabase auth, exam selection (IELTS/TOEFL), bottom nav, scaffold.
- **Phase 2–9** — Reading, Listening, Writing, Level Test, Chat, Group Chat, Schedule, Speaking.
- **Phase 10** — port `_reference/netlify/functions/*` → Supabase Edge Functions (Deno).
- **Phase 11** — polish, signed APK.

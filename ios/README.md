# AITutor — iOS

Native SwiftUI app, parallels the Kotlin/Compose Android app on the `android` branch. Shares the Supabase backend in `../backend/`.

## Stack

- Swift 5.10, SwiftUI
- Minimum iOS 16 (NavigationStack, Swift Charts available)
- [supabase-swift](https://github.com/supabase/supabase-swift) — auth, postgrest, realtime, storage, edge functions
- Layered architecture parallel to Android: `Domain` → `Data` → `UI`

## First-time setup (Mac required)

1. Install [XcodeGen](https://github.com/yonaskolb/XcodeGen):
   ```sh
   brew install xcodegen
   ```
2. Copy the secrets template and fill in your Supabase keys:
   ```sh
   cp AITutor/Secrets.example.swift AITutor/Secrets.swift
   # edit AITutor/Secrets.swift and paste real supabaseURL + supabaseAnonKey
   ```
   `Secrets.swift` is gitignored.
3. Generate the Xcode project:
   ```sh
   xcodegen generate
   ```
4. Open it:
   ```sh
   open AITutor.xcodeproj
   ```
5. Select your team in Signing & Capabilities, then Run.

## Layout

```
ios/
├── project.yml                    # XcodeGen spec
├── Config.example.xcconfig        # Template (real one is gitignored)
└── AITutor/
    ├── AITutorApp.swift           # @main entry point
    ├── App/                       # Root composition
    ├── Domain/
    │   ├── Model/                 # Pure data models
    │   ├── Repository/            # Protocols
    │   └── UseCase/
    ├── Data/
    │   ├── Local/                 # UserDefaults wrappers, on-device banks
    │   ├── Remote/                # SupabaseProvider, AiProxyApi
    │   └── Repository/            # Protocol implementations
    ├── DI/
    │   └── AppContainer.swift     # Lightweight container (Hilt-equivalent)
    ├── UI/
    │   ├── Theme/                 # Colors, Typography, Shape
    │   ├── Components/            # DuoButton, GamificationTopBar, BottomNav
    │   ├── Navigation/            # Routes, navigation graph
    │   └── Screens/               # One folder per feature
    └── Resources/
        └── Assets.xcassets
```

## Backend

Lives in `../backend/`. Edge functions deploy with `supabase functions deploy`. The iOS app talks to:

- `openai` — chat completions (all `toolMode` values)
- `realtime-token` — ephemeral OpenAI Realtime token (Speaking module)
- `transcribe` — Whisper

The Anon key in `Config.xcconfig` is the public client key (RLS-protected), not the service role.

## Speaking module

Uses WebRTC for the OpenAI Realtime API. The iOS implementation will use `AVAudioEngine` + a WebRTC pod (planned). Currently a placeholder.

import Foundation
import Functions

/// Tool modes accepted by the OpenAI proxy. Mirrors the `toolMode` switch in
/// `backend/supabase/functions/openai/index.ts` — keep in sync when the
/// backend gains new modes.
enum ToolMode: String {
    case chat
    case interview
    case grammar
    case tutor
    case translate
    case level
    case essayEvaluate = "essay_evaluate"
    case readingGenerate = "reading_generate"
    case listeningGenerate = "listening_generate"
    case taskResponseEvaluate = "task_response_evaluate"
    case speedReadingGenerate = "speed_reading_generate"
    case conversationGenerate = "conversation_generate"
}

struct AiProxyRequest: Encodable {
    let toolMode: String
    let userText: String
    let userLevel: UserLevelDto?
    let examMode: String?

    init(
        toolMode: String,
        userText: String,
        userLevel: UserLevelDto? = nil,
        examMode: String? = nil
    ) {
        self.toolMode = toolMode
        self.userText = userText
        self.userLevel = userLevel
        self.examMode = examMode
    }
}

struct UserLevelDto: Encodable {
    let level: String
    let description: String
}

struct AiProxyResponse: Decodable {
    let text: String
}

struct RealtimeTokenRequest: Encodable {
    let mode: String
}

struct RealtimeTokenResponse: Decodable {
    let token: String
    let sessionId: String
    let expiresAt: Int?
}

/// Thin wrapper around the Supabase Edge Functions that proxy OpenAI calls.
///
/// Edge function names (deployed from `backend/supabase/functions/`):
/// - `openai`          — chat completions (all toolModes)
/// - `realtime-token`  — ephemeral token for OpenAI Realtime (Speaking)
/// - `transcribe`      — Whisper transcription
final class AiProxyApi {
    private let provider: SupabaseProvider

    init(provider: SupabaseProvider = .shared) {
        self.provider = provider
    }

    func callOpenAi(_ request: AiProxyRequest) async throws -> String {
        let response: AiProxyResponse = try await provider.client.functions.invoke(
            "openai",
            options: FunctionInvokeOptions(body: request)
        )
        return response.text
    }

    func createRealtimeToken(mode: String) async throws -> RealtimeTokenResponse {
        let response: RealtimeTokenResponse = try await provider.client.functions.invoke(
            "realtime-token",
            options: FunctionInvokeOptions(body: RealtimeTokenRequest(mode: mode))
        )
        return response
    }

    func transcribeAudio(audioBase64: String) async throws -> String {
        let response: AiProxyResponse = try await provider.client.functions.invoke(
            "transcribe",
            options: FunctionInvokeOptions(body: ["audio": audioBase64])
        )
        return response.text
    }
}

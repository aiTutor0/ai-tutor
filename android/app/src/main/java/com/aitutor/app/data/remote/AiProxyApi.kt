package com.aitutor.app.data.remote

import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.functions.functions
import io.ktor.client.call.body
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpMethod
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Tool modes accepted by the OpenAI proxy. Mirrors the `toolMode` switch in
 * `_reference/netlify/functions/openai.js` — keep in sync when the backend
 * gains new modes.
 */
enum class ToolMode(val wire: String) {
    CHAT("chat"),
    INTERVIEW("interview"),
    GRAMMAR("grammar"),
    TUTOR("tutor"),
    TRANSLATE("translate"),
    LEVEL("level"),
    ESSAY_EVALUATE("essay_evaluate"),
    READING_GENERATE("reading_generate"),
    LISTENING_GENERATE("listening_generate"),
    TASK_RESPONSE_EVALUATE("task_response_evaluate"),
    SPEED_READING_GENERATE("speed_reading_generate"),
    CONVERSATION_GENERATE("conversation_generate")
}

@Serializable
data class AiProxyRequest(
    @SerialName("toolMode") val toolMode: String,
    @SerialName("userText") val userText: String,
    @SerialName("userLevel") val userLevel: UserLevel? = null,
    @SerialName("examMode") val examMode: String? = null
)

@Serializable
data class UserLevel(
    val level: String,
    val description: String
)

@Serializable
data class AiProxyResponse(
    val text: String
)

@Serializable
data class RealtimeTokenRequest(
    val mode: String
)

@Serializable
data class RealtimeTokenResponse(
    val token: String,
    val sessionId: String,
    val expiresAt: Long? = null
)

/**
 * Thin wrapper around the Supabase Edge Functions that proxy OpenAI calls.
 *
 * Edge function names (deployed from `backend/supabase/functions/`):
 * - `openai`          — chat completions (all toolModes)
 * - `realtime-token`  — ephemeral token for OpenAI Realtime (Speaking)
 * - `transcribe`      — Whisper transcription
 */
@Singleton
class AiProxyApi @Inject constructor(
    private val supabase: SupabaseProvider
) {
    private val functions: Functions get() = supabase.client.functions
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = false }

    suspend fun callOpenAi(request: AiProxyRequest): String {
        val res = functions.invoke(
            function = "openai",
            body = json.encodeToString(request)
        ) {
            method = HttpMethod.Post
        }
        val raw = res.bodyAsText()
        return json.decodeFromString<AiProxyResponse>(raw).text
    }

    suspend fun createRealtimeToken(mode: String): RealtimeTokenResponse {
        val res = functions.invoke(
            function = "realtime-token",
            body = json.encodeToString(RealtimeTokenRequest(mode))
        ) {
            method = HttpMethod.Post
        }
        return json.decodeFromString(res.bodyAsText())
    }

    suspend fun transcribeAudio(audioBase64: String): String {
        val payload = json.encodeToString(mapOf("audio" to audioBase64))
        val res = functions.invoke(
            function = "transcribe",
            body = payload
        ) {
            method = HttpMethod.Post
        }
        return json.decodeFromString<AiProxyResponse>(res.bodyAsText()).text
    }
}

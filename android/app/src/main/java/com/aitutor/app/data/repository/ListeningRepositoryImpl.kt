package com.aitutor.app.data.repository

import com.aitutor.app.data.remote.AiProxyApi
import com.aitutor.app.data.remote.AiProxyRequest
import com.aitutor.app.data.remote.SupabaseProvider
import com.aitutor.app.data.remote.ToolMode
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.ListeningContent
import com.aitutor.app.domain.model.ReadingResult
import com.aitutor.app.domain.repository.ListeningRepository
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ListeningRepositoryImpl @Inject constructor(
    private val ai: AiProxyApi,
    private val supabase: SupabaseProvider
) : ListeningRepository {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    override suspend fun generateContent(examMode: ExamMode): Result<ListeningContent> = runCatching {
        val text = ai.callOpenAi(
            AiProxyRequest(
                toolMode = ToolMode.LISTENING_GENERATE.wire,
                userText = "Generate a random ${examMode.displayName} listening lecture",
                examMode = examMode.name
            )
        )
        json.decodeFromString<ListeningContent>(text)
    }

    override suspend fun saveSession(
        examMode: ExamMode,
        content: ListeningContent,
        userAnswers: List<String>,
        result: ReadingResult
    ): Result<Unit> = runCatching {
        val userId = supabase.client.auth.currentUserOrNull()?.id ?: return@runCatching
        supabase.client.postgrest.from("listening_sessions").insert(
            ListeningRow(
                userId = userId,
                examMode = examMode.name,
                title = content.title,
                topic = content.topic,
                transcript = content.transcript,
                correctCount = result.correctCount,
                totalQuestions = result.totalQuestions,
                scorePercentage = result.scorePercentage,
                timeTakenSeconds = result.timeTakenSeconds.toInt()
            )
        )
    }

    @Serializable
    private data class ListeningRow(
        @SerialName("user_id") val userId: String,
        @SerialName("exam_mode") val examMode: String,
        val title: String,
        val topic: String?,
        val transcript: String,
        @SerialName("score") val correctCount: Int,
        @SerialName("total_questions") val totalQuestions: Int,
        @SerialName("score_percentage") val scorePercentage: Int,
        @SerialName("time_taken_seconds") val timeTakenSeconds: Int
    )
}

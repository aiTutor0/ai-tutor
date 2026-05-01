package com.aitutor.app.data.repository

import com.aitutor.app.data.remote.AiProxyApi
import com.aitutor.app.data.remote.AiProxyRequest
import com.aitutor.app.data.remote.SupabaseProvider
import com.aitutor.app.data.remote.ToolMode
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.ReadingPassage
import com.aitutor.app.domain.model.ReadingResult
import com.aitutor.app.domain.repository.ReadingRepository
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReadingRepositoryImpl @Inject constructor(
    private val ai: AiProxyApi,
    private val supabase: SupabaseProvider
) : ReadingRepository {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    override suspend fun generatePassage(examMode: ExamMode): Result<ReadingPassage> = runCatching {
        val text = ai.callOpenAi(
            AiProxyRequest(
                toolMode = ToolMode.READING_GENERATE.wire,
                userText = "Generate a random ${examMode.displayName} reading passage",
                examMode = examMode.name
            )
        )
        json.decodeFromString<ReadingPassage>(text)
    }

    override suspend fun saveSession(
        examMode: ExamMode,
        passage: ReadingPassage,
        userAnswers: List<String>,
        result: ReadingResult,
        timeLimitSeconds: Int
    ): Result<Unit> = runCatching {
        val userId = supabase.client.auth.currentUserOrNull()?.id ?: return@runCatching
        val row = ReadingSessionRow(
            userId = userId,
            examMode = examMode.name,
            passageTitle = passage.title,
            passageContent = passage.passage,
            passageWordCount = passage.wordCount,
            questions = json.encodeToString(
                ListSerializer(com.aitutor.app.domain.model.ReadingQuestion.serializer()),
                passage.questions
            ),
            userAnswers = json.encodeToString(
                ListSerializer(String.serializer()),
                userAnswers
            ),
            correctAnswers = result.correctCount,
            totalQuestions = result.totalQuestions,
            scorePercentage = result.scorePercentage,
            timeTakenSeconds = result.timeTakenSeconds.toInt(),
            timeLimitSeconds = timeLimitSeconds,
            wpm = result.wordsPerMinute
        )
        supabase.client.postgrest.from("reading_sessions").insert(row)
    }

    @Serializable
    private data class ReadingSessionRow(
        @SerialName("user_id") val userId: String,
        @SerialName("exam_mode") val examMode: String,
        @SerialName("passage_title") val passageTitle: String,
        @SerialName("passage_content") val passageContent: String,
        @SerialName("passage_word_count") val passageWordCount: Int,
        val questions: String,
        @SerialName("user_answers") val userAnswers: String,
        @SerialName("correct_answers") val correctAnswers: Int,
        @SerialName("total_questions") val totalQuestions: Int,
        @SerialName("score_percentage") val scorePercentage: Int,
        @SerialName("time_taken_seconds") val timeTakenSeconds: Int,
        @SerialName("time_limit_seconds") val timeLimitSeconds: Int,
        val wpm: Int
    )
}

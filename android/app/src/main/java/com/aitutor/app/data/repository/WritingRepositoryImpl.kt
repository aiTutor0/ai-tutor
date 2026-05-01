package com.aitutor.app.data.repository

import com.aitutor.app.data.local.WritingTopicBank
import com.aitutor.app.data.remote.AiProxyApi
import com.aitutor.app.data.remote.AiProxyRequest
import com.aitutor.app.data.remote.SupabaseProvider
import com.aitutor.app.data.remote.ToolMode
import com.aitutor.app.domain.model.WritingEvaluation
import com.aitutor.app.domain.model.WritingTaskType
import com.aitutor.app.domain.model.WritingTopic
import com.aitutor.app.domain.repository.WritingRepository
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WritingRepositoryImpl @Inject constructor(
    private val ai: AiProxyApi,
    private val supabase: SupabaseProvider
) : WritingRepository {

    private val json = Json { ignoreUnknownKeys = true; isLenient = true; encodeDefaults = false }

    override fun randomTopic(taskType: WritingTaskType): WritingTopic =
        WritingTopicBank.random(taskType)

    override suspend fun evaluate(
        topic: WritingTopic,
        essay: String
    ): Result<WritingEvaluation> = runCatching {
        val taskType = WritingTaskType.valueOf(topic.taskType)
        val mode = when (taskType) {
            WritingTaskType.IELTS_TASK_1 -> ToolMode.TASK_RESPONSE_EVALUATE
            WritingTaskType.IELTS_TASK_2 -> ToolMode.ESSAY_EVALUATE
            WritingTaskType.TOEFL_INDEPENDENT -> ToolMode.ESSAY_EVALUATE
            WritingTaskType.TOEFL_INTEGRATED -> ToolMode.ESSAY_EVALUATE
        }
        val payload = json.encodeToString(
            EvaluatePayload(
                taskType = taskType.name,
                topic = topic.prompt,
                sourceMaterial = topic.sourceMaterial,
                essay = essay,
                wordCount = wordCount(essay)
            )
        )
        val text = ai.callOpenAi(
            AiProxyRequest(
                toolMode = mode.wire,
                userText = payload,
                examMode = taskType.examMode.name
            )
        )
        json.decodeFromString<WritingEvaluation>(text).copy(wordCount = wordCount(essay))
    }

    override suspend fun saveEssay(
        taskType: WritingTaskType,
        topic: WritingTopic,
        essay: String,
        evaluation: WritingEvaluation
    ): Result<Unit> = runCatching {
        val userId = supabase.client.auth.currentUserOrNull()?.id ?: return@runCatching
        supabase.client.postgrest.from("writing_essays").insert(
            EssayRow(
                userId = userId,
                taskType = taskType.name,
                examMode = taskType.examMode.name,
                topic = topic.prompt,
                essayContent = essay,
                wordCount = evaluation.wordCount,
                bandScore = evaluation.bandScore,
                taskAchievement = evaluation.taskAchievement,
                coherenceCohesion = evaluation.coherenceCohesion,
                lexicalResource = evaluation.lexicalResource,
                grammarAccuracy = evaluation.grammarAccuracy,
                aiFeedback = evaluation.feedback
            )
        )
    }

    private fun wordCount(text: String) = text.trim().split(Regex("\\s+"))
        .filter { it.isNotEmpty() }.size

    @Serializable
    private data class EvaluatePayload(
        val taskType: String,
        val topic: String,
        val sourceMaterial: String?,
        val essay: String,
        val wordCount: Int
    )

    @Serializable
    private data class EssayRow(
        @SerialName("user_id") val userId: String,
        @SerialName("task_type") val taskType: String,
        @SerialName("exam_mode") val examMode: String,
        val topic: String,
        @SerialName("essay_content") val essayContent: String,
        @SerialName("word_count") val wordCount: Int,
        @SerialName("band_score") val bandScore: Double,
        @SerialName("task_achievement") val taskAchievement: Double,
        @SerialName("coherence_cohesion") val coherenceCohesion: Double,
        @SerialName("lexical_resource") val lexicalResource: Double,
        @SerialName("grammar_accuracy") val grammarAccuracy: Double,
        @SerialName("ai_feedback") val aiFeedback: String
    )
}

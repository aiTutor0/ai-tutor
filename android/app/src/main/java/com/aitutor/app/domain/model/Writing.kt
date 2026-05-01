package com.aitutor.app.domain.model

import kotlinx.serialization.Serializable

/**
 * Writing-task taxonomy across the two exams.
 *
 * IELTS:
 *   - Academic Task 1 (chart description, ~150 words)
 *   - Task 2 (essay, ~250 words)
 * TOEFL iBT:
 *   - Independent (essay on personal opinion, ~300 words)
 *   - Integrated (read + listen + write, ~150-225 words)
 */
enum class WritingTaskType(
    val displayName: String,
    val examMode: ExamMode,
    val targetWords: Int,
    val timeLimitMinutes: Int
) {
    IELTS_TASK_1("IELTS Task 1 — Chart", ExamMode.IELTS, 150, 20),
    IELTS_TASK_2("IELTS Task 2 — Essay", ExamMode.IELTS, 250, 40),
    TOEFL_INDEPENDENT("TOEFL Independent", ExamMode.TOEFL, 300, 30),
    TOEFL_INTEGRATED("TOEFL Integrated", ExamMode.TOEFL, 200, 20);

    companion object {
        fun forExam(mode: ExamMode): List<WritingTaskType> =
            entries.filter { it.examMode == mode }
    }
}

@Serializable
data class WritingTopic(
    val taskType: String,
    val prompt: String,
    /** For Task 1 / Integrated: brief description of the source material. */
    val sourceMaterial: String? = null
)

@Serializable
data class WritingEvaluation(
    val bandScore: Double = 0.0,
    val taskAchievement: Double = 0.0,
    val coherenceCohesion: Double = 0.0,
    val lexicalResource: Double = 0.0,
    val grammarAccuracy: Double = 0.0,
    val feedback: String = "",
    val strengths: List<String> = emptyList(),
    val weaknesses: List<String> = emptyList(),
    val suggestions: List<String> = emptyList(),
    val grammarErrors: List<GrammarError> = emptyList(),
    val improvedSentences: List<ImprovedSentence> = emptyList(),
    val wordCount: Int = 0
) {
    @Serializable
    data class GrammarError(
        val original: String = "",
        val corrected: String = "",
        val explanation: String = ""
    )

    @Serializable
    data class ImprovedSentence(
        val original: String = "",
        val improved: String = ""
    )

    /** Convert IELTS band → TOEFL approximate equivalent. */
    fun toeflEquivalent(): Int = when {
        bandScore >= 8.5 -> 30
        bandScore >= 8.0 -> 28
        bandScore >= 7.5 -> 26
        bandScore >= 7.0 -> 24
        bandScore >= 6.5 -> 22
        bandScore >= 6.0 -> 20
        bandScore >= 5.5 -> 18
        bandScore >= 5.0 -> 16
        bandScore >= 4.5 -> 14
        else -> 10
    }
}

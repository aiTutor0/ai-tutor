package com.aitutor.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Question types supported by the AI generator + grader. */
enum class QuestionType(val wire: String) {
    MULTIPLE_CHOICE("multiple_choice"),
    TRUE_FALSE_NG("true_false_ng"),
    TRUE_FALSE("true_false"),
    FILL_BLANK("fill_blank"),
    /** TOEFL-specific: pick best paraphrase / inference. */
    INFERENCE("inference"),
    /** TOEFL-specific: pick three statements that summarize the passage. */
    SUMMARY("summary");

    companion object {
        fun fromWire(s: String?): QuestionType =
            entries.firstOrNull { it.wire.equals(s, ignoreCase = true) } ?: MULTIPLE_CHOICE
    }
}

@Serializable
data class ReadingQuestion(
    val id: Int,
    @SerialName("type") private val typeWire: String? = null,
    val question: String,
    val options: List<String> = emptyList(),
    val correctAnswer: String,
    val explanation: String? = null
) {
    val type: QuestionType get() = QuestionType.fromWire(typeWire)
}

@Serializable
data class ReadingPassage(
    val title: String,
    val passage: String,
    val wordCount: Int,
    val questions: List<ReadingQuestion>
)

/** Per-question grading result. */
data class GradedAnswer(
    val questionIndex: Int,
    val userAnswer: String,
    val correctAnswer: String,
    val isCorrect: Boolean,
    val explanation: String?
)

data class ReadingResult(
    val correctCount: Int,
    val totalQuestions: Int,
    val scorePercentage: Int,
    val timeTakenSeconds: Long,
    val wordsPerMinute: Int,
    val perQuestion: List<GradedAnswer>
) {
    val xpEarned: Int = correctCount * 5
    val starsEarned: Int = when {
        scorePercentage >= 90 -> 3
        scorePercentage >= 70 -> 2
        scorePercentage >= 50 -> 1
        else -> 0
    }
}

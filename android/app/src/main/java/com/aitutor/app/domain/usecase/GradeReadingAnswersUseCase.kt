package com.aitutor.app.domain.usecase

import com.aitutor.app.domain.model.GradedAnswer
import com.aitutor.app.domain.model.QuestionType
import com.aitutor.app.domain.model.ReadingPassage
import com.aitutor.app.domain.model.ReadingResult
import javax.inject.Inject
import kotlin.math.roundToInt

/**
 * Pure grading logic — same lenient matching the web app uses
 * (`_reference/js/services/readingService.js`):
 *
 * - Multiple choice / True-False / True-False-NG / Inference: case-insensitive equality
 *   on the option letter ("A", "B"…) or value
 * - Fill-blank: lenient — exact match OR substring containment in either direction
 * - Summary (TOEFL): expected to be a comma-separated list of letters; user must
 *   pick the same set (order-independent)
 */
class GradeReadingAnswersUseCase @Inject constructor() {

    operator fun invoke(
        passage: ReadingPassage,
        userAnswers: List<String>,
        timeTakenSeconds: Long
    ): ReadingResult {
        val per = passage.questions.mapIndexed { idx, q ->
            val user = userAnswers.getOrNull(idx).orEmpty()
            val correct = q.correctAnswer
            val ok = when (q.type) {
                QuestionType.FILL_BLANK -> {
                    val u = user.normalize()
                    val c = correct.normalize()
                    u == c || (u.isNotEmpty() && c.isNotEmpty() && (u.contains(c) || c.contains(u)))
                }
                QuestionType.SUMMARY -> {
                    val a = user.split(',', ' ').map { it.normalize() }.filter { it.isNotEmpty() }.toSet()
                    val b = correct.split(',', ' ').map { it.normalize() }.filter { it.isNotEmpty() }.toSet()
                    a.isNotEmpty() && a == b
                }
                else -> user.normalize() == correct.normalize()
            }
            GradedAnswer(
                questionIndex = idx,
                userAnswer = user,
                correctAnswer = correct,
                isCorrect = ok,
                explanation = q.explanation
            )
        }
        val correctCount = per.count { it.isCorrect }
        val total = per.size
        val percent = if (total == 0) 0 else (100.0 * correctCount / total).roundToInt()
        val minutes = (timeTakenSeconds / 60.0).coerceAtLeast(0.05)
        val wpm = (passage.wordCount / minutes).roundToInt()
        return ReadingResult(
            correctCount = correctCount,
            totalQuestions = total,
            scorePercentage = percent,
            timeTakenSeconds = timeTakenSeconds,
            wordsPerMinute = wpm,
            perQuestion = per
        )
    }

    private fun String.normalize() = trim().lowercase()
        .removePrefix("a)").removePrefix("b)").removePrefix("c)").removePrefix("d)")
        .trim()
}

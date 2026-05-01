package com.aitutor.app.domain.model

import androidx.compose.ui.graphics.Color
import com.aitutor.app.ui.theme.IeltsBlue
import com.aitutor.app.ui.theme.ToeflRed

/**
 * Which exam the user is currently preparing for.
 *
 * Drives content selection (topic banks, scoring rubrics, task types) across all
 * skill modules. Persisted in [com.aitutor.app.data.local.UserPreferences].
 */
enum class ExamMode(
    val displayName: String,
    val tagline: String,
    val brandColor: Color,
    val scoreLabel: String,
    val maxScore: Double
) {
    IELTS(
        displayName = "IELTS",
        tagline = "Academic & General • 0–9 band",
        brandColor = IeltsBlue,
        scoreLabel = "Band",
        maxScore = 9.0
    ),
    TOEFL(
        displayName = "TOEFL iBT",
        tagline = "Academic • 0–120 total",
        brandColor = ToeflRed,
        scoreLabel = "Score",
        maxScore = 120.0
    );

    companion object {
        fun fromName(name: String?): ExamMode? =
            entries.firstOrNull { it.name.equals(name, ignoreCase = true) }
    }
}

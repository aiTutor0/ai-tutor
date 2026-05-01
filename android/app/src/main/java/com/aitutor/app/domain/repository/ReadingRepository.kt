package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.ReadingPassage
import com.aitutor.app.domain.model.ReadingResult

interface ReadingRepository {
    /** Generate a passage + questions tuned to the given exam mode. */
    suspend fun generatePassage(examMode: ExamMode): Result<ReadingPassage>

    /** Persist a finished session and roll up statistics. Best-effort. */
    suspend fun saveSession(
        examMode: ExamMode,
        passage: ReadingPassage,
        userAnswers: List<String>,
        result: ReadingResult,
        timeLimitSeconds: Int
    ): Result<Unit>
}

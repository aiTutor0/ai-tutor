package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.ListeningContent
import com.aitutor.app.domain.model.ReadingResult

interface ListeningRepository {
    suspend fun generateContent(examMode: ExamMode): Result<ListeningContent>

    suspend fun saveSession(
        examMode: ExamMode,
        content: ListeningContent,
        userAnswers: List<String>,
        result: ReadingResult
    ): Result<Unit>
}

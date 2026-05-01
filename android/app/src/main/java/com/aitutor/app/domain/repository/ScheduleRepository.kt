package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.StudySession

interface ScheduleRepository {
    suspend fun upcoming(): Result<List<StudySession>>
    suspend fun add(title: String, notes: String?, scheduledForIso: String): Result<StudySession>
    suspend fun remove(id: String): Result<Unit>
}

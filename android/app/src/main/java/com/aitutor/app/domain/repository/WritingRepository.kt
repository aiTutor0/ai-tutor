package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.WritingEvaluation
import com.aitutor.app.domain.model.WritingTaskType
import com.aitutor.app.domain.model.WritingTopic

interface WritingRepository {
    fun randomTopic(taskType: WritingTaskType): WritingTopic

    suspend fun evaluate(topic: WritingTopic, essay: String): Result<WritingEvaluation>

    suspend fun saveEssay(
        taskType: WritingTaskType,
        topic: WritingTopic,
        essay: String,
        evaluation: WritingEvaluation
    ): Result<Unit>
}

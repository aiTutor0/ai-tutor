package com.aitutor.app.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ListeningContent(
    val title: String,
    val topic: String? = null,
    val transcript: String,
    val wordCount: Int = 0,
    val duration: String? = null,
    val questions: List<ReadingQuestion>
)

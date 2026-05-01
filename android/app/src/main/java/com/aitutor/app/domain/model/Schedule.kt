package com.aitutor.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class StudySession(
    val id: String,
    val title: String,
    val notes: String? = null,
    @SerialName("scheduled_for") val scheduledFor: String, // ISO-8601 timestamp
    @SerialName("user_id") val userId: String,
    @SerialName("created_at") val createdAt: String? = null
)

package com.aitutor.app.data.repository

import com.aitutor.app.data.remote.SupabaseProvider
import com.aitutor.app.domain.model.StudySession
import com.aitutor.app.domain.repository.ScheduleRepository
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ScheduleRepositoryImpl @Inject constructor(
    private val supabase: SupabaseProvider
) : ScheduleRepository {

    private val client get() = supabase.client

    override suspend fun upcoming(): Result<List<StudySession>> = runCatching {
        val userId = client.auth.currentUserOrNull()?.id ?: return@runCatching emptyList()
        client.postgrest.from("study_schedule")
            .select {
                filter { eq("user_id", userId) }
                order("scheduled_for", Order.ASCENDING)
            }
            .decodeList<StudySession>()
    }

    override suspend fun add(
        title: String,
        notes: String?,
        scheduledForIso: String
    ): Result<StudySession> = runCatching {
        val userId = client.auth.currentUserOrNull()?.id ?: error("Not signed in")
        client.postgrest.from("study_schedule")
            .insert(NewSession(userId, title, notes, scheduledForIso)) { select() }
            .decodeSingle<StudySession>()
    }

    override suspend fun remove(id: String): Result<Unit> = runCatching {
        client.postgrest.from("study_schedule").delete { filter { eq("id", id) } }
    }

    @Serializable
    private data class NewSession(
        @SerialName("user_id") val userId: String,
        val title: String,
        val notes: String?,
        @SerialName("scheduled_for") val scheduledFor: String
    )
}

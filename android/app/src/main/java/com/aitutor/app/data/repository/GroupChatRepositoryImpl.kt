package com.aitutor.app.data.repository

import com.aitutor.app.data.remote.SupabaseProvider
import com.aitutor.app.domain.model.GroupMessage
import com.aitutor.app.domain.model.Room
import com.aitutor.app.domain.repository.GroupChatRepository
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GroupChatRepositoryImpl @Inject constructor(
    private val supabase: SupabaseProvider
) : GroupChatRepository {

    private val client get() = supabase.client

    override suspend fun listRooms(): Result<List<Room>> = runCatching {
        client.postgrest.from("rooms").select().decodeList<Room>()
    }

    override suspend fun createRoom(name: String): Result<Room> = runCatching {
        val userId = client.auth.currentUserOrNull()?.id ?: error("Not signed in")
        client.postgrest.from("rooms")
            .insert(NewRoom(name = name, createdBy = userId)) { select() }
            .decodeSingle<Room>()
    }

    override suspend fun joinRoom(roomId: String): Result<Unit> = runCatching {
        val userId = client.auth.currentUserOrNull()?.id ?: error("Not signed in")
        client.postgrest.from("room_members").insert(MembershipRow(roomId, userId))
    }

    override fun observeMessages(roomId: String): Flow<List<GroupMessage>> = channelFlow {
        // Initial snapshot
        val initial = runCatching {
            client.postgrest.from("group_messages")
                .select {
                    filter { eq("room_id", roomId) }
                    order("created_at", Order.ASCENDING)
                }
                .decodeList<GroupMessage>()
        }.getOrDefault(emptyList())
        val running = initial.toMutableList()
        send(running.toList())

        // Realtime subscription
        val channel = client.realtime.channel("room:$roomId")
        val changes = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
            table = "group_messages"
        }
        val job = launch {
            changes.collect { action ->
                when (action) {
                    is PostgresAction.Insert -> {
                        runCatching { action.decodeRecord<GroupMessage>() }
                            .getOrNull()
                            ?.takeIf { it.roomId == roomId }
                            ?.let { running.add(it) }
                    }
                    is PostgresAction.Delete -> {
                        val deletedId = (action.oldRecord["id"]?.toString() ?: "").trim('"')
                        running.removeAll { it.id == deletedId }
                    }
                    else -> Unit
                }
                send(running.toList())
            }
        }
        channel.subscribe(blockUntilSubscribed = true)

        awaitClose {
            job.cancel()
            launch { client.realtime.removeChannel(channel) }
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun sendMessage(roomId: String, content: String): Result<Unit> = runCatching {
        val user = client.auth.currentUserOrNull() ?: error("Not signed in")
        val displayName = (user.userMetadata?.get("display_name")?.toString() ?: user.email.orEmpty())
            .trim('"')
        client.postgrest.from("group_messages").insert(
            NewMessage(
                roomId = roomId,
                userId = user.id,
                displayName = displayName,
                content = content
            )
        )
    }

    @Serializable
    private data class NewRoom(
        val name: String,
        @SerialName("created_by") val createdBy: String
    )

    @Serializable
    private data class MembershipRow(
        @SerialName("room_id") val roomId: String,
        @SerialName("user_id") val userId: String
    )

    @Serializable
    private data class NewMessage(
        @SerialName("room_id") val roomId: String,
        @SerialName("user_id") val userId: String,
        @SerialName("display_name") val displayName: String,
        val content: String
    )
}

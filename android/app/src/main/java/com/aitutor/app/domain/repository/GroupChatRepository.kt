package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.GroupMessage
import com.aitutor.app.domain.model.Room
import kotlinx.coroutines.flow.Flow

interface GroupChatRepository {
    suspend fun listRooms(): Result<List<Room>>
    suspend fun createRoom(name: String): Result<Room>
    suspend fun joinRoom(roomId: String): Result<Unit>

    /** Cold flow — calling collect() opens the realtime channel; cancelling closes it. */
    fun observeMessages(roomId: String): Flow<List<GroupMessage>>

    suspend fun sendMessage(roomId: String, content: String): Result<Unit>
}

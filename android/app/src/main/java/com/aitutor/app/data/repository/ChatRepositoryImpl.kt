package com.aitutor.app.data.repository

import com.aitutor.app.data.remote.AiProxyApi
import com.aitutor.app.data.remote.AiProxyRequest
import com.aitutor.app.domain.model.ChatMessage
import com.aitutor.app.domain.model.TutorMode
import com.aitutor.app.domain.repository.ChatRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val ai: AiProxyApi
) : ChatRepository {

    override suspend fun ask(
        mode: TutorMode,
        history: List<ChatMessage>,
        userText: String
    ): Result<String> = runCatching {
        val recent = history.takeLast(10).joinToString("\n") { msg ->
            val tag = if (msg.role == ChatMessage.Role.USER) "User" else "Tutor"
            "$tag: ${msg.content}"
        }
        val combined = if (recent.isBlank()) userText
        else "Conversation so far:\n$recent\n\nUser: $userText"

        ai.callOpenAi(
            AiProxyRequest(
                toolMode = mode.toolMode,
                userText = combined
            )
        )
    }
}

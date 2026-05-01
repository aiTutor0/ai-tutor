package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.ChatMessage
import com.aitutor.app.domain.model.TutorMode

interface ChatRepository {
    /** Ask the AI tutor for a reply given the running conversation. */
    suspend fun ask(mode: TutorMode, history: List<ChatMessage>, userText: String): Result<String>
}

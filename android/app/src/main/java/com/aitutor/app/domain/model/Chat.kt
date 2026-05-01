package com.aitutor.app.domain.model

import kotlinx.serialization.Serializable

/**
 * The "tool" the AI tutor adopts for a given conversation. Mirrors the
 * `toolMode` switch in the OpenAI proxy.
 */
enum class TutorMode(val displayName: String, val description: String, val toolMode: String) {
    CHAT("Free chat", "Casual practice with corrections", "chat"),
    INTERVIEW("Mock interview", "Realistic interview rehearsal", "interview"),
    GRAMMAR("Grammar fixer", "Get your text corrected with explanations", "grammar"),
    TUTOR("Topic explainer", "Ask about grammar rules or vocabulary", "tutor"),
    TRANSLATE("Translate", "Turkish ⇄ English", "translate")
}

@Serializable
data class ChatMessage(
    val id: String,
    val role: Role,
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
) {
    enum class Role { USER, ASSISTANT }
}
